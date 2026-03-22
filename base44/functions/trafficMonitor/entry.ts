import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory traffic tracking (use Redis/Database in production)
const trafficStats = {
  totalRequests: 0,
  suspiciousRequests: 0,
  blockedIPs: new Set(),
  ipRequestCounts: new Map(),
  lastReset: Date.now()
};

const THRESHOLDS = {
  requestSpike: 200, // 200% of normal
  normalRequestsPerMinute: 100,
  ipBlockThreshold: 50, // requests per minute
  resetInterval: 3600000 // 1 hour
};

function analyzeTraffic() {
  const now = Date.now();
  
  // Reset stats every hour
  if (now - trafficStats.lastReset > THRESHOLDS.resetInterval) {
    trafficStats.totalRequests = 0;
    trafficStats.suspiciousRequests = 0;
    trafficStats.ipRequestCounts.clear();
    trafficStats.lastReset = now;
  }
  
  const avgRequestsPerMinute = trafficStats.totalRequests / 
    ((now - trafficStats.lastReset) / 60000);
  
  const isSpike = avgRequestsPerMinute > 
    (THRESHOLDS.normalRequestsPerMinute * (THRESHOLDS.requestSpike / 100));
  
  // Find IPs exceeding threshold
  const suspiciousIPs = [];
  for (const [ip, count] of trafficStats.ipRequestCounts) {
    if (count > THRESHOLDS.ipBlockThreshold) {
      suspiciousIPs.push({ ip, count });
      trafficStats.blockedIPs.add(ip);
    }
  }
  
  return {
    isSpike,
    avgRequestsPerMinute: Math.round(avgRequestsPerMinute),
    totalRequests: trafficStats.totalRequests,
    suspiciousRequests: trafficStats.suspiciousRequests,
    blockedIPs: Array.from(trafficStats.blockedIPs),
    suspiciousIPs,
    suspicionRate: trafficStats.totalRequests > 0 ? 
      ((trafficStats.suspiciousRequests / trafficStats.totalRequests) * 100).toFixed(2) + '%' : '0%'
  };
}

function trackRequest(ip, isSuspicious = false) {
  trafficStats.totalRequests++;
  if (isSuspicious) trafficStats.suspiciousRequests++;
  
  const currentCount = trafficStats.ipRequestCounts.get(ip) || 0;
  trafficStats.ipRequestCounts.set(ip, currentCount + 1);
  
  // Auto-block if IP is making too many requests
  if (currentCount + 1 > THRESHOLDS.ipBlockThreshold) {
    trafficStats.blockedIPs.add(ip);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'track';
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';
    
    // Check authentication for admin actions
    const isAuth = await base44.auth.isAuthenticated();
    if (['stats', 'block', 'unblock'].includes(action) && !isAuth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    switch (action) {
      case 'track': {
        const suspicious = url.searchParams.get('suspicious') === 'true';
        trackRequest(clientIp, suspicious);
        
        // Check if IP is blocked
        if (trafficStats.blockedIPs.has(clientIp)) {
          return Response.json({
            blocked: true,
            reason: 'IP has been temporarily blocked due to suspicious activity',
            retryAfter: 3600
          }, { status: 429 });
        }
        
        return Response.json({ tracked: true, ip: clientIp });
      }
      
      case 'stats': {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
        
        return Response.json({
          ...analyzeTraffic(),
          timestamp: new Date().toISOString()
        });
      }
      
      case 'block': {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
        
        const ipToBlock = url.searchParams.get('ip');
        if (ipToBlock) {
          trafficStats.blockedIPs.add(ipToBlock);
          return Response.json({ blocked: ipToBlock });
        }
        return Response.json({ error: 'IP parameter required' }, { status: 400 });
      }
      
      case 'unblock': {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
        
        const ipToUnblock = url.searchParams.get('ip');
        if (ipToUnblock) {
          trafficStats.blockedIPs.delete(ipToUnblock);
          return Response.json({ unblocked: ipToUnblock });
        }
        return Response.json({ error: 'IP parameter required' }, { status: 400 });
      }
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});