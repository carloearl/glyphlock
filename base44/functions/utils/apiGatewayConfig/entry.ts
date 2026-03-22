/**
 * API Gateway Route Configuration
 * Defines all routes, their security requirements, rate limits, and validation rules
 */

export const ROUTES = {
  // Public endpoints - no auth required
  public: {
    '/health': {
      methods: ['GET'],
      rateLimit: { requests: 100, window: 60 },
      auth: false
    },
    '/robotsTxt': {
      methods: ['GET'],
      rateLimit: { requests: 50, window: 60 },
      auth: false
    },
    '/sitemap': {
      methods: ['GET'],
      rateLimit: { requests: 50, window: 60 },
      auth: false
    },
    '/aiTxt': {
      methods: ['GET'],
      rateLimit: { requests: 50, window: 60 },
      auth: false
    }
  },

  // Authentication endpoints
  auth: {
    '/generateVerificationToken': {
      methods: ['POST'],
      rateLimit: { requests: 5, window: 300 },
      auth: false,
      validation: {
        body: ['email']
      }
    },
    '/validateVerificationToken': {
      methods: ['POST'],
      rateLimit: { requests: 10, window: 300 },
      auth: false,
      validation: {
        body: ['token']
      }
    },
    '/mfaSetup': {
      methods: ['POST'],
      rateLimit: { requests: 5, window: 300 },
      auth: true
    },
    '/mfaVerifySetup': {
      methods: ['POST'],
      rateLimit: { requests: 10, window: 300 },
      auth: true,
      validation: {
        body: ['code']
      }
    },
    '/mfaVerifyLogin': {
      methods: ['POST'],
      rateLimit: { requests: 10, window: 300 },
      auth: false,
      validation: {
        body: ['code', 'email']
      }
    }
  },

  // Protected endpoints - require authentication
  protected: {
    '/glyphbotLLM': {
      methods: ['POST'],
      rateLimit: { requests: 50, window: 60 },
      auth: true,
      validation: {
        body: ['messages']
      }
    },
    '/glyphbotWebSearch': {
      methods: ['POST'],
      rateLimit: { requests: 30, window: 60 },
      auth: true,
      validation: {
        body: ['query']
      }
    },
    '/textToSpeech': {
      methods: ['POST'],
      rateLimit: { requests: 50, window: 60 },
      auth: true,
      validation: {
        body: ['text']
      }
    },
    '/conversationSave': {
      methods: ['POST'],
      rateLimit: { requests: 100, window: 60 },
      auth: true
    },
    '/conversationLoad': {
      methods: ['GET'],
      rateLimit: { requests: 100, window: 60 },
      auth: true
    },
    '/conversationList': {
      methods: ['GET'],
      rateLimit: { requests: 50, window: 60 },
      auth: true
    },
    '/conversationDelete': {
      methods: ['DELETE'],
      rateLimit: { requests: 50, window: 60 },
      auth: true
    }
  },

  // Payment endpoints
  payment: {
    '/stripeCreateCheckout': {
      methods: ['POST'],
      rateLimit: { requests: 10, window: 300 },
      auth: true,
      validation: {
        body: ['priceId', 'mode']
      }
    },
    '/stripeWebhook': {
      methods: ['POST'],
      rateLimit: { requests: 1000, window: 60 },
      auth: false,
      skipValidation: true // Webhook signature validation handled internally
    }
  },

  // Admin endpoints - require admin role
  admin: {
    '/runSiteAudit': {
      methods: ['POST'],
      rateLimit: { requests: 5, window: 300 },
      auth: true,
      roles: ['admin']
    },
    '/siteBuilderExecute': {
      methods: ['POST'],
      rateLimit: { requests: 20, window: 60 },
      auth: true,
      roles: ['admin']
    },
    '/devGetFileTree': {
      methods: ['GET'],
      rateLimit: { requests: 50, window: 60 },
      auth: true,
      roles: ['admin']
    },
    '/devGetFileContent': {
      methods: ['POST'],
      rateLimit: { requests: 100, window: 60 },
      auth: true,
      roles: ['admin']
    }
  }
};

/**
 * Get route configuration by path
 */
export function getRouteConfig(path) {
  // Remove query params and normalize path
  const cleanPath = path.split('?')[0];
  
  // Check all route categories
  for (const category of Object.values(ROUTES)) {
    if (category[cleanPath]) {
      return category[cleanPath];
    }
  }
  
  return null;
}

/**
 * Global rate limit fallback for unknown routes
 */
export const DEFAULT_RATE_LIMIT = {
  requests: 20,
  window: 60
};

/**
 * Security headers for all responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};