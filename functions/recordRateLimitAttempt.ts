import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * RECORD RATE LIMIT ATTEMPT
 * 
 * Called after every rate-limited operation to persist attempt
 * Enables distributed rate limiting across multiple app instances
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get venue_id from session
    const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
    const venue_id = sessionVenue.data?.venue_id || null;

    const payload = await req.json();
    const { 
      resource_id, 
      resource_type, 
      success, 
      failure_reason,
      ip_address,
      user_agent
    } = payload;

    await base44.asServiceRole.entities.RateLimitAttempt.create({
      resource_id,
      resource_type,
      venue_id,
      actor_id: user.email,
      attempt_timestamp: new Date().toISOString(),
      ip_address,
      user_agent,
      success: success || false,
      failure_reason
    });

    return Response.json({ recorded: true });

  } catch (error) {
    console.error('Failed to record rate limit attempt:', error);
    
    // Non-blocking failure
    return Response.json({ 
      recorded: false,
      error: error.message 
    });
  }
});