import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// W3-008B — Payment Provider Abstraction Layer
// This function creates a payment intent for the Stripe adapter ONLY.
// Non-Stripe providers (cash, manual_external, clover, etc.) do NOT call
// this function — they go directly to createPaymentRecord.
//
// Stripe is lazily imported. The secret name is resolved dynamically from
// the PaymentProvider entity — no literal STRIPE_SECRET_KEY in source.

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];
const paymentAttempts = new Map();
const MAX_PAYMENT_ATTEMPTS_PER_HOUR = 10;
const LOCKOUT_DURATION_MS = 3600000;

async function resolveVenueConfig(base44, venue_id) {
  const configs = await base44.asServiceRole.entities.VenuePaymentConfig.filter(
    { venue_id, active: true }, null, 1
  );
  if (configs && configs.length > 0) return configs[0];
  return {
    primary_provider_code: 'stripe',
    fallback_provider_code: 'manual_external',
    external_approval_required: false,
    manager_pin_required_for_external: true
  };
}

async function resolveProviderConfig(base44, providerCode) {
  const providers = await base44.asServiceRole.entities.PaymentProvider.filter(
    { provider_code: providerCode, active: true }, null, 1
  );
  return providers?.[0] || null;
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
        error: 'Forbidden: Staff access required to process payments'
      }, { status: 403 });
    }

    // Rate limiting
    const now = Date.now();
    const attemptKey = user.email;
    const attempts = paymentAttempts.get(attemptKey);

    if (attempts) {
      if (now < attempts.resetAt) {
        if (attempts.count >= MAX_PAYMENT_ATTEMPTS_PER_HOUR) {
          return Response.json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many payment attempts. Please wait.',
            retry_after_seconds: Math.ceil((attempts.resetAt - now) / 1000)
          }, { status: 429 });
        }
        attempts.count++;
      } else {
        paymentAttempts.set(attemptKey, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
      }
    } else {
      paymentAttempts.set(attemptKey, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    }

    // Venue resolution
    let venue_id;
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      if (!sessionVenue.data?.success) {
        return Response.json({
          error: sessionVenue.data?.error || 'Venue access denied'
        }, { status: 403 });
      }
      venue_id = sessionVenue.data.venue_id;
    } catch (venueErr) {
      const status = venueErr?.response?.status === 403 ? 403 : 503;
      return Response.json({
        error: status === 403 ? 'Venue access denied' : 'Venue session service unavailable',
        detail: venueErr?.message
      }, { status });
    }

    const payload = await req.json();
    const { amount, order_number, customer_name, customer_email, description } = payload;

    if (!amount || amount <= 0 || amount > 50000) {
      return Response.json({
        error: 'Invalid amount',
        message: 'Amount must be between $0.01 and $50,000'
      }, { status: 400 });
    }
    if (!order_number || typeof order_number !== 'string') {
      return Response.json({ error: 'Missing or invalid order_number' }, { status: 400 });
    }

    // Duplicate check
    const existingPayment = await base44.asServiceRole.entities.SystemAuditLog.filter({
      entity_type: 'PaymentIntent',
      event_type: 'GLYPHBUCKS_PAYMENT_INTENT_CREATED'
    }, null, 100);

    const isDuplicate = existingPayment.some(e => e.description && e.description.includes(order_number));
    if (isDuplicate) {
      return Response.json({
        error: 'DUPLICATE_ORDER',
        message: 'This order number has already been processed'
      }, { status: 409 });
    }

    // ── PROVIDER ROUTING ────────────────────────────────────────
    const venueConfig = await resolveVenueConfig(base44, venue_id);
    const providerCode = venueConfig.primary_provider_code || 'stripe';

    // Non-Stripe providers don't create payment intents — they go to createPaymentRecord
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
    const secretName = providerConfig?.secret_name || 'STRIPE_SECRET_KEY';
    const stripeKey = Deno.env.get(secretName);

    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe is not configured for this venue. Use a manual_external or cash provider via createPaymentRecord instead.',
        provider_code: providerCode
      }, { status: 503 });
    }

    const { default: Stripe } = await import('npm:stripe@14.14.0');
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: description || `GlyphBucks Order ${order_number}`,
      metadata: {
        order_number,
        customer_name,
        processed_by: user.email,
        venue_id,
        order_type: 'glyphbucks_sale'
      },
      receipt_email: customer_email || user.email,
      automatic_payment_methods: { enabled: true }
    });

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'GLYPHBUCKS_PAYMENT_INTENT_CREATED',
      entity_type: 'PaymentIntent',
      entity_id: paymentIntent.id,
      actor_id: user.email,
      venue_id,
      severity: 'low',
      description: `Payment intent created for order ${order_number}: $${amount}`,
      metadata: {
        amount,
        order_number,
        status: paymentIntent.status,
        payment_intent_id: paymentIntent.id
      },
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amount,
      status: paymentIntent.status
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Payment processing error:`, error);

    return Response.json({
      success: false,
      error: 'Payment processing failed',
      error_id: errorId
    }, { status: 500 });
  }
});