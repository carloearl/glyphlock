import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch real API keys for this user
    const keys = await base44.asServiceRole.entities.APIKey.filter({
      created_by: user.email
    });

    // Never return secret keys in list view
    const sanitized = keys.map(key => ({
      id: key.id,
      name: key.name,
      public_key: key.public_key,
      env_key: key.env_key,
      status: key.status,
      environment: key.environment,
      last_used: key.last_used,
      last_rotated: key.last_rotated,
      rotation_schedule: key.rotation_schedule,
      permissions: key.permissions,
      created_date: key.created_date
    }));

    return Response.json({ keys: sanitized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});