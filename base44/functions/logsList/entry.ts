import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type'); // 'all' | 'billing' | 'security'

    let logs = await base44.asServiceRole.entities.SystemAuditLog.filter({
      actor_email: user.email
    }, '-created_date', limit);

    // Filter by type if specified
    if (type === 'billing') {
      logs = logs.filter(log => 
        log.event_type.includes('PAYMENT') || 
        log.event_type.includes('SUBSCRIPTION') ||
        log.event_type.includes('BILLING')
      );
    } else if (type === 'security') {
      logs = logs.filter(log => 
        log.event_type.includes('KEY') || 
        log.event_type.includes('AUTH') ||
        log.event_type.includes('SECURITY')
      );
    }

    return Response.json({ logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});