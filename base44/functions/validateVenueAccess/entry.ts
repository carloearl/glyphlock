import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * CRITICAL SECURITY FUNCTION
 * Validates that authenticated user has access to requested venue_id
 * Prevents cross-venue data access attacks
 * 
 * Expected payload:
 * {
 *   venue_id: string,
 *   action: 'read' | 'write' | 'delete'
 * }
 * 
 * Returns:
 * {
 *   authorized: boolean,
 *   user_email: string,
 *   user_role: string,
 *   venue_id: string,
 *   reason?: string (if unauthorized)
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        authorized: false,
        reason: 'Not authenticated' 
      }, { status: 401 });
    }

    const payload = await req.json();
    const { venue_id, action = 'read' } = payload;

    if (!venue_id) {
      return Response.json({ 
        authorized: false,
        reason: 'Missing venue_id' 
      }, { status: 400 });
    }

    // RBAC: Platform admins have access to all venues
    if (user.role === 'admin') {
      return Response.json({
        authorized: true,
        user_email: user.email,
        user_role: user.role,
        venue_id,
        elevated: true
      });
    }

    // Fetch user's venue access permissions
    let permissionsData = null;
    try {
      const res = await base44.asServiceRole.functions.invoke('getUserPermissions', {});
      permissionsData = res.data;
    } catch (e) {
      // Fallback: deny by default if RBAC unavailable
      return Response.json({
        authorized: false,
        user_email: user.email,
        user_role: user.role,
        venue_id,
        reason: 'RBAC data unavailable'
      }, { status: 403 });
    }

    // Check if user has access to this specific venue
    const venueAccess = permissionsData?.venue_access?.find(
      va => va.venue_id === venue_id
    );

    if (!venueAccess) {
      // CRITICAL: Log cross-venue access attempt
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id,
        entity_type: 'VenueAccess',
        entity_id: venue_id,
        action: 'ACCESS',
        severity: 'CRITICAL',
        description: `UNAUTHORIZED VENUE ACCESS ATTEMPT: User ${user.email} attempted ${action} on venue ${venue_id} without permission`
      });

      return Response.json({
        authorized: false,
        user_email: user.email,
        user_role: user.role,
        venue_id,
        reason: 'No access to this venue'
      }, { status: 403 });
    }

    // Verify role has sufficient privileges for action
    const WRITE_ROLES = ['VENUE_OWNER', 'VENUE_MANAGER', 'STAFF_MANAGER'];
    const DELETE_ROLES = ['VENUE_OWNER', 'PLATFORM_ADMIN'];

    if (action === 'delete' && !DELETE_ROLES.includes(venueAccess.role_key)) {
      return Response.json({
        authorized: false,
        user_email: user.email,
        user_role: venueAccess.role_key,
        venue_id,
        reason: `Role ${venueAccess.role_key} cannot delete in this venue`
      }, { status: 403 });
    }

    if (action === 'write' && !WRITE_ROLES.includes(venueAccess.role_key) && venueAccess.role_key !== 'BARTENDER') {
      return Response.json({
        authorized: false,
        user_email: user.email,
        user_role: venueAccess.role_key,
        venue_id,
        reason: `Role ${venueAccess.role_key} cannot write in this venue`
      }, { status: 403 });
    }

    // AUTHORIZED
    return Response.json({
      authorized: true,
      user_email: user.email,
      user_role: venueAccess.role_key,
      venue_id
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Venue access validation error:`, error);
    
    return Response.json({ 
      authorized: false,
      error_id: errorId,
      reason: 'Validation error'
    }, { status: 500 });
  }
});