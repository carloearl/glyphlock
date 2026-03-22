// GLYPHLOCK: Verify 2FA code
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Verification code required' }, { status: 400 });
    }

    // GLYPHLOCK: Verify code matches and hasn't expired
    const now = new Date();
    const expiresAt = user.twoFactorCodeExpires ? new Date(user.twoFactorCodeExpires) : null;

    if (!user.twoFactorCode || !expiresAt) {
      return Response.json({ 
        error: 'No verification code sent or expired' 
      }, { status: 400 });
    }

    if (now > expiresAt) {
      return Response.json({ 
        error: 'Verification code expired' 
      }, { status: 400 });
    }

    if (user.twoFactorCode !== code) {
      return Response.json({ 
        error: 'Invalid verification code' 
      }, { status: 400 });
    }

    // GLYPHLOCK: Mark 2FA as verified and clear code
    await base44.asServiceRole.entities.User.update(user.id, {
      twoFactorVerified: true,
      twoFactorCode: null,
      twoFactorCodeExpires: null,
      twoFactorVerifiedAt: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      message: '2FA verification successful' 
    });

  } catch (error) {
    console.error('[2FA Verify] Error:', error);
    return Response.json({ 
      error: error.message || 'Verification failed' 
    }, { status: 500 });
  }
});