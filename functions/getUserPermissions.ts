import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PHASE 3 — Session Contract: Structured RBAC Payload
 * 
 * Returns:
 * {
 *   user_id: string,
 *   email: string,
 *   full_name: string,
 *   base44_role: string,       // Built-in Base44 role ("admin" / "user")
 *   venue_access: [
 *     {
 *       venue_id: string,
 *       role_key: string,
 *       display_name: string,
 *       allowed_actions: string[],
 *       is_cross_venue: boolean,
 *       session_timeout_minutes: number,
 *       can_escalate_to: string[],
 *       assignment_id: string,
 *       is_primary: boolean,
 *     }
 *   ]
 * }
 * 
 * Derived from LIVE DB queries — never hardcoded.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active role assignments for this user
    const assignments = await base44.asServiceRole.entities.UserRoleAssignment.filter({
      user_email: user.email,
      is_active: true,
    });

    // Fetch all PlatformRole records (cache-friendly, small dataset)
    const platformRoles = await base44.asServiceRole.entities.PlatformRole.list();
    const roleByKey = {};
    for (const pr of platformRoles) {
      roleByKey[pr.role_key] = pr;
    }

    // Build venue_access array
    const venueAccess = [];
    for (const assignment of assignments) {
      // Skip expired assignments
      if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) continue;

      const role = roleByKey[assignment.role_key];
      if (!role || !role.is_active) continue;

      venueAccess.push({
        venue_id: assignment.venue_id || null,
        role_key: role.role_key,
        display_name: role.display_name,
        allowed_actions: role.allowed_actions || [],
        is_cross_venue: role.is_cross_venue || false,
        session_timeout_minutes: role.session_timeout_minutes || 480,
        can_escalate_to: role.can_escalate_to || [],
        assignment_id: assignment.id,
        is_primary: assignment.is_primary || false,
      });
    }

    // Determine highest role for backward compatibility
    const ROLE_HIERARCHY = [
      'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'FLOOR_HOST',
      'SECURITY', 'BARTENDER', 'DJ', 'PERFORMER', 'KIOSK'
    ];
    
    let highestRole = null;
    for (const rk of ROLE_HIERARCHY) {
      if (venueAccess.some(va => va.role_key === rk)) {
        highestRole = rk;
        break;
      }
    }

    return Response.json({
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      base44_role: user.role, // Built-in Base44 role
      highest_role: highestRole,
      venue_access: venueAccess,
      _meta: {
        fetched_at: new Date().toISOString(),
        assignment_count: venueAccess.length,
        source: 'live_db',
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});