/**
 * DACO Directive 003 §4 — Entertainer (IC) linear flow state machine.
 *
 * §4 order of operations:
 *   SCAN → CHECK_IN → HOUSE_FEE_DUE → PAY_FEE → QR_RECEIPT → ON_FLOOR
 *          → BATCH_OUT_REQUEST → (manager batch-out) → SETTLEMENT → CHECK_OUT
 *
 * Principle: "The entertainer flow is a contract transaction, not an
 * employment session. No clock-in language anywhere — CHECK IN only."
 *
 * ID-01 gate: verifyLiveIdentity() probes before the check-in write.
 */

export const IC_STEP = {
  IDENTITY_BLOCK:    "identity_block",
  CHECK_IN:          "check_in",       // verification checklist + PIN
  HOUSE_FEE_DUE:     "house_fee_due",   // rate from VenueRateConfig
  PAY_FEE:           "pay_fee",         // cash / card / GlyphBucks
  QR_RECEIPT:        "qr_receipt",      // signed HMAC QR issued
  ON_FLOOR:          "on_floor",        // working
  BATCH_OUT_REQUEST: "batch_out_request",
  SETTLEMENT:        "settlement",
  DONE:              "done",
};

/**
 * Resolve the current IC step from identity + shift + fee state.
 * @param {{ ok: boolean }} probe
 * @param {object|null} activeShift — open EntertainerShift
 * @param {boolean} feePaid — house fee settled this shift
 * @param {boolean} receiptAcknowledged — IC dismissed the QR receipt
 * @param {boolean} batchOutRequested — IC requested batch-out
 */
export function resolveIcStep({ probe, activeShift, feePaid, receiptAcknowledged, batchOutRequested }) {
  if (probe && !probe.ok) return IC_STEP.IDENTITY_BLOCK;
  if (!activeShift) return IC_STEP.CHECK_IN;
  if (!feePaid) return IC_STEP.HOUSE_FEE_DUE;
  if (!receiptAcknowledged) return IC_STEP.QR_RECEIPT;
  if (batchOutRequested) return IC_STEP.BATCH_OUT_REQUEST;
  return IC_STEP.ON_FLOOR;
}