/**
 * POST /api/mfa/logout
 * 
 * Clears MFA session state (cookie) on logout.
 * Should be called before base44.auth.logout() to ensure clean session termination.
 * 
 * This does NOT revoke trusted devices - they persist for 30 days.
 * Users must explicitly revoke trusted devices via /api/mfa/revoke-trusted-device.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Clear MFA verified cookie
    const headers = new Headers();
    headers.set('Set-Cookie', 
      'mfa_verified=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );
    
    return Response.json({ 
      success: true,
      message: 'MFA session cleared'
    }, { headers });
    
  } catch (error) {
    console.error('[MFA Logout]', error);
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
});