import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

/**
 * Create a Stripe-hosted subscription checkout using server-owned pricing.
 *
 * The browser selects only a stable plan key. Price IDs, line items, mode,
 * entitlement metadata, and return destinations are controlled server-side so
 * a caller cannot buy an arbitrary Price and label it "professional".
 */

const PLAN_PRICE_SECRETS = {
  creator: 'STRIPE_PRICE_CREATOR_MONTHLY',
  professional: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
};

// Stripe Price IDs are public catalog identifiers, not credentials. These
// trusted sandbox defaults belong to GlyphLock's connected Stripe sandbox and
// remove two unnecessary secret-entry steps during testing. A live Stripe key
// can NEVER use these values; live checkout still requires explicit live Price
// IDs in Base44's server-side environment.
const SANDBOX_PLAN_PRICES = {
  creator: 'price_1U5wo5AOlRvharGOaHq8bkWs',
  professional: 'price_1U5wpWAOlRvharGOW3oA5U6B',
};

function stripeKeyMode(secretKey) {
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) return 'live';
  return 'unknown';
}

function resolvePlanPrice(plan, stripeSecretKey) {
  const configured = Deno.env.get(PLAN_PRICE_SECRETS[plan]);
  if (configured) return configured;

  // Fail closed for live or unrecognized credentials. This prevents a live
  // account from accidentally receiving a sandbox Price ID.
  return stripeKeyMode(stripeSecretKey) === 'test' ? SANDBOX_PLAN_PRICES[plan] : null;
}

function getAllowedOrigin(req) {
  const candidates = [Deno.env.get('APP_BASE_URL'), req.headers.get('origin')].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      const host = url.hostname.toLowerCase();
      const allowed =
        url.protocol === 'https:' &&
        (host === 'glyphlock.io' ||
          host.endsWith('.glyphlock.io') ||
          host.endsWith('.base44.app'));

      if (allowed) return url.origin;
    } catch {
      // Ignore malformed candidates and continue to the safe production default.
    }
  }

  return 'https://glyphlock.io';
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

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const plan = typeof body?.plan === 'string' ? body.plan.toLowerCase() : '';

    if (plan === 'enterprise') {
      return Response.json(
        { error: 'Enterprise access requires an approved engagement' },
        { status: 400 },
      );
    }

    if (!Object.hasOwn(PLAN_PRICE_SECRETS, plan)) {
      return Response.json({ error: 'Unsupported subscription plan' }, { status: 400 });
    }

    // Reject legacy client-controlled pricing inputs explicitly. Silently
    // ignoring them would conceal an integration bug and invite future drift.
    if (body?.priceId || body?.lineItems || (body?.mode && body.mode !== 'subscription')) {
      return Response.json(
        { error: 'Client-controlled prices, line items, and checkout modes are not accepted' },
        { status: 400 },
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const priceId = stripeSecretKey ? resolvePlanPrice(plan, stripeSecretKey) : null;

    if (!stripeSecretKey || !priceId) {
      return Response.json(
        { error: 'Stripe subscription checkout is not configured' },
        { status: 503 },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const appOrigin = getAllowedOrigin(req);
    const successUrl = `${appOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appOrigin}/payment-cancel`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          plan,
          expectedPriceId: priceId,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            userEmail: user.email,
            plan,
            expectedPriceId: priceId,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      },
      {
        idempotencyKey: `glyphlock-subscription-${user.id}-${plan}-${Math.floor(Date.now() / 300000)}`,
      },
    );

    return Response.json({
      success: true,
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      plan,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Stripe checkout error:`, error);
    return Response.json(
      { error: 'Unable to create checkout session', error_id: errorId },
      { status: 500 },
    );
  }
});