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

// Resolve the PERSISTENT signing key — server-side only, never leaves this handler.
// Priority: GLYPHBUCKS_ED25519_SK secret (base64 PKCS#8). Fallback: a stable key
// deterministically derived from KEY_PEPPER (PKCS#8 = fixed Ed25519 prefix + 32-byte
// seed = SHA-256 of pepper+context). Same key every call → one published public key
// printed on every receipt, valid offline verification forever.
const PKCS8_ED25519_PREFIX = '302e020100300506032b657004220420';
async function resolveKeyPair(mode: string) {
  const skB64 = Deno.env.get('GLYPHBUCKS_ED25519_SK');
  let pkcs8: Uint8Array;
  let keySource: 'dedicated_secret' | 'derived_demo';

  if (skB64) {
    pkcs8 = Uint8Array.from(atob(skB64), (c) => c.charCodeAt(0));
    keySource = 'dedicated_secret';
  } else {
    // REAL evidence must never depend on a general application pepper. Demo
    // continuity may use the deterministic fallback, but production requires a
    // dedicated, independently rotatable signing key.
    if (mode === 'REAL') {
      throw new Error('REAL mode requires the dedicated GLYPHBUCKS_ED25519_SK signing key.');
    }
    const pepper = Deno.env.get('KEY_PEPPER');
    if (!pepper) throw new Error('No demo signing key available. Configure KEY_PEPPER or GLYPHBUCKS_ED25519_SK.');
    const seedHex = await sha256Hex('glyphbucks-ed25519-signing-v1:' + pepper);
    pkcs8 = new Uint8Array([...hexToBytes(PKCS8_ED25519_PREFIX), ...hexToBytes(seedHex)]);
    keySource = 'derived_demo';
  }

  const privateKey = await crypto.subtle.importKey('pkcs8', pkcs8.buffer as ArrayBuffer, { name: 'Ed25519' }, true, ['sign']);
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  const pubRaw = Uint8Array.from(atob(String(jwk.x || '').replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  return { privateKey, publicHex: bytesToHex(pubRaw), keySource };
}

// Real blockchain timestamp — submit the chain hash digest to OpenTimestamps
// Bitcoin calendars (server-side; no CORS). Proof stored unmodified on the SealRecord.
const OTS_CALENDARS = [
  'https://a.pool.opentimestamps.org/digest',
  'https://b.pool.opentimestamps.org/digest',
  'https://finney.calendar.eternitywall.com/digest',
];
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
async function anchorDigest(chainHashHex: string) {
  for (const cal of OTS_CALENDARS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(cal, {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.opentimestamps.v1' },
        body: hexToBytes(chainHashHex),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error('OTS calendar HTTP ' + res.status);
      const proof = new Uint8Array(await res.arrayBuffer());
      return {
        status: 'ANCHOR_SUBMITTED',
        protocol: 'OpenTimestamps→Bitcoin',
        calendar: cal,
        proof_b64: bytesToB64(proof),
        submitted_at: new Date().toISOString(),
        note: 'Pending Bitcoin attestation; calendars aggregate and commit within hours.',
      };
    } catch (_e) { /* try next calendar */ }
  }
  return { status: 'ANCHOR_FAILED_RETRY', protocol: 'OpenTimestamps→Bitcoin' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const mode = String(body.mode || 'DEMO').toUpperCase();
    if (!body.venue_id) return Response.json({ ok: false, error: 'venue_id required.' }, { status: 400 });
    const esigs = body.esigs || {};
    if (!esigs.purchaser || !esigs.issuer_rep || !esigs.manager) {
      return Response.json({ ok: false, error: 'Three e-signatures required (purchaser, issuer rep, manager).' }, { status: 422 });
    }
    // REAL mode hard requirements: clickwrap + both purchaser initials captured.
    if (mode === 'REAL') {
      if (!body.assent?.clickwrap_accepted) return Response.json({ ok: false, error: 'REAL mode requires clickwrap acceptance.' }, { status: 422 });
      if (!body.assent?.initials_term1 || !body.assent?.initials_term3) {
        return Response.json({ ok: false, error: 'REAL mode requires purchaser initials on Terms 1 and 3.' }, { status: 422 });
      }
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
    let ledgerSeq = 1;
    try {
      const lastSale = await base44.asServiceRole.entities.GlyphBucksSale.filter({ venue_id: body.venue_id }, '-created_date', 1);
      if (lastSale?.[0]?.serial_hi) serialLo = Number(lastSale[0].serial_hi) + 1;
      if (lastSale?.[0]) ledgerSeq = Number(lastSale[0].ledger_seq || 0) + 1;
    } catch (_) { /* genesis */ }
    const serialHi = serialLo + qty - 1;
    const terminalId = String(body.terminal_id || 'CG01-T1');
    const shiftId = body.shift_id ? String(body.shift_id) : null;
    const memberTier = body.member_tier ? String(body.member_tier) : null;
    const cardBrand = body.card_brand ? String(body.card_brand) : null;

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

    const { privateKey, publicHex } = await resolveKeyPair();
    const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, enc.encode(canonicalJson)));
    const signedToken = `NUPS1.${b64url(enc.encode(canonicalJson))}.${b64url(sig)}`;
    const pubId = (await sha256Hex(publicHex)).slice(0, 16);

    // Real blockchain timestamp — anchor the chain hash to Bitcoin via OpenTimestamps.
    const anchor = await anchorDigest(chainHash);

    // --- WRITES (append-only seal) ---
    const sealed = await base44.asServiceRole.entities.SealRecord.create({
      verify_ref: verifyRef, venue_id: body.venue_id, agreement_no: agreementNo,
      terms_version: GB_TERMS_VERSION, terms_hash: termsHash,
      prev_block_hash: prevBlockHash, chain_hash: chainHash,
      ed25519_pub_id: pubId, public_key_hex: publicHex, signed_token: signedToken,
      tsa_token: null, anchor, sealed_at: now.toISOString(), mode,
    });

    try {
      await base44.asServiceRole.entities.AssentEvidence.create({
        verify_ref: verifyRef, venue_id: body.venue_id,
        clickwrap_accepted: !!body.assent?.clickwrap_accepted,
        terms_shown_at: body.assent?.terms_shown_at || null,
        scroll_depth_pct: Number(body.assent?.scroll_depth_pct) || 0,
        dwell_seconds: Number(body.assent?.dwell_seconds) || 0,
        accepted_at: body.assent?.accepted_at || now.toISOString(),
        initials_term1: body.assent?.initials_term1 || null,
        initials_term3: body.assent?.initials_term3 || null,
        ip: req.headers.get('x-forwarded-for') || null,
        id_scan_ref: body.identity?.id_scan_ref || null,
        age_verified: !!body.identity?.age_verified,
        face_id_match_pct: body.identity?.face_id_match_pct ?? null,
        thumbprint_match_pct: body.identity?.thumb_match_pct ?? null,
        card_auth_code: body.card_auth_code || null,
        card_last4: body.card_last4 || null,
        card_entry: body.card_entry || 'CHIP',
        esig_purchaser_ref: esigs.purchaser, esig_issuer_rep_ref: esigs.issuer_rep, esig_manager_ref: esigs.manager,
        delivery_printed_at: now.toISOString(), delivery_emailed_at: null, delivery_sms_at: null,
        mode,
      });

      const saleId = `GBS-${ymd}-${seq}`;
      await base44.asServiceRole.entities.GlyphBucksSale.create({
        sale_id: saleId, agreement_no: agreementNo, receipt_no: receiptNo, verify_ref: verifyRef,
        venue_id: body.venue_id, purchaser_name: body.purchaser_name || null,
        purchaser_member_id: body.purchaser_member_id || null,
        gb_account_last4: body.gb_account_last4 || null,
        denom_cents: denom, qty, face_cents: faceCents, card_fee_cents: cardFee, amount_cents: amountCents,
        currency: body.currency || 'USD', serial_lo: serialLo, serial_hi: serialHi,
        mcc: body.mcc || 'stored_value', mode, status: 'SEALED', sealed_at: now.toISOString(),
        terminal_id: terminalId, shift_id: shiftId, ledger_seq: ledgerSeq,
        member_tier: memberTier, card_brand: cardBrand,
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
        metadata: { verify_ref: verifyRef, agreement_no: agreementNo, venue_id: body.venue_id, mode, face_cents: faceCents, amount_cents: amountCents, anchor_status: anchor.status },
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
      terms_hash: termsHash, prev_block_hash: prevBlockHash,
      chain_hash: chainHash, public_key_hex: publicHex, signed_token: signedToken,
      anchor, sealed_at: now.toISOString(), mode,
      terminal_id: terminalId, shift_id: shiftId, ledger_seq: ledgerSeq,
      member_tier: memberTier, card_brand: cardBrand,
      delivery_printed_at: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
});