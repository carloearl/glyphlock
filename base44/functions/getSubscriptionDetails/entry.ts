import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

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
        invoices: []
      });
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id, {
      expand: ['default_payment_method', 'items.data.price.product']
    });

    // Get billing history (last 12 invoices)
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 12
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
        plan_name: user.plan_name || 'Unknown',
        amount: subscription.items.data[0]?.price?.unit_amount || 0,
        currency: subscription.items.data[0]?.price?.currency || 'usd',
        interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
        payment_method: subscription.default_payment_method
      },
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        invoice_pdf: inv.invoice_pdf,
        hosted_invoice_url: inv.hosted_invoice_url
      }))
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});