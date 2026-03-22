/**
 * GlyphLock Webhook Handler
 * Handles webhook events from GlyphLock SDK for chain, QR, and covenant events
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Verify webhook signature
function verifyWebhookSignature(payload, signature, timestamp, secret) {
  if (!signature || !timestamp || !secret) {
    return false;
  }

  // Check timestamp freshness (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  const webhookTimestamp = parseInt(timestamp, 10);
  if (Math.abs(now - webhookTimestamp) > 300) {
    console.warn('[Webhook] Timestamp too old:', now - webhookTimestamp, 'seconds');
    return false;
  }

  // Create expected signature
  const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : JSON.stringify(payload)}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Timing-safe comparison
  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    return sigBuffer.length === expectedBuffer.length && 
           timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (e) {
    console.error('[Webhook] Signature comparison failed:', e.message);
    return false;
  }
}

// Process different event types
async function processWebhookEvent(event, base44) {
  const { type, data, timestamp, event_id } = event;

  console.log(`[Webhook] Processing event: ${type} (${event_id})`);

  switch (type) {
    // ═══════════════════════════════════════════════════════════
    // CHAIN EVENTS - Provider chain completion/failure
    // ═══════════════════════════════════════════════════════════
    case 'chain.completed':
      console.log('[Chain] Completed:', data.trace_id, 'via', data.provider);
      await base44.entities.SystemAuditLog.create({
        event_type: 'chain_completed',
        details: {
          trace_id: data.trace_id,
          provider: data.provider,
          latency_ms: data.latency_ms,
          tokens_used: data.tokens_used
        },
        severity: 'info',
        timestamp: new Date().toISOString()
      });
      break;

    case 'chain.failed':
      console.log('[Chain] FAILED:', data.error_message);
      console.log('[Chain] Providers attempted:', data.providers_attempted);
      await base44.entities.SystemAuditLog.create({
        event_type: 'chain_failed',
        details: {
          error_message: data.error_message,
          providers_attempted: data.providers_attempted,
          trace_id: data.trace_id
        },
        severity: 'error',
        timestamp: new Date().toISOString()
      });
      break;

    // ═══════════════════════════════════════════════════════════
    // QR EVENTS - QR code encoding/decoding
    // ═══════════════════════════════════════════════════════════
    case 'qr.encoded':
      console.log('[QR] Encoded:', data.code_id);
      console.log('[QR] Payload size:', data.payload_size_bytes, 'bytes');
      await base44.entities.QRGenHistory.update(data.code_id, {
        status: 'encoded',
        payload_size: data.payload_size_bytes
      }).catch(() => {});
      break;

    case 'qr.decoded':
      console.log('[QR] Decoded:', data.code_id);
      console.log('[QR] Integrity verified:', data.integrity_verified);
      
      // Log scan event
      await base44.entities.QrScanEvent.create({
        code_id: data.code_id,
        integrity_verified: data.integrity_verified,
        scan_timestamp: new Date().toISOString(),
        user_agent: data.user_agent || 'unknown',
        ip_hash: data.ip_hash
      }).catch(() => {});

      // Update threat status if integrity failed
      if (!data.integrity_verified) {
        await base44.entities.QRThreatLog.create({
          incident_id: `INC-${Date.now()}`,
          code_id: data.code_id,
          attack_type: 'Malicious URL',
          payload: data.payload_preview || '',
          threat_description: 'QR code integrity verification failed',
          severity: 'high',
          resolved: false
        }).catch(() => {});
      }
      break;

    case 'qr.scanned':
      console.log('[QR] Scanned:', data.code_id, 'from', data.location);
      await base44.entities.QrScanEvent.create({
        code_id: data.code_id,
        scan_timestamp: new Date().toISOString(),
        location: data.location,
        device_type: data.device_type
      }).catch(() => {});
      break;

    // ═══════════════════════════════════════════════════════════
    // COVENANT EVENTS - Master Covenant verification
    // ═══════════════════════════════════════════════════════════
    case 'covenant.verified':
      console.log('[Covenant] Verified:', data.covenant_id);
      await base44.entities.SystemAuditLog.create({
        event_type: 'covenant_verified',
        details: {
          covenant_id: data.covenant_id,
          ai_model: data.ai_model,
          binding_type: data.binding_type,
          verification_timestamp: data.verified_at
        },
        severity: 'info',
        timestamp: new Date().toISOString()
      });
      break;

    case 'covenant.denied':
      console.log('[Covenant] DENIED:', data.denial_reason);
      console.log('[Covenant] Denial code:', data.denial_code);
      await base44.entities.SystemAuditLog.create({
        event_type: 'covenant_denied',
        details: {
          covenant_id: data.covenant_id,
          denial_reason: data.denial_reason,
          denial_code: data.denial_code,
          ai_model: data.ai_model
        },
        severity: 'critical',
        timestamp: new Date().toISOString()
      });

      // Send alert email for critical denials
      if (data.denial_code === 'BINDING_BREACH' || data.denial_code === 'UNAUTHORIZED_ACCESS') {
        await base44.integrations.Core.SendEmail({
          to: 'glyphlock@gmail.com',
          subject: `🚨 COVENANT DENIAL: ${data.denial_code}`,
          body: `
Critical covenant denial detected:

Covenant ID: ${data.covenant_id}
Denial Reason: ${data.denial_reason}
Denial Code: ${data.denial_code}
AI Model: ${data.ai_model || 'Unknown'}
Timestamp: ${new Date().toISOString()}

Immediate investigation required.
          `.trim()
        }).catch(console.error);
      }
      break;

    case 'covenant.binding_created':
      console.log('[Covenant] New binding created:', data.binding_id);
      await base44.entities.SystemAuditLog.create({
        event_type: 'covenant_binding_created',
        details: {
          binding_id: data.binding_id,
          ai_model: data.ai_model,
          binding_type: data.binding_type,
          signature_hash: data.signature_hash
        },
        severity: 'info',
        timestamp: new Date().toISOString()
      });
      break;

    // ═══════════════════════════════════════════════════════════
    // SECURITY EVENTS
    // ═══════════════════════════════════════════════════════════
    case 'security.threat_detected':
      console.log('[Security] Threat detected:', data.threat_type);
      await base44.entities.QRThreatLog.create({
        incident_id: `INC-${Date.now()}`,
        code_id: data.code_id || 'N/A',
        attack_type: data.threat_type,
        payload: data.payload || '',
        threat_description: data.description,
        severity: data.severity || 'medium',
        resolved: false
      });
      break;

    case 'security.rate_limit_exceeded':
      console.log('[Security] Rate limit exceeded:', data.ip_hash);
      await base44.entities.SystemAuditLog.create({
        event_type: 'rate_limit_exceeded',
        details: {
          ip_hash: data.ip_hash,
          endpoint: data.endpoint,
          request_count: data.request_count,
          window_seconds: data.window_seconds
        },
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
      break;

    // ═══════════════════════════════════════════════════════════
    // PAYMENT EVENTS
    // ═══════════════════════════════════════════════════════════
    case 'payment.completed':
      console.log('[Payment] Completed:', data.transaction_id);
      // Update consultation if applicable
      if (data.consultation_id) {
        await base44.entities.Consultation.update(data.consultation_id, {
          payment_status: 'paid',
          stripe_payment_intent_id: data.payment_intent_id,
          amount_paid: data.amount,
          payment_date: new Date().toISOString()
        }).catch(() => {});
      }
      break;

    case 'payment.failed':
      console.log('[Payment] Failed:', data.error_message);
      if (data.consultation_id) {
        await base44.entities.Consultation.update(data.consultation_id, {
          payment_status: 'failed'
        }).catch(() => {});
      }
      break;

    default:
      console.log('[Webhook] Unhandled event type:', type);
  }

  return { processed: true, event_type: type };
}

// Main handler
Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Get signature headers
    const signature = req.headers.get('x-glyphlock-signature');
    const timestamp = req.headers.get('x-glyphlock-timestamp');
    const webhookSecret = Deno.env.get('GLYPHKEY');

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, timestamp, webhookSecret);
      if (!isValid) {
        console.error('[Webhook] Invalid signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Parse event
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate event structure
    if (!event.type || !event.data) {
      return new Response(JSON.stringify({ error: 'Invalid event structure' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process the event
    const result = await processWebhookEvent(event, base44);

    return new Response(JSON.stringify({ 
      received: true, 
      ...result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});