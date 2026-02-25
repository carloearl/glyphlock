/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for payment status updates
 * 
 * @param {object} event - Stripe webhook event
 * @param {string} signature - Stripe signature header
 * @returns {object} Processing result
 */

export default async function handler({ event, signature }, { secrets, entities }) {
  try {
    const STRIPE_WEBHOOK_SECRET = secrets.STRIPE_WEBHOOK_SECRET;
    
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook secret not configured');
    }

    // In production, verify the webhook signature
    // For now, we'll process the event directly
    
    const eventType = event.type;
    const paymentIntent = event.data?.object;

    console.log(`Processing Stripe webhook: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(paymentIntent, entities);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(paymentIntent, entities);
        break;

      case 'charge.succeeded':
        await handleChargeSuccess(event.data.object, entities);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object, entities);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return {
      success: true,
      received: true
    };

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handlePaymentSuccess(paymentIntent, entities) {
  const consultationId = paymentIntent.metadata?.consultation_id;
  
  if (!consultationId) {
    console.error('No consultation_id in payment intent metadata');
    return;
  }

  const consultations = await entities.Consultation.filter({ id: consultationId });
  
  if (consultations.length === 0) {
    console.error(`Consultation not found: ${consultationId}`);
    return;
  }

  await entities.Consultation.update(consultationId, {
    payment_status: 'paid',
    status: 'confirmed',
    amount_paid: paymentIntent.amount,
    payment_date: new Date().toISOString()
  });

  console.log(`Payment succeeded for consultation: ${consultationId}`);
}

async function handlePaymentFailure(paymentIntent, entities) {
  const consultationId = paymentIntent.metadata?.consultation_id;
  
  if (!consultationId) return;

  await entities.Consultation.update(consultationId, {
    payment_status: 'failed'
  });

  console.log(`Payment failed for consultation: ${consultationId}`);
}

async function handleChargeSuccess(charge, entities) {
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

async function handleRefund(charge, entities) {
  const consultations = await entities.Consultation.filter({ 
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