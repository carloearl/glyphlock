import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const results = [];

  const stubNames = ['Jane', 'Jon Doe', 'Demo Star 1', 'Demo Star 2', 'Demo Star 3'];

  for (const name of stubNames) {
    try {
      // Filter by stage_name across ALL venues (stubs may predate venue_id)
      const records = await base44.asServiceRole.entities.Entertainer.filter({ stage_name: name });
      if (records && records.length > 0) {
        for (const r of records) {
          await base44.asServiceRole.entities.Entertainer.update(r.id, { status: 'inactive', is_demo: true });
          results.push('Archived: ' + name + ' (' + r.id + ')');
        }
      } else {
        results.push('Not found by filter: ' + name);
      }
    } catch (e) {
      results.push('FAILED ' + name + ': ' + e.message);
    }
  }

  return Response.json({ results });
});