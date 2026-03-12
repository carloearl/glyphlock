import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Only staff/admin can confirm payments
    if (!['admin', 'manager', 'staff'].includes(user.role)) {
      return Response.json({ 
        error: 'Forbidden: Staff access required to confirm payments' 
      }, { status: 403 });
    }

    const payload = await req.json();
    const { payment_intent_id, order_number } = payload;

    if (!payment_intent_id || typeof payment_intent_id !== 'string') {
      return Response.json({ error: 'Missing or invalid payment_intent_id' }, { status: 400 });
    }

    // FRAUD PREVENTION: Idempotency check
    const existingConfirm = await base44.asServiceRole.entities.AuditEvent.filter({
      entity_type: 'PaymentIntent',
      entity_id: payment_intent_id,
      action: 'CONFIRM'
    }, null, 1);

    if (existingConfirm.length > 0) {
      // Already confirmed — return cached result (idempotent)
      const cached = JSON.parse(existingConfirm[0].after_state);
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

    // Retrieve payment intent to verify status
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    } catch (stripeError) {
      return Response.json({
        success: false,
        error: 'PAYMENT_NOT_FOUND',
        message: 'Invalid payment intent ID'
      }, { status: 404 });
    }

    if (paymentIntent.status !== 'succeeded') {
      // Log failed confirmation attempt
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id: 'dream-palace-tempe',
        entity_type: 'PaymentIntent',
        entity_id: payment_intent_id,
        action: 'ACCESS',
        severity: 'WARNING',
        description: `Payment confirmation failed: status=${paymentIntent.status}, order=${order_number}`
      });

      return Response.json({
        success: false,
        payment_status: paymentIntent.status,
        error: `Payment ${paymentIntent.status}. Cannot complete order.`
      }, { status: 400 });
    }

    // Extract approval code (last 4 of payment intent ID)
    const approval_code = paymentIntent.id.slice(-4).toUpperCase();
    const processor_reference = paymentIntent.id;

    // Get charge details
    const charge = paymentIntent.latest_charge 
      ? await stripe.charges.retrieve(paymentIntent.latest_charge)
      : null;

    const card_last_four = charge?.payment_method_details?.card?.last4 || null;

    // Log successful payment verification (IMMUTABLE)
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id: 'dream-palace-tempe',
      entity_type: 'PaymentIntent',
      entity_id: payment_intent_id,
      action: 'CONFIRM',
      after_state: JSON.stringify({
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        approval_code,
        card_last_four
      }),
      severity: 'INFO',
      description: `Payment confirmed for order ${order_number}: $${(paymentIntent.amount / 100).toFixed(2)}`
    });

    return Response.json({
      success: true,
      payment_status: paymentIntent.status,
      approval_code,
      processor_reference,
      card_last_four,
      amount_charged: paymentIntent.amount / 100
    });

  } catch (error) {
    // SECURITY: Log error without exposing internals
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Payment confirmation error:`, error);
    
    return Response.json({ 
      success: false,
      error: 'Payment confirmation failed',
      error_id: errorId
    }, { status: 500 });
  }
});