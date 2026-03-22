// GLYPHLOCK: Send 2FA verification code via SMS
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { send2FACode } from './helpers/twilioClient.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // GLYPHLOCK: Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // GLYPHLOCK: Store code in user record (using service role for update)
    await base44.asServiceRole.entities.User.update(user.id, {
      twoFactorCode: code,
      twoFactorCodeExpires: expiresAt.toISOString(),
      twoFactorPhone: phoneNumber
    });

    // GLYPHLOCK: Send SMS
    await send2FACode({ to: phoneNumber, code });

    return Response.json({ 
      success: true,
      message: 'Verification code sent',
      expiresIn: 600 // seconds
    });

  } catch (error) {
    console.error('[2FA Send] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send verification code' 
    }, { status: 500 });
  }
});