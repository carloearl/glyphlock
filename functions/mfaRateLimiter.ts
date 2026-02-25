/**
 * MFA Rate Limiter - DACO FIX: MED-001
 * Shared rate limiting service for MFA operations to prevent brute-force
 * 
 * Usage: import { checkMFARateLimit } from './mfaRateLimiter'
 * NOTE: Deno Deploy isolates functions, so using in-memory Map for simplicity
 * Production: Should use Redis/KV store for distributed rate limiting
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In-memory rate limit store (resets on cold start)
const rateLimitStore = new Map();
const MFA_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MFA_MAX_ATTEMPTS = 5; // Max 5 failed attempts per window
const MFA_LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour lockout

export function checkMFARateLimit(identifier) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { attempts: [], lockedUntil: null };
  
  // Check if currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      allowed: false,
      reason: `Account locked due to too many failed attempts. Try again in ${remainingMin} minutes.`,
      lockedUntil: record.lockedUntil
    };
  }
  
  // Filter attempts within rate limit window
  const validAttempts = record.attempts.filter(timestamp => now - timestamp < MFA_RATE_LIMIT_WINDOW);
  
  if (validAttempts.length >= MFA_MAX_ATTEMPTS) {
    // Lock account for 1 hour
    record.lockedUntil = now + MFA_LOCKOUT_DURATION;
    record.attempts = validAttempts;
    rateLimitStore.set(identifier, record);
    
    return {
      allowed: false,
      reason: `Too many failed attempts. Account locked for 1 hour.`,
      lockedUntil: record.lockedUntil
    };
  }
  
  return { allowed: true };
}

export function recordMFAAttempt(identifier, success) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { attempts: [], lockedUntil: null };
  
  if (!success) {
    // Only record failed attempts
    const validAttempts = record.attempts.filter(timestamp => now - timestamp < MFA_RATE_LIMIT_WINDOW);
    validAttempts.push(now);
    record.attempts = validAttempts;
    rateLimitStore.set(identifier, record);
  } else {
    // Success: clear rate limit record
    rateLimitStore.delete(identifier);
  }
}

// Standalone endpoint for rate limit checking (callable from other functions)
Deno.serve(async (req) => {
  try {
    const { identifier, recordAttempt, success } = await req.json();
    
    if (recordAttempt) {
      recordMFAAttempt(identifier, success);
      return Response.json({ recorded: true });
    }
    
    const result = checkMFARateLimit(identifier);
    return Response.json(result);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});