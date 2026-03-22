/**
 * Rate Limiter for API Gateway
 * In-memory rate limiting with sliding window algorithm
 */

// Store for rate limit tracking: { identifier: { timestamp: count } }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [identifier, windows] of rateLimitStore.entries()) {
    const validWindows = {};
    let hasValidWindows = false;
    
    for (const [timestamp, count] of Object.entries(windows)) {
      if (now - parseInt(timestamp) < 600000) { // Keep last 10 minutes
        validWindows[timestamp] = count;
        hasValidWindows = true;
      }
    }
    
    if (hasValidWindows) {
      rateLimitStore.set(identifier, validWindows);
    } else {
      rateLimitStore.delete(identifier);
    }
  }
}, 300000);

/**
 * Check if request should be rate limited
 * @param {string} identifier - Unique identifier (IP + user ID)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowSeconds - Time window in seconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(identifier, maxRequests, windowSeconds) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  
  // Get or create tracking for this identifier
  let windows = rateLimitStore.get(identifier) || {};
  
  // Count requests in current window
  let requestCount = 0;
  for (const [timestamp, count] of Object.entries(windows)) {
    const ts = parseInt(timestamp);
    if (ts >= windowStart) {
      requestCount += count;
    }
  }
  
  // Check if limit exceeded
  if (requestCount >= maxRequests) {
    // Find when the oldest request in window will expire
    let oldestInWindow = now;
    for (const timestamp of Object.keys(windows)) {
      const ts = parseInt(timestamp);
      if (ts >= windowStart && ts < oldestInWindow) {
        oldestInWindow = ts;
      }
    }
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
      retryAfter: Math.ceil((oldestInWindow + windowMs - now) / 1000)
    };
  }
  
  // Increment counter for current second
  const currentSecond = Math.floor(now / 1000) * 1000;
  windows[currentSecond] = (windows[currentSecond] || 0) + 1;
  rateLimitStore.set(identifier, windows);
  
  return {
    allowed: true,
    remaining: maxRequests - requestCount - 1,
    resetAt: currentSecond + windowMs,
    retryAfter: 0
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req, userId = null) {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0].trim() || 
             realIp || 
             cfIp || 
             'unknown';
  
  // Combine IP with user ID if available for more granular control
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(rateLimitResult) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        'Retry-After': rateLimitResult.retryAfter.toString()
      }
    }
  );
}