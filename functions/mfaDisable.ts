/**
 * POST /api/mfa/disable
 * Disable MFA for the user (requires TOTP or recovery code)
 * SELF-CONTAINED: No local imports (Deno deploy limitation)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import speakeasy from 'npm:speakeasy@2.0.0';
import { createDecipheriv, createHash } from 'node:crypto';

const TOTP_WINDOW = 1;

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

function verifyRecoveryCode(code, hashedCodes) {
  const hash = createHash('sha256').update(code.toUpperCase()).digest('hex');
  return hashedCodes.indexOf(hash);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { totpCode, recoveryCode } = body;
    
    if (!totpCode && !recoveryCode) {
      return Response.json({ error: 'TOTP or recovery code required' }, { status: 400 });
    }
    
    // Use service role
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const userData = userEntities[0];
    
    if (!userData || !userData.mfaEnabled) {
      return Response.json({ error: 'MFA not enabled' }, { status: 400 });
    }
    
    let isValid = false;
    
    if (totpCode) {
      const decryptedSecret = decrypt(userData.mfaSecretEncrypted);
      isValid = verifyTotpCode(decryptedSecret, totpCode);
    } else if (recoveryCode) {
      isValid = verifyRecoveryCode(recoveryCode, userData.mfaRecoveryCodes || []) !== -1;
    }
    
    if (!isValid) {
      return Response.json({ error: 'Invalid verification code' }, { status: 400 });
    }
    
    // Disable MFA
    await base44.asServiceRole.entities.User.update(userData.id, {
      mfaEnabled: false,
      mfaSecretEncrypted: '',
      mfaRecoveryCodes: [],
      trustedDevices: []
    });
    
    // Clear MFA cookie
    const headers = new Headers();
    headers.set('Set-Cookie', 'mfa_verified=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    
    return Response.json({ success: true, message: 'MFA disabled successfully' }, { headers });
    
  } catch (error) {
    console.error('[MFA Disable]', error);
    return Response.json({ error: 'Failed to disable MFA' }, { status: 500 });
  }
});