/**
 * QuickBooks Export — Builds importable journal entries from aggregated financials.
 *
 * Outputs:
 *   - IIF (QuickBooks Desktop import format)
 *   - CSV (QuickBooks Online "Journal Entries" import format)
 *
 * Double-entry mapping (debits = credits per journal):
 *
 *   1) Cash sales         DR Cash on Hand           CR Sales Revenue
 *   2) Card sales         DR Merchant Account       CR Sales Revenue
 *   3) GB issued          DR Cash on Hand           CR Gift Card Liability   (face value)
 *   4) GB redeemed        DR Gift Card Liability    CR Sales Revenue         (face value)
 *   5) Driver payouts     DR Contract Labor         CR Cash on Hand
 *   6) Payroll            DR Payroll Expense        CR Cash on Hand
 *   7) Tip payouts        DR Tip Payable            CR Cash on Hand
 *   8) Contractor         DR Contractor Expense     CR Cash on Hand
 *
 * Accountant can remap account names to their actual QB chart of accounts on import.
 */

const ACCOUNTS = {
  CASH: 'Cash on Hand',
  MERCHANT: 'Merchant Account',
  SALES: 'Sales Revenue',
  GB_LIABILITY: 'Gift Card Liability',
  CONTRACT_LABOR: 'Contract Labor',
  PAYROLL: 'Payroll Expense',
  TIP_PAYABLE: 'Tip Payable',
  CONTRACTOR: 'Contractor Expense',
};

function fmtDateIIF(iso) {
  // MM/DD/YYYY
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function fmtAmt(n) {
  return Number(n || 0).toFixed(2);
}

function buildJournalLines(timeline) {
  // timeline: [{ date: 'YYYY-MM-DD', cash_sales, card_sales, gb_issued, gb_redeemed,
  //              driver_disbursements, payroll, tips, contractor }]
  const journals = [];
  let docCounter = 1;

  for (const row of timeline) {
    const date = row.date;
    const docNum = `GL-${date.replace(/-/g, '')}-${String(docCounter).padStart(3, '0')}`;
    docCounter++;

    const lines = [];

    if (row.cash_sales > 0) {
      lines.push({ account: ACCOUNTS.CASH, debit: row.cash_sales, credit: 0, memo: 'Cash sales' });
      lines.push({ account: ACCOUNTS.SALES, debit: 0, credit: row.cash_sales, memo: 'Cash sales' });
    }
    if (row.card_sales > 0) {
      lines.push({ account: ACCOUNTS.MERCHANT, debit: row.card_sales, credit: 0, memo: 'Card sales' });
      lines.push({ account: ACCOUNTS.SALES, debit: 0, credit: row.card_sales, memo: 'Card sales' });
    }
    if (row.gb_issued > 0) {
      lines.push({ account: ACCOUNTS.CASH, debit: row.gb_issued, credit: 0, memo: 'GlyphBucks issued (liability)' });
      lines.push({ account: ACCOUNTS.GB_LIABILITY, debit: 0, credit: row.gb_issued, memo: 'GlyphBucks issued (liability)' });
    }
    if (row.gb_redeemed > 0) {
      lines.push({ account: ACCOUNTS.GB_LIABILITY, debit: row.gb_redeemed, credit: 0, memo: 'GlyphBucks redeemed' });
      lines.push({ account: ACCOUNTS.SALES, debit: 0, credit: row.gb_redeemed, memo: 'GlyphBucks redeemed' });
    }
    if (row.driver_disbursements > 0) {
      lines.push({ account: ACCOUNTS.CONTRACT_LABOR, debit: row.driver_disbursements, credit: 0, memo: 'Driver payouts' });
      lines.push({ account: ACCOUNTS.CASH, debit: 0, credit: row.driver_disbursements, memo: 'Driver payouts' });
    }
    if (row.payroll > 0) {
      lines.push({ account: ACCOUNTS.PAYROLL, debit: row.payroll, credit: 0, memo: 'Payroll' });
      lines.push({ account: ACCOUNTS.CASH, debit: 0, credit: row.payroll, memo: 'Payroll' });
    }
    if (row.tips > 0) {
      lines.push({ account: ACCOUNTS.TIP_PAYABLE, debit: row.tips, credit: 0, memo: 'Tip payouts' });
      lines.push({ account: ACCOUNTS.CASH, debit: 0, credit: row.tips, memo: 'Tip payouts' });
    }
    if (row.contractor > 0) {
      lines.push({ account: ACCOUNTS.CONTRACTOR, debit: row.contractor, credit: 0, memo: 'Contractor payouts' });
      lines.push({ account: ACCOUNTS.CASH, debit: 0, credit: row.contractor, memo: 'Contractor payouts' });
    }

    if (lines.length > 0) journals.push({ date, docNum, lines });
  }

  return journals;
}

/**
 * Build IIF (QuickBooks Desktop) — tab-delimited.
 */
export function buildIIF(timeline) {
  const journals = buildJournalLines(timeline);
  const lines = [];

  // IIF headers
  lines.push(['!TRNS', 'TRNSTYPE', 'DATE', 'ACCNT', 'AMOUNT', 'DOCNUM', 'MEMO'].join('\t'));
  lines.push(['!SPL', 'TRNSTYPE', 'DATE', 'ACCNT', 'AMOUNT', 'DOCNUM', 'MEMO'].join('\t'));
  lines.push(['!ENDTRNS'].join('\t'));

  for (const j of journals) {
    const date = fmtDateIIF(j.date);
    // First line is TRNS (must net to zero with SPLs; convention = first debit line)
    const first = j.lines[0];
    const firstAmt = first.debit > 0 ? first.debit : -first.credit;
    lines.push(['TRNS', 'GENERAL JOURNAL', date, first.account, fmtAmt(firstAmt), j.docNum, first.memo].join('\t'));

    for (let i = 1; i < j.lines.length; i++) {
      const l = j.lines[i];
      // SPL convention: opposite sign of TRNS leg
      const amt = l.debit > 0 ? l.debit : -l.credit;
      // For double-entry IIF, the SPL must net the TRNS to zero, so we flip credits to negative.
      const splAmt = l.credit > 0 ? -l.credit : -l.debit;
      lines.push(['SPL', 'GENERAL JOURNAL', date, l.account, fmtAmt(splAmt), j.docNum, l.memo].join('\t'));
    }
    lines.push('ENDTRNS');
  }

  return lines.join('\n');
}

/**
 * Build QuickBooks Online Journal Entry CSV.
 * Format expected by QBO "Import Journal Entries": one row per line item.
 */
export function buildQBOCsv(timeline) {
  const journals = buildJournalLines(timeline);
  const rows = [['*JournalNo', '*JournalDate', '*AccountName', 'Debits', 'Credits', 'Description']];

  for (const j of journals) {
    const date = fmtDateIIF(j.date);
    for (const l of j.lines) {
      rows.push([
        j.docNum,
        date,
        l.account,
        l.debit > 0 ? fmtAmt(l.debit) : '',
        l.credit > 0 ? fmtAmt(l.credit) : '',
        l.memo,
      ]);
    }
  }

  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(escape).join(',')).join('\n');
}

export function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const QB_ACCOUNTS = ACCOUNTS;