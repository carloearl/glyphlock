/**
 * POST /api/mfaVerifyLogin
 * Verify TOTP code or recovery code during login
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
    return false;
  }
}

// --- Inline recovery code verification ---
function verifyRecoveryCode(code, hashedCodes) {
  const hash = createHash('sha256').update(code.toUpperCase()).digest('hex');
  return hashedCodes.indexOf(hash);
}

// --- Inline device fingerprint ---
function generateDeviceFingerprint(req) {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return createHash('sha256').update(fingerprint).digest('hex');
}

function extractDeviceName(userAgent) {
  if (!userAgent) return 'Unknown Device';
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) return userAgent.includes('Mobile') ? 'Android Phone' : 'Android Tablet';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Mac OS/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux PC';
  return 'Unknown Device';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { totpCode, recoveryCode, trustDevice = false } = body;
    
    if (!totpCode && !recoveryCode) {
      return Response.json({ error: 'No verification code provided' }, { status: 400 });
    }
    
    // Use service role to read User entity
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const userData = userEntities[0];
    
    if (!userData || !userData.mfaEnabled) {
      return Response.json({ error: 'MFA not enabled' }, { status: 400 });
    }
    
    let isValid = false;
    let usedRecoveryCodeIndex = -1;
    
    if (totpCode) {
      const decryptedSecret = decrypt(userData.mfaSecretEncrypted);
      isValid = verifyTotpCode(decryptedSecret, totpCode);
    } else if (recoveryCode) {
      usedRecoveryCodeIndex = verifyRecoveryCode(recoveryCode, userData.mfaRecoveryCodes || []);
      isValid = usedRecoveryCodeIndex !== -1;
      
      if (isValid) {
        const updatedCodes = [...(userData.mfaRecoveryCodes || [])];
        updatedCodes.splice(usedRecoveryCodeIndex, 1);
        await base44.asServiceRole.entities.User.update(userData.id, {
          mfaRecoveryCodes: updatedCodes
        });
      }
    }
    
    if (!isValid) {
      return Response.json({ error: 'Invalid verification code' }, { status: 401 });
    }
    
    // Handle trusted device registration
    if (trustDevice) {
      const deviceId = generateDeviceFingerprint(req);
      const deviceName = extractDeviceName(req.headers.get('user-agent') || '');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const trustedDevices = (userData.trustedDevices || []).filter(d => d.deviceId !== deviceId);
      trustedDevices.push({
        deviceId,
        deviceName,
        trustGrantedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastUsedAt: now.toISOString()
      });
      
      await base44.asServiceRole.entities.User.update(userData.id, {
        trustedDevices
      });
    }
    
    // Set MFA verified cookie
    const headers = new Headers();
    headers.set('Set-Cookie', 'mfa_verified=true; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400');
    
    return Response.json({ success: true }, { headers });
    
  } catch (error) {
    console.error('[MFA Verify Login]', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
});