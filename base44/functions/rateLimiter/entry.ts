import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map();

const RATE_LIMITS = {
  authenticated: { requests: 1000, window: 3600000 }, // 1000 req/hour
  unauthenticated: { requests: 100, window: 3600000 }, // 100 req/hour
  burst: { requests: 20, window: 10000 } // 20 req/10 seconds
};

function getRateLimitKey(identifier, type = 'main') {
  return `${identifier}:${type}`;
}

function checkRateLimit(identifier, limit) {
  const key = getRateLimitKey(identifier);
  const now = Date.now();
  
  let record = rateLimitStore.get(key);
  
  if (!record) {
    record = { count: 0, resetAt: now + limit.window, requests: [] };
    rateLimitStore.set(key, record);
  }
  
  // Reset if window expired
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + limit.window;
    record.requests = [];
  }
  
  // Clean old burst requests
  record.requests = record.requests.filter(t => now - t < RATE_LIMITS.burst.window);
  
  // Check burst limit
  if (record.requests.length >= RATE_LIMITS.burst.requests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.requests[0] + RATE_LIMITS.burst.window - now) / 1000),
      reason: 'burst_limit'
    };
  }
  
  // Check main limit
  if (record.count >= limit.requests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
      reason: 'rate_limit'
    };
  }
  
  // Allow request
  record.count++;
  record.requests.push(now);
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remaining: limit.requests - record.count,
    resetAt: record.resetAt
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check if user is authenticated
    const isAuth = await base44.auth.isAuthenticated();
    let identifier = clientIp;
    let limit = RATE_LIMITS.unauthenticated;
    
    if (isAuth) {
      const user = await base44.auth.me();
      identifier = user.id;
      limit = RATE_LIMITS.authenticated;
    }
    
    const result = checkRateLimit(identifier, limit);
    
    if (!result.allowed) {
      return Response.json(
        {
          error: 'Rate limit exceeded',
          reason: result.reason,
          retryAfter: result.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': result.retryAfter.toString(),
            'X-RateLimit-Limit': limit.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + result.retryAfter * 1000).toISOString()
          }
        }
      );
    }
    
    return Response.json({
      allowed: true,
      identifier: isAuth ? 'authenticated' : 'ip',
      remaining: result.remaining,
      resetAt: new Date(result.resetAt).toISOString()
    }, {
      headers: {
        'X-RateLimit-Limit': limit.requests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});