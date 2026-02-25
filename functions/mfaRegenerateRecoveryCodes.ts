/**
 * POST /api/mfa/recovery-codes/regenerate
 * Regenerate recovery codes (requires valid TOTP code)
 * SELF-CONTAINED: No local imports (Deno deploy limitation)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import speakeasy from 'npm:speakeasy@2.0.0';
import { createDecipheriv, createHash, randomBytes } from 'node:crypto';

const TOTP_WINDOW = 1;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;

// --- Inline decryption ---
function getEncryptionKey() {
  const key = Deno.env.get('MFA_SECRET_KEY');
  if (!key) throw new Error('MFA_SECRET_KEY not configured');
  const buf = new Uint8Array(32);
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  buf.set(keyBytes.subarray(0, 32));
  return Buffer.from(buf);
}

function decrypt(encryptedData) {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedData, 'base64');
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function verifyTotpCode(secretBase32, token) {
  try {
    return speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token: token,
      window: TOTP_WINDOW
    });
  } catch (e) {
    return false;
  }
}

function generateRecoveryCodes() {
  const rawCodes = [];
  const hashedCodes = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = randomBytes(RECOVERY_CODE_LENGTH)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, RECOVERY_CODE_LENGTH)
      .toUpperCase();
    rawCodes.push(code);
    hashedCodes.push(createHash('sha256').update(code).digest('hex'));
  }
  return { rawCodes, hashedCodes };
}

// Rate limiting (in-memory)
const rateLimitStore = new Map();
const checkRateLimit = (identifier) => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { attempts: [], lockedUntil: null };
  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, remainingMs: record.lockedUntil - now };
  }
  const validAttempts = record.attempts.filter(t => now - t < 900000);
  if (validAttempts.length >= 5) {
    record.lockedUntil = now + 3600000;
    rateLimitStore.set(identifier, record);
    return { allowed: false, remainingMs: 3600000 };
  }
  return { allowed: true };
};
const recordAttempt = (identifier, success) => {
  if (!success) {
    const record = rateLimitStore.get(identifier) || { attempts: [], lockedUntil: null };
    record.attempts.push(Date.now());
    rateLimitStore.set(identifier, record);
  } else {
    rateLimitStore.delete(identifier);
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DACO FIX: MED-001 - Rate limiting
    const rateLimit = checkRateLimit(user.email);
    if (!rateLimit.allowed) {
      const remainingMin = Math.ceil(rateLimit.remainingMs / 60000);
      return Response.json({ 
        error: `Too many failed attempts. Try again in ${remainingMin} minutes.` 
      }, { status: 429 });
    }
    
    const body = await req.json();
    const { totpCode } = body;
    
    if (!totpCode) {
      return Response.json({ error: 'TOTP code required' }, { status: 400 });
    }
    
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const userData = userEntities[0];
    
    if (!userData || !userData.mfaEnabled) {
      return Response.json({ error: 'MFA not enabled' }, { status: 400 });
    }
    
    const decryptedSecret = decrypt(userData.mfaSecretEncrypted);
    const isValid = verifyTotpCode(decryptedSecret, totpCode);
    
    if (!isValid) {
      recordAttempt(user.email, false);
      return Response.json({ error: 'Invalid TOTP code' }, { status: 400 });
    }

    recordAttempt(user.email, true);
    
    const { rawCodes, hashedCodes } = generateRecoveryCodes();
    
    await base44.asServiceRole.entities.User.update(userData.id, {
      mfaRecoveryCodes: hashedCodes
    });
    
    return Response.json({
      success: true,
      recoveryCodes: rawCodes
    });
    
  } catch (error) {
    console.error('[MFA Regenerate Codes]', error);
    return Response.json({ error: 'Failed to regenerate recovery codes' }, { status: 500 });
  }
});