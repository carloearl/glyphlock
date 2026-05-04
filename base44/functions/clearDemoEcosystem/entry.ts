// DACO OMEGA v6.0 — Phase 6: clearDemoEcosystem
// SOVEREIGN-gated. Removes records flagged as demo in scoped entities.
// Touches ONLY: NUPSUser (is_demo=true), POSBatch (DEMO-BATCH-*),
// POSTransaction (DEMO-TX-*), TipPayout (status pending + venue tagged).
// Does NOT touch the real "Lucky" entertainer or any non-demo records.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function isCallerSovereign(base44, email) {
  if (!email) return false;
  try {
    const matches = await base44.asServiceRole.entities.NUPSUser.filter({ created_by: email });
    return (matches || []).some((u) => u?.sovereign_flag === true || u?.role === 'SOVEREIGN');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'UNAUTHORIZED', code: 401 }, { status: 401 });

    const sovereign = await isCallerSovereign(base44, me.email);
    if (!sovereign) {
      return Response.json({ error: 'SOVEREIGN_REQUIRED', code: 403 }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const venue_id = body.venue_id || 'DEMO_VENUE_001';

    const removed = { staff: 0, batches: 0, transactions: 0, tipPayouts: 0 };

    // Staff: only is_demo=true records
    const demoStaff = await base44.asServiceRole.entities.NUPSUser.filter({ is_demo: true, venue_id });
    for (const u of demoStaff || []) {
      await base44.asServiceRole.entities.NUPSUser.delete(u.id);
      removed.staff += 1;
    }

    // Batches: only those with batch_id starting DEMO-BATCH-
    const allBatches = await base44.asServiceRole.entities.POSBatch.filter({ venue_id });
    for (const b of allBatches || []) {
      if (typeof b.batch_id === 'string' && b.batch_id.startsWith('DEMO-BATCH-')) {
        await base44.asServiceRole.entities.POSBatch.delete(b.id);
        removed.batches += 1;
      }
    }

    // Transactions: only those with transaction_id starting DEMO-TX-
    const allTx = await base44.asServiceRole.entities.POSTransaction.filter({ venue_id });
    for (const t of allTx || []) {
      if (typeof t.transaction_id === 'string' && t.transaction_id.startsWith('DEMO-TX-')) {
        await base44.asServiceRole.entities.POSTransaction.delete(t.id);
        removed.transactions += 1;
      }
    }

    // TipPayouts: only those tagged with bucket=BUCKET_1_STAFF_POOL AND status pending AND matching venue
    const allTips = await base44.asServiceRole.entities.TipPayout.filter({ venue_id, status: 'pending' });
    for (const tp of allTips || []) {
      if (tp.split_config?.bucket === 'BUCKET_1_STAFF_POOL') {
        await base44.asServiceRole.entities.TipPayout.delete(tp.id);
        removed.tipPayouts += 1;
      }
    }

    await base44.asServiceRole.entities.MigrationAuditLog.create({
      entity_name: 'multi',
      operation: 'delete',
      actor_id: me.email,
      actor_role: 'SOVEREIGN',
      mode: 'DEMO',
      tier: 'TIER_1_OBSERVE',
      result: 'allowed',
      venue_id,
      notes: `clearDemoEcosystem: ${JSON.stringify(removed)}`,
    });

    return Response.json({ ok: true, venue_id, removed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});