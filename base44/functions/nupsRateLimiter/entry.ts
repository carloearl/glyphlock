import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * NUPS Rate Limiter — In-memory sliding window per user+action.
 * Limits: 30 requests/minute per user for standard ops.
 * Usage: await nupsRateLimit(req, userEmail, 'pos_transaction') — throws if exceeded.
 */

const WINDOWS = new Map(); // key: `${email}:${action}` → [{ts}]

const LIMITS = {
  default:         { max: 30,  window: 60_000 },
  pos_transaction: { max: 20,  window: 60_000 },
  vip_contract:    { max: 10,  window: 60_000 },
  dream_palace:    { max: 10,  window: 60_000 },
  auth_check:      { max: 60,  window: 60_000 },
};

function checkLimit(email, action) {
  const cfg = LIMITS[action] || LIMITS.default;
  const key = `${email}:${action}`;
  const now = Date.now();
  const cutoff = now - cfg.window;

  if (!WINDOWS.has(key)) WINDOWS.set(key, []);
  const hits = WINDOWS.get(key).filter(ts => ts > cutoff);
  hits.push(now);
  WINDOWS.set(key, hits);

  if (hits.length > cfg.max) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((hits[0] + cfg.window - now) / 1000) };
  }
  return { allowed: true, remaining: cfg.max - hits.length, resetIn: null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'default';

    const result = checkLimit(user.email, action);

    if (!result.allowed) {
      return Response.json(
        { error: 'Rate limit exceeded', resetIn: result.resetIn },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.resetIn),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    return Response.json({ allowed: true, remaining: result.remaining });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});