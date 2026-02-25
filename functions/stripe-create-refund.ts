/**
 * Create Stripe Refund
 * 
 * Issues a full or partial refund for a consultation payment
 * 
 * @param {string} consultationId - Consultation record ID
 * @param {number} amount - Optional: Amount to refund in cents (defaults to full refund)
 * @param {string} reason - Refund reason (duplicate, fraudulent, requested_by_customer)
 * @returns {object} Refund result
 */

export default async function handler({ consultationId, amount, reason = 'requested_by_customer' }, { secrets, entities }) {
  try {
    const STRIPE_SECRET_KEY = secrets.STRIPE_SECRET_KEY;
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }

    // Get consultation
    const consultations = await entities.Consultation.filter({ id: consultationId });
    
    if (consultations.length === 0) {
      throw new Error('Consultation not found');
    }

    const consultation = consultations[0];

    if (consultation.payment_status !== 'paid') {
      throw new Error('Consultation payment is not in paid status');
    }

    if (!consultation.stripe_payment_intent_id) {
      throw new Error('No Stripe payment intent ID found');
    }

    // Create refund
    const refundData = {
      payment_intent: consultation.stripe_payment_intent_id,
      reason: reason
    };

    if (amount) {
      refundData.amount = amount.toString();
    }

    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(refundData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create refund');
    }

    const refund = await response.json();

    // Update consultation
    await entities.Consultation.update(consultationId, {
      payment_status: 'refunded',
      refund_amount: refund.amount,
      refund_date: new Date().toISOString()
    });

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    };

  } catch (error) {
    console.error('Refund creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}