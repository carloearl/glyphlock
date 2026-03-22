import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

const paymentAttempts = new Map();
const MAX_PAYMENT_ATTEMPTS_PER_HOUR = 10;
const LOCKOUT_DURATION_MS = 3600000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

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

    const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
    if (!sessionVenue.data.success) {
      return Response.json({ 
        error: sessionVenue.data.error || 'Venue access denied' 
      }, { status: 403 });
    }
    const venue_id = sessionVenue.data.venue_id;

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

    const existingPayment = await base44.asServiceRole.entities.AuditEvent.filter({
      entity_type: 'PaymentIntent',
      description: { $regex: order_number }
    }, null, 1);

    if (existingPayment.length > 0) {
      return Response.json({
        error: 'DUPLICATE_ORDER',
        message: 'This order number has already been processed',
        existing_event_id: existingPayment[0].event_id
      }, { status: 409 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: description || `Dream Palace Order ${order_number}`,
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

    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      entity_type: 'PaymentIntent',
      entity_id: paymentIntent.id,
      action: 'CREATE',
      after_state: JSON.stringify({
        amount,
        order_number,
        status: paymentIntent.status,
        payment_intent_id: paymentIntent.id
      }),
      severity: 'INFO',
      description: `Payment intent created for order ${order_number}: $${amount}`
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