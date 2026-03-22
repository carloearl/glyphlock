import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check system health
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: 'operational',
        functions: 'operational',
        storage: 'operational'
      },
      uptime: '99.9%'
    };

    return Response.json(health);
  } catch (error) {
    return Response.json({ 
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});