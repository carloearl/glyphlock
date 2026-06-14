/**
 * quickbooksNightlySync — QuickBooks "auto-sync" without Intuit OAuth.
 *
 * Generates both QB Desktop (.iif) and QB Online (.csv) Journal Entry files for
 * the requested date range, pushes them into the connected Google Drive (link-
 * shareable), optionally emails the bookkeeper(s) the download links, and writes
 * an ActivityLog entry. Runs nightly via scheduled automation OR on-demand from
 * the Accounting page "Sync to Drive" button.
 *
 * Bookkeeper imports the file once a day — same outcome as real-time sync, no
 * Intuit Developer app required.
 *
 * Journal mapping kept in sync with `exportQuickBooksIIF`:
 *   DAILY SETTLEMENT  → Dr Cash Drawer / Card Clearing   · Cr Cash Sales / Card Sales
 *   DRIVER PAYOUT     → Dr Driver Payouts                · Cr Cash Drawer
 *   PAYROLL           → Dr Payroll                       · Cr Cash Drawer
 *   GLYPHBUCKS SALE   → Dr Card Clearing                 · Cr GB Liability + GB Surcharge
 *
 * Hard rules:
 *   • total_sales = cash + card only
 *   • GlyphBucks face value = liability (never revenue)
 *   • Payouts = expense disbursements (never negative revenue)
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

    const body = await req.json().catch(() => ({}));

    // Default range = yesterday (matches "nightly close" cadence)
    const ymd = (d) => d.toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000);
    const start_date = body.start_date || ymd(yesterday);
    const end_date = body.end_date || ymd(yesterday);
    const venue_id = body.venue_id || null;
    const notify_emails = Array.isArray(body.notify_emails) ? body.notify_emails : [];
    const auto_lookup_emails = body.auto_lookup_emails === true;

    const sr = base44.asServiceRole;
    const venueFilter = venue_id ? { venue_id } : {};

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

    const totalRecords = counts.settlements + counts.drivers + counts.payroll + counts.glyphbucks;
    if (totalRecords === 0) {
      return Response.json({
        ok: true,
        skipped: true,
        message: 'No financial records in date range — nothing to sync.',
        start_date, end_date, counts,
      });
    }

    const iif = buildIIF(periodSettlements, periodDrivers, periodPayroll, periodGB);
    const csv = buildJournalEntryCSV(periodSettlements, periodDrivers, periodPayroll, periodGB);

    // Upload both to the connected Google Drive
    const accessToken = await sr.connectors.getAccessToken('googledrive');
    const fileSuffix = start_date === end_date ? start_date : `${start_date}_to_${end_date}`;
    const iifName = `NUPS_QB_Desktop_${fileSuffix}.iif`;
    const csvName = `NUPS_QB_Online_${fileSuffix}.csv`;

    const iifFile = await uploadToDrive(accessToken, iifName, iif, 'application/octet-stream');
    const csvFile = await uploadToDrive(accessToken, csvName, csv, 'text/csv');

    // Bookkeeper email list — explicit arg first, then PayoutSafetyLimit fallback for nightly cron
    let recipients = [...notify_emails];
    if (auto_lookup_emails && recipients.length === 0) {
      try {
        const limits = await sr.entities.PayoutSafetyLimit.filter(
          { venue_id: venue_id || '*' }, null, 5
        );
        const lim = limits[0];
        if (lim && Array.isArray(lim.compliance_digest_emails)) {
          recipients = lim.compliance_digest_emails.filter(Boolean);
        }
      } catch (e) { console.warn('PayoutSafetyLimit lookup failed:', e); }
    }

    let emailedTo = [];
    if (recipients.length > 0) {
      const subj = `NUPS QuickBooks Sync — ${fileSuffix}`;
      const emailBody = [
        'Daily QuickBooks sync ready for import.',
        '',
        `Period: ${start_date} to ${end_date}`,
        `Venue: ${venue_id || 'ALL'}`,
        `Records: ${counts.settlements} settlements · ${counts.drivers} driver payouts · ${counts.payroll} payroll · ${counts.glyphbucks} GlyphBucks orders`,
        '',
        `QuickBooks Desktop (IIF): ${iifFile.web_view_url}`,
        `QuickBooks Online (CSV):  ${csvFile.web_view_url}`,
        '',
        'Import instructions:',
        '  • Desktop: File → Utilities → Import → IIF Files',
        '  • Online:  Settings (gear) → Import data → Journal Entries',
        '',
        '— Automated by NUPS',
      ].join('\n');

      for (const to of recipients) {
        try {
          await base44.integrations.Core.SendEmail({ to, subject: subj, body: emailBody });
          emailedTo.push(to);
        } catch (e) { console.error('SendEmail failed for', to, e); }
      }
    }

    // ActivityLog
    try {
      await sr.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user.email || 'system',
        user_role: role,
        action_type: 'EXPORT',
        entity_affected: 'QuickBooksSync',
        venue_id: venue_id,
        mode: 'REAL',
        notes: `QB sync uploaded to Drive — ${fileSuffix} · ${totalRecords} records · emailed ${emailedTo.length}`,
        after_value: {
          period: { start_date, end_date },
          counts,
          iif_url: iifFile.web_view_url,
          csv_url: csvFile.web_view_url,
          emailed_to: emailedTo,
        },
      });
    } catch (e) { console.error('ActivityLog write failed:', e); }

    return Response.json({
      ok: true,
      start_date,
      end_date,
      counts,
      iif: { name: iifName, url: iifFile.web_view_url, file_id: iifFile.file_id },
      csv: { name: csvName, url: csvFile.web_view_url, file_id: csvFile.file_id },
      emailed_to: emailedTo,
    });
  } catch (error) {
    console.error('quickbooksNightlySync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/* ─── Google Drive upload + link-share ─────────────────────────────── */
async function uploadToDrive(accessToken, name, content, mimeType) {
  const boundary = '----NUPSQBSyncBoundary';
  const metadata = JSON.stringify({ name, mimeType });
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(content);

  const preamble = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const closing = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(preamble.length + contentBytes.length + closing.length);
  body.set(preamble, 0);
  body.set(contentBytes, preamble.length);
  body.set(closing, preamble.length + contentBytes.length);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive upload failed: ${errText}`);
  }
  const file = await res.json();

  // Make link-shareable so bookkeeper opens without Google login
  await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return {
    file_id: file.id,
    file_name: file.name,
    web_view_url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
  };
}

/* ─── Journal generators (mirror exportQuickBooksIIF) ──────────────── */
function fmtIIFDate(iso) {
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

  L.push('!ACCNT\tNAME\tACCNTTYPE\tDESC');
  L.push('ACCNT\tNUPS Cash Sales\tINC\tCash POS receipts');
  L.push('ACCNT\tNUPS Card Sales\tINC\tCard POS receipts');
  L.push('ACCNT\tNUPS GlyphBucks Surcharge\tINC\tGB processing surcharge revenue');
  L.push('ACCNT\tNUPS GlyphBucks Liability\tOCLIAB\tOutstanding GlyphBucks face-value liability');
  L.push('ACCNT\tNUPS Driver Payouts\tEXP\tContract driver disbursements');
  L.push('ACCNT\tNUPS Payroll\tEXP\tEntertainer / staff payroll');
  L.push('ACCNT\tNUPS Cash Drawer\tBANK\tPhysical drawer');
  L.push('ACCNT\tNUPS Card Clearing\tBANK\tCard processor clearing');

  L.push('!TRNS\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tDOCNUM\tMEMO');
  L.push('!SPL\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tDOCNUM\tMEMO');
  L.push('!ENDTRNS');

  for (const s of settlements) {
    const date = fmtIIFDate(s.business_date || s.settlement_date);
    const cash = +(s.cash_sales || 0);
    const card = +(s.card_sales || 0);
    if (cash === 0 && card === 0) continue;
    const docnum = safe(s.settlement_id || s.id || '').slice(0, 20);
    if (cash > 0) L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Cash Drawer\t${cash.toFixed(2)}\t${docnum}\tDaily ${date}`);
    if (card > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Card Clearing\t${card.toFixed(2)}\t${docnum}\tCard portion`);
    if (cash > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Cash Sales\t${(-cash).toFixed(2)}\t${docnum}\tCash sales`);
    if (card > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Card Sales\t${(-card).toFixed(2)}\t${docnum}\tCard sales`);
    L.push('ENDTRNS');
  }

  for (const d of drivers) {
    const date = fmtIIFDate(d.payout_date);
    const amt = +(d.total_payout || 0);
    if (amt === 0) continue;
    const docnum = safe(d.id || '').slice(0, 20);
    L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Driver Payouts\t${amt.toFixed(2)}\t${docnum}\tDriver: ${safe(d.driver_name)}`);
    L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Cash Drawer\t${(-amt).toFixed(2)}\t${docnum}\tCash out`);
    L.push('ENDTRNS');
  }

  for (const p of payroll) {
    const date = fmtIIFDate(p.pay_period_end);
    const amt = +(p.net_payout || 0);
    if (amt === 0) continue;
    const docnum = safe(p.id || '').slice(0, 20);
    L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Payroll\t${amt.toFixed(2)}\t${docnum}\tPayroll: ${safe(p.stage_name)}`);
    L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS Cash Drawer\t${(-amt).toFixed(2)}\t${docnum}\tDisbursement`);
    L.push('ENDTRNS');
  }

  for (const g of glyphBucks) {
    const date = fmtIIFDate(g.created_date);
    const face = +(g.glyphbucks_value || 0);
    const surcharge = +(g.processing_surcharge || 0);
    const total = face + surcharge;
    if (total === 0) continue;
    const docnum = safe(g.order_number || g.id || '').slice(0, 20);
    L.push(`TRNS\tGENERAL JOURNAL\t${date}\tNUPS Card Clearing\t${total.toFixed(2)}\t${docnum}\tGB sale ${docnum}`);
    if (face > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS GlyphBucks Liability\t${(-face).toFixed(2)}\t${docnum}\tFace value`);
    if (surcharge > 0) L.push(`SPL\tGENERAL JOURNAL\t${date}\tNUPS GlyphBucks Surcharge\t${(-surcharge).toFixed(2)}\t${docnum}\tSurcharge`);
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