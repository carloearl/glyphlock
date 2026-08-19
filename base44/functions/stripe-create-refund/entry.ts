import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@22.5.0';

const ALLOWED_REASONS = new Set(['duplicate', 'fraudulent', 'requested_by_customer']);

async function resolveStripeSecretKey(base44) {
  const configured = Deno.env.get('STRIPE_SECRET_KEY');
  if (configured) return configured;

  try {
    const connection = await base44.asServiceRole.connectors.getConnection('stripe');
    const token = connection?.accessToken;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/**
 * Admin-only full or partial Stripe refund for a Consultation payment.
 * The operation is idempotent, supports Connect direct charges, and records
 * the accepted refund without pretending a browser response is final truth.
 */

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (String(user.role || '').toLowerCase() !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const consultationId = body?.consultationId;
    const amount = body?.amount == null ? null : Number(body.amount);
    const reason = ALLOWED_REASONS.has(body?.reason) ? body.reason : 'requested_by_customer';

    if (typeof consultationId !== 'string' || !consultationId.trim()) {
      return Response.json({ error: 'consultationId is required' }, { status: 400 });
    }
    if (amount != null && (!Number.isInteger(amount) || amount <= 0)) {
      return Response.json({ error: 'Refund amount must be a positive integer in cents' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    let consultations = await db.Consultation.filter({ id: consultationId }, null, 1);
    if (!consultations.length) {
      consultations = await db.Consultation.filter({ consultation_id: consultationId }, null, 1);
    }
    const consultation = consultations[0];

    if (!consultation) {
      return Response.json({ error: 'Consultation not found' }, { status: 404 });
    }
    if (!consultation.stripe_payment_intent_id) {
      return Response.json({ error: 'Consultation has no Stripe PaymentIntent' }, { status: 409 });
    }
    if (!['paid', 'refund_pending'].includes(consultation.payment_status)) {
      return Response.json({ error: 'Consultation payment is not refundable in its current state' }, { status: 409 });
    }
    if (consultation.payment_status === 'refunded') {
      return Response.json({
        success: true,
        idempotent: true,
        refundId: consultation.refund_id || null,
        amount: consultation.refund_amount || null,
        status: consultation.refund_status || 'succeeded',
      });
    }

    const stripeSecretKey = await resolveStripeSecretKey(base44);
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' });
    const params = {
      payment_intent: consultation.stripe_payment_intent_id,
      reason,
      metadata: {
        consultation_id: consultation.consultation_id || consultation.id,
        requested_by: user.email,
      },
    };
    if (amount != null) params.amount = amount;

    const requestOptions = {
      idempotencyKey: `consultation-refund-${consultation.id}-${amount || 'full'}`,
    };
    if (consultation.stripe_connected_account_id) {
      requestOptions.stripeAccount = consultation.stripe_connected_account_id;
    }

    const refund = await stripe.refunds.create(params, requestOptions);
    const paymentStatus = refund.status === 'succeeded' ? 'refunded' : 'refund_pending';

    await db.Consultation.update(consultation.id, {
      payment_status: paymentStatus,
      refund_id: refund.id,
      refund_status: refund.status,
      refund_amount: refund.amount,
      refund_date: new Date().toISOString(),
    });

    await db.SystemAuditLog.create({
      event_type: 'STRIPE_REFUND_REQUESTED',
      description: `Stripe refund accepted for consultation ${consultation.consultation_id || consultation.id}`,
      actor_email: user.email,
      resource_id: refund.id,
      metadata: {
        consultation_id: consultation.consultation_id || consultation.id,
        payment_intent_id: consultation.stripe_payment_intent_id,
        amount: refund.amount,
        status: refund.status,
        connected_account_id: consultation.stripe_connected_account_id || null,
      },
      status: 'success',
      severity: 'medium',
    });

    return Response.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Stripe refund failed:`, error);
    return Response.json(
      { error: 'Refund request failed', error_id: errorId },
      { status: 500 },
    );
  }
});