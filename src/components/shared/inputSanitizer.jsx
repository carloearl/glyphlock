/**
 * GLYPHLOCK — Shared Input Sanitizer
 * Used by all forms across the platform.
 * Strips HTML tags, script injections, and dangerous characters.
 */

export function stripHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"']/g, '')
    .trim();
}

export function sanitizeEmail(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
  if (!phone) return true; // optional
  return /^[\d\s\-+().]{7,20}$/.test(phone);
}

export function clampLength(str, min, max) {
  if (!str) return { valid: false, value: '' };
  const trimmed = str.trim();
  return {
    valid: trimmed.length >= min && trimmed.length <= max,
    value: trimmed.slice(0, max)
  };
}

export function sanitizeFormData(fields) {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') {
      result[key] = stripHtml(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}