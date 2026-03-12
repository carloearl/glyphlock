import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * SECURE SINGLE-USE QR CODE GENERATOR
 * 
 * Generates tamper-proof QR codes for customer orders
 * Expires after 24 hours or first scan
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
    const venue_id = sessionVenue.data?.venue_id;

    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id required' }, { status: 400 });
    }

    // Generate cryptographically secure QR data
    const qr_id = crypto.randomUUID();
    const timestamp = Date.now();
    const secret_key = Deno.env.get('MFA_SECRET_KEY'); // Reuse existing secret for signing
    
    const payload = JSON.stringify({
      qr_id,
      order_id,
      venue_id,
      timestamp,
      nonce: crypto.randomUUID()
    });

    // Create HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret_key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const signature_hex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const signed_payload = `${payload}:${signature_hex}`;
    const qr_data = btoa(signed_payload); // Base64 encode

    // Generate QR code image using AI
    const qr_prompt = `Generate a QR code image with data: ${qr_data}. High contrast black and white, 512x512px.`;
    
    const qr_image = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: qr_prompt
    });

    // Store QR record
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const qr_record = await base44.asServiceRole.entities.SecureQRCode.create({
      qr_id,
      order_id,
      venue_id,
      qr_data,
      qr_image_url: qr_image.url,
      is_single_use: true,
      is_used: false,
      expires_at,
      scan_attempts: 0,
      status: 'active'
    });

    // Log creation
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'SecureQRCode',
      entity_id: qr_id,
      action: 'CREATED',
      severity: 'INFO',
      description: `Secure QR code generated for order ${order_id}`
    });

    return Response.json({
      qr_id,
      qr_image_url: qr_image.url,
      qr_data,
      expires_at
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});