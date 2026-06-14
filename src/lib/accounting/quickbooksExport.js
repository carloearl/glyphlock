/**
 * QuickBooks Export — pure generators (no I/O, no React).
 *
 * Two formats:
 *   1. IIF  — Intuit Interchange Format, tab-separated, QuickBooks Desktop import
 *   2. CSV  — Journal Entry CSV, QuickBooks Online import
 *
 * Source of truth: the same `aggregateFinancials()` output the Accounting page
 * already renders. No new business logic — same numbers, two new wrappers.
 *
 * Default chart of accounts (overridable via `accountMap`):
 *   Cash Sales       → "Cash"           (BANK)
 *   Card Sales       → "Card Clearing"  (BANK)
 *   All Sales credit → "Sales Income"   (INC)
 *   Driver Payouts   → "Driver Payouts" (EXP)
 *   Payroll          → "Payroll"        (EXP)
 *   Tip Pool         → "Tip Pool"       (EXP)
 *   Contractor       → "Contractor Pay" (EXP)
 *   GB Liability     → "Gift Card Liability" (OCLIAB)
 */

export const DEFAULT_ACCOUNT_MAP = {
  cash: 'Cash',
  card: 'Card Clearing',
  sales: 'Sales Income',
  driver: 'Driver Payouts',
  payroll: 'Payroll',
  tips: 'Tip Pool',
  contractor: 'Contractor Pay',
  gb_liability: 'Gift Card Liability',
};

const ACCOUNT_TYPES = {
  cash: 'BANK',
  card: 'BANK',
  sales: 'INC',
  driver: 'EXP',
  payroll: 'EXP',
  tips: 'EXP',
  contractor: 'EXP',
  gb_liability: 'OCLIAB',
};

const fmt = (n) => (Math.round((n || 0) * 100) / 100).toFixed(2);
const iifDate = (iso) => {
  // IIF wants MM/DD/YYYY
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

/**
 * Build the journal-entry list. One JE per day in the timeline + summary lines
 * for liability movement at end of period.
 *
 * @returns Array<{ date, lines: [{ account, debit, credit, memo }] }>
 */
export function buildJournalEntries({ timeline = [], data, range, venueLabel = 'Venue', accountMap = DEFAULT_ACCOUNT_MAP }) {
  const entries = [];

  // Per-day revenue + disbursement entries (only days with any activity)
  timeline.forEach((day) => {
    const lines = [];
    const cashAmt = Number(day.cash_sales || 0);
    const cardAmt = Number(day.card_sales || 0);
    const driverAmt = Number(day.driver_disbursements || 0);
    const payrollAmt = Number(day.payroll_disbursements || 0);
    const tipsAmt = Number(day.tip_disbursements || 0);
    const contractorAmt = Number(day.contractor_disbursements || 0);

    if (cashAmt > 0) {
      lines.push({ account: accountMap.cash, debit: cashAmt, credit: 0, memo: `Cash sales · ${venueLabel}` });
      lines.push({ account: accountMap.sales, debit: 0, credit: cashAmt, memo: `Cash sales · ${venueLabel}` });
    }
    if (cardAmt > 0) {
      lines.push({ account: accountMap.card, debit: cardAmt, credit: 0, memo: `Card sales · ${venueLabel}` });
      lines.push({ account: accountMap.sales, debit: 0, credit: cardAmt, memo: `Card sales · ${venueLabel}` });
    }
    if (driverAmt > 0) {
      lines.push({ account: accountMap.driver, debit: driverAmt, credit: 0, memo: `Driver payouts · ${venueLabel}` });
      lines.push({ account: accountMap.cash, debit: 0, credit: driverAmt, memo: `Driver payouts · ${venueLabel}` });
    }
    if (payrollAmt > 0) {
      lines.push({ account: accountMap.payroll, debit: payrollAmt, credit: 0, memo: `Payroll · ${venueLabel}` });
      lines.push({ account: accountMap.cash, debit: 0, credit: payrollAmt, memo: `Payroll · ${venueLabel}` });
    }
    if (tipsAmt > 0) {
      lines.push({ account: accountMap.tips, debit: tipsAmt, credit: 0, memo: `Tip pool · ${venueLabel}` });
      lines.push({ account: accountMap.cash, debit: 0, credit: tipsAmt, memo: `Tip pool · ${venueLabel}` });
    }
    if (contractorAmt > 0) {
      lines.push({ account: accountMap.contractor, debit: contractorAmt, credit: 0, memo: `Contractor pay · ${venueLabel}` });
      lines.push({ account: accountMap.cash, debit: 0, credit: contractorAmt, memo: `Contractor pay · ${venueLabel}` });
    }
    if (lines.length > 0) {
      entries.push({ date: day.date, memo: `${venueLabel} — daily activity`, lines });
    }
  });

  // GlyphBucks liability summary at end of period (delta only — issued − redeemed)
  if (data?.glyphbucks) {
    const issued = Number(data.glyphbucks.issued_face_value || 0);
    const redeemed = Number(data.glyphbucks.redeemed_face_value || 0);
    if (issued > 0 || redeemed > 0) {
      const endDate = range?.end || timeline[timeline.length - 1]?.date || new Date().toISOString().slice(0, 10);
      const lines = [];
      if (issued > 0) {
        lines.push({ account: accountMap.cash, debit: issued, credit: 0, memo: 'GB issued (cash received)' });
        lines.push({ account: accountMap.gb_liability, debit: 0, credit: issued, memo: 'GB issued (liability)' });
      }
      if (redeemed > 0) {
        lines.push({ account: accountMap.gb_liability, debit: redeemed, credit: 0, memo: 'GB redeemed (liability cleared)' });
        lines.push({ account: accountMap.cash, debit: 0, credit: redeemed, memo: 'GB redeemed (cash paid)' });
      }
      entries.push({ date: endDate, memo: `${venueLabel} — GlyphBucks liability movement`, lines });
    }
  }

  return entries;
}

/**
 * Build IIF (QuickBooks Desktop) — tab-separated, header + per-account chart + per-JE block.
 */
export function buildIIF({ timeline, data, range, venueLabel, accountMap = DEFAULT_ACCOUNT_MAP }) {
  const entries = buildJournalEntries({ timeline, data, range, venueLabel, accountMap });
  const TAB = '\t';
  const lines = [];

  // Chart of accounts header
  lines.push(['!ACCNT', 'NAME', 'ACCNTTYPE'].join(TAB));
  Object.keys(accountMap).forEach((key) => {
    lines.push(['ACCNT', accountMap[key], ACCOUNT_TYPES[key] || 'EXP'].join(TAB));
  });

  // Transaction headers
  lines.push(['!TRNS', 'TRNSTYPE', 'DATE', 'ACCNT', 'AMOUNT', 'MEMO'].join(TAB));
  lines.push(['!SPL', 'TRNSTYPE', 'DATE', 'ACCNT', 'AMOUNT', 'MEMO'].join(TAB));
  lines.push('!ENDTRNS');

  // One block per JE
  entries.forEach((entry) => {
    const date = iifDate(entry.date);
    // IIF convention: TRNS = first line (debit positive, credit negative);
    // SPL lines flip sign. We always put the first line as TRNS, rest as SPL.
    entry.lines.forEach((ln, idx) => {
      const amt = ln.debit > 0 ? ln.debit : -ln.credit;
      const tag = idx === 0 ? 'TRNS' : 'SPL';
      // SPL amounts are sign-flipped from TRNS in IIF
      const out = idx === 0 ? amt : -amt;
      lines.push([tag, 'GENERAL JOURNAL', date, ln.account, fmt(out), ln.memo].join(TAB));
    });
    lines.push('ENDTRNS');
  });

  return lines.join('\n');
}

/**
 * Build QuickBooks Online Journal Entry CSV.
 * QBO accepts: JournalNo, JournalDate, Memo, AccountName, Debits, Credits, Description
 */
export function buildQBOJournalCSV({ timeline, data, range, venueLabel, accountMap = DEFAULT_ACCOUNT_MAP }) {
  const entries = buildJournalEntries({ timeline, data, range, venueLabel, accountMap });
  const headers = ['JournalNo', 'JournalDate', 'Memo', 'AccountName', 'Debits', 'Credits', 'Description'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [headers.join(',')];

  entries.forEach((entry, jeIdx) => {
    const journalNo = `JE-${entry.date}-${jeIdx + 1}`;
    entry.lines.forEach((ln) => {
      rows.push(
        [
          escape(journalNo),
          escape(entry.date),
          escape(entry.memo),
          escape(ln.account),
          escape(ln.debit > 0 ? fmt(ln.debit) : ''),
          escape(ln.credit > 0 ? fmt(ln.credit) : ''),
          escape(ln.memo),
        ].join(',')
      );
    });
  });

  return rows.join('\n');
}