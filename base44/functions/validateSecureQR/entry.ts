import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * SECURE QR CODE VALIDATOR
 * 
 * Real-time validation with anti-replay protection
 * Prevents double-entry and unauthorized access
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qr_data } = await req.json();

    if (!qr_data) {
      return Response.json({ error: 'qr_data required', valid: false }, { status: 400 });
    }

    // Decode and verify signature
    let decoded;
    try {
      const decoded_b64 = atob(qr_data);
      const [payload_str, signature_hex] = decoded_b64.split(':');
      
      if (!signature_hex) {
        throw new Error('Invalid QR format');
      }

      const payload = JSON.parse(payload_str);
      const { qr_id, order_id, venue_id, timestamp } = payload;

      // Verify signature
      const secret_key = Deno.env.get('MFA_SECRET_KEY');
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret_key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const signature_bytes = new Uint8Array(
        signature_hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );

      const is_valid_signature = await crypto.subtle.verify(
        'HMAC',
        key,
        signature_bytes,
        encoder.encode(payload_str)
      );

      if (!is_valid_signature) {
        throw new Error('Invalid signature');
      }

      decoded = payload;

    } catch (decode_error) {
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        entity_type: 'SecureQRCode',
        action: 'SCAN_FAILED',
        severity: 'WARNING',
        description: `Invalid QR signature: ${decode_error.message}`
      });

      return Response.json({ valid: false, error: 'Invalid QR code' }, { status: 400 });
    }

    // Fetch QR record
    const qr_records = await base44.asServiceRole.entities.SecureQRCode.filter({
      qr_id: decoded.qr_id
    });

    if (qr_records.length === 0) {
      return Response.json({ valid: false, error: 'QR code not found' }, { status: 404 });
    }

    const qr_record = qr_records[0];

    // Increment scan attempts
    await base44.asServiceRole.entities.SecureQRCode.update(qr_record.id, {
      scan_attempts: (qr_record.scan_attempts || 0) + 1
    });

    // Check if already used
    if (qr_record.is_used) {
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id: decoded.venue_id,
        entity_type: 'SecureQRCode',
        entity_id: decoded.qr_id,
        action: 'REPLAY_ATTACK_BLOCKED',
        severity: 'CRITICAL',
        description: `QR code ${decoded.qr_id} scanned after already used — FRAUD ALERT`
      });

      return Response.json({ valid: false, error: 'QR code already used' }, { status: 403 });
    }

    // Check expiration
    if (new Date() > new Date(qr_record.expires_at)) {
      return Response.json({ valid: false, error: 'QR code expired' }, { status: 403 });
    }

    // Mark as used
    await base44.asServiceRole.entities.SecureQRCode.update(qr_record.id, {
      is_used: true,
      used_at: new Date().toISOString(),
      used_by: user.email,
      status: 'used'
    });

    // Log successful scan
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id: decoded.venue_id,
      entity_type: 'SecureQRCode',
      entity_id: decoded.qr_id,
      action: 'SCAN_SUCCESS',
      severity: 'INFO',
      description: `QR code validated for order ${decoded.order_id}`
    });

    return Response.json({
      valid: true,
      order_id: decoded.order_id,
      venue_id: decoded.venue_id,
      qr_id: decoded.qr_id
    });

  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});