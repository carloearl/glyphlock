import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';

/**
 * Retrieve the current user's Checkout Session status.
 * A session ID is not an authorization token: ownership is verified against
 * client_reference_id or the Stripe-collected customer email before any data
 * is returned.
 */

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const sessionId = body?.sessionId;
    if (typeof sessionId !== 'string' || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
      return Response.json({ error: 'Invalid Checkout Session ID' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const sessionEmail = (
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.userEmail ||
      ''
    ).toLowerCase();
    const userEmail = String(user.email || '').toLowerCase();
    const ownsByReference = Boolean(session.client_reference_id && session.client_reference_id === user.id);
    const ownsByEmail = Boolean(sessionEmail && userEmail && sessionEmail === userEmail);

    if (!ownsByReference && !ownsByEmail) {
      console.warn(`[stripePoll] Session ownership mismatch for user ${user.id}`);
      return Response.json({ error: 'Checkout Session not found' }, { status: 404 });
    }

    let status = 'unknown';
    const subscription = typeof session.subscription === 'object' ? session.subscription : null;

    if (session.payment_status === 'paid') {
      status = subscription?.status || 'active';
    } else if (session.status === 'open') {
      status = 'pending';
    } else if (session.status === 'complete' && session.payment_status !== 'paid') {
      status = subscription?.status || 'completed_unpaid';
    } else if (session.status === 'expired') {
      status = 'expired';
    } else if (session.payment_status === 'unpaid') {
      status = 'unpaid';
    }

    return Response.json({
      status,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      amountTotal: session.amount_total,
      currency: session.currency,
      plan: session.metadata?.plan || null,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Stripe session lookup failed:`, error);
    return Response.json(
      { error: 'Unable to retrieve Checkout Session', error_id: errorId },
      { status: 500 },
    );
  }
});