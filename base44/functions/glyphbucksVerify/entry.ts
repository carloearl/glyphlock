// DACO GlyphBucks — READ-ONLY verification route (§5). GET-style via invoke.
// Never writes. Recomputes the chain hash and verifies the Ed25519 signature
// against the published public key. Redacts to safe fields (hashes only; no raw
// biometrics; no full PAN). Validates :ref against ^VRF-\d{6}-\d{6}-[0-9A-F]{4}$.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const REF_RE = /^VRF-\d{6}-\d{6}-[0-9A-F]{4}$/;
const enc = new TextEncoder();

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}
function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const ref = String(body.ref || '').toUpperCase();
    if (!REF_RE.test(ref)) {
      return Response.json({ seal_valid: false, error: 'Invalid verify reference format.' }, { status: 400 });
    }

    const seals = await base44.asServiceRole.entities.SealRecord.filter({ verify_ref: ref }, '-created_date', 1);
    const seal = seals?.[0];
    if (!seal) return Response.json({ seal_valid: false, error: 'No sealed record found for this reference.' }, { status: 404 });

    const sales = await base44.asServiceRole.entities.GlyphBucksSale.filter({ verify_ref: ref }, '-created_date', 1);
    const sale = sales?.[0] || {};

    // Recompute chain hash from stored inputs.
    const recomputedChain = await sha256Hex(String(seal.prev_block_hash) + String(seal.terms_hash) + String(seal.agreement_no));
    const chainValid = recomputedChain === seal.chain_hash;

    // Verify Ed25519 signature over the canonical payload embedded in the token.
    let signatureValid = false;
    try {
      const [tag, payloadB64, sigB64] = String(seal.signed_token).split('.');
      if (tag === 'NUPS1' && payloadB64 && sigB64) {
        const payloadBytes = b64urlToBytes(payloadB64);
        const sigBytes = b64urlToBytes(sigB64);
        const pubKey = await crypto.subtle.importKey('raw', hexToBytes(seal.public_key_hex), { name: 'Ed25519' }, false, ['verify']);
        signatureValid = await crypto.subtle.verify({ name: 'Ed25519' }, pubKey, sigBytes, payloadBytes);
        // Cross-check: the token's embedded chain hash must match the stored seal.
        const decoded = JSON.parse(new TextDecoder().decode(payloadBytes));
        if (decoded.ch !== seal.chain_hash || decoded.ref !== ref) signatureValid = false;
      }
    } catch (_) { signatureValid = false; }

    const sealValid = chainValid && signatureValid;

    return Response.json({
      seal_valid: sealValid,
      verify_ref: ref,
      agreement_no: seal.agreement_no,
      terms_version: seal.terms_version,
      mode: seal.mode,
      sealed_at: seal.sealed_at,
      face_cents: sale.face_cents ?? null,
      amount_cents: sale.amount_cents ?? null,
      serial_lo: sale.serial_lo ?? null,
      serial_hi: sale.serial_hi ?? null,
      gb_account_last4: sale.gb_account_last4 ?? null,
      integrity: {
        chain_hash: seal.chain_hash,
        chain_valid: chainValid,
        signature_valid: signatureValid,
        terms_hash: seal.terms_hash,
        public_key_hex: seal.public_key_hex,
      },
      error: sealValid ? null : (!chainValid ? 'Hash chain broken — a sealed field or an earlier record was altered.' : 'Ed25519 signature invalid.'),
    });
  } catch (error) {
    return Response.json({ seal_valid: false, error: (error as Error).message }, { status: 500 });
  }
});