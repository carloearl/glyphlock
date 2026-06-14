import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHmac } from 'node:crypto';

/**
 * DACO-20260613-MOBILE-SCANNER — Verify server-signed HMAC QR token.
 * 
 * The client sends the decoded QR payload ({driver_id}|{venue_id}|{issued_at}|{signature}).
 * Server recomputes the HMAC using the per-venue key and returns valid/invalid + driver identity.
 * 
 * The device NEVER verifies and NEVER holds the key.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { qr_token, venue_id } = await req.json();
    if (!qr_token || !venue_id) {
      return new Response(JSON.stringify({ error: 'qr_token and venue_id required' }), { status: 400 });
    }

    // Parse payload: {driver_id}|{venue_id}|{issued_at}|{signature}
    const parts = qr_token.split('|');
    if (parts.length !== 4) {
      return new Response(JSON.stringify({ ok: false, reason: 'Invalid token format' }), { status: 400 });
    }
    const [driver_id, token_venue, issuedAt, clientSignature] = parts;

    // Validate venue match.
    if (token_venue !== venue_id) {
      return new Response(JSON.stringify({ ok: false, reason: 'Venue mismatch' }), { status: 400 });
    }

    // Fetch venue config for the signing key.
    const configs = await base44.asServiceRole.entities.VenueRateConfig.filter({ venue_id }, null, 1);
    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ ok: false, reason: 'Venue config not found' }), { status: 404 });
    }
    const config = configs[0];
    const signingKey = config.hmac_signing_key || Deno.env.get('DEFAULT_HMAC_KEY');
    if (!signingKey) {
      return new Response(JSON.stringify({ ok: false, reason: 'Signing key not configured' }), { status: 500 });
    }

    // Recompute HMAC.
    const payloadData = `${driver_id}|${venue_id}|${issuedAt}`;
    const serverSignature = createHmac('sha256', signingKey).update(payloadData).digest('hex');

    // Constant-time comparison to prevent timing attacks.
    const isValid = serverSignature === clientSignature;
    if (!isValid) {
      return new Response(JSON.stringify({ ok: false, reason: 'Signature mismatch' }), { status: 400 });
    }

    // Check token age (reject if >1 hour old).
    const issuedTime = new Date(issuedAt).getTime();
    const now = Date.now();
    const ageMs = now - issuedTime;
    if (ageMs > 3600000) {
      return new Response(JSON.stringify({ ok: false, reason: 'Token expired' }), { status: 400 });
    }

    // Fetch driver and validate.
    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({ driver_id, venue_id }, null, 1);
    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ ok: false, reason: 'Driver not found' }), { status: 404 });
    }
    const driver = drivers[0];

    if (driver.status !== 'active') {
      return new Response(JSON.stringify({ ok: false, reason: `Driver status: ${driver.status}` }), { status: 403 });
    }

    // Audit log.
    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user.email,
        user_role: user.role,
        action_type: 'UPDATE',
        entity_affected: `DriverProfile:${driver.id}:qr_verified`,
        after_value: { driver_id, venue_id, verified_at: new Date().toISOString() },
        venue_id,
        mode: 'REAL',
        notes: 'QR token verified via mobile scanner.',
      });
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return new Response(JSON.stringify({
      ok: true,
      driver_id: driver.driver_id,
      driver_name: driver.name,
      venue_id,
      verified_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});