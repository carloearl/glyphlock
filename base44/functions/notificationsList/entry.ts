import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent logs as notifications
    const logs = await base44.asServiceRole.entities.SystemAuditLog.filter({
      actor_email: user.email
    }, '-created_date', 20);

    const notifications = logs.map(log => ({
      id: log.id,
      type: log.status === 'failure' ? 'error' : 
            log.event_type.includes('PAYMENT') ? 'billing' :
            log.event_type.includes('SECURITY') ? 'security' : 'info',
      title: log.event_type.replace(/_/g, ' '),
      message: log.description,
      timestamp: log.created_date,
      read: false, // TODO: Track read status
      link: log.event_type.includes('KEY') ? '/command-center?tab=keys' :
            log.event_type.includes('PAYMENT') ? '/command-center?tab=billing' :
            '/command-center?tab=logs'
    }));

    return Response.json({ 
      notifications,
      unread_count: notifications.length // TODO: Track actual unread
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});