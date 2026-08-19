import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// W3-008B — Optional Native Payment Integration
// This function confirms a Stripe payment intent only when a venue explicitly
// enables Stripe integration, then delegates to createPaymentRecord.
// Existing venue processors/terminals bypass this function and are recorded
// through the external_terminal overlay in createPaymentRecord.
//
// Stripe credentials resolve from the provider-configured environment secret
// first, then Base44's managed Stripe connector. They never reach the client.

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];

async function resolveVenueConfig(base44, venue_id) {
  const configs = await base44.asServiceRole.entities.VenuePaymentConfig.filter(
    { venue_id, active: true }, null, 1
  );
  if (configs && configs.length > 0) return configs[0];
  return { primary_provider_code: 'external_terminal' };
}

async function resolveProviderConfig(base44, providerCode) {
  const providers = await base44.asServiceRole.entities.PaymentProvider.filter(
    { provider_code: providerCode, active: true }, null, 1
  );
  return providers?.[0] || null;
}

async function resolveStripeSecretKey(base44, providerConfig) {
  const secretName = providerConfig?.secret_name || 'STRIPE_SECRET_KEY';
  const configured = Deno.env.get(secretName);
  if (configured) return configured;

  try {
    const connection = await base44.asServiceRole.connectors.getConnection('stripe');
    const token = connection?.accessToken;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({
        error: 'Forbidden: Staff access required to confirm payments'
      }, { status: 403 });
    }

    let venue_id;
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      if (!sessionVenue?.data?.success) {
        return Response.json({
          error: sessionVenue?.data?.error || 'Venue access denied'
        }, { status: 403 });
      }
      venue_id = sessionVenue.data.venue_id;
    } catch (_) {
      return Response.json({ error: 'Venue access denied' }, { status: 403 });
    }

    const payload = await req.json();
    const { payment_intent_id, order_number, denomination, quantity } = payload;

    if (!payment_intent_id || typeof payment_intent_id !== 'string') {
      return Response.json({ error: 'Missing or invalid payment_intent_id' }, { status: 400 });
    }

    // Idempotency — check for existing confirmation
    const existingConfirm = await base44.asServiceRole.entities.SystemAuditLog.filter({
      entity_type: 'PaymentIntent',
      entity_id: payment_intent_id,
      event_type: 'GLYPHBUCKS_PAYMENT_CONFIRMED'
    }, null, 1);

    if (existingConfirm.length > 0) {
      const cached = existingConfirm[0].metadata || {};
      return Response.json({
        success: true,
        payment_status: 'succeeded',
        approval_code: cached.approval_code,
        processor_reference: payment_intent_id,
        card_last_four: cached.card_last_four || null,
        amount_charged: cached.amount,
        idempotent: true
      });
    }

    // ── PROVIDER ROUTING ────────────────────────────────────────
    const venueConfig = await resolveVenueConfig(base44, venue_id);
    const providerCode = venueConfig.primary_provider_code || 'external_terminal';

    // Non-Stripe providers don't confirm via Stripe — they use createPaymentRecord
    if (providerCode !== 'stripe') {
      return Response.json({
        success: false,
        error: 'USE_CREATE_PAYMENT_RECORD',
        message: `Venue uses ${providerCode}. Call createPaymentRecord directly with provider_code='${providerCode}', processor_reference, approval_code, and amount.`,
        provider_code: providerCode
      }, { status: 400 });
    }

    // ── Stripe Adapter (lazy) ──
    const providerConfig = await resolveProviderConfig(base44, 'stripe');
    const stripeKey = await resolveStripeSecretKey(base44, providerConfig);

    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe integration is not configured. Keep using the venue existing processor and capture its terminal reference through createPaymentRecord, or explicitly configure Stripe integration.',
        provider_code: providerCode
      }, { status: 503 });
    }

    const connectedAccountId = venueConfig.stripe_connected_account_id || null;

    let paymentIntent;
    try {
      const headers = { 'Authorization': `Bearer ${stripeKey}` };
      if (connectedAccountId) headers['Stripe-Account'] = connectedAccountId;
      const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(payment_intent_id)}`, { headers });
      paymentIntent = await stripeResponse.json();
      if (!stripeResponse.ok) throw new Error(paymentIntent?.error?.message || 'Stripe payment lookup failed');
    } catch (stripeError) {
      return Response.json({
        success: false,
        error: 'PAYMENT_NOT_FOUND',
        message: 'Invalid payment intent ID'
      }, { status: 404 });
    }

    if (paymentIntent.status !== 'succeeded') {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'GLYPHBUCKS_PAYMENT_FAILED',
        entity_type: 'PaymentIntent',
        entity_id: payment_intent_id,
        actor_id: user.email,
        actor_role: user.role,
        venue_id,
        severity: 'WARNING',
        description: `Payment confirmation failed: status=${paymentIntent.status}, order=${order_number}`,
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: false,
        payment_status: paymentIntent.status,
        error: `Payment ${paymentIntent.status}. Cannot complete order.`
      }, { status: 400 });
    }

    // ── DELEGATE TO createPaymentRecord ─────────────────────────
    // This creates the provider-agnostic PaymentRecord + GlyphBucksOrder
    // that createGlyphBucksSale will verify against.
    const createResult = await base44.functions.invoke('createPaymentRecord', {
      provider_code: 'stripe',
      processor_reference: payment_intent_id,
      payment_method: 'Credit Card',
      order_number,
      denominations: denomination ? [{ denomination, quantity: quantity || 1 }] : undefined,
      metadata: { order_number }
    });

    if (!createResult?.data?.success) {
      return Response.json({
        success: false,
        error: 'PAYMENT_RECORD_CREATION_FAILED',
        message: createResult?.data?.message || 'Failed to create payment record',
        payment_intent_id
      }, { status: 400 });
    }

    const rd = createResult.data;
    const approval_code = rd.approval_code || paymentIntent.id.slice(-4).toUpperCase();

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'GLYPHBUCKS_PAYMENT_CONFIRMED',
      entity_type: 'PaymentIntent',
      entity_id: payment_intent_id,
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      severity: 'INFO',
      description: `Payment confirmed for order ${order_number}: $${(paymentIntent.amount / 100).toFixed(2)}`,
      timestamp: new Date().toISOString(),
      metadata: {
        approval_code,
        card_last_four: rd.card_last_four || null,
        amount: rd.amount,
        stripe_connected_account_id: connectedAccountId
      }
    });

    return Response.json({
      success: true,
      payment_status: paymentIntent.status,
      approval_code,
      processor_reference: payment_intent_id,
      card_last_four: rd.card_last_four,
      amount_charged: rd.amount,
      payment_record_id: rd.record_id,
      stripe_connected_account_id: connectedAccountId
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Payment confirmation error:`, error);

    return Response.json({
      success: false,
      error: 'Payment confirmation failed',
      error_id: errorId
    }, { status: 500 });
  }
});