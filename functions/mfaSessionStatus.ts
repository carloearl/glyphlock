/**
 * POST /api/mfa/session-status
 * Returns MFA status for the current authenticated user
 * SELF-CONTAINED: No local imports (Deno deploy limitation)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// --- Inline device fingerprint using Web Crypto API ---
async function generateDeviceFingerprint(req) {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function findTrustedDevice(trustedDevices, deviceId) {
  if (!trustedDevices || trustedDevices.length === 0) return null;
  const now = new Date();
  const device = trustedDevices.find(d => d.deviceId === deviceId);
  if (!device) return null;
  if (new Date(device.expiresAt) < now) return null;
  return device;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let user;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      return Response.json({
        authenticated: false,
        mfaEnabled: false,
        mfaVerified: false
      });
    }
    
    if (!user) {
      return Response.json({
        authenticated: false,
        mfaEnabled: false,
        mfaVerified: false
      });
    }
    
    // Use service role to read User entity
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const userData = userEntities[0] || {};
    
    const mfaEnabled = userData.mfaEnabled || false;
    
    if (!mfaEnabled) {
      return Response.json({
        authenticated: true,
        mfaEnabled: false,
        mfaVerified: true
      });
    }
    
    // Check session cookie
    const mfaVerifiedCookie = req.headers.get('cookie')?.includes('mfa_verified=true');
    
    // Check trusted device
    const deviceId = await generateDeviceFingerprint(req);
    const trustedDevice = findTrustedDevice(userData.trustedDevices, deviceId);
    
    // Update lastUsedAt for trusted device (fire and forget)
    if (trustedDevice) {
      const updatedDevices = (userData.trustedDevices || []).map(d => 
        d.deviceId === deviceId 
          ? { ...d, lastUsedAt: new Date().toISOString() }
          : d
      );
      base44.asServiceRole.entities.User.update(userData.id, { trustedDevices: updatedDevices })
        .catch(err => console.error('[MFA] Failed to update device lastUsedAt:', err));
    }
    
    const mfaVerified = mfaVerifiedCookie || !!trustedDevice;
    
    return Response.json({
      authenticated: true,
      mfaEnabled: true,
      mfaVerified
    });
    
  } catch (error) {
    console.error('[MFA Session Status]', error);
    return Response.json({ 
      authenticated: false,
      mfaEnabled: false,
      mfaVerified: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
});