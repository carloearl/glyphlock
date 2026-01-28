import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// GLYPHLOCK: Env-based price ID mapping
const PRICE_MAPPING = {
  creator: Deno.env.get('STRIPE_PRICE_CREATOR_MONTHLY'),
  professional: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY')
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, priceId, lineItems, mode = 'subscription', successUrl, cancelUrl } = await req.json();

    // GLYPHLOCK: Enterprise requires manual approval, not direct checkout
    if (plan === 'enterprise') {
      return Response.json({ 
        error: 'Enterprise requires manual approval. Please submit a request instead.' 
      }, { status: 400 });
    }

    // GLYPHLOCK: Resolve price ID from plan name or use provided priceId
    let resolvedPriceId = priceId;
    if (plan && PRICE_MAPPING[plan]) {
      resolvedPriceId = PRICE_MAPPING[plan];
    }

    if (!resolvedPriceId && !lineItems) {
      return Response.json({ error: 'Plan, price ID, or line items are required' }, { status: 400 });
    }

    // GLYPHLOCK: Build line items - either from resolved priceId or custom lineItems
    const checkoutLineItems = lineItems || [
      {
        price: resolvedPriceId,
        quantity: 1,
      },
    ];

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: checkoutLineItems,
      mode: mode, // 'payment' for one-time, 'subscription' for recurring
      success_url: successUrl || `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        plan: plan || 'unknown' // GLYPHLOCK: Track plan type for webhook mapping
      },
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});