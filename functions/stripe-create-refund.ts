/**
 * Create Stripe Refund - SECURED
 * DACO FIX: CRIT-002 - Migrated to Deno.serve with explicit auth + admin gating
 * Issues a full or partial refund for a consultation payment
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ADMIN-ONLY: Only admin users can issue refunds
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { consultationId, amount, reason = 'requested_by_customer' } = await req.json();

    if (!consultationId) {
      return Response.json({ error: 'consultationId is required' }, { status: 400 });
    }

    // Get consultation
    const consultations = await base44.asServiceRole.entities.Consultation.filter({ id: consultationId });
    
    if (consultations.length === 0) {
      return Response.json({ error: 'Consultation not found' }, { status: 404 });
    }

    const consultation = consultations[0];

    if (consultation.payment_status !== 'paid') {
      return Response.json({ error: 'Consultation payment is not in paid status' }, { status: 400 });
    }

    if (!consultation.stripe_payment_intent_id) {
      return Response.json({ error: 'No Stripe payment intent ID found' }, { status: 400 });
    }

    // Create refund
    const refundParams = {
      payment_intent: consultation.stripe_payment_intent_id,
      reason: reason
    };

    if (amount) {
      refundParams.amount = parseInt(amount);
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update consultation
    await base44.asServiceRole.entities.Consultation.update(consultationId, {
      payment_status: 'refunded',
      refund_amount: refund.amount,
      refund_date: new Date().toISOString()
    });

    // Log refund to audit
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'REFUND_ISSUED',
      description: `Admin ${user.email} issued refund for consultation ${consultationId}`,
      actor_email: user.email,
      resource_id: consultationId,
      metadata: {
        refund_id: refund.id,
        amount: refund.amount,
        reason: reason
      },
      status: 'success'
    });

    return Response.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });

  } catch (error) {
    console.error('[Refund] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});