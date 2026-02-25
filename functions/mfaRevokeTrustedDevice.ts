/**
 * POST /api/mfa/revoke-trusted-device
 * Revoke a trusted device
 * SELF-CONTAINED: No local imports (Deno deploy limitation)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { deviceId } = body;
    
    if (!deviceId) {
      return Response.json({ error: 'Device ID required' }, { status: 400 });
    }
    
    const userEntities = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const userData = userEntities[0];
    
    if (!userData || !userData.trustedDevices) {
      return Response.json({ error: 'No trusted devices found' }, { status: 404 });
    }
    
    // DACO FIX: HIGH-001 - Exact deviceId match instead of prefix
    const updatedDevices = userData.trustedDevices.filter(
      d => d.deviceId !== deviceId
    );
    
    await base44.asServiceRole.entities.User.update(userData.id, {
      trustedDevices: updatedDevices
    });
    
    return Response.json({ success: true, message: 'Device trust revoked successfully' });
    
  } catch (error) {
    console.error('[MFA Revoke Trusted Device]', error);
    return Response.json({ error: 'Failed to revoke device trust' }, { status: 500 });
  }
});