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
    console.warn('[getSubscriptionDetails] Stripe connector unavailable:', error?.message || 'not connected');
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_customer_id || !user.subscription_id) {
      return Response.json({
        hasSubscription: false,
        subscription: null,
        invoices: [],
      });
    }

    const stripeSecretKey = await resolveStripeSecretKey(base44);
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-06-24.dahlia' });
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id, {
      expand: ['default_payment_method', 'items.data.price.product'],
    });

    if (String(subscription.customer || '') !== String(user.stripe_customer_id)) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 12,
    });

    return Response.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at,
        canceled_at: subscription.canceled_at,
        plan_name: user.subscription_plan || 'Unknown',
        amount: subscription.items.data[0]?.price?.unit_amount || 0,
        currency: subscription.items.data[0]?.price?.currency || 'usd',
        interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
        payment_method: subscription.default_payment_method,
      },
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      })),
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Subscription lookup failed:`, error);
    return Response.json(
      { error: 'Unable to retrieve subscription', error_id: errorId },
      { status: 500 },
    );
  }
});
