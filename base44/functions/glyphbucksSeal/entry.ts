// DACO GlyphBucks Stored-Value Contract-Receipt — SERVER-SIDE SEAL (§3, §4, §7.7).
// Builds the canonical record, signs it with Ed25519 (private key NEVER leaves
// the server), links the append-only hash chain, and writes SealRecord +
// AssentEvidence + GlyphBucksSale + GlyphBucksLedger (liability) with dual audit
// logging. REAL mode is refused until the Production Readiness Gate (§9).
//
// Key management: GLYPHBUCKS_ED25519_SK secret holds the PKCS#8 private key (base64).
// If unset, a DEMO ephemeral key is derived from KEY_PEPPER so DEMO/SANDBOX work
// out of the box — that key path is BLOCKED for REAL mode (a real KMS key is a §9 gate item).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const GB_TERMS_VERSION = 'v2.0';
// Canonical v2.0 terms text — MUST match src/constants/glyphbucksTerms.js byte-for-byte.
const GB_TERMS = [
  "INSTRUMENT SALE ONLY — This transaction is the sale of GlyphBucks™ stored-value vouchers. It is not a purchase of, prepayment for, or guarantee of any performance, service, or entertainment. [PURCHASER INITIALS]",
  "CLOSED-LOOP REDEMPTION — Vouchers are redeemable only at participating venue points of sale as a separate future transaction. No cash redemption except where required by law.",
  "NON-REFUNDABLE — All voucher sales are final and non-refundable per A.R.S. § 44-7402. [PURCHASER INITIALS]",
  "DISPUTE PROCESS — Purchaser may raise billing disputes with the Issuer within 60 days of purchase. Nothing herein limits any statutory right.",
  "SEGREGATED RESERVE — Outstanding voucher value is backed by a segregated reserve account held by the Issuer.",
  "TAX AT REDEMPTION — Stored-value issuance is not a retail sale; applicable transaction privilege tax is collected at redemption pursuant to A.R.S. § 42-5061.",
  "LIABILITY ACCOUNTING — Issued value is recorded as a stored-value liability of the Issuer, not revenue.",
  "AGE & IDENTITY — Purchaser affirms they are 21 years of age or older and that identity was verified at purchase.",
  "ELECTRONIC ASSENT — This agreement is executed by electronic signature under the Arizona Electronic Transactions Act and the federal E-SIGN Act.",
  "CHARGEBACKS — Card chargebacks are borne by the Issuer of record; GlyphLock LLC is held harmless as software provider. Dispute defense is by representment evidence only.",
  "FCBA NON-WAIVER — Nothing in this agreement waives, limits, or conditions the purchaser's rights under the Fair Credit Billing Act, 15 U.S.C. § 1666, or Regulation Z. This clause is mandatory and survives all other terms.",
  "DELIVERY — This agreement-receipt is delivered in print and electronically; delivery timestamps are logged.",
  "RETENTION & TAMPER-EVIDENCE — The sealed record is retained append-only with cryptographic tamper-evidence (Ed25519 signature and hash chain).",
  "GOVERNING LAW — Governed by the laws of Arizona; exclusive venue Maricopa County.",
];
const GB_TERMS_TEXT = GB_TERMS.map((t, i) => `${i + 1}. ${t}`).join('\n');

const enc = new TextEncoder();

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Resolve the signing key. REAL mode REQUIRES GLYPHBUCKS_ED25519_SK (a §9 gate item).
async function resolveKeyPair(mode: string) {
  const skB64 = Deno.env.get('GLYPHBUCKS_ED25519_SK');
  if (skB64) {
    const pkcs8 = Uint8Array.from(atob(skB64), (c) => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, true, ['sign']);
    // Derive public raw from JWK.
    const jwk = await crypto.subtle.exportKey('jwk', privateKey);
    const pubRaw = Uint8Array.from(atob((jwk.x || '').replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    return { privateKey, publicHex: bytesToHex(pubRaw), demo: false };
  }
  if (mode === 'REAL') throw new Error('REAL mode requires GLYPHBUCKS_ED25519_SK (Production Readiness Gate §9). Refusing to seal a REAL record with a demo key.');
  // DEMO/SANDBOX ephemeral keypair — public half is stored on the SealRecord and
  // used for verification, so per-call keys verify correctly. The private half
  // exists only inside this handler and is never persisted or returned (§3).
  const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  return { privateKey: kp.privateKey, publicHex: bytesToHex(pubRaw), demo: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mode = String(body.mode || 'DEMO').toUpperCase();
    if (mode === 'REAL') {
      return Response.json({ ok: false, error: 'REAL mode is locked until the Production Readiness Gate (§9) is signed off. Use DEMO or SANDBOX.' }, { status: 403 });
    }
    if (!body.venue_id) return Response.json({ ok: false, error: 'venue_id required.' }, { status: 400 });
    const esigs = body.esigs || {};
    if (!esigs.purchaser || !esigs.issuer_rep || !esigs.manager) {
      return Response.json({ ok: false, error: 'Three e-signatures required (purchaser, issuer rep, manager).' }, { status: 422 });
    }
    if (String(esigs.issuer_rep).trim().toLowerCase() === String(esigs.manager).trim().toLowerCase()) {
      return Response.json({ ok: false, error: 'Manager must be a distinct person from the issuer rep (§7.5).' }, { status: 422 });
    }

    const denom = Number(body.denom_cents) || 0;
    const qty = Number(body.qty) || 0;
    const faceCents = denom * qty;
    const cardFee = Number(body.card_fee_cents) || 0;
    const amountCents = faceCents + cardFee;
    if (faceCents <= 0) return Response.json({ ok: false, error: 'Face value must be positive.' }, { status: 422 });

    const now = new Date();
    const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
    const seq = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const rand4 = bytesToHex(crypto.getRandomValues(new Uint8Array(2))).toUpperCase();
    const agreementNo = `GB-${ymd}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const receiptNo = `RC-${ymd}-${seq}`;
    const verifyRef = `VRF-${ymd}-${seq}-${rand4}`;

    // Voucher serials — registered range for this sale.
    let serialLo = 1;
    try {
      const lastSale = await base44.asServiceRole.entities.GlyphBucksSale.filter({ venue_id: body.venue_id }, '-created_date', 1);
      if (lastSale?.[0]?.serial_hi) serialLo = Number(lastSale[0].serial_hi) + 1;
    } catch (_) { /* genesis */ }
    const serialHi = serialLo + qty - 1;

    // Hash chain (append-only; per-venue).
    const termsHash = await sha256Hex(GB_TERMS_TEXT);
    let prevBlockHash = '0'.repeat(64);
    try {
      const lastSeal = await base44.asServiceRole.entities.SealRecord.filter({ venue_id: body.venue_id }, '-created_date', 1);
      if (lastSeal?.[0]?.chain_hash) prevBlockHash = lastSeal[0].chain_hash;
    } catch (_) { /* genesis */ }
    const chainHash = await sha256Hex(prevBlockHash + termsHash + agreementNo);

    // Canonical signed payload — EXACT sorted keys (§3.5): v, ref, iss, doc, prod, amt, cur, face, sn, acct, th, ch, ts
    const canonical = {
      v: GB_TERMS_VERSION,
      ref: verifyRef,
      iss: 'GlyphLock LLC',
      doc: 'GlyphBucks Purchase Agreement & Receipt',
      prod: 'stored-value-voucher',
      amt: amountCents,
      cur: String(body.currency || 'USD'),
      face: faceCents,
      sn: `${serialLo}-${serialHi}`,
      acct: String(body.gb_account_last4 || ''),
      th: termsHash,
      ch: chainHash,
      ts: now.toISOString(),
    };
    const canonicalJson = JSON.stringify(canonical);

    const { privateKey, publicHex, demo } = await resolveKeyPair(mode);
    const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, enc.encode(canonicalJson)));
    const signedToken = `NUPS1.${b64url(enc.encode(canonicalJson))}.${b64url(sig)}`;
    const pubId = (await sha256Hex(publicHex)).slice(0, 16);

    // --- WRITES (append-only seal) ---
    const sealed = await base44.asServiceRole.entities.SealRecord.create({
      verify_ref: verifyRef, venue_id: body.venue_id, agreement_no: agreementNo,
      terms_version: GB_TERMS_VERSION, terms_hash: termsHash,
      prev_block_hash: prevBlockHash, chain_hash: chainHash,
      ed25519_pub_id: pubId, public_key_hex: publicHex, signed_token: signedToken,
      tsa_token: null, sealed_at: now.toISOString(), mode,
    });

    try {
      await base44.asServiceRole.entities.AssentEvidence.create({
        verify_ref: verifyRef, venue_id: body.venue_id,
        clickwrap_accepted: !!body.assent?.clickwrap_accepted,
        terms_shown_at: body.assent?.terms_shown_at || null,
        scroll_depth_pct: Number(body.assent?.scroll_depth_pct) || 0,
        dwell_seconds: Number(body.assent?.dwell_seconds) || 0,
        accepted_at: body.assent?.accepted_at || now.toISOString(),
        ip: req.headers.get('x-forwarded-for') || null,
        id_scan_ref: body.identity?.id_scan_ref || null,
        age_verified: !!body.identity?.age_verified,
        face_id_match_pct: body.identity?.face_id_match_pct ?? null,
        thumbprint_match_pct: body.identity?.thumb_match_pct ?? null,
        card_auth_code: body.card_auth_code || null,
        card_last4: body.card_last4 || null,
        card_entry: body.card_entry || 'CHIP',
        esig_purchaser_ref: esigs.purchaser, esig_issuer_rep_ref: esigs.issuer_rep, esig_manager_ref: esigs.manager,
        delivery_printed_at: null, delivery_emailed_at: null, delivery_sms_at: null,
        mode,
      });

      const saleId = `GBS-${ymd}-${seq}`;
      await base44.asServiceRole.entities.GlyphBucksSale.create({
        sale_id: saleId, agreement_no: agreementNo, receipt_no: receiptNo, verify_ref: verifyRef,
        venue_id: body.venue_id, purchaser_member_id: body.purchaser_member_id || null,
        gb_account_last4: body.gb_account_last4 || null,
        denom_cents: denom, qty, face_cents: faceCents, card_fee_cents: cardFee, amount_cents: amountCents,
        currency: body.currency || 'USD', serial_lo: serialLo, serial_hi: serialHi,
        mcc: body.mcc || 'stored_value', mode, status: 'SEALED', sealed_at: now.toISOString(),
      });

      // Liability ledger — NEVER revenue, excluded from total_sales.
      await base44.asServiceRole.entities.GlyphBucksLedger.create({
        entry_id: `GBL-${ymd}-${seq}`, venue_id: body.venue_id, verify_ref: verifyRef, sale_id: saleId,
        entry_type: 'ISSUANCE', liability_delta_cents: faceCents, currency: body.currency || 'USD',
        posted_at: now.toISOString(), mode, notes: 'Stored-value issuance — liability, not revenue.',
      });

      // Dual audit logging.
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'GLYPHBUCKS_SALE_SEALED',
        description: `GlyphBucks sale ${agreementNo} sealed (${verifyRef}) — $${(amountCents / 100).toFixed(2)}`,
        actor_email: user.email, resource_id: sealed.id,
        metadata: { verify_ref: verifyRef, agreement_no: agreementNo, venue_id: body.venue_id, mode, face_cents: faceCents, amount_cents: amountCents, demo_key: demo },
        status: 'success',
      }).catch(() => {});

      await base44.asServiceRole.entities.AuditEvent.create({
        venue_id: body.venue_id, timestamp: now.toISOString(),
        event_type: 'GlyphBucksPayment', event_category: 'glyphbucks', severity: 'low',
        mode: mode.toLowerCase(), session_id: verifyRef, source: 'pos',
        entity_type: 'GlyphBucksSale', entity_id: sealed.id,
        new_value: { agreement_no: agreementNo, verify_ref: verifyRef, face_cents: faceCents, amount_cents: amountCents },
        // Stored-value issuance NEVER adds to total_sales_impact (§2, §3.1).
        financial_context: {
          gross_value: amountCents / 100, payment_type: 'glyphbucks',
          cash_portion: 0, card_portion: 0, glyphbucks_portion: amountCents / 100, total_sales_impact: 0,
        },
        notes: { glyphbucks_liability_delta_cents: faceCents, instrument_sale_only: true },
        actor_ref: user.email, identity_verified: false, retention_class: 'compliance', event_version: 1,
      }).catch(() => {});
    } catch (writeErr) {
      // Seal is append-only and already committed; surface the partial-write defect.
      return Response.json({ ok: false, error: 'Seal committed but a downstream write failed: ' + (writeErr as Error).message, verify_ref: verifyRef }, { status: 500 });
    }

    return Response.json({
      ok: true, verify_ref: verifyRef, agreement_no: agreementNo, receipt_no: receiptNo,
      face_cents: faceCents, amount_cents: amountCents, serial_lo: serialLo, serial_hi: serialHi,
      chain_hash: chainHash, public_key_hex: publicHex, signed_token: signedToken,
      sealed_at: now.toISOString(), mode, demo_key: demo,
    });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
});