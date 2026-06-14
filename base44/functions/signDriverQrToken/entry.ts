/**
 * DACO-20260613-MOBILE-SCANNER — signDriverQrToken
 *
 * Issues a server-signed HMAC-SHA256 QR token for a driver.
 * Reuses the GlyphBucks/SecureQR signing pattern (MFA_SECRET_KEY +
 * HMAC-SHA256 over JSON, base64 `payload:signature` format) — does NOT
 * fork a second signing system.
 *
 * Governance:
 *   - Signing key NEVER returned to the client.
 *   - Payload contains driver_id, venue_id, issued_at, sig — no key material.
 *   - qr_token / signature / issued_at persisted on the DriverProfile.
 *   - Caller must be an authenticated operational user (Doorman/Manager/Admin).
 *
 * Request body: { driver_id: string }
 * Response: { qr_token: string, signature: string, issued_at: string, driver_id: string, venue_id: string }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_ROLES = new Set([
  'admin', 'manager',
  'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER',
  'DOORMAN', 'SECURITY',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.role || user._highestRole || '';
    if (!ALLOWED_ROLES.has(role)) {
      return Response.json({ error: 'Forbidden — operational role required' }, { status: 403 });
    }

    const { driver_id } = await req.json();
    if (!driver_id) return Response.json({ error: 'driver_id required' }, { status: 400 });

    // Resolve driver — venue is read from the durable record (no client-supplied venue).
    const matches = await base44.asServiceRole.entities.DriverProfile.filter({ driver_id });
    if (!matches.length) return Response.json({ error: 'Driver not found' }, { status: 404 });
    const driver = matches[0];

    const secret = Deno.env.get('MFA_SECRET_KEY');
    if (!secret) return Response.json({ error: 'Signing key not configured' }, { status: 500 });

    const issued_at = new Date().toISOString();
    const payload = JSON.stringify({
      v: 1,                    // version
      kind: 'driver',          // distinguishes from SecureQR / GlyphBucks tokens
      driver_id,
      venue_id: driver.venue_id,
      issued_at,
      nonce: crypto.randomUUID(),
    });

    // HMAC-SHA256 — same pattern as generateSecureQR/validateSecureQR.
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const signature = Array.from(new Uint8Array(sigBytes))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const qr_token = btoa(`${payload}:${signature}`);

    // Persist token fields on the durable driver record.
    await base44.asServiceRole.entities.DriverProfile.update(driver.id, {
      qr_token,
      signature,
      issued_at,
    });

    // Forensic audit — issuance is logged immutably.
    await base44.asServiceRole.entities.ActivityLog.create({
      log_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user_email: user.email,
      user_role: role,
      action_type: 'CREATE',
      entity_affected: `DriverProfile:${driver.id}:qr_token`,
      after_value: { driver_id, venue_id: driver.venue_id, issued_at },
      venue_id: driver.venue_id,
      mode: 'REAL',
      notes: 'DACO-20260613-MOBILE-SCANNER QR issuance',
    });

    return Response.json({
      qr_token,
      signature,
      issued_at,
      driver_id,
      venue_id: driver.venue_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});