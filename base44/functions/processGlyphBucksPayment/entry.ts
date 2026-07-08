import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const paymentAttempts = new Map();
const MAX_PAYMENT_ATTEMPTS_PER_HOUR = 10;
const LOCKOUT_DURATION_MS = 3600000;

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in app secrets to enable card payments.'
      }, { status: 503 });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const base44 = createClientFromRequest(req);

    // W3-008: Wrap auth.me() — unauthenticated calls must return 401, not 500.
    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'manager', 'staff'].includes(user.role)) {
      return Response.json({ 
        error: 'Forbidden: Staff access required to process payments' 
      }, { status: 403 });
    }

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
    const {
      amount,
      order_number,
      customer_name,
      customer_email,
      description
    } = payload;

    if (!amount || amount <= 0 || amount > 50000) {
      return Response.json({ 
        error: 'Invalid amount',
        message: 'Amount must be between $0.01 and $50,000'
      }, { status: 400 });
    }

    if (!order_number || typeof order_number !== 'string') {
      return Response.json({ error: 'Missing or invalid order_number' }, { status: 400 });
    }

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
      automatic_payment_methods: {
        enabled: true,
      },
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