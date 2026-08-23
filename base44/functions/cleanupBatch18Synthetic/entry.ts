import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const EXACT_EMAIL = 'batch18-synthetic@example.invalid';
const EXACT_FEEDBACK = 'Synthetic governance verification. Not real user feedback.';
const EXACT_SERVICE = 'batch18_synthetic';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405 });
  const base44 = createClientFromRequest(req);
  const E = base44.asServiceRole.entities;
  const targets = [
    ['Consultation', { email: EXACT_EMAIL }],
    ['ContactEvent', { email: EXACT_EMAIL }],
    ['ServiceUsage', { service_name: EXACT_SERVICE }],
    ['LLMFeedback', { feedback: EXACT_FEEDBACK }],
  ] as const;
  const report: Array<{ entity: string; found: number; deleted: number; failed: number }> = [];
  for (const [entity, query] of targets) {
    const rows = await E[entity].filter(query, '-created_date', 200).catch(() => []);
    let deleted = 0;
    let failed = 0;
    for (const row of rows || []) {
      try { await E[entity].delete(row.id); deleted += 1; } catch { failed += 1; }
    }
    report.push({ entity, found: (rows || []).length, deleted, failed });
  }
  await E.SystemAuditLog.create({
    event_type: 'GLYPHLOCK_BATCH18_SYNTHETIC_CLEANUP',
    description: 'Removed exact-match Batch 18 synthetic business records after runtime verification.',
    actor_email: 'batch18-engineering',
    status: report.some((item) => item.failed) ? 'failure' : 'success',
    severity: 'low',
    metadata: { synthetic_only: true, report },
  }).catch(() => null);
  return Response.json({ success: !report.some((item) => item.failed), report });
});
