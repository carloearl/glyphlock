import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only gate — a data purge must never be invokable by regular users.
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const results = {};

  for (const [entityName, ids] of Object.entries(body)) {
    if (entityName.startsWith('_')) continue;
    let deleted = 0;
    let failed = 0;
    let errors = [];

    for (const id of ids) {
      try {
        await base44.asServiceRole.entities[entityName].delete(id);
        deleted++;
      } catch (e) {
        failed++;
        if (errors.length < 3) errors.push({ id, error: e.message });
      }
    }

    results[entityName] = { total: ids.length, deleted, failed, errors: errors.length > 0 ? errors : undefined };
  }

  return Response.json({ success: true, purge: 'complete', results });
});