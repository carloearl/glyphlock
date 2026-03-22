import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const ALLOWED_BOTS = [
  // Search Engines
  'Googlebot', 'Googlebot-Image', 'Googlebot-News', 'Googlebot-Video',
  'Bingbot', 'BingPreview', 'msnbot',
  'DuckDuckBot', 'DuckDuckGo-Favicons-Bot',
  'Slurp', 'Yahoo', // Yahoo
  'Baiduspider', // Baidu
  'YandexBot', 'YandexImages', // Yandex
  
  // AI Crawlers
  'GPTBot', 'ChatGPT-User', 'OpenAI',
  'Claude-Web', 'ClaudeBot', 'Anthropic-AI',
  'CCBot', 'cohere-ai',
  'PerplexityBot', 'Perplexity',
  'Applebot',
  'facebookexternalhit', 'FacebookBot',
  'LinkedInBot',
  'Twitterbot',
  
  // Monitoring & SEO Tools
  'Pingdom', 'UptimeRobot',
  'Ahrefs', 'SEMrush', 'Moz'
];

const SUSPICIOUS_PATTERNS = [
  'scrapy', 'curl', 'wget', 'python-requests', 'axios',
  'headless', 'phantom', 'selenium', 'puppeteer', 'playwright',
  'bot', 'crawler', 'spider', 'scraper'
];

function analyzeUserAgent(userAgent) {
  if (!userAgent) {
    return { suspicious: true, reason: 'no_user_agent', allowedBot: false };
  }
  
  const ua = userAgent.toLowerCase();
  
  // Check if it's an allowed bot
  const isAllowedBot = ALLOWED_BOTS.some(bot => 
    userAgent.includes(bot) || ua.includes(bot.toLowerCase())
  );
  
  if (isAllowedBot) {
    return { suspicious: false, allowedBot: true, botName: userAgent };
  }
  
  // Check for suspicious patterns
  const suspiciousPattern = SUSPICIOUS_PATTERNS.find(pattern => ua.includes(pattern));
  if (suspiciousPattern) {
    return { 
      suspicious: true, 
      reason: 'suspicious_user_agent', 
      pattern: suspiciousPattern,
      allowedBot: false 
    };
  }
  
  return { suspicious: false, allowedBot: false };
}

function detectHeadlessBrowser(headers) {
  const indicators = [];
  
  // Check for common headless browser indicators
  if (headers.get('chrome-lighthouse')) {
    indicators.push('lighthouse');
  }
  
  // Missing common browser headers
  const requiredHeaders = ['accept-language', 'accept-encoding', 'accept'];
  const missingHeaders = requiredHeaders.filter(h => !headers.get(h));
  if (missingHeaders.length > 0) {
    indicators.push(`missing_headers:${missingHeaders.join(',')}`);
  }
  
  return {
    suspicious: indicators.length > 0,
    indicators
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const userAgent = req.headers.get('user-agent') || '';
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';
    
    // Analyze user agent
    const uaAnalysis = analyzeUserAgent(userAgent);
    
    // Detect headless browser
    const headlessCheck = detectHeadlessBrowser(req.headers);
    
    // Get request details
    const requestDetails = {
      userAgent,
      ip: clientIp,
      timestamp: new Date().toISOString(),
      referer: req.headers.get('referer') || 'direct',
      acceptLanguage: req.headers.get('accept-language') || 'none'
    };
    
    // Determine if request should be allowed
    const isAllowed = uaAnalysis.allowedBot || (!uaAnalysis.suspicious && !headlessCheck.suspicious);
    
    // Log suspicious activity (you could store this in a database)
    if (!isAllowed) {
      console.log('SUSPICIOUS REQUEST:', {
        ...requestDetails,
        uaAnalysis,
        headlessCheck
      });
    }
    
    return Response.json({
      allowed: isAllowed,
      analysis: {
        userAgent: uaAnalysis,
        headless: headlessCheck,
        request: requestDetails
      },
      action: isAllowed ? 'allow' : 'block'
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});