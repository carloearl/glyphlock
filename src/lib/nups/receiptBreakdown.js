/**
 * receiptBreakdown.js — single source of truth for receipt fee math.
 *
 * Every receipt surface (on-screen preview, printable HTML, post-sale
 * confirmation modal) calls `buildReceiptBreakdown(tx, rates)` so the
 * guest always sees the same line items in the same order:
 *
 *   Subtotal → Service Fee → Discount → Gratuity → Tax → Processing Fee → TOTAL
 *
 * Door cover charges are sales-tax-exempt; the `tax` field on a door
 * transaction is treated as the card processing fee when the explicit
 * `processing_fee` field is absent (legacy compatibility).
 */

const DOOR_STATION = 'door';

/**
 * Resolve the cashier display name — prefer cashier_name, fall back to
 * legacy cashier email, then 'N/A'.
 */
export function getCashierDisplay(tx) {
  return tx?.cashier_name || tx?.cashier || 'N/A';
}

/**
 * Build the canonical fee breakdown for a transaction given the
 * per-venue rate configuration.
 *
 * @param {object} tx      POSTransaction record
 * @param {object} rates   VenueRateConfig row (may be null/empty)
 * @returns {object} structured breakdown with labels + amounts
 */
export function buildReceiptBreakdown(tx, rates = {}) {
  if (!tx) return null;

  const showProcFee = rates?.show_processing_fee !== false; // default true
  const showSvcFee  = !!rates?.show_service_fee;
  const svcPct      = Number(rates?.service_fee_pct || 0);
  const svcLabel    = rates?.service_fee_label || 'Service Fee';
  const procRate    = Number(rates?.cc_processing_fee_rate || 0);
  const taxRate     = Number(rates?.tax_rate || 0.08);

  const isDoor = (tx.station || '').toLowerCase() === DOOR_STATION;

  const subtotal = Number(tx.subtotal || 0);
  const tipAmount = Number(tx.tip || 0);
  const discount  = Number(tx.discount || 0);
  const grandTotal = Number(tx.total || 0);

  // Sales tax: door cover charges are tax-exempt.
  const taxLabel = isDoor
    ? 'Sales Tax (0%)'
    : `Sales Tax (${(taxRate * 100).toFixed(0)}%)`;
  const taxValue = isDoor ? 0 : Number(tx.tax || 0);

  // Processing fee: explicit field wins; legacy door records stashed the
  // CC fee in `tax`, so fall back to that only when the explicit field is absent.
  const ccFee = tx.processing_fee != null
    ? Number(tx.processing_fee)
    : (isDoor ? Number(tx.tax || 0) : 0);
  const ccFeeLabel = procRate > 0
    ? `Card Processing Fee (${(procRate * 100).toFixed(2)}%)`
    : 'Card Processing Fee';

  // Service fee: explicit tx field wins; otherwise compute from subtotal × pct.
  const svcFee = Number(
    tx.service_fee || (showSvcFee ? (subtotal * svcPct) : 0)
  );
  const svcFeeLabel = svcPct > 0
    ? `${svcLabel} (${(svcPct * 100).toFixed(2)}%)`
    : svcLabel;

  // Build the ordered line-item array so every consumer renders identically.
  const lines = [
    { key: 'subtotal', label: 'Subtotal', amount: subtotal, always: true },
    { key: 'service_fee', label: svcFeeLabel, amount: svcFee, show: showSvcFee, always: false },
    { key: 'discount', label: 'Discount', amount: -discount, show: discount > 0, negative: true },
    { key: 'tip', label: 'Gratuity', amount: tipAmount, show: tipAmount > 0 },
    { key: 'tax', label: taxLabel, amount: taxValue, always: true },
    { key: 'processing_fee', label: ccFeeLabel, amount: ccFee, show: showProcFee, always: false },
  ];

  const visibleLines = lines.filter(l => l.always || l.show);

  return {
    isDoor,
    subtotal,
    tipAmount,
    discount,
    grandTotal,
    taxLabel,
    taxValue,
    ccFee,
    ccFeeLabel,
    svcFee,
    svcFeeLabel,
    showProcFee,
    showSvcFee,
    lines: visibleLines,
    totalItems: (tx.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0),
  };
}