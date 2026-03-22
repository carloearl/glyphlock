import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Honeypot endpoints that should never be accessed by legitimate users
const HONEYPOT_PATHS = [
  '/api/admin/users',
  '/api/v1/internal/keys',
  '/api/debug/config',
  '/.env',
  '/config.json',
  '/backup.sql'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'none';
    
    // Log the suspicious access attempt
    const suspiciousAccess = {
      ip: clientIp,
      userAgent,
      path: url.pathname,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries())
    };
    
    console.error('🚨 HONEYPOT TRIGGERED:', suspiciousAccess);
    
    // Store in database for monitoring (using service role)
    try {
      await base44.asServiceRole.entities.QRThreatLog.create({
        incident_id: `HONEYPOT-${Date.now()}`,
        code_id: 'system',
        attack_type: 'Other',
        payload: JSON.stringify(suspiciousAccess),
        threat_description: `Honeypot accessed: ${url.pathname}`,
        severity: 'high',
        resolved: false
      });
    } catch (dbError) {
      console.error('Failed to log honeypot trigger:', dbError);
    }
    
    // Return fake error to mislead attacker
    return Response.json({
      error: 'Not Found',
      message: 'The requested resource does not exist'
    }, {
      status: 404,
      headers: {
        'X-Request-ID': crypto.randomUUID(),
        'Server': 'nginx/1.18.0'
      }
    });
    
  } catch (error) {
    return Response.json({ 
      error: 'Not Found',
      message: 'The requested resource does not exist'
    }, { status: 404 });
  }
});