import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policy_key, value } = await req.json();

    if (!policy_key) {
      return Response.json({ error: 'policy_key required' }, { status: 400 });
    }

    // Create audit log
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'SECURITY_POLICY_CHANGE',
      description: `Changed ${policy_key} to ${value}`,
      actor_email: user.email,
      resource_id: user.id,
      metadata: {
        policy_key,
        new_value: value,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    });

    // TODO: Store policy in database
    // For now, just acknowledge
    return Response.json({ 
      success: true,
      policy_key,
      value
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});