import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Allowed good bots
const ALLOWED_BOTS = [
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'whatsapp',
  'telegrambot'
];

// Malicious bot patterns
const MALICIOUS_PATTERNS = [
  'scrapy',
  'webcopier',
  'curl',
  'wget',
  'python-requests',
  'go-http-client',
  'nikto',
  'sqlmap',
  'nmap',
  'masscan',
  'acunetix',
  'netsparker',
  'burp',
  'metasploit',
  'havij',
  'zgrab'
];

// Sensitive paths to protect
const PROTECTED_PATHS = [
  '/dashboard',
  '/admin',
  '/manage-subscription',
  '/payment'
];

function analyzeRequest(req, userAgent, ip) {
  const path = new URL(req.url).pathname;
  const ua = userAgent.toLowerCase();
  
  const threats = [];
  let riskScore = 0;
  
  // Check if accessing protected paths
  const isProtectedPath = PROTECTED_PATHS.some(p => path.startsWith(p));
  
  // Check for malicious patterns
  const isMalicious = MALICIOUS_PATTERNS.some(pattern => ua.includes(pattern));
  if (isMalicious) {
    threats.push('MALICIOUS_BOT_DETECTED');
    riskScore += 50;
  }
  
  // Check if legitimate bot
  const isGoodBot = ALLOWED_BOTS.some(bot => ua.includes(bot));
  
  // Block malicious bots on protected paths
  if (isMalicious && isProtectedPath) {
    threats.push('MALICIOUS_ACCESS_ATTEMPT');
    riskScore += 50;
  }
  
  // Suspicious: bot accessing protected area without credentials
  if (!isGoodBot && isProtectedPath && !req.headers.get('authorization')) {
    threats.push('UNAUTHORIZED_BOT_ACCESS');
    riskScore += 30;
  }
  
  // Check for SQL injection patterns in URL
  if (path.includes("'") || path.includes('--') || path.includes('union') || path.includes('select')) {
    threats.push('SQL_INJECTION_ATTEMPT');
    riskScore += 70;
  }
  
  // Check for path traversal
  if (path.includes('..') || path.includes('etc/passwd')) {
    threats.push('PATH_TRAVERSAL_ATTEMPT');
    riskScore += 70;
  }
  
  // Check rate - simple heuristic (should use Redis in production)
  const requestRate = req.headers.get('x-request-count') || 0;
  if (requestRate > 100) {
    threats.push('HIGH_REQUEST_RATE');
    riskScore += 40;
  }
  
  return {
    ip,
    userAgent,
    path,
    threats,
    riskScore,
    isBlocked: riskScore >= 50,
    isGoodBot,
    isMalicious,
    timestamp: new Date().toISOString()
  };
}

async function notifyAdmin(base44, incident) {
  try {
    // Send email notification to admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'glyphlock@gmail.com',
      subject: `🚨 Security Alert: ${incident.threats.join(', ')}`,
      body: `
Security Threat Detected on GlyphLock

Risk Score: ${incident.riskScore}/100
IP Address: ${incident.ip}
User Agent: ${incident.userAgent}
Path: ${incident.path}
Threats: ${incident.threats.join(', ')}
Timestamp: ${incident.timestamp}

Action Taken: ${incident.isBlocked ? 'BLOCKED' : 'LOGGED'}

Please review the security logs immediately.
      `
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const analysis = analyzeRequest(req, userAgent, ip);
    
    // Log all incidents
    if (analysis.threats.length > 0) {
      console.log('Security Incident:', JSON.stringify(analysis, null, 2));
      
      // Notify admin for high-risk incidents
      if (analysis.riskScore >= 50) {
        await notifyAdmin(base44, analysis);
      }
    }
    
    return Response.json({
      allowed: !analysis.isBlocked,
      riskScore: analysis.riskScore,
      threats: analysis.threats,
      isGoodBot: analysis.isGoodBot,
      message: analysis.isBlocked ? 'Access denied - suspicious activity detected' : 'Access granted'
    });
    
  } catch (error) {
    console.error('Bot security check error:', error);
    return Response.json({ 
      allowed: true, // Fail open to avoid blocking legitimate users
      error: 'Security check failed' 
    }, { status: 500 });
  }
});