/**
 * GLYPHLOCK SECURITY MIDDLEWARE
 * Provides security headers for all requests
 */

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Security Headers Configuration
  const securityHeaders = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://unpkg.com https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://hcaptcha.com https://*.hcaptcha.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://hcaptcha.com https://*.hcaptcha.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };

  // Detect suspicious patterns in URL
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /\.\.\//, // Path traversal
    /;\s*(drop|alter|delete|insert|update)\s/i, // SQL injection
    /union\s+select/i,
    /exec\(/i,
    /cmd\(/i,
    /%00/, // Null byte
    /\.\.\\/g // Windows path traversal
  ];

  const fullPath = path + url.search;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullPath)) {
      console.warn(`[SECURITY] Blocked suspicious request: ${fullPath}`);
      return Response.json(
        { error: 'Invalid request' },
        { status: 400, headers: securityHeaders }
      );
    }
  }

  // Block malicious bots
  const userAgent = req.headers.get('user-agent') || '';
  const maliciousBots = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'acunetix',
    'nessus', 'metasploit', 'burpsuite', 'havij',
    'w3af', 'webscarab', 'zaproxy'
  ];

  if (maliciousBots.some(bot => userAgent.toLowerCase().includes(bot))) {
    console.warn(`[SECURITY] Blocked malicious bot: ${userAgent}`);
    return Response.json(
      { error: 'Access denied' },
      { status: 403, headers: securityHeaders }
    );
  }

  // Return security headers config
  return Response.json({
    status: 'active',
    headers: securityHeaders,
    timestamp: new Date().toISOString()
  }, { 
    status: 200,
    headers: securityHeaders
  });
});