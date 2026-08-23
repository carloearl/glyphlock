import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const SYNTHETIC_EMAIL = 'batch18-runtime@invalid.test';
const SYNTHETIC_MARKER = 'B18-SYNTHETIC-PUBLIC-RUNTIME';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const E = base44.asServiceRole.entities;
    const removed: Record<string, number> = { Consultation: 0, ContactEvent: 0, PublicMutationGrant: 0 };

    for (const entity of ['Consultation', 'ContactEvent']) {
      const rows = await E[entity].filter({ email: SYNTHETIC_EMAIL }, '-created_date', 50).catch(() => []);
      for (const row of rows || []) {
        const serialized = JSON.stringify(row);
        if (!serialized.includes(SYNTHETIC_MARKER)) continue;
        const grants = await E.PublicMutationGrant.filter({ entity_name: entity, record_id: row.id }, null, 50).catch(() => []);
        for (const grant of grants || []) {
          await E.PublicMutationGrant.delete(grant.id);
          removed.PublicMutationGrant += 1;
        }
        await E[entity].delete(row.id);
        removed[entity] += 1;
      }
    }

    await E.SystemAuditLog.create({
      event_type: 'BATCH18_SYNTHETIC_PUBLIC_RECORDS_CLEANED',
      description: 'Removed the exact Batch 18 synthetic public-intake records after runtime verification.',
      actor_email: 'batch18-cleanup',
      status: 'security_action',
      severity: 'low',
      metadata: { marker: SYNTHETIC_MARKER, removed, production_records_targeted: false },
    }).catch(() => null);

    return Response.json({ success: true, marker: SYNTHETIC_MARKER, removed });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || 'Synthetic cleanup failed.' }, { status: 500 });
  }
});
