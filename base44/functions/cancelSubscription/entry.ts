import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@22.5.0';

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
    console.warn('[cancelSubscription] Stripe connector unavailable:', error?.message || 'not connected');
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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.subscription_id || !user.stripe_customer_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const immediate = body?.immediate === true;
    const stripeSecretKey = await resolveStripeSecretKey(base44);
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' });
    const existing = await stripe.subscriptions.retrieve(user.subscription_id);
    if (String(existing.customer || '') !== String(user.stripe_customer_id)) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const subscription = immediate
      ? await stripe.subscriptions.cancel(user.subscription_id)
      : await stripe.subscriptions.update(user.subscription_id, {
          cancel_at_period_end: true,
        });

    await base44.asServiceRole.entities.User.update(user.id, {
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      subscription_status: subscription.status,
      subscription_end_date: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
      },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Subscription cancellation failed:`, error);
    return Response.json(
      { error: 'Unable to cancel subscription', error_id: errorId },
      { status: 500 },
    );
  }
});
