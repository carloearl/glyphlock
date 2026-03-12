import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

/**
 * Process Dream Dollar Payment
 * Creates Stripe Payment Intent for Dream Dollar purchase
 * 
 * Expected payload:
 * {
 *   amount: number (total charge in dollars),
 *   order_number: string,
 *   customer_name: string,
 *   customer_email?: string,
 *   description: string
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   client_secret: string,
 *   payment_intent_id: string,
 *   amount: number
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
    const {
      amount,
      order_number,
      customer_name,
      customer_email,
      description
    } = payload;

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!order_number) {
      return Response.json({ error: 'Missing order_number' }, { status: 400 });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: description || `Dream Palace Order ${order_number}`,
      metadata: {
        order_number,
        customer_name,
        processed_by: user.email,
        venue_id: 'dream-palace-tempe',
        order_type: 'dream_dollar_sale'
      },
      receipt_email: customer_email || user.email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Log payment intent creation
    await base44.asServiceRole.entities.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: user.role,
      venue_id: 'dream-palace-tempe',
      entity_type: 'PaymentIntent',
      entity_id: paymentIntent.id,
      action: 'CREATE',
      after_state: JSON.stringify({
        amount,
        order_number,
        status: paymentIntent.status
      }),
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
    console.error('Payment processing error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});