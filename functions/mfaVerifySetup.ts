/**
 * POST /api/mfa/verify-setup
 * Verify TOTP code and enable MFA
 * SELF-CONTAINED: No local imports (Deno deploy limitation)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import speakeasy from 'npm:speakeasy@2.0.0';
import { createCipheriv, randomBytes, createHash } from 'node:crypto';

const TOTP_WINDOW = 1;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;

// --- Inline encryption ---
function getEncryptionKey() {
  const key = Deno.env.get('MFA_SECRET_KEY');
  if (!key) throw new Error('MFA_SECRET_KEY not configured');
  const buf = new Uint8Array(32);
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  buf.set(keyBytes.subarray(0, 32));
  return Buffer.from(buf);
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
  return combined.toString('base64');
}

// --- Inline TOTP verification ---
function verifyTotpCode(secretBase32, token) {
  try {
    return speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token: token,
      window: TOTP_WINDOW
    });
  } catch (e) {
    console.error('[TOTP Verify]', e.message);
    return false;
  }
}

// --- Inline recovery code generation ---
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { code, tempSecret } = body;
    
    if (!code || !tempSecret) {
      return Response.json({ error: 'Missing code or secret' }, { status: 400 });
    }
    
    // Verify the TOTP code against the temp secret
    const isValid = verifyTotpCode(tempSecret, code);
    
    if (!isValid) {
      return Response.json({ error: 'Invalid verification code. Make sure you entered the 6-digit code from your authenticator app.' }, { status: 400 });
    }
    
    // Generate recovery codes
    const { rawCodes, hashedCodes } = generateRecoveryCodes();
    
    // Encrypt the TOTP secret for storage
    const encryptedSecret = encrypt(tempSecret);
    
    // Use service role to update User entity
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    
    if (userEntities.length > 0) {
      await base44.asServiceRole.entities.User.update(userEntities[0].id, {
        mfaEnabled: true,
        mfaSecretEncrypted: encryptedSecret,
        mfaRecoveryCodes: hashedCodes
      });
    }
    
    return Response.json({
      success: true,
      recoveryCodes: rawCodes
    });
    
  } catch (error) {
    console.error('[MFA Verify Setup]', error);
    return Response.json({ error: 'Failed to enable MFA' }, { status: 500 });
  }
});