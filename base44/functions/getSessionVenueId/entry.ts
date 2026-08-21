import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * SESSION VENUE ID RESOLVER
 * Returns venue_id for authenticated user from their NUPSUser profile
 * 
 * SECURITY: venue_id comes from SESSION only, never from request body
 * 
 * Returns:
 * {
 *   success: boolean,
 *   venue_id: string,
 *   user_email: string,
 *   role: string
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // ID-01 FIX-7: platform_email is the canonical auth binding — username
    // stores login names, not emails. Fallback: email prefix as username.
    let nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({
      platform_email: user.email
    }, null, 1);
    if (nupsUsers.length === 0) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({
        username: emailPrefix
      }, null, 1);
    }

    if (nupsUsers.length === 0) {
      // User not in NUPS system — deny access
      return Response.json({
        success: false,
        error: 'User not registered in NUPS system',
        user_email: user.email
      }, { status: 403 });
    }

    const nupsUser = nupsUsers[0];
    const venue_id = nupsUser.venue_id;

    // Validate the assigned venue against the live Venue registry rather than a source-code allow-list.
    const venueRecord = venue_id
      ? ((await base44.asServiceRole.entities.Venue.filter({ venue_id, status: 'active' }, null, 1).catch(() => []))?.[0]
        || await base44.asServiceRole.entities.Venue.get(venue_id).catch(() => null))
      : null;
    if (!venue_id || !venueRecord || venueRecord.status === 'inactive') {
      // CRITICAL: Log invalid venue assignment
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: nupsUser.role,
        venue_id: venue_id || 'INVALID',
        entity_type: 'VenueAccess',
        entity_id: user.email,
        action: 'ACCESS',
        severity: 'CRITICAL',
        description: `INVALID VENUE ASSIGNMENT: User ${user.email} has venue_id="${venue_id}" which is not an active registered venue`
      });

      return Response.json({
        success: false,
        error: 'Invalid venue assignment',
        user_email: user.email,
        assigned_venue: venue_id
      }, { status: 403 });
    }

    return Response.json({
      success: true,
      venue_id,
      user_email: user.email,
      role: nupsUser.role,
      nups_user_id: nupsUser.id
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Session venue lookup error:`, error);
    
    return Response.json({ 
      success: false,
      error: 'Venue lookup failed',
      error_id: errorId
    }, { status: 500 });
  }
});