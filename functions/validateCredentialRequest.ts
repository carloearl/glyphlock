import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * GLYPHLOCK CREDENTIAL REQUEST VALIDATOR
 * Validates and sanitizes credential requests with rate limiting
 */

// Rate limiting store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 3; // Stricter for credential requests

function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];
  
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get IP for rate limiting (even if not authenticated)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return Response.json({ 
        error: 'Too many requests. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 });
    }

    const { 
      full_name, 
      email, 
      company, 
      phone, 
      service_interest, 
      message, 
      preferred_date,
      captchaToken 
    } = await req.json();

    // Validate required fields
    if (!full_name || !email || !phone || !service_interest || !preferred_date) {
      return Response.json({ 
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    // String length validation
    if (full_name.length > 100 || email.length > 200 || 
        (company && company.length > 200) || phone.length > 20 ||
        (message && message.length > 2000)) {
      return Response.json({ 
        error: 'Input exceeds maximum length',
        code: 'INPUT_TOO_LONG'
      }, { status: 400 });
    }

    // Validate captcha token presence
    if (!captchaToken) {
      return Response.json({ 
        error: 'Security verification required',
        code: 'CAPTCHA_REQUIRED'
      }, { status: 400 });
    }

    return Response.json({ 
      valid: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ 
      error: 'Validation failed',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
});