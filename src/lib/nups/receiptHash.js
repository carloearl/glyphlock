/**
 * receiptHash — SHA-256 fingerprint of a completed POS transaction.
 *
 * Purpose: prints a tamper-evident hash on every receipt (and stores it
 * back on the transaction). Downstream: exportable to a public blockchain
 * anchor as batched proofs; each hash on paper is one leaf.
 *
 * Uses browser-native SubtleCrypto — zero deps, works everywhere Base44
 * runs. NEVER include PII (card PAN, DOB) in the payload — we hash only
 * the ledger-visible fields plus the timestamp + hardware terminal id so
 * two identical transactions from the same terminal at the same instant
 * would collide (they can't in practice; sequence id makes it impossible).
 */

// Stable JSON — key order matters for the hash to be reproducible.
function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Build the canonical payload for hashing. Adding a new field here is a
 * BREAKING change for hash verification — bump `receipt_hash_version`.
 */
export function buildReceiptPayload(tx) {
  return {
    receipt_hash_version: 1,
    transaction_id: tx.transaction_id || null,
    venue_id: tx.venue_id || null,
    station: tx.station || null,
    terminal_id: tx.terminal_id || tx.terminal_name || null,
    batch_id: tx.batch_id || null,
    cashier_id: tx.cashier_id || null,
    payment_method: tx.payment_method || null,
    subtotal: Number(tx.subtotal || 0),
    tax: Number(tx.tax || 0),
    tip: Number(tx.tip || 0),
    discount: Number(tx.discount || 0),
    processing_fee: Number(tx.processing_fee || 0),
    service_fee: Number(tx.service_fee || 0),
    total: Number(tx.total || 0),
    // Items — quantity + total only. No SKU meta; keeps hash stable
    // across product-name edits that don't affect the sale.
    items: (tx.items || []).map(i => ({
      pid: i.product_id || null,
      qty: Number(i.quantity || 0),
      total: Number(i.total || 0),
    })),
    // Timestamp — the transaction's own created_date. Use ISO so
    // timezone shifts don't move the hash.
    ts: tx.created_date ? new Date(tx.created_date).toISOString() : null,
  };
}

/**
 * Compute the SHA-256 hex of a transaction. Returns { hash, short, payload }.
 * `short` is the first 12 hex chars — printable, human-scannable ref.
 */
export async function computeReceiptHash(tx) {
  const payload = buildReceiptPayload(tx);
  const enc = new TextEncoder().encode(stableStringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const hash = toHex(new Uint8Array(digest));
  return {
    hash,                       // full 64-hex
    short: hash.slice(0, 12),   // first 12 hex — printed prominently
    algorithm: "SHA-256",
    version: 1,
    payload,                    // for debugging / verification
  };
}