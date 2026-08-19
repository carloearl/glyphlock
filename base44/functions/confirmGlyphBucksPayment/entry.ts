import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

// W3-008B — Optional Native Payment Integration
// Confirms a Stripe-hosted Checkout Session (preferred) or a legacy
// PaymentIntent, then delegates to createPaymentRecord so every provider uses
// the same NUPS evidence and reconciliation layer.

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];

async function resolveVenueConfig(base44, venueId) {
  const configs = await base44.asServiceRole.entities.VenuePaymentConfig.filter(
    { venue_id: venueId, active: true }, null, 1,
  );
  if (configs && configs.length > 0) return configs[0];
  return { primary_provider_code: 'external_terminal' };
}

async function resolveProviderConfig(base44, providerCode) {
  const providers = await base44.asServiceRole.entities.PaymentProvider.filter(
    { provider_code: providerCode, active: true }, null, 1,
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

async function audit(db, eventType, resourceId, description, severity, actorEmail, metadata = {}) {
  try {
    await db.SystemAuditLog.create({
      event_type: eventType,
      description,
      actor_email: actorEmail,
      resource_id: resourceId,
      metadata,
      status: severity === 'high' || severity === 'critical' ? 'alert' : 'success',
      severity,
    });
  } catch (error) {
    console.error('[confirmGlyphBucksPayment] Audit write failed:', error?.message || error);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json(
        { error: 'Forbidden: Staff access required to confirm payments' },
        { status: 403 },
      );
    }

    let venueId;
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      if (!sessionVenue?.data?.success) {
        return Response.json(
          { error: sessionVenue?.data?.error || 'Venue access denied' },
          { status: 403 },
        );
      }
      venueId = sessionVenue.data.venue_id;
    } catch {
      return Response.json({ error: 'Venue access denied' }, { status: 403 });
    }

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      checkout_session_id: checkoutSessionId,
      payment_intent_id: legacyPaymentIntentId,
      order_number: requestedOrderNumber,
      denomination,
      quantity,
    } = payload || {};

    if (checkoutSessionId && !/^cs_(test|live)_[A-Za-z0-9]+$/.test(checkoutSessionId)) {
      return Response.json({ error: 'Invalid Checkout Session ID' }, { status: 400 });
    }
    if (legacyPaymentIntentId && !/^pi_[A-Za-z0-9]+$/.test(legacyPaymentIntentId)) {
      return Response.json({ error: 'Invalid PaymentIntent ID' }, { status: 400 });
    }
    if (!checkoutSessionId && !legacyPaymentIntentId) {
      return Response.json(
        { error: 'checkout_session_id or payment_intent_id is required' },
        { status: 400 },
      );
    }

    const venueConfig = await resolveVenueConfig(base44, venueId);
    const providerCode = venueConfig.primary_provider_code || 'external_terminal';
    if (providerCode !== 'stripe') {
      return Response.json({
        success: false,
        error: 'USE_CREATE_PAYMENT_RECORD',
        message: `Venue uses ${providerCode}. Record the terminal or external payment through createPaymentRecord.`,
        provider_code: providerCode,
      }, { status: 400 });
    }

    const providerConfig = await resolveProviderConfig(base44, 'stripe');
    const stripeKey = await resolveStripeSecretKey(base44, providerConfig);
    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe integration is not configured.',
        provider_code: providerCode,
      }, { status: 503 });
    }

    const connectedAccountId = venueConfig.stripe_connected_account_id || null;
    const requestOptions = connectedAccountId ? { stripeAccount: connectedAccountId } : {};
    const stripe = new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' });

    let checkoutSession = null;
    let paymentIntent = null;
    let orderNumber = requestedOrderNumber || null;

    if (checkoutSessionId) {
      try {
        checkoutSession = await stripe.checkout.sessions.retrieve(
          checkoutSessionId,
          { expand: ['payment_intent'] },
          requestOptions,
        );
      } catch {
        return Response.json({ error: 'Checkout Session not found' }, { status: 404 });
      }

      const sessionOrderNumber = checkoutSession.metadata?.order_number || null;
      const ownsSession = checkoutSession.client_reference_id === user.id;
      const matchesVenue = checkoutSession.metadata?.venue_id === venueId;
      const matchesOrder = !requestedOrderNumber || requestedOrderNumber === sessionOrderNumber;
      const correctPurpose = checkoutSession.metadata?.order_type === 'glyphbucks_sale';

      if (!ownsSession || !matchesVenue || !matchesOrder || !correctPurpose) {
        await audit(
          base44.asServiceRole.entities,
          'STRIPE_CHECKOUT_OWNERSHIP_REJECTED',
          checkoutSessionId,
          'Stripe Checkout Session ownership or scope validation failed',
          'high',
          user.email,
          { venue_id: venueId, requested_order_number: requestedOrderNumber || null },
        );
        return Response.json({ error: 'Checkout Session not found' }, { status: 404 });
      }

      orderNumber = sessionOrderNumber;
      if (checkoutSession.mode !== 'payment') {
        return Response.json({ error: 'Checkout Session is not a one-time payment' }, { status: 409 });
      }
      if (checkoutSession.status !== 'complete' || checkoutSession.payment_status !== 'paid') {
        return Response.json({
          success: false,
          error: 'PAYMENT_NOT_COMPLETE',
          payment_status: checkoutSession.payment_status,
          checkout_status: checkoutSession.status,
        }, { status: 409 });
      }

      paymentIntent = typeof checkoutSession.payment_intent === 'object'
        ? checkoutSession.payment_intent
        : await stripe.paymentIntents.retrieve(
            String(checkoutSession.payment_intent),
            {},
            requestOptions,
          );
    } else {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(
          legacyPaymentIntentId,
          {},
          requestOptions,
        );
      } catch {
        return Response.json({ error: 'PaymentIntent not found' }, { status: 404 });
      }

      orderNumber = orderNumber || paymentIntent.metadata?.order_number || null;
      if (
        paymentIntent.metadata?.venue_id && paymentIntent.metadata.venue_id !== venueId
      ) {
        return Response.json({ error: 'PaymentIntent not found' }, { status: 404 });
      }
    }

    if (!paymentIntent?.id) {
      return Response.json({ error: 'PaymentIntent not found' }, { status: 404 });
    }

    const existingConfirm = await base44.asServiceRole.entities.SystemAuditLog.filter({
      event_type: 'GLYPHBUCKS_PAYMENT_CONFIRMED',
      resource_id: paymentIntent.id,
    }, null, 1);

    if (existingConfirm.length > 0) {
      const cached = existingConfirm[0].metadata || {};
      return Response.json({
        success: true,
        payment_status: 'succeeded',
        approval_code: cached.approval_code || paymentIntent.id.slice(-4).toUpperCase(),
        processor_reference: paymentIntent.id,
        card_last_four: cached.card_last_four || null,
        amount_charged: cached.amount,
        payment_record_id: cached.payment_record_id || null,
        checkout_session_id: checkoutSession?.id || null,
        idempotent: true,
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      await audit(
        base44.asServiceRole.entities,
        'GLYPHBUCKS_PAYMENT_FAILED',
        paymentIntent.id,
        `Stripe payment was not complete for order ${orderNumber || 'unknown'}`,
        'high',
        user.email,
        { payment_status: paymentIntent.status, order_number: orderNumber },
      );
      return Response.json({
        success: false,
        payment_status: paymentIntent.status,
        error: `Payment ${paymentIntent.status}. Cannot complete order.`,
      }, { status: 409 });
    }

    const createResult = await base44.functions.invoke('createPaymentRecord', {
      provider_code: 'stripe',
      processor_reference: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      payment_method: 'Credit Card',
      order_number: orderNumber,
      denominations: denomination ? [{ denomination, quantity: quantity || 1 }] : undefined,
      metadata: {
        order_number: orderNumber,
        checkout_session_id: checkoutSession?.id || null,
      },
      create_linked_order: false,
    });

    if (!createResult?.data?.success) {
      return Response.json({
        success: false,
        error: 'PAYMENT_RECORD_CREATION_FAILED',
        message: createResult?.data?.message || 'Failed to create payment record',
        payment_intent_id: paymentIntent.id,
      }, { status: 409 });
    }

    const record = createResult.data;
    const approvalCode = record.approval_code || paymentIntent.id.slice(-4).toUpperCase();

    await audit(
      base44.asServiceRole.entities,
      'GLYPHBUCKS_PAYMENT_CONFIRMED',
      paymentIntent.id,
      `Stripe payment confirmed for order ${orderNumber || 'unknown'}`,
      'low',
      user.email,
      {
        approval_code: approvalCode,
        card_last_four: record.card_last_four || null,
        amount: record.amount,
        payment_record_id: record.record_id,
        checkout_session_id: checkoutSession?.id || null,
        stripe_connected_account_id: connectedAccountId,
      },
    );

    return Response.json({
      success: true,
      payment_status: paymentIntent.status,
      approval_code: approvalCode,
      processor_reference: paymentIntent.id,
      card_last_four: record.card_last_four || null,
      amount_charged: record.amount,
      payment_record_id: record.record_id,
      checkout_session_id: checkoutSession?.id || null,
      stripe_connected_account_id: connectedAccountId,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Payment confirmation error:`, error);
    return Response.json({
      success: false,
      error: 'Payment confirmation failed',
      error_id: errorId,
    }, { status: 500 });
  }
});
