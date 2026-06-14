/**
 * exportQuickBooksIIF — server-side QuickBooks export.
 *
 * Produces:
 *   • IIF (Intuit Interchange Format) — for QuickBooks Desktop / Enterprise
 *   • CSV Journal Entries — for QuickBooks Online (import via "Upload Journal Entries")
 *
 * Re-aggregation runs on the server (no client trust). Mapping:
 *
 *   DAILY SETTLEMENT  → Dr Cash Drawer / Card Clearing  · Cr Cash Sales / Card Sales
 *   DRIVER PAYOUT     → Dr Driver Payouts               · Cr Cash Drawer
 *   PAYROLL           → Dr Payroll                       · Cr Cash Drawer
 *   GLYPHBUCKS SALE   → Dr Card Clearing                · Cr GB Liability + GB Surcharge
 *
 * Hard rules preserved:
 *   • total_sales = cash + card only
 *   • GlyphBucks face value is liability, never revenue
 *   • Payouts are expense disbursements, never negative revenue
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_ROLES = new Set(['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.role || user.nups_role;
    if (!ALLOWED_ROLES.has(role)) {
      return Response.json({ error: 'Forbidden — manager+ only' }, { status: 403 });
    }

    const body = await req.json();
    const { start_date, end_date, venue_id, format = 'iif' } = body || {};

    if (!start_date || !end_date) {
      return Response.json({ error: 'start_date and end_date required (YYYY-MM-DD)' }, { status: 400 });
    }

    const venueFilter = venue_id ? { venue_id } : {};
    const sr = base44.asServiceRole;

    const [settlements, driverPayouts, payrollRecords, glyphBucksOrders] = await Promise.all([
      sr.entities.DailySettlement.filter(venueFilter, '-business_date', 2000),
      sr.entities.DriverPayout.filter(venueFilter, '-payout_date', 5000),
      sr.entities.PayrollRecord.list('-pay_period_end', 2000),
      sr.entities.GlyphBucksOrder.filter(venueFilter, '-created_date', 5000),
    ]);

    const inRange = (d) => {
      if (!d) return false;
      const s = String(d).slice(0, 10);
      return s >= start_date && s <= end_date;
    };

    const periodSettlements = settlements.filter((s) => inRange(s.business_date || s.settlement_date));
    const periodDrivers = driverPayouts.filter(
      (d) => inRange(d.payout_date) && (d.payout_status === 'PROCESSED' || d.status === 'paid')
    );
    const periodPayroll = payrollRecords.filter((p) => inRange(p.pay_period_end) && p.status === 'paid');
    const periodGB = glyphBucksOrders.filter(
      (g) => inRange(g.created_date) && (g.status === 'signed' || g.status === 'printed' || g.status === 'archived')
    );

    const counts = {
      settlements: periodSettlements.length,
      drivers: periodDrivers.length,
      payroll: periodPayroll.length,
      glyphbucks: periodGB.length,
    };

    if (format === 'csv') {
      const csv = buildJournalEntryCSV(periodSettlements, periodDrivers, periodPayroll, periodGB);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="qbo_journal_${start_date}_to_${end_date}.csv"`,
          'X-Record-Counts': JSON.stringify(counts),
        },
      });
    }

    const iif = buildIIF(periodSettlements, periodDrivers, periodPayroll, periodGB);
    return new Response(iif, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="qb_desktop_${start_date}_to_${end_date}.iif"`,
        'X-Record-Counts': JSON.stringify(counts),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/* ─────────────────────────────────────────────────────────────────────── */
/* FORMATTERS                                                              */
/* ─────────────────────────────────────────────────────────────────────── */

function fmtIIFDate(iso) {
  // IIF expects MM/DD/YYYY
  if (!iso) return '';
  const d = String(iso).slice(0, 10);
  const [y, m, dd] = d.split('-');
  return `${m}/${dd}/${y}`;
}

function safe(s) {
  if (s == null) return '';
  return String(s).replace(/[\t\r\n]+/g, ' ').slice(0, 80);
}

function buildIIF(settlements, drivers, payroll, glyphBucks) {
  const L = [];

  // CHART OF ACCOUNTS — QB ignores accounts that already exist.
  L.push('!ACCNT\tNAME\tACCNTTYPE\tDESC');
  L.push('ACCNT\tNUPS Cash Sales\tINC\tCash POS receipts');
  L.push('ACCNT\tNUPS Card Sales\tINC\tCard POS receipts');
  L.push('ACCNT\tNUPS GlyphBucks Surcharge\tINC\tGB processing surcharge revenue');
  L.push('ACCNT\tNUPS GlyphBucks Liability\tOCLIAB\tOutstanding GlyphBucks face-value liability');
  L.push('ACCNT\tNUPS Driver Payouts\tEXP\tContract driver disbursements');
  L.push('ACCNT\tNUPS Payroll\tEXP\tEntertainer / staff payroll');
  L.push('ACCNT\tNUPS Cash Drawer\tBANK\tPhysical drawer');
  L.push('ACCNT\tNUPS Card Clearing\tBANK\tCard processor clearing');

  // TRANSACTION HEADERS
  L.push('!TRNS\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tDOCNUM\tMEMO');
  L.push('!SPL\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tDOCNUM\tMEMO');
  L.push('!ENDTRNS');

  // SETTLEMENTS
  for (const s of settlements) {
    const date = fmtIIFDate(s.business_date || s.settlement_date);
    const cash = +(s.cash_sales || 0);
    const card = +(s.card_sales || 0);
    if (cash === 0 && card === 0) continue;
    const docnum = safe(s.settlement_id || s.id || '').slice(0, 20);
    // Debits first (positive), then credits (negative). Sum must equal zero.
    if (cash > 0) L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Cash Drawer\t${cash.toFixed(2)}\t${docnum}\tDaily ${date}`);
    if (card > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Card Clearing\t${card.toFixed(2)}\t${docnum}\tCard portion`);
    if (cash > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Cash Sales\t${(-cash).toFixed(2)}\t${docnum}\tCash sales`);
    if (card > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Card Sales\t${(-card).toFixed(2)}\t${docnum}\tCard sales`);
    L.push('ENDTRNS');
  }

  // DRIVER PAYOUTS
  for (const d of drivers) {
    const date = fmtIIFDate(d.payout_date);
    const amt = +(d.total_payout || 0);
    if (amt === 0) continue;
    const docnum = safe(d.id || '').slice(0, 20);
    L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Driver Payouts\t${amt.toFixed(2)}\t${docnum}\tDriver: ${safe(d.driver_name)}`);
    L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Cash Drawer\t${(-amt).toFixed(2)}\t${docnum}\tCash out`);
    L.push('ENDTRNS');
  }

  // PAYROLL
  for (const p of payroll) {
    const date = fmtIIFDate(p.pay_period_end);
    const amt = +(p.net_payout || 0);
    if (amt === 0) continue;
    const docnum = safe(p.id || '').slice(0, 20);
    L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Payroll\t${amt.toFixed(2)}\t${docnum}\tPayroll: ${safe(p.stage_name)}`);
    L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Cash Drawer\t${(-amt).toFixed(2)}\t${docnum}\tDisbursement`);
    L.push('ENDTRNS');
  }

  // GLYPHBUCKS ISSUANCE
  for (const g of glyphBucks) {
    const date = fmtIIFDate(g.created_date);
    const face = +(g.glyphbucks_value || 0);
    const surcharge = +(g.processing_surcharge || 0);
    const total = face + surcharge;
    if (total === 0) continue;
    const docnum = safe(g.order_number || g.id || '').slice(0, 20);
    L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Card Clearing\t${total.toFixed(2)}\t${docnum}\tGB sale ${docnum}`);
    if (face > 0)
      L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS GlyphBucks Liability\t${(-face).toFixed(2)}\t${docnum}\tFace value`);
    if (surcharge > 0)
      L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS GlyphBucks Surcharge\t${(-surcharge).toFixed(2)}\t${docnum}\tSurcharge`);
    L.push('ENDTRNS');
  }

  return L.join('\r\n') + '\r\n';
}

function buildJournalEntryCSV(settlements, drivers, payroll, glyphBucks) {
  const rows = [['JournalNo', 'JournalDate', 'AccountName', 'Debit', 'Credit', 'Description']];
  let je = 1;

  const fmt = (n) => (n ? n.toFixed(2) : '');
  const push = (no, date, account, dr, cr, desc) =>
    rows.push([no, date, account, fmt(dr), fmt(cr), safe(desc)]);

  for (const s of settlements) {
    const date = String(s.business_date || s.settlement_date || '').slice(0, 10);
    const cash = +(s.cash_sales || 0);
    const card = +(s.card_sales || 0);
    if (cash === 0 && card === 0) continue;
    const no = `JE-S-${je++}`;
    if (cash > 0) push(no, date, 'NUPS Cash Drawer', cash, 0, `Cash sales ${date}`);
    if (card > 0) push(no, date, 'NUPS Card Clearing', card, 0, `Card sales ${date}`);
    if (cash > 0) push(no, date, 'NUPS Cash Sales', 0, cash, `Cash sales ${date}`);
    if (card > 0) push(no, date, 'NUPS Card Sales', 0, card, `Card sales ${date}`);
  }

  for (const d of drivers) {
    const date = String(d.payout_date || '').slice(0, 10);
    const amt = +(d.total_payout || 0);
    if (amt === 0) continue;
    const no = `JE-D-${je++}`;
    push(no, date, 'NUPS Driver Payouts', amt, 0, `Driver: ${d.driver_name}`);
    push(no, date, 'NUPS Cash Drawer', 0, amt, `Driver payout`);
  }

  for (const p of payroll) {
    const date = String(p.pay_period_end || '').slice(0, 10);
    const amt = +(p.net_payout || 0);
    if (amt === 0) continue;
    const no = `JE-P-${je++}`;
    push(no, date, 'NUPS Payroll', amt, 0, `Payroll: ${p.stage_name}`);
    push(no, date, 'NUPS Cash Drawer', 0, amt, `Payroll`);
  }

  for (const g of glyphBucks) {
    const date = String(g.created_date || '').slice(0, 10);
    const face = +(g.glyphbucks_value || 0);
    const surcharge = +(g.processing_surcharge || 0);
    if (face + surcharge === 0) continue;
    const no = `JE-G-${je++}`;
    push(no, date, 'NUPS Card Clearing', face + surcharge, 0, `GB sale ${g.order_number || ''}`);
    if (face > 0) push(no, date, 'NUPS GlyphBucks Liability', 0, face, `Face value`);
    if (surcharge > 0) push(no, date, 'NUPS GlyphBucks Surcharge', 0, surcharge, `Surcharge`);
  }

  return rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}