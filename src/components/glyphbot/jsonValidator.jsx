/**
 * GlyphBot JSON Validator
 * Validates and cleans JSON responses from LLM providers
 */

function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;
  
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch (e) { /* Intentionally ignored: best-effort operation. */ }
  }
  
  const auditJsonMatch = text.match(/---AUDIT_JSON_START---([\s\S]*?)---AUDIT_JSON_END---/);
  if (auditJsonMatch) {
    try {
      return JSON.parse(auditJsonMatch[1].trim());
    } catch (e) { /* Intentionally ignored: best-effort operation. */ }
  }
  
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch (e) { /* Intentionally ignored: best-effort operation. */ }
  }
  
  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) {
    try {
      return JSON.parse(bracketMatch[0]);
    } catch (e) { /* Intentionally ignored: best-effort operation. */ }
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function validateAgainstSchema(json, schema) {
  if (!json || !schema) return { valid: false, errors: ['Missing JSON or schema'] };
  
  const errors = [];
  
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in json)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in json) {
        const value = json[key];
        
        if (propSchema.type === 'number' && typeof value !== 'number') {
          if (!isNaN(Number(value))) {
            json[key] = Number(value);
          } else {
            errors.push(`Field ${key} should be number, got ${typeof value}`);
          }
        }
        
        if (propSchema.type === 'string' && typeof value !== 'string') {
          json[key] = String(value);
        }
        
        if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
          json[key] = Boolean(value);
        }
        
        if (propSchema.type === 'array' && !Array.isArray(value)) {
          errors.push(`Field ${key} should be array, got ${typeof value}`);
        }
        
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          const closest = propSchema.enum.find(e => 
            e.toLowerCase() === String(value).toLowerCase()
          );
          if (closest) {
            json[key] = closest;
          } else {
            errors.push(`Field ${key} has invalid enum value: ${value}`);
          }
        }
        
        if (propSchema.minimum !== undefined && typeof value === 'number' && value < propSchema.minimum) {
          json[key] = propSchema.minimum;
        }
        
        if (propSchema.maximum !== undefined && typeof value === 'number' && value > propSchema.maximum) {
          json[key] = propSchema.maximum;
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    correctedJson: json
  };
}

function cleanJSONResponse(rawText, schema = null) {
  const extracted = extractJSON(rawText);
  
  if (!extracted) {
    return {
      success: false,
      json: null,
      rawText,
      errors: ['Could not extract valid JSON from response']
    };
  }
  
  if (schema) {
    const validation = validateAgainstSchema(extracted, schema);
    return {
      success: validation.valid,
      json: validation.correctedJson,
      rawText,
      errors: validation.errors
    };
  }
  
  return {
    success: true,
    json: extracted,
    rawText,
    errors: []
  };
}

function prettyPrintJSON(json, indent = 2) {
  try {
    return JSON.stringify(json, null, indent);
  } catch (e) {
    return String(json);
  }
}

function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
}

export {
  extractJSON,
  validateAgainstSchema,
  cleanJSONResponse,
  prettyPrintJSON,
  isValidJSON
};