import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entity_type, entity_id, before_state, after_state, venue_id, metadata, description, severity } = body;

    if (!action || !entity_type || !entity_id) {
      return Response.json({ error: 'Missing required fields: action, entity_type, entity_id' }, { status: 400 });
    }

    // §8.2 — Generate unique event_id
    const event_id = crypto.randomUUID();

    // §8.1 — Actor attribution from authenticated session
    const actor_id = user.email;
    const actor_role = user.role || 'user';

    // Build the audit event per §8.2 minimum schema
    const auditEvent = {
      event_id,
      timestamp: new Date().toISOString(),
      actor_id,
      actor_role,
      venue_id: venue_id || null,
      entity_type,
      entity_id,
      action,
      before_state: before_state ? JSON.stringify(before_state) : null,
      after_state: after_state ? JSON.stringify(after_state) : null,
      metadata: {
        session_id: metadata?.session_id || null,
        device_hash: metadata?.device_hash || null,
        ip_address: metadata?.ip_address || req.headers.get('x-forwarded-for') || 'unknown',
        geo: metadata?.geo || null,
        user_agent: metadata?.user_agent || req.headers.get('user-agent') || 'unknown'
      },
      is_system_action: false,
      severity: severity || 'INFO',
      description: description || `${action} on ${entity_type}:${entity_id} by ${actor_id}`
    };

    // §8.2 — Append-only. Create the immutable record.
    const created = await base44.asServiceRole.entities.AuditEvent.create(auditEvent);

    return Response.json({ 
      status: 'logged',
      event_id: created.event_id || event_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});