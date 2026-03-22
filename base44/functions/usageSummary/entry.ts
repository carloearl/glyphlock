import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get real usage data
    const keys = await base44.asServiceRole.entities.APIKey.filter({
      created_by: user.email
    });

    const logs = await base44.asServiceRole.entities.SystemAuditLog.filter({
      actor_email: user.email
    });

    // Calculate actual usage metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const logsToday = logs.filter(log => new Date(log.created_date) >= today);

    const summary = {
      api_keys: {
        total: keys.length,
        active: keys.filter(k => k.status === 'active').length,
        limit: 50
      },
      requests: {
        today: logsToday.length,
        this_month: logs.filter(log => {
          const logDate = new Date(log.created_date);
          return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
        }).length
      },
      functions: {
        deployed: 0, // TODO: Track deployed functions
        limit: null // unlimited
      }
    };

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});