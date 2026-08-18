import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const calendars = [
      'https://alice.btc.calendar.opentimestamps.org/digest',
      'https://bob.btc.calendar.opentimestamps.org/digest',
      'https://a.pool.opentimestamps.org/digest',
    ];
    const hexToBytes = (hex) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
      }
      return bytes;
    };
    const bytesToB64 = (bytes) => {
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    };
    const anchorDigest = async (chainSealHex) => {
      for (const calendar of calendars) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(calendar, {
            method: 'POST',
            headers: { 'Content-Type': 'application/vnd.opentimestamps.v1' },
            body: hexToBytes(chainSealHex),
            signal: controller.signal,
          });
          if (!response.ok) continue;
          const proof = new Uint8Array(await response.arrayBuffer());
          return {
            status: 'ANCHOR_SUBMITTED',
            protocol: 'OpenTimestamps→Bitcoin',
            calendar,
            proof_b64: bytesToB64(proof),
            submitted_at: new Date().toISOString(),
            note: 'Pending Bitcoin attestation; upgrade proof via OTS client to obtain block height.',
          };
        } catch (_error) {
          // Try the next OpenTimestamps calendar.
        } finally {
          clearTimeout(timeout);
        }
      }
      return { status: 'ANCHOR_FAILED_RETRY', protocol: 'OpenTimestamps→Bitcoin' };
    };

    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_error) {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await base44.asServiceRole.entities.VIPShowContract.filter({}, '-executed_at', 500);
    const pending = rows.filter((record) => record.anchor && ['ANCHOR_PENDING_SERVER', 'ANCHOR_FAILED_RETRY'].includes(record.anchor.status));
    const results = [];

    for (const record of pending) {
      const anchor = await anchorDigest(record.chain_seal);
      await base44.asServiceRole.entities.VIPShowContract.update(record.id, { anchor });
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'ANCHOR_COMPLETED',
        description: `VIP Show Contract ${record.verify_ref} anchor retry → ${anchor.status}`,
        actor_email: user?.email || 'automation',
        resource_id: record.id,
        metadata: { verify_ref: record.verify_ref, anchor_status: anchor.status, calendar: anchor.calendar || null },
        status: anchor.status === 'ANCHOR_SUBMITTED' ? 'success' : 'failure',
      });
      results.push({ verify_ref: record.verify_ref, anchor: anchor.status });
    }

    return Response.json({ ok: true, checked: rows.length, retried: results.length, results });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
});