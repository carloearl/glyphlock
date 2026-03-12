import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * DB-BACKED RATE LIMIT CHECKER
 * 
 * Replaces in-memory rate limiting with persistent DB tracking
 * Prevents distributed instance bypass attacks
 * 
 * Limits:
 * - bill_redemption: 5 attempts per serial_number in 10 minutes
 * - payment_processing: 3 attempts per payment_intent_id in 5 minutes
 * - qr_scan: 10 scans per resource_id in 1 minute
 */

const RATE_LIMITS = {
  bill_redemption: { max_attempts: 5, window_minutes: 10 },
  payment_processing: { max_attempts: 3, window_minutes: 5 },
  qr_scan: { max_attempts: 10, window_minutes: 1 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { resource_id, resource_type } = payload;

    if (!resource_id || !resource_type || !RATE_LIMITS[resource_type]) {
      return Response.json({ 
        error: 'Invalid rate limit check parameters' 
      }, { status: 400 });
    }

    const limit_config = RATE_LIMITS[resource_type];
    const window_start = new Date(Date.now() - limit_config.window_minutes * 60000);

    // Query recent attempts for this resource
    const recent_attempts = await base44.asServiceRole.entities.RateLimitAttempt.filter({
      resource_id,
      resource_type
    }, '-attempt_timestamp', 100);

    // Filter to current time window
    const attempts_in_window = recent_attempts.filter(a => 
      new Date(a.attempt_timestamp) >= window_start
    );

    const allowed = attempts_in_window.length < limit_config.max_attempts;

    if (!allowed) {
      // Log rate limit violation
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id: null,
        entity_type: 'RateLimit',
        entity_id: resource_id,
        action: 'BLOCKED',
        severity: 'WARNING',
        description: `RATE LIMIT EXCEEDED: ${resource_type} for ${resource_id} — ${attempts_in_window.length}/${limit_config.max_attempts} in ${limit_config.window_minutes}min`
      });
    }

    return Response.json({
      allowed,
      current_attempts: attempts_in_window.length,
      max_attempts: limit_config.max_attempts,
      window_minutes: limit_config.window_minutes,
      retry_after_seconds: allowed ? 0 : limit_config.window_minutes * 60
    });

  } catch (error) {
    console.error('Rate limit check error:', error);
    
    // FAIL OPEN on errors (allow request but log)
    return Response.json({ 
      allowed: true,
      error: 'Rate limit check failed — request allowed',
      error_details: error.message 
    });
  }
});