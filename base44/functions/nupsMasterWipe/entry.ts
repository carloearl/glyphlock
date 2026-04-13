import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * NUPS MASTER DATA WIPE
 * Wipes all operational NUPS data to zero.
 * Preserves: NUPSUser, Entertainer, POSProduct, Venue, SystemAuditLog
 * Requires: admin role + confirm_phrase === "WIPE ALL NUPS DATA"
 */

const WIPE_ENTITIES = [
  'POSTransaction',
  'POSBatch',
  'POSZReport',
  'VenueContract',
  'GlyphBucksTransaction',
  'GlyphBucksOrder',
  'GlyphBucksBill',
  'GlyphBucksBatch',
  'VIPRoom',
  'VIPGuest',
  'EntertainerShift',
  'DriverPayout',
  'TipPayout',
  'ContractorPayout',
  'DailySettlement',
  'VIPContractRecord',
  'VIPSessionReport',
];

async function wipeEntity(base44, entityName) {
  try {
    const records = await base44.asServiceRole.entities[entityName].list('', 1000);
    if (!records || records.length === 0) return { entity: entityName, deleted: 0 };

    let deleted = 0;
    for (const record of records) {
      try {
        await base44.asServiceRole.entities[entityName].delete(record.id);
        deleted++;
      } catch { /* skip individual failures */ }
    }
    return { entity: entityName, deleted };
  } catch (err) {
    return { entity: entityName, deleted: 0, error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { confirm_phrase, wipe_scope = 'all' } = body;

    if (confirm_phrase !== 'WIPE ALL NUPS DATA') {
      return Response.json({ error: 'Invalid confirmation phrase. You must type exactly: WIPE ALL NUPS DATA' }, { status: 400 });
    }

    const startTime = Date.now();
    const results = [];
    let totalDeleted = 0;

    // Write audit log BEFORE wipe (immutable record)
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'NUPS_MASTER_WIPE_INITIATED',
      description: `NUPS Master Wipe initiated by ${user.email}. Scope: ${wipe_scope}. All operational data will be deleted.`,
      actor_email: user.email,
      status: 'alert',
      severity: 'critical',
      metadata: {
        initiated_by: user.email,
        initiated_at: new Date().toISOString(),
        scope: wipe_scope,
        entities_targeted: WIPE_ENTITIES,
        section: 'NUPS-MASTER-WIPE'
      }
    });

    // Wipe each entity
    for (const entityName of WIPE_ENTITIES) {
      const result = await wipeEntity(base44, entityName);
      results.push(result);
      totalDeleted += result.deleted;
    }

    const elapsed = Date.now() - startTime;

    // Write completion audit log
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'NUPS_MASTER_WIPE_COMPLETE',
      description: `NUPS Master Wipe complete. ${totalDeleted} records deleted in ${elapsed}ms by ${user.email}.`,
      actor_email: user.email,
      status: 'success',
      severity: 'critical',
      metadata: {
        completed_by: user.email,
        completed_at: new Date().toISOString(),
        total_deleted: totalDeleted,
        elapsed_ms: elapsed,
        results,
        section: 'NUPS-MASTER-WIPE'
      }
    });

    return Response.json({
      success: true,
      total_deleted: totalDeleted,
      elapsed_ms: elapsed,
      results,
      wiped_at: new Date().toISOString(),
      wiped_by: user.email,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});