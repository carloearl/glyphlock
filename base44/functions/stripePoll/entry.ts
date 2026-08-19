import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

/**
 * Retrieve and reconcile the current user's Stripe Checkout Session.
 *
 * A Session ID is never treated as authorization. The function verifies that
 * the authenticated user owns the Session and derives entitlements only from a
 * trusted server-side Stripe Price mapping. Webhooks remain the canonical async
 * path; this endpoint provides safe return-page reconciliation when a webhook
 * is delayed.
 */

const PLAN_PRICE_SECRETS = {
  creator: 'STRIPE_PRICE_CREATOR_MONTHLY',
  professional: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
};

const SANDBOX_PLAN_PRICES = {
  creator: 'price_1U5wo5AOlRvharGOaHq8bkWs',
  professional: 'price_1U5wpWAOlRvharGOW3oA5U6B',
};

function stripeKeyMode(secretKey) {
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) return 'live';
  return 'unknown';
}

function pricePlanMap(stripeSecretKey) {
  const map = {};
  const creator = Deno.env.get(PLAN_PRICE_SECRETS.creator);
  const professional = Deno.env.get(PLAN_PRICE_SECRETS.professional);
  if (creator) map[creator] = 'creator';
  if (professional) map[professional] = 'professional';

  if (stripeKeyMode(stripeSecretKey) === 'test') {
    map[SANDBOX_PLAN_PRICES.creator] = 'creator';
    map[SANDBOX_PLAN_PRICES.professional] = 'professional';
  }
  return map;
}

async function resolveStripeSecretKey(base44) {
  const configured = Deno.env.get('STRIPE_SECRET_KEY');
  if (configured) return configured;

  try {
    const connection = await base44.asServiceRole.connectors.getConnection('stripe');
    const connectorToken = connection?.accessToken;
    return typeof connectorToken === 'string' && connectorToken.length > 0
      ? connectorToken
      : null;
  } catch (error) {
    console.warn('[stripePoll] Stripe connector unavailable:', error?.message || 'not connected');
    return null;
  }
}

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

    const stripeSecretKey = await resolveStripeSecretKey(base44);
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' });
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

    const subscription = typeof session.subscription === 'object' ? session.subscription : null;
    const priceId = subscription?.items?.data?.[0]?.price?.id || null;
    const trustedPlan = priceId ? pricePlanMap(stripeSecretKey)[priceId] : null;
    const claimedPlan = session.metadata?.plan ?? null;
    const expectedPriceId = session.metadata?.expectedPriceId ?? null;
    const priceConsistent = Boolean(
      trustedPlan &&
      (!claimedPlan || claimedPlan === trustedPlan) &&
      (!expectedPriceId || expectedPriceId === priceId),
    );

    let status = 'unknown';
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

    let entitlementConfirmed = false;
    if (session.payment_status === 'paid' && subscription && priceConsistent) {
      await base44.asServiceRole.entities.User.update(user.id, {
        subscription_status: subscription.status,
        subscription_id: subscription.id,
        stripe_customer_id: String(session.customer || subscription.customer || ''),
        subscription_plan: trustedPlan,
        subscription_start_date: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        subscription_end_date: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      });
      entitlementConfirmed = true;
    } else if (session.payment_status === 'paid' && !priceConsistent) {
      console.error('[stripePoll] Paid Session rejected due to untrusted or inconsistent Price mapping', {
        session_id: session.id,
        price_id: priceId,
        claimed_plan: claimedPlan,
      });
      status = 'unrecognized_price';
    }

    return Response.json({
      status,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      amountTotal: session.amount_total,
      currency: session.currency,
      plan: priceConsistent ? trustedPlan : null,
      entitlementConfirmed,
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
