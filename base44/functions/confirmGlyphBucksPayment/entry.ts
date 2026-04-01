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

    if (!['admin', 'manager', 'staff'].includes(user.role)) {
      return Response.json({ 
        error: 'Forbidden: Staff access required to confirm payments' 
      }, { status: 403 });
    }

    const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
    if (!sessionVenue.data.success) {
      return Response.json({ 
        error: sessionVenue.data.error || 'Venue access denied' 
      }, { status: 403 });
    }
    const venue_id = sessionVenue.data.venue_id;

    const payload = await req.json();
    const { payment_intent_id, order_number } = payload;

    if (!payment_intent_id || typeof payment_intent_id !== 'string') {
      return Response.json({ error: 'Missing or invalid payment_intent_id' }, { status: 400 });
    }

    const existingConfirm = await base44.asServiceRole.entities.AuditEvent.filter({
      entity_type: 'PaymentIntent',
      entity_id: payment_intent_id,
      action: 'CONFIRM'
    }, null, 1);

    if (existingConfirm.length > 0) {
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
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        venue_id,
        entity_type: 'PaymentIntent',
        entity_id: payment_intent_id,
        action: 'ACCESS',
        severity: 'WARNING',
        description: `Payment confirmation failed: status=${paymentIntent.status}, order=${order_number}`
      });

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

    const approval_code = paymentIntent.id.slice(-4).toUpperCase();
    const processor_reference = paymentIntent.id;

    const charge = paymentIntent.latest_charge 
      ? await stripe.charges.retrieve(paymentIntent.latest_charge)
      : null;

    const card_last_four = charge?.payment_method_details?.card?.last4 || null;

    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
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

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'GLYPHBUCKS_PAYMENT_CONFIRMED',
      entity_type: 'PaymentIntent',
      entity_id: payment_intent_id,
      actor_id: user.email,
      actor_role: user.role,
      venue_id,
      severity: 'INFO',
      description: `Payment confirmed for order ${order_number}: $${(paymentIntent.amount / 100).toFixed(2)}`,
      timestamp: new Date().toISOString()
    });

    await base44.asServiceRole.entities.GlyphBucksOrder.create({
      order_number:   order_number || processor_reference,
      venue_id:       venue_id,
      status:         'COMPLETE',
      card_token:     processor_reference,
      approval_code:  approval_code,
      card_last_four: card_last_four || null,
      grand_total:    paymentIntent.amount / 100,
      payment_type:   'STRIPE',
      created_by:     user.email,
      created_at:     new Date().toISOString(),
      denomination:   payload.denomination || null,
      quantity:       payload.quantity || null
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
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Payment confirmation error:`, error);
    
    return Response.json({ 
      success: false,
      error: 'Payment confirmation failed',
      error_id: errorId
    }, { status: 500 });
  }
});