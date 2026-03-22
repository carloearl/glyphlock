/**
 * API Gateway - Centralized request handler
 * Manages authentication, rate limiting, validation, and routing for all API requests
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  getRouteConfig, 
  DEFAULT_RATE_LIMIT, 
  SECURITY_HEADERS 
} from './utils/apiGatewayConfig.js';
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse
} from './utils/gatewayRateLimiter.js';
import {
  validateBody,
  validateMethod,
  validateContentType,
  createValidationErrorResponse,
  sanitizeInput
} from './utils/requestValidator.js';

/**
 * API Gateway Handler
 */
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/gateway', '');
  const method = req.method;
  
  try {
    // Get route configuration
    const routeConfig = getRouteConfig(path);
    
    if (!routeConfig) {
      return new Response(
        JSON.stringify({ 
          error: 'Not Found',
          message: `Route ${path} not found`
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...SECURITY_HEADERS
          }
        }
      );
    }
    
    // Validate HTTP method
    const methodValidation = validateMethod(method, routeConfig.methods);
    if (!methodValidation.valid) {
      return new Response(
        JSON.stringify({ error: methodValidation.error }),
        {
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Allow': routeConfig.methods.join(', '),
            ...SECURITY_HEADERS
          }
        }
      );
    }
    
    // Initialize Base44 client
    const base44 = createClientFromRequest(req);
    let user = null;
    let userId = null;
    
    // Authentication check if required
    if (routeConfig.auth) {
      try {
        user = await base44.auth.me();
        userId = user?.id || user?.email;
        
        if (!user) {
          return new Response(
            JSON.stringify({ 
              error: 'Unauthorized',
              message: 'Authentication required'
            }),
            {
              status: 401,
              headers: { 
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
              }
            }
          );
        }
        
        // Role-based authorization
        if (routeConfig.roles && !routeConfig.roles.includes(user.role)) {
          return new Response(
            JSON.stringify({ 
              error: 'Forbidden',
              message: 'Insufficient permissions'
            }),
            {
              status: 403,
              headers: { 
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
              }
            }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            message: 'Invalid authentication token'
          }),
          {
            status: 401,
            headers: { 
              'Content-Type': 'application/json',
              ...SECURITY_HEADERS
            }
          }
        );
      }
    }
    
    // Rate limiting
    const rateLimit = routeConfig.rateLimit || DEFAULT_RATE_LIMIT;
    const clientId = getClientIdentifier(req, userId);
    const rateLimitResult = checkRateLimit(
      `${path}:${clientId}`,
      rateLimit.requests,
      rateLimit.window
    );
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }
    
    // Request validation
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      if (!routeConfig.skipValidation) {
        // Validate content type
        const contentTypeValidation = validateContentType(req);
        if (!contentTypeValidation.valid) {
          return createValidationErrorResponse([contentTypeValidation.error]);
        }
        
        // Parse and validate body
        try {
          body = await req.json();
          
          if (routeConfig.validation?.body) {
            const bodyValidation = validateBody(body, routeConfig.validation.body);
            if (!bodyValidation.valid) {
              return createValidationErrorResponse(bodyValidation.errors);
            }
          }
          
          // Sanitize input
          body = sanitizeInput(body);
        } catch (error) {
          return createValidationErrorResponse(['Invalid JSON in request body']);
        }
      }
    }
    
    // Log request (for monitoring)
    console.log(`[API Gateway] ${method} ${path} - User: ${userId || 'anonymous'} - Rate limit: ${rateLimitResult.remaining}/${rateLimit.requests}`);
    
    // Forward to actual function
    // In a real implementation, you would route to the actual backend function here
    // For now, return success with gateway info
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Request validated and authorized',
        gateway: {
          path,
          method,
          authenticated: !!user,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: new Date(rateLimitResult.resetAt).toISOString()
          }
        },
        // In production, forward to actual handler
        note: 'This is the API Gateway. In production, this would route to the actual backend function.'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimit.requests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          ...SECURITY_HEADERS
        }
      }
    );
    
  } catch (error) {
    console.error('[API Gateway] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...SECURITY_HEADERS
        }
      }
    );
  }
});