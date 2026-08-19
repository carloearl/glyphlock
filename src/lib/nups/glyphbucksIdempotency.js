const encoder = new TextEncoder();

async function sha256Hex(value) {
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Builds a stable key for one logical GlyphBucks issuance.
 *
 * The terms acceptance timestamp is the event nonce: an identical retry reuses
 * the same key, while a newly accepted sale produces a different key. Sale
 * identity and tender fields are included to prevent accidental cross-use.
 */
export async function buildGlyphBucksIdempotencyKey({
  mode,
  venueId,
  assent,
  purchaserName,
  purchaserMemberId,
  idScanRef,
  denomCents,
  qty,
  cardFeeCents,
  cardAuthCode,
  cardLast4,
  terminalId,
}) {
  const normalizedMode = String(mode || "DEMO").trim().toUpperCase();
  const canonical = {
    version: 1,
    mode: normalizedMode,
    venue_id: String(venueId || "").trim(),
    accepted_at: String(assent?.accepted_at || assent?.terms_shown_at || "").trim(),
    purchaser_name: String(purchaserName || "").trim().replace(/\s+/g, " ").toLowerCase(),
    purchaser_member_id: String(purchaserMemberId || "").trim(),
    id_scan_ref: String(idScanRef || "").trim(),
    denom_cents: Number(denomCents) || 0,
    qty: Number(qty) || 0,
    card_fee_cents: Number(cardFeeCents) || 0,
    card_auth_code: String(cardAuthCode || "").trim(),
    card_last4: String(cardLast4 || "").trim().slice(-4),
    terminal_id: String(terminalId || "").trim(),
  };

  const digest = await sha256Hex(JSON.stringify(canonical));
  return `GBSEAL:${normalizedMode}:${digest.slice(0, 48)}`;
}
