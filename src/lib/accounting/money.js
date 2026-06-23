/**
 * BPAA-NUPS-ACCT-001 — Money handling primitives.
 *
 * Invariant I-2: Money is integer cents. No floats. No "0.1 + 0.2" drift in
 * the accounting engine. Anything that crosses the postToLedger() boundary
 * MUST be an integer count of cents.
 *
 * Use these helpers everywhere; never hand-roll `Math.round(dollars * 100)`
 * at a call site — it's been a bug source forever.
 */

/**
 * Convert a USD dollar amount (float, may be "12.34" string, may be null)
 * to integer cents. Rejects non-finite values. Rounds half-away-from-zero
 * to avoid banker's-rounding surprises in receipts.
 */
export function toCents(dollars) {
  if (dollars === null || dollars === undefined || dollars === "") return 0;
  const n = typeof dollars === "string" ? Number(dollars) : dollars;
  if (!Number.isFinite(n)) {
    throw new Error(`money: toCents(${dollars}) — not a finite number`);
  }
  // Round half away from zero. 12.345 => 1235; -12.345 => -1235.
  const sign = n < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(n) * 100);
}

/**
 * Convert integer cents back to a USD float for display ONLY. Never use the
 * returned float in arithmetic that posts to the ledger.
 */
export function fromCents(cents) {
  const n = Number(cents) || 0;
  return n / 100;
}

/**
 * Format integer cents as a display string ($12.34, -$3.50, $0.00).
 */
export function formatCents(cents, { withDollar = true, withSign = false } = {}) {
  const n = Number(cents) || 0;
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const body = `${withDollar ? "$" : ""}${whole.toLocaleString()}.${frac}`;
  if (neg) return `-${body}`;
  if (withSign) return `+${body}`;
  return body;
}

/**
 * Assert a value is a valid integer cents amount. Throws on float/NaN/string.
 * Used inside the posting gateway — call sites should hit `toCents()` first.
 */
export function assertCents(value, label = "cents") {
  if (!Number.isInteger(value)) {
    throw new Error(`money: ${label} must be an integer count of cents, got ${value} (${typeof value})`);
  }
  return value;
}

/**
 * Sum a list of cents amounts. Pure integer math — never a float intermediate.
 */
export function sumCents(arr) {
  let total = 0;
  for (const v of arr || []) total += Number(v) || 0;
  return total;
}