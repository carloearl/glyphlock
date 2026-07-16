// DACO VIP SHOW CONTRACT SYSTEM v2 — ANCHOR COMPLETION / RETRY (cron-safe)
// Re-submits any record stuck in ANCHOR_PENDING_SERVER or ANCHOR_FAILED_RETRY
// to the OpenTimestamps Bitcoin calendars. Runs on a 15-minute schedule.
// Anchor lifecycle: ANCHOR_PENDING_SERVER → ANCHOR_SUBMITTED → (offline OTS
// upgrade) BITCOIN_ATTESTED(block_height). The .ots proof_b64 is stored
// unmodified — it is the cryptographic evidence.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const OTS_CALENDARS = [
  'https://alice.btc.calendar.opentimestamps.org/digest',
  'https://bob.btc.calendar.opentimestamps.org/digest',
  'https://a.pool.opentimestamps.org/digest',
];

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
        note: 'Pending Bitcoin attestation; upgrade proof via OTS client to obtain block height.',
      };
    } catch (_e) { /* try next calendar */ }
  }
  return { status: 'ANCHOR_FAILED_RETRY', protocol: 'OpenTimestamps→Bitcoin' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Automation runs without a user session; direct invocations require admin.
    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await base44.asServiceRole.entities.VIPShowContract.filter({}, '-executed_at', 500);
    const pending = rows.filter((r: any) =>
      r.anchor && ['ANCHOR_PENDING_SERVER', 'ANCHOR_FAILED_RETRY'].includes(r.anchor.status));

    const results: any[] = [];
    for (const rec of pending) {
      const anchor = await anchorDigest(rec.chain_seal);
      await base44.asServiceRole.entities.VIPShowContract.update(rec.id, { anchor });
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'ANCHOR_COMPLETED',
        description: `VIP Show Contract ${rec.verify_ref} anchor retry → ${anchor.status}`,
        actor_email: user?.email || 'automation',
        resource_id: rec.id,
        metadata: { verify_ref: rec.verify_ref, anchor_status: anchor.status, calendar: (anchor as any).calendar || null },
        status: anchor.status === 'ANCHOR_SUBMITTED' ? 'success' : 'failure',
      });
      results.push({ verify_ref: rec.verify_ref, anchor: anchor.status });
    }

    return Response.json({ ok: true, checked: rows.length, retried: results.length, results });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
});