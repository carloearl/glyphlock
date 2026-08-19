import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

// W3-008B — Optional Native Payment Integration
// Creates a Stripe-hosted one-time Checkout Session only when a venue
// explicitly selects Stripe. Other providers stay on the provider-agnostic
// PaymentRecord evidence path.
//
// Stripe credentials resolve from the provider-configured environment secret
// first, then Base44's managed Stripe connector. The credential never reaches
// the browser or an entity record.

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];
const paymentAttempts = new Map();
const MAX_PAYMENT_ATTEMPTS_PER_HOUR = 10;
const LOCKOUT_DURATION_MS = 3600000;

async function resolveVenueConfig(base44, venue_id) {
  const configs = await base44.asServiceRole.entities.VenuePaymentConfig.filter(
    { venue_id, active: true }, null, 1
  );
  if (configs && configs.length > 0) return configs[0];
  return {
    primary_provider_code: 'external_terminal',
    fallback_provider_code: 'manual_external',
    external_approval_required: false,
    manager_pin_required_for_external: true
  };
}

async function resolveProviderConfig(base44, providerCode) {
  const providers = await base44.asServiceRole.entities.PaymentProvider.filter(
    { provider_code: providerCode, active: true }, null, 1
  );
  return providers?.[0] || null;
}

async function resolveStripeSecretKey(base44, providerConfig) {
  const secretName = providerConfig?.secret_name || 'STRIPE_SECRET_KEY';
  const configured = Deno.env.get(secretName);
  if (configured) return configured;

  try {
    const connection = await base44.asServiceRole.connectors.getConnection('stripe');
    const token = connection?.accessToken;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

function getAllowedOrigin(req) {
  const candidates = [Deno.env.get('APP_BASE_URL'), req.headers.get('origin')].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      const host = url.hostname.toLowerCase();
      if (
        url.protocol === 'https:' &&
        (host === 'glyphlock.io' || host.endsWith('.glyphlock.io') || host.endsWith('.base44.app'))
      ) {
        return url.origin;
      }
    } catch {
      // Ignore malformed origins and use the canonical app fallback.
    }
  }
  return 'https://glyphlock.base44.app';
}

function integrationIdentifier() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (value) => String.fromCharCode(97 + (value % 26))).join('');
  return `glyphlock_nups_${suffix}`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return Response.json({
        error: 'Forbidden: Staff access required to process payments'
      }, { status: 403 });
    }

    // Rate limiting
    const now = Date.now();
    const attemptKey = user.email;
    const attempts = paymentAttempts.get(attemptKey);

    if (attempts) {
      if (now < attempts.resetAt) {
        if (attempts.count >= MAX_PAYMENT_ATTEMPTS_PER_HOUR) {
          return Response.json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many payment attempts. Please wait.',
            retry_after_seconds: Math.ceil((attempts.resetAt - now) / 1000)
          }, { status: 429 });
        }
        attempts.count++;
      } else {
        paymentAttempts.set(attemptKey, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
      }
    } else {
      paymentAttempts.set(attemptKey, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
    }

    // Venue resolution
    let venue_id;
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      if (!sessionVenue.data?.success) {
        return Response.json({
          error: sessionVenue.data?.error || 'Venue access denied'
        }, { status: 403 });
      }
      venue_id = sessionVenue.data.venue_id;
    } catch (venueErr) {
      const status = venueErr?.response?.status === 403 ? 403 : 503;
      return Response.json({
        error: status === 403 ? 'Venue access denied' : 'Venue session service unavailable',
        detail: venueErr?.message
      }, { status });
    }

    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { amount, order_number, customer_name, customer_email, description } = payload;
    const amountNumber = Number(amount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || amountNumber > 50000) {
      return Response.json({
        error: 'Invalid amount',
        message: 'Amount must be between $0.01 and $50,000'
      }, { status: 400 });
    }
    if (
      typeof order_number !== 'string' ||
      !/^[A-Za-z0-9_-]{6,80}$/.test(order_number)
    ) {
      return Response.json({ error: 'Missing or invalid order_number' }, { status: 400 });
    }

    // ── PROVIDER ROUTING ────────────────────────────────────────
    const venueConfig = await resolveVenueConfig(base44, venue_id);
    const providerCode = venueConfig.primary_provider_code || 'external_terminal';

    // Non-Stripe providers use the provider-agnostic evidence path directly.
    if (providerCode !== 'stripe') {
      return Response.json({
        success: false,
        error: 'USE_CREATE_PAYMENT_RECORD',
        message: `Venue uses ${providerCode}. Call createPaymentRecord directly with provider_code='${providerCode}', processor_reference, approval_code, and amount.`,
        provider_code: providerCode
      }, { status: 400 });
    }

    // ── Stripe Adapter (lazy) ──
    const providerConfig = await resolveProviderConfig(base44, 'stripe');
    const stripeKey = await resolveStripeSecretKey(base44, providerConfig);

    if (!stripeKey) {
      return Response.json({
        success: false,
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe integration is not configured for this venue. Keep using the venue existing processor and record its terminal reference through createPaymentRecord, or configure Stripe as an optional native integration.',
        provider_code: providerCode
      }, { status: 503 });
    }

    const venueMode = String(venueConfig.mode || 'REAL').toUpperCase();
    const liveCredential = /_(live)_/.test(stripeKey);
    const testCredential = /_(test)_/.test(stripeKey);
    if (venueMode === 'REAL' && !liveCredential) {
      return Response.json({
        success: false,
        error: 'STRIPE_LIVE_CREDENTIAL_REQUIRED',
        message: 'REAL mode requires a live Stripe credential.',
      }, { status: 503 });
    }
    if (venueMode !== 'REAL' && liveCredential) {
      return Response.json({
        success: false,
        error: 'STRIPE_ENVIRONMENT_MISMATCH',
        message: `${venueMode} mode cannot use a live Stripe credential.`,
      }, { status: 503 });
    }

    const amountCents = Math.round(amountNumber * 100);
    const connectedAccountId = venueConfig.stripe_connected_account_id || null;
    const feeBps = Math.max(0, Math.min(10000, Number(venueConfig.stripe_application_fee_bps) || 0));
    const applicationFeeAmount = connectedAccountId && feeBps > 0
      ? Math.floor((amountCents * feeBps) / 10000)
      : 0;
    const appOrigin = getAllowedOrigin(req);
    const metadata = {
      order_number,
      customer_name: String(customer_name || '').slice(0, 200),
      processed_by: user.email,
      operator_user_id: user.id,
      venue_id,
      order_type: 'glyphbucks_sale',
      stripe_connected_account_id: connectedAccountId || '',
      platform_fee_bps: String(feeBps),
    };

    const paymentIntentData = { metadata };
    if (applicationFeeAmount > 0) {
      paymentIntentData.application_fee_amount = applicationFeeAmount;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2026-06-24.dahlia' });

    if (connectedAccountId) {
      try {
        // Compatibility gate for the existing connected account. Its controller
        // configuration is SaaS/direct-charge shaped; migrate the readiness
        // check to Accounts v2 when this legacy account is upgraded.
        const account = await stripe.accounts.retrieve(connectedAccountId);
        if (account.capabilities?.card_payments !== 'active' || account.charges_enabled !== true) {
          return Response.json({
            success: false,
            error: 'STRIPE_CONNECTED_ACCOUNT_NOT_READY',
            message: 'The venue connected account is not ready to accept card payments.',
          }, { status: 409 });
        }
      } catch (accountError) {
        return Response.json({
          success: false,
          error: 'STRIPE_CONNECTED_ACCOUNT_LOOKUP_FAILED',
          message: accountError?.message || 'Unable to verify the venue connected account.',
        }, { status: accountError?.statusCode || 502 });
      }
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          integration_identifier: integrationIdentifier(),
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: {
                name: String(description || `NUPS order ${order_number}`).slice(0, 120),
                description: `Venue ${venue_id} · Order ${order_number}`,
              },
            },
            quantity: 1,
          }],
          success_url: `${appOrigin}/NUPSPaymentReturn?session_id={CHECKOUT_SESSION_ID}&order_number=${encodeURIComponent(order_number)}`,
          cancel_url: `${appOrigin}/NUPSPaymentReturn?canceled=1&order_number=${encodeURIComponent(order_number)}`,
          customer_email: customer_email || user.email,
          client_reference_id: user.id,
          metadata,
          payment_intent_data: paymentIntentData,
          expires_at: Math.floor(Date.now() / 1000) + 1800,
        },
        {
          stripeAccount: connectedAccountId || undefined,
          idempotencyKey: `nups-glyphbucks-${venue_id}-${order_number}`,
        },
      );
    } catch (stripeError) {
      return Response.json({
        success: false,
        error: 'STRIPE_CHECKOUT_CREATE_FAILED',
        message: stripeError?.message || 'Stripe rejected the checkout session',
        provider_code: providerCode,
      }, { status: stripeError?.statusCode || 502 });
    }

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'GLYPHBUCKS_CHECKOUT_SESSION_CREATED',
      actor_email: user.email,
      resource_id: session.id,
      severity: 'low',
      description: `Stripe-hosted checkout created for order ${order_number}`,
      metadata: {
        amount_cents: amountCents,
        order_number,
        mode: venueMode,
        credential_environment: liveCredential ? 'live' : testCredential ? 'test' : 'managed_sandbox',
        checkout_session_id: session.id,
        stripe_connected_account_id: connectedAccountId,
        application_fee_amount: applicationFeeAmount,
        application_fee_bps: feeBps,
      },
      status: 'success',
    });

    return Response.json({
      success: true,
      provider_code: providerCode,
      checkout_url: session.url,
      checkout_session_id: session.id,
      amount: amountNumber,
      status: session.status,
      stripe_connected_account_id: connectedAccountId,
      application_fee_amount: applicationFeeAmount,
      application_fee_bps: feeBps,
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Payment processing error:`, error);

    return Response.json({
      success: false,
      error: 'Payment processing failed',
      error_id: errorId
    }, { status: 500 });
  }
});