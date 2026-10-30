/**
 * Formatting helpers for employee payroll checks.
 * Money is stored and passed as integer cents — never floats.
 */

export const EMPLOYER = {
  name: 'GlyphLock LLC',
  addr1: '12721 N 121st Dr',
  addr2: 'El Mirage, AZ 85335',
  phone: '(480) 886-5588',
  entityNumber: '23831258',
};

export const BANK_NAME = 'Chase';
export const CHECK_STOCK_LABEL = 'Preprinted Chase business check stock';

/** Parse a dollars string ("4,000.00") into integer cents. Returns NaN if invalid. */
export function toCents(value) {
  const cleaned = String(value ?? '').replace(/[$,\s]/g, '');
  if (!cleaned) return 0;
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100);
}

export function fromCents(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export function fmtCents(cents) {
  const value = Number(cents || 0);
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}$${Math.floor(abs / 100).toLocaleString('en-US')}.${String(abs % 100).padStart(2, '0')}`;
}

export function sumDeductionCents(deductions = []) {
  return deductions.reduce((sum, item) => sum + (Number(item?.amount_cents) || 0), 0);
}

export function fmtDate(iso) {
  const text = String(iso || '');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return text || '—';
  return `${match[2]}/${match[3]}/${match[1]}`;
}

export function periodLabel(record = {}) {
  return `${fmtDate(record.period_start)} – ${fmtDate(record.period_end)}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowThousand(value) {
  if (value === 0) return '';
  if (value < 20) return ONES[value];
  if (value < 100) return `${TENS[Math.floor(value / 10)]}${value % 10 ? `-${ONES[value % 10]}` : ''}`;
  return `${ONES[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${belowThousand(value % 100)}` : ''}`;
}

/** Amount in words for the face of the check, e.g. "Two Thousand Four Hundred and 00/100". */
export function amountInWords(cents) {
  const total = Math.max(0, Math.round(Number(cents) || 0));
  const dollars = Math.floor(total / 100);
  const change = total % 100;

  if (dollars === 0) return `Zero and ${String(change).padStart(2, '0')}/100`;

  const millions = Math.floor(dollars / 1_000_000);
  const thousands = Math.floor((dollars % 1_000_000) / 1000);
  const remainder = dollars % 1000;

  const parts = [];
  if (millions) parts.push(`${belowThousand(millions)} Million`);
  if (thousands) parts.push(`${belowThousand(thousands)} Thousand`);
  if (remainder) parts.push(belowThousand(remainder));

  return `${parts.join(' ')} and ${String(change).padStart(2, '0')}/100`;
}

/** Mirrors the server document stamp so a printed draft can never look negotiable. */
export function stampFor(record = {}, { reprinted = false } = {}) {
  const status = String(record.status || 'DRAFT').toUpperCase();
  if (status === 'PAID') return { label: 'PAID RECORD — NON-NEGOTIABLE COPY', stamp: 'NON-NEGOTIABLE', negotiable: false };
  if (status === 'VOID') return { label: 'VOID — NON-NEGOTIABLE COPY', stamp: 'NON-NEGOTIABLE', negotiable: false };
  if (status !== 'REVIEWED') return { label: 'DRAFT — NON-NEGOTIABLE', stamp: 'NON-NEGOTIABLE', negotiable: false };
  if (reprinted) return { label: 'REPRINT — NON-NEGOTIABLE COPY', stamp: 'NON-NEGOTIABLE', negotiable: false };
  return {
    label: 'REVIEWED — UNSIGNED, PRINT ON PREPRINTED CHASE STOCK',
    stamp: 'UNSIGNED',
    negotiable: true,
  };
}