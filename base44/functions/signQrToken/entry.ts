import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHmac } from 'node:crypto';

/**
 * DACO-20260613-MOBILE-SCANNER — Generate server-signed HMAC QR token for a driver.
 * 
 * Reuses the per-venue signing key from VenueRateConfig (same infrastructure as GlyphBucks).
 * The client never sees the key; only the signed payload leaves the server.
 * 
 * Payload format: {driver_id}|{venue_id}|{issued_at}|{signature}
 * Signature: HMAC-SHA256({driver_id}|{venue_id}|{issued_at}, per_venue_key)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { driver_id, venue_id } = await req.json();
    if (!driver_id || !venue_id) {
      return new Response(JSON.stringify({ error: 'driver_id and venue_id required' }), { status: 400 });
    }

    // Fetch venue config to get the signing key.
    const configs = await base44.asServiceRole.entities.VenueRateConfig.filter({ venue_id }, null, 1);
    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ error: 'Venue config not found' }), { status: 404 });
    }
    const config = configs[0];
    const signingKey = config.hmac_signing_key || Deno.env.get('DEFAULT_HMAC_KEY');
    if (!signingKey) {
      return new Response(JSON.stringify({ error: 'Signing key not configured' }), { status: 500 });
    }

    // Generate payload.
    const issuedAt = new Date().toISOString();
    const payloadData = `${driver_id}|${venue_id}|${issuedAt}`;
    const signature = createHmac('sha256', signingKey).update(payloadData).digest('hex');
    const qr_token = `${payloadData}|${signature}`;

    // Update DriverProfile with the signed token.
    const driverProfiles = await base44.asServiceRole.entities.DriverProfile.filter({ driver_id, venue_id }, null, 1);
    if (!driverProfiles || driverProfiles.length === 0) {
      return new Response(JSON.stringify({ error: 'Driver not found' }), { status: 404 });
    }
    const driver = driverProfiles[0];

    await base44.asServiceRole.entities.DriverProfile.update(driver.id, {
      qr_token,
      qr_signature: signature,
      qr_issued_at: issuedAt,
    });

    // Audit log.
    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user.email,
        user_role: user.role,
        action_type: 'CREATE',
        entity_affected: `DriverProfile:${driver.id}:qr_signed`,
        after_value: { driver_id, venue_id, qr_issued_at: issuedAt },
        venue_id,
        mode: 'REAL',
        notes: 'QR token signed for mobile scanner.',
      });
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return new Response(JSON.stringify({ ok: true, qr_token, driver_id, venue_id, issued_at: issuedAt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});