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

    const body = await req.json();
    const { immediate = false } = body;

    if (!user.subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 });
    }

    let subscription;
    
    if (immediate) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(user.subscription_id);
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(user.subscription_id, {
        cancel_at_period_end: true
      });
    }

    // Update user record
    await base44.asServiceRole.entities.User.update(user.id, {
      cancel_at_period_end: subscription.cancel_at_period_end,
      subscription_status: subscription.status
    });

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});