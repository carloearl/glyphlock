import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * NUPS BATCH RESET
 * Deletes only POSBatch records.
 * Leaves all other data (transactions, contracts, entertainers, etc.) untouched.
 * Requires: admin role + confirm_phrase === "RESET BATCHES"
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });

    const body = await req.json();
    if (body.confirm_phrase !== 'RESET BATCHES') {
      return Response.json({ error: 'Must confirm with: RESET BATCHES' }, { status: 400 });
    }

    const batches = await base44.asServiceRole.entities.POSBatch.list('', 1000);
    let deleted = 0;
    for (const b of (batches || [])) {
      try {
        await base44.asServiceRole.entities.POSBatch.delete(b.id);
        deleted++;
      } catch { /* skip */ }
    }

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'BATCH_RESET',
      description: `POSBatch reset by ${user.email}. ${deleted} batches deleted.`,
      actor_email: user.email,
      status: 'success',
      severity: 'medium',
    });

    return Response.json({ success: true, deleted, entity: 'POSBatch' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});