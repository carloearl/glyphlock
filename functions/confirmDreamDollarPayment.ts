import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

/**
 * Confirm Dream Dollar Payment
 * Verifies payment intent succeeded before allowing order completion
 * 
 * Expected payload:
 * {
 *   payment_intent_id: string,
 *   order_number: string
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   payment_status: string,
 *   approval_code: string (last 4 of payment ID),
 *   processor_reference: string
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { payment_intent_id, order_number } = payload;

    if (!payment_intent_id) {
      return Response.json({ error: 'Missing payment_intent_id' }, { status: 400 });
    }

    // Retrieve payment intent to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
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

    // Log successful payment verification
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
        approval_code
      }),
      description: `Payment confirmed for order ${order_number}`
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
    console.error('Payment confirmation error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});