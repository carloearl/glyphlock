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

const ALLOWED_VENUES = [
  'dream_palace',
  'dream-palace-tempe',
  'bones-cabaret-scottsdale',
  'skin-cabaret-scottsdale'
];

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

    // Validate venue_id is in allowed list
    if (!venue_id || !ALLOWED_VENUES.includes(venue_id)) {
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
        description: `INVALID VENUE ASSIGNMENT: User ${user.email} has venue_id="${venue_id}" which is not in allowed venues list`
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