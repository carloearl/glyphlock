// DACO VIP SHOW CONTRACT SYSTEM v2 — INGEST (POST /api/vip-contracts equivalent)
// Accepts the generator's writeEntity payload: { mode, writes:[{entity,op,data}...], invariants }
// Enforces BEFORE persistence:
//   - total_sales === cash_sales + card_sales  (422 otherwise)
//   - chain seal recomputation (422 on tamper)
// Completes CORS-blocked blockchain anchors server-side (ANCHOR_PENDING_SERVER → ANCHOR_SUBMITTED).
// Writes VIPShowContract + SystemAuditLog + AuditEvent together; contract is rolled back
// if the audit rows cannot be written (a contract row without both audit rows is a defect).
// GlyphBucks tendered is a stored-value LIABILITY delta — never revenue.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const OTS_CALENDARS = [
  'https://alice.btc.calendar.opentimestamps.org/digest',
  'https://bob.btc.calendar.opentimestamps.org/digest',
  'https://a.pool.opentimestamps.org/digest',
];

const encTxt = new TextEncoder();

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', encTxt.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Recompute and confirm the chain seal. Key order is hash-significant:
// verify_ref is nulled IN PLACE (it existed with value null at hash time);
// record_hash/prev_seal/chain_seal/anchor were appended after hashing.
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

// Submit chain seal digest to OpenTimestamps Bitcoin calendars (server-side; no CORS).
async function anchorDigest(chainSealHex: string) {
  for (const cal of OTS_CALENDARS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(cal, {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.opentimestamps.v1' },
        body: hexToBytes(chainSealHex),
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
        note: 'Pending Bitcoin attestation; calendars aggregate and commit within hours. Upgrade proof via OTS client to obtain block height.',
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

    const payload = await req.json();
    if (!payload || !Array.isArray(payload.writes)) {
      return Response.json({ ok: false, error: 'Malformed payload.' }, { status: 400 });
    }
    const contractWrite = payload.writes.find((w: any) => w.entity === 'VIPShowContract');
    if (!contractWrite?.data) {
      return Response.json({ ok: false, error: 'Missing VIPShowContract write.' }, { status: 400 });
    }
    const r = contractWrite.data;

    // INVARIANT: total_sales === cash_sales + card_sales
    const tender = r.tender || {};
    const sumOK = Math.abs(((Number(tender.cash_sales) || 0) + (Number(tender.card_sales) || 0)) - (Number(tender.total_sales) || 0)) < 0.005;
    if (!sumOK) {
      return Response.json({ ok: false, error: 'INVARIANT: total_sales must equal cash_sales + card_sales.' }, { status: 422 });
    }

    // INVARIANT: chain seal recomputation
    const seal = await verifyChainSeal(r);
    if (seal.tamper_detected) {
      return Response.json({ ok: false, error: 'INVARIANT: chain seal failed recomputation — record rejected.', seal }, { status: 422 });
    }

    // Byte-exact evidence copy — verification/reprint always use this string.
    const sealedJson = JSON.stringify(r);

    // Complete anchor server-side if the browser was CORS-blocked.
    if (r.anchor && r.anchor.status === 'ANCHOR_PENDING_SERVER') {
      r.anchor = await anchorDigest(r.chain_seal);
    }

    const created = await base44.asServiceRole.entities.VIPShowContract.create({
      ...r,
      membership_id: r.guest?.membership_id || null,
      sealed_json: sealedJson,
    });

    // Dual audit logging — atomic-or-rollback.
    const nowISO = new Date().toISOString();
    try {
      const sysWrite = payload.writes.find((w: any) => w.entity === 'SystemAuditLog');
      const evWrite = payload.writes.find((w: any) => w.entity === 'AuditEvent');

      const sysData = sysWrite?.data || {};
      await base44.asServiceRole.entities.SystemAuditLog.create({
        ...sysData,
        event_type: sysData.event_type || sysData.event || 'VIP_SHOW_CONTRACT_CREATED',
        description: sysData.description || `VIP Show Contract ${r.contract_ref} sealed (${r.verify_ref})`,
        actor_email: user.email,
        resource_id: created.id,
        metadata: { ...(sysData.metadata || {}), verify_ref: r.verify_ref, contract_ref: r.contract_ref, venue_id: r.venue_id, mode: r.mode, anchor_status: r.anchor?.status || 'NONE' },
        status: 'success',
      });

      // AuditEvent has a strict schema — try generator data first, fall back to compliant synthesis.
      const glyphbucksTendered = Number(r.notes?.glyphbucks_tendered) || 0;
      const synthesized = {
        venue_id: r.venue_id,
        timestamp: nowISO,
        event_type: 'VipCharge',
        event_category: 'financial',
        severity: 'low',
        mode: String(r.mode || 'REAL').toLowerCase(),
        session_id: r.verify_ref,
        source: 'pos',
        entity_type: 'VIPShowContract',
        entity_id: created.id,
        new_value: { contract_ref: r.contract_ref, verify_ref: r.verify_ref, total: r.total },
        notes: {
          ...(r.notes || {}),
          glyphbucks_liability_delta: glyphbucksTendered > 0 ? -glyphbucksTendered : 0,
          generator_audit: evWrite?.data || null,
        },
        financial_context: {
          gross_value: Number(r.total) || 0,
          payment_type: glyphbucksTendered > 0 ? 'mixed' : ((Number(tender.card_sales) || 0) > 0 && (Number(tender.cash_sales) || 0) > 0 ? 'mixed' : ((Number(tender.card_sales) || 0) > 0 ? 'card' : 'cash')),
          cash_portion: Number(tender.cash_sales) || 0,
          card_portion: Number(tender.card_sales) || 0,
          glyphbucks_portion: glyphbucksTendered,
          total_sales_impact: Number(tender.total_sales) || 0,
        },
        actor_ref: user.email,
        identity_verified: false,
        retention_class: 'compliance',
        event_version: 1,
      };
      try {
        if (evWrite?.data) {
          await base44.asServiceRole.entities.AuditEvent.create(evWrite.data);
        } else {
          await base44.asServiceRole.entities.AuditEvent.create(synthesized);
        }
      } catch (_schemaErr) {
        await base44.asServiceRole.entities.AuditEvent.create(synthesized);
      }
    } catch (auditErr) {
      // A contract row without both audit rows is a defect — roll back.
      await base44.asServiceRole.entities.VIPShowContract.delete(created.id);
      return Response.json({ ok: false, error: 'Audit write failed — contract rolled back: ' + (auditErr as Error).message }, { status: 500 });
    }

    return Response.json({ ok: true, verify_ref: r.verify_ref, anchor: r.anchor?.status || 'NONE', id: created.id });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
});