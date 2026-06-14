/**
 * DACO-20260613-MOBILE-SCANNER — verifyDriverQrToken
 *
 * Server-side verification of a scanned driver QR token. The scanning device
 * NEVER holds the signing key — it only captures the token from the camera
 * and POSTs it here. The server recomputes the HMAC, validates, looks up the
 * driver, and (on valid) writes an immutable scan participation event to
 * ActivityLog stamped with all governance fields:
 *
 *   subject_id (driver_id), venue_id, timestamp, scanned_by (live email),
 *   mode, validation_run, funds_settled
 *
 * During a funds-off validation / seed run the caller passes validation_run=true
 * so the scan event stays quarantined alongside POSTransaction door writes.
 *
 * Request body:
 *   { qr_token: string, validation_run?: boolean, mode?: 'REAL'|'DEMO'|'SANDBOX' }
 *
 * Response (valid):   { valid: true, driver: {...}, event_id }
 * Response (invalid): { valid: false, reason }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_ROLES = new Set([
  'admin', 'manager',
  'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER',
  'DOORMAN', 'DOOR_GIRL', 'SECURITY',
]);

// Replay-window guard — tokens older than 90 days will not validate.
// Issuance rotation triggers a re-sign; this is a defense-in-depth ceiling.
const MAX_TOKEN_AGE_MS = 90 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.role || user._highestRole || '';
    if (!ALLOWED_ROLES.has(role)) {
      return Response.json({ error: 'Forbidden — operational role required' }, { status: 403 });
    }

    const body = await req.json();
    const { qr_token } = body;
    const validation_run = body.validation_run === true;
    const mode = ['REAL', 'DEMO', 'SANDBOX'].includes(body.mode) ? body.mode : 'REAL';

    if (!qr_token) return Response.json({ valid: false, reason: 'qr_token required' }, { status: 400 });

    const secret = Deno.env.get('MFA_SECRET_KEY');
    if (!secret) return Response.json({ error: 'Signing key not configured' }, { status: 500 });

    // Decode + verify signature.
    let payloadObj;
    let payloadStr;
    let signatureHex;
    try {
      const decoded = atob(qr_token);
      const sepIdx = decoded.lastIndexOf(':');
      if (sepIdx < 0) throw new Error('Malformed token');
      payloadStr = decoded.slice(0, sepIdx);
      signatureHex = decoded.slice(sepIdx + 1);
      payloadObj = JSON.parse(payloadStr);
    } catch {
      return Response.json({ valid: false, reason: 'malformed_token' }, { status: 400 });
    }

    if (payloadObj.kind !== 'driver') {
      return Response.json({ valid: false, reason: 'wrong_token_kind' }, { status: 400 });
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );
    const sigBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []
    );
    const sigValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payloadStr));

    if (!sigValid) {
      await base44.asServiceRole.entities.ActivityLog.create({
        log_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user_email: user.email,
        user_role: role,
        action_type: 'UPDATE',
        entity_affected: `DriverScanAttempt:invalid_signature`,
        after_value: { reason: 'invalid_signature', payload_driver_id: payloadObj.driver_id || null },
        venue_id: payloadObj.venue_id || null,
        mode,
        notes: 'DACO-20260613-MOBILE-SCANNER — bad signature, scan rejected',
      });
      return Response.json({ valid: false, reason: 'invalid_signature' }, { status: 403 });
    }

    // Replay-window guard.
    const issuedAt = Date.parse(payloadObj.issued_at || '');
    if (!issuedAt || Date.now() - issuedAt > MAX_TOKEN_AGE_MS) {
      return Response.json({ valid: false, reason: 'token_expired' }, { status: 403 });
    }

    // Driver lookup — must match BOTH driver_id AND the persisted qr_token (defense vs. token swap).
    const matches = await base44.asServiceRole.entities.DriverProfile.filter({
      driver_id: payloadObj.driver_id,
    });
    const driver = matches.find(d => d.qr_token === qr_token);
    if (!driver) {
      return Response.json({ valid: false, reason: 'driver_not_found_or_token_revoked' }, { status: 404 });
    }
    if (driver.status !== 'active') {
      return Response.json({ valid: false, reason: `driver_${driver.status}` }, { status: 403 });
    }

    // Write the scan participation event — stamps every governance field the
    // directive requires. ActivityLog is append-only at the schema level.
    const event_id = crypto.randomUUID();
    await base44.asServiceRole.entities.ActivityLog.create({
      log_id: event_id,
      timestamp: new Date().toISOString(),
      user_email: user.email,           // scanned_by — from live session
      user_role: role,
      action_type: 'CREATE',
      entity_affected: `DriverScanEvent:${driver.driver_id}`,
      after_value: {
        kind: 'driver_scan',
        driver_id: driver.driver_id,
        driver_profile_id: driver.id,
        venue_id: driver.venue_id,
        scanned_by: user.email,
        scanned_at: new Date().toISOString(),
        mode,
        validation_run,
        funds_settled: !validation_run,
        token_issued_at: payloadObj.issued_at,
      },
      venue_id: driver.venue_id,
      mode,
      notes: validation_run
        ? 'DACO-20260613-MOBILE-SCANNER funds-off validation scan (quarantined)'
        : 'DACO-20260613-MOBILE-SCANNER driver scan',
    });

    // Touch last_active_at — only on REAL non-validation scans.
    if (mode === 'REAL' && !validation_run) {
      await base44.asServiceRole.entities.DriverProfile.update(driver.id, {
        last_active_at: new Date().toISOString(),
      });
    }

    return Response.json({
      valid: true,
      event_id,
      driver: {
        driver_id: driver.driver_id,
        name: driver.name,
        venue_id: driver.venue_id,
        affiliated: driver.affiliated,
        status: driver.status,
      },
      mode,
      validation_run,
    });
  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});