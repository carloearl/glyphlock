/**
 * Stripe Webhook Handler - SECURED
 * DACO FIX: CRIT-001 - Implemented signature verification
 * Handles Stripe webhook events for payment status updates with signature verification
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!STRIPE_WEBHOOK_SECRET) {
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // CRITICAL: Verify Stripe signature before processing
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const eventType = event.type;
    const paymentIntent = event.data?.object;

    console.log(`Processing Stripe webhook: ${eventType}`);

    // Handle different event types using Base44 SDK
    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(paymentIntent, base44);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(paymentIntent, base44);
        break;

      case 'charge.succeeded':
        await handleChargeSuccess(event.data.object, base44);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object, base44);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Processing failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handlePaymentSuccess(paymentIntent, base44) {
  const consultationId = paymentIntent.metadata?.consultation_id;
  
  if (!consultationId) {
    console.error('No consultation_id in payment intent metadata');
    return;
  }

  const consultations = await base44.asServiceRole.entities.Consultation.filter({ id: consultationId });
  
  if (consultations.length === 0) {
    console.error(`Consultation not found: ${consultationId}`);
    return;
  }

  await base44.asServiceRole.entities.Consultation.update(consultationId, {
    payment_status: 'paid',
    status: 'confirmed',
    amount_paid: paymentIntent.amount,
    payment_date: new Date().toISOString()
  });

  console.log(`Payment succeeded for consultation: ${consultationId}`);
}

async function handlePaymentFailure(paymentIntent, base44) {
  const consultationId = paymentIntent.metadata?.consultation_id;
  
  if (!consultationId) return;

  await base44.asServiceRole.entities.Consultation.update(consultationId, {
    payment_status: 'failed'
  });

  console.log(`Payment failed for consultation: ${consultationId}`);
}

async function handleChargeSuccess(charge, base44) {
  const paymentIntentId = charge.payment_intent;
  
  if (!paymentIntentId) return;

  const consultations = await entities.Consultation.filter({ 
    stripe_payment_intent_id: paymentIntentId 
  });

  if (consultations.length > 0) {
    await entities.Consultation.update(consultations[0].id, {
      stripe_charge_id: charge.id
    });
    console.log(`Charge ID stored for payment intent: ${paymentIntentId}`);
  }
}

async function handleRefund(charge, base44) {
  const consultations = await base44.asServiceRole.entities.Consultation.filter({ 
    stripe_charge_id: charge.id 
  });

  if (consultations.length > 0) {
    const refundAmount = charge.amount_refunded;
    
    await entities.Consultation.update(consultations[0].id, {
      payment_status: 'refunded',
      refund_amount: refundAmount,
      refund_date: new Date().toISOString()
    });

    console.log(`Refund processed for consultation: ${consultations[0].id}`);
  }
}