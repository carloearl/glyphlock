/**
 * Request Validator for API Gateway
 * Validates request body, query params, and headers
 */

/**
 * Validate request body against required fields
 */
export function validateBody(body, requiredFields = []) {
  const errors = [];
  
  if (!body) {
    if (requiredFields.length > 0) {
      return {
        valid: false,
        errors: ['Request body is required']
      };
    }
    return { valid: true, errors: [] };
  }
  
  // Check required fields
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate field types and formats
  if (body.email && !isValidEmail(body.email)) {
    errors.push('Invalid email format');
  }
  
  if (body.url && !isValidUrl(body.url)) {
    errors.push('Invalid URL format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(query, requiredParams = []) {
  const errors = [];
  
  for (const param of requiredParams) {
    if (!query.has(param)) {
      errors.push(`Missing required query parameter: ${param}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate HTTP method
 */
export function validateMethod(method, allowedMethods = []) {
  if (!allowedMethods.includes(method)) {
    return {
      valid: false,
      error: `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove potential SQL injection patterns
    let sanitized = input.replace(/['";\\]/g, '');
    
    // Remove potential XSS patterns
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    return sanitized;
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate content type
 */
export function validateContentType(req, expectedType = 'application/json') {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !contentType.includes(expectedType)) {
    return {
      valid: false,
      error: `Invalid content type. Expected: ${expectedType}`
    };
  }
  
  return { valid: true };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(errors) {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: errors
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}