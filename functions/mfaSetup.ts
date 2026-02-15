/**
 * POST /api/mfa/setup
 * Initialize MFA setup - generate TOTP secret and QR code
 * SELF-CONTAINED: No local imports (Deno deploy limitation)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import speakeasy from 'npm:speakeasy@2.0.0';
import QRCode from 'npm:qrcode@1.5.3';

const ISSUER = 'GlyphLock';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use service role to read User entity (User entity has RLS restrictions)
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const userData = userEntities[0] || {};
    
    if (userData.mfaEnabled) {
      return Response.json({ 
        error: 'MFA is already enabled. Disable it first to reconfigure.' 
      }, { status: 400 });
    }
    
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${ISSUER} (${user.email})`,
      issuer: ISSUER,
      length: 32
    });
    
    // Generate QR code as data URL (scannable by Google Authenticator, Authy, etc.)
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    
    return Response.json({
      qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url,
      manualKey: secret.base32,
      tempSecret: secret.base32
    });
    
  } catch (error) {
    console.error('[MFA Setup]', error);
    return Response.json({ error: 'Failed to initialize MFA setup' }, { status: 500 });
  }
});