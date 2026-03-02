import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * manageRoleAssignment — Assign or revoke NUPS roles for staff.
 * 
 * POST body:
 *   action: 'assign' | 'revoke' | 'list'
 *   user_email: string
 *   role_key: string       (for assign/revoke)
 *   venue_id: string       (optional)
 *   is_primary: boolean    (optional, for assign)
 *   expires_at: string     (optional ISO date, for assign)
 * 
 * Requires: VENUE_OWNER or PLATFORM_ADMIN or base44 admin role.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check caller has staff management permission
    const callerAssignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email: user.email,
      is_active: true,
    });

    const platformRoles = await base44.asServiceRole.entities.PlatformRole.list();
    const roleByKey = {};
    for (const r of platformRoles) roleByKey[r.role_key] = r;

    const canManageStaff = user.role === 'admin' ||
      callerAssignments.some(a => {
        const r = roleByKey[a.role_key];
        return r?.allowed_actions?.includes('staff.assign_roles') ||
               r?.allowed_actions?.includes('staff.edit') ||
               r?.allowed_actions?.includes('*');
      });

    if (!canManageStaff) {
      return Response.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { action, user_email, role_key, venue_id, is_primary, expires_at } = body;

    if (!action) {
      return Response.json({ error: 'Missing: action' }, { status: 400 });
    }

    // LIST — get all assignments (optionally filtered by user_email)
    if (action === 'list') {
      const filter = { is_active: true };
      if (user_email) filter.user_email = user_email;
      const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter(filter);

      // Enrich with role display info
      const enriched = assignments.map(a => ({
        ...a,
        role_display: roleByKey[a.role_key]?.display_name || a.role_key,
        role_actions_count: roleByKey[a.role_key]?.allowed_actions?.length || 0,
      }));

      return Response.json({ assignments: enriched, roles: platformRoles });
    }

    // ASSIGN
    if (action === 'assign') {
      if (!user_email || !role_key) {
        return Response.json({ error: 'Missing: user_email, role_key' }, { status: 400 });
      }

      // Validate role exists
      if (!roleByKey[role_key]) {
        return Response.json({ error: `Unknown role: ${role_key}` }, { status: 400 });
      }

      // Check if assignment already exists
      const existing = await base44.asServiceRole.entities.UserRoleAssignment.filter({
        user_email,
        role_key,
        is_active: true,
      });

      if (existing.length > 0 && (!venue_id || existing.some(e => e.venue_id === venue_id))) {
        return Response.json({ error: 'Assignment already exists', existing: existing[0] }, { status: 409 });
      }

      const assignment = await base44.asServiceRole.entities.UserRoleAssignment.create({
        user_email,
        role_key,
        venue_id: venue_id || null,
        is_active: true,
        is_primary: is_primary || false,
        assigned_by: user.email,
        assigned_at: new Date().toISOString(),
        expires_at: expires_at || null,
      });

      // Audit log
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id: venue_id || null,
        entity_type: 'UserRoleAssignment',
        entity_id: assignment.id,
        action: 'CREATE',
        after_state: JSON.stringify({ user_email, role_key, venue_id }),
        is_system_action: false,
        severity: 'INFO',
        description: `ROLE_ASSIGNED: ${user.email} assigned ${role_key} to ${user_email}`,
      });

      return Response.json({ success: true, assignment });
    }

    // REVOKE
    if (action === 'revoke') {
      if (!user_email || !role_key) {
        return Response.json({ error: 'Missing: user_email, role_key' }, { status: 400 });
      }

      const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
        user_email,
        role_key,
        is_active: true,
      });

      for (const a of assignments) {
        await base44.asServiceRole.entities.UserRoleAssignment.update(a.id, {
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: user.email,
          deactivation_reason: 'Manual revocation',
        });
      }

      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id: venue_id || null,
        entity_type: 'UserRoleAssignment',
        entity_id: `${user_email}:${role_key}`,
        action: 'UPDATE',
        is_system_action: false,
        severity: 'WARNING',
        description: `ROLE_REVOKED: ${user.email} revoked ${role_key} from ${user_email}`,
      });

      return Response.json({ success: true, revoked: assignments.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});