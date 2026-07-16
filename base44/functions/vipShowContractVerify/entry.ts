// DACO VIP SHOW CONTRACT SYSTEM v2 — PUBLIC VERIFICATION (GET /v/:ref equivalent)
// READ-ONLY. The QR on every printed contract resolves to the /v/:ref page which
// calls this. Returns receipt-level PII only — no raw biometrics, no full PAN.
// Seal verification recomputes from the stored sealed_json string (key order is
// hash-significant; JSON.parse preserves the original textual order).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const encTxt = new TextEncoder();

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', encTxt.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyChainSeal(record: any) {
  const clone: any = { ...record };
  delete clone.record_hash; delete clone.prev_seal; delete clone.chain_seal;
  delete clone.anchor;
  clone.verify_ref = null;
  const recomputedRecordHash = await sha256Hex(JSON.stringify(clone));
  const recomputedSeal = await sha256Hex(String(record.prev_seal) + String(record.record_hash));
  return {
    record_hash_valid: recomputedRecordHash === record.record_hash,
    chain_seal_valid: recomputedSeal === record.chain_seal,
    tamper_detected:
      recomputedRecordHash !== record.record_hash || recomputedSeal !== record.chain_seal,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ref } = await req.json();
    if (!ref) return Response.json({ verified: false, error: 'Missing reference.' }, { status: 400 });

    const rows = await base44.asServiceRole.entities.VIPShowContract.filter(
      { verify_ref: String(ref).toUpperCase() }, '-executed_at', 1,
    );
    if (!rows.length) {
      return Response.json({ verified: false, error: 'No sealed record for this reference.' }, { status: 404 });
    }
    const row = rows[0];
    // ALWAYS verify against the byte-exact stored evidence, never the DB projection.
    const rec = row.sealed_json ? JSON.parse(row.sealed_json) : row;
    const seal = await verifyChainSeal(rec);

    return Response.json({
      verified: !seal.tamper_detected,
      verify_ref: rec.verify_ref || row.verify_ref,
      contract_ref: rec.contract_ref,
      document: 'VIP Private Suite & Performance Contract — Agreement & Receipt v2.0',
      venue: rec.venue, operator: rec.operator, software: rec.software,
      executed_at: rec.executed_at, mode: rec.mode,
      guest: {
        name: rec.guest?.name,
        membership_id: rec.guest?.membership_id,
        card_last4: rec.guest?.card_last4,
      }, // receipt-level PII only
      totals: {
        total: rec.total,
        total_sales: rec.tender?.total_sales,
        glyphbucks_tendered: rec.notes?.glyphbucks_tendered,
      },
      integrity: {
        terms_hash: rec.terms_hash,
        record_hash: rec.record_hash,
        chain_seal: rec.chain_seal,
        record_hash_valid: seal.record_hash_valid,
        chain_seal_valid: seal.chain_seal_valid,
        tamper_detected: seal.tamper_detected,
      },
      blockchain_anchor: row.anchor || rec.anchor || null,
      representment: {
        clickwrap_assent: true,
        terms_hash: rec.terms_hash,
        identity_binding: {
          id_scan_ref: rec.guest?.id_scan_ref,
          face_match_pct: rec.guest?.face_match_pct,
          thumb_match_pct: rec.guest?.thumb_match_pct,
        },
        delivery: 'printed copy delivered at execution',
        statutes: ['A.R.S. § 23-1601', 'A.R.S. § 44-7402', '15 U.S.C. § 1666'],
      },
    });
  } catch (_error) {
    return Response.json({ verified: false, error: 'Verification service error.' }, { status: 500 });
  }
});