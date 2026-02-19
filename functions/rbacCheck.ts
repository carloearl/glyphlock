import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PHASE 2 — Centralized Authorization Enforcement
 * 
 * can(user_email, venue_id, action) → boolean
 * 
 * Deny by default. Only grants access if:
 *   1. Active UserRoleAssignment exists for (user_email, venue_id)
 *   2. Linked PlatformRole.allowed_actions includes the action (or "*")
 * 
 * PLATFORM_ADMIN with is_cross_venue=true bypasses venue_id scoping.
 * 
 * Usage from other functions:
 *   const res = await base44.functions.invoke('rbacCheck', { 
 *     user_email, venue_id, action 
 *   });
 *   if (!res.data.allowed) return Response.json({error:'Forbidden'},{status:403});
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ allowed: false, reason: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { user_email, venue_id, action, log_denial } = body;

    if (!action) {
      return Response.json({ allowed: false, reason: 'Missing required field: action' }, { status: 400 });
    }

    const targetEmail = user_email || user.email;

    // Fetch all active assignments for this user
    const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email: targetEmail,
      is_active: true,
    });

    if (assignments.length === 0) {
      // Deny by default — no assignments exist
      if (log_denial !== false) {
        await logDenial(base44, targetEmail, venue_id, action, 'No active role assignments found', req);
      }
      return Response.json({ 
        allowed: false, 
        reason: 'No active role assignments',
        user_email: targetEmail,
      });
    }

    // Load all PlatformRole records
    const platformRoles = await base44.asServiceRole.entities.PlatformRole.list();
    const roleByKey = {};
    for (const pr of platformRoles) {
      roleByKey[pr.role_key] = pr;
    }

    // Check each assignment
    for (const assignment of assignments) {
      const role = roleByKey[assignment.role_key];
      if (!role || !role.is_active) continue;

      // Check expiry
      if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) continue;

      // PLATFORM_ADMIN with is_cross_venue bypasses venue scoping
      if (role.is_cross_venue && role.role_key === 'PLATFORM_ADMIN') {
        if (role.allowed_actions.includes('*') || role.allowed_actions.includes(action)) {
          return Response.json({
            allowed: true,
            role_key: role.role_key,
            venue_id: venue_id || 'cross_venue',
            action,
            user_email: targetEmail,
          });
        }
      }

      // Venue-scoped check
      if (venue_id && assignment.venue_id !== venue_id) continue;

      // Check if the role's allowed_actions includes the requested action
      if (role.allowed_actions.includes('*') || role.allowed_actions.includes(action)) {
        return Response.json({
          allowed: true,
          role_key: role.role_key,
          venue_id: assignment.venue_id,
          action,
          user_email: targetEmail,
        });
      }
    }

    // Deny — no matching permission found
    if (log_denial !== false) {
      await logDenial(base44, targetEmail, venue_id, action, 'No role grants this action', req);
    }

    return Response.json({
      allowed: false,
      reason: 'Insufficient permissions',
      user_email: targetEmail,
      venue_id,
      action,
      checked_roles: assignments.map(a => a.role_key),
    });

  } catch (error) {
    return Response.json({ allowed: false, error: error.message }, { status: 500 });
  }
});

async function logDenial(base44, actorId, venueId, action, reason, req) {
  try {
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: actorId,
      actor_role: 'UNKNOWN',
      venue_id: venueId || null,
      entity_type: 'Authorization',
      entity_id: action,
      action: 'ACCESS',
      before_state: null,
      after_state: null,
      is_system_action: false,
      severity: 'WARNING',
      description: `AUTHORIZATION_DENIED: ${actorId} attempted ${action} at venue ${venueId || 'unscoped'} — ${reason}`,
      metadata: {
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      }
    });
  } catch (e) {
    console.error('Failed to log audit denial:', e);
  }
}