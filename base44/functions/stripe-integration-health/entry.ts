import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

const EXPECTED_ACCOUNT_ID = Deno.env.get('STRIPE_EXPECTED_ACCOUNT_ID') || 'acct_1RvNQlAOlRvharGO';
const EXPECTED_CONNECTED_ACCOUNT_ID = Deno.env.get('STRIPE_EXPECTED_CONNECTED_ACCOUNT_ID') || 'acct_1S7x8fAOlRz4oyOk';
const REQUIRED_WEBHOOK_SECRET_COUNT = 2;

const EXPECTED_PRICES = {
  creator: {
    id: 'price_1U5wo5AOlRvharGOaHq8bkWs',
    amount: 3900,
    currency: 'usd',
    interval: 'month',
  },
  professional: {
    id: 'price_1U5wpWAOlRvharGOW3oA5U6B',
    amount: 14900,
    currency: 'usd',
    interval: 'month',
  },
};

async function resolveConnection(base44) {
  const environmentKey = Deno.env.get('STRIPE_SECRET_KEY');
  const environmentWebhookSecrets = [
    Deno.env.get('STRIPE_WEBHOOK_SECRET'),
    Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET'),
  ].filter(Boolean);

  let connector = null;
  try {
    connector = await base44.asServiceRole.connectors.getConnection('stripe');
  } catch {
    // Reported as disconnected below; no secret values are exposed.
  }

  const config = connector?.connectionConfig || {};
  const connectorWebhookSecrets = [
    config.webhook_secret,
    config.webhookSecret,
    config.connect_webhook_secret,
    config.signing_secret,
    config.endpoint_secret,
  ].filter((value) => typeof value === 'string' && value.length > 0);

  return {
    secretKey: environmentKey || connector?.accessToken || null,
    source: environmentKey ? 'environment' : connector?.accessToken ? 'base44_connector' : 'none',
    connectorConnected: Boolean(connector?.accessToken),
    webhookSecretCount: new Set([
      ...environmentWebhookSecrets,
      ...connectorWebhookSecrets,
    ]).size,
    connectionConfigFields: Object.keys(config).sort(),
  };
}

Deno.serve(async (req) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const connection = await resolveConnection(base44);
    if (!connection.secretKey) {
      return Response.json({
        ok: false,
        source: connection.source,
        connectorConnected: connection.connectorConnected,
        webhookReady: false,
        connectionConfigFields: connection.connectionConfigFields,
        error: 'Stripe is not configured',
      }, { status: 503 });
    }

    const stripe = new Stripe(connection.secretKey, { apiVersion: '2026-06-24.dahlia' });
    const checks = {};

    for (const [plan, expected] of Object.entries(EXPECTED_PRICES)) {
      try {
        const price = await stripe.prices.retrieve(expected.id);
        checks[plan] = {
          ok: Boolean(
            price.active &&
            price.unit_amount === expected.amount &&
            price.currency === expected.currency &&
            price.recurring?.interval === expected.interval &&
            price.metadata?.glyphlock_plan === plan
          ),
          priceId: price.id,
          active: price.active,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || null,
          productId: typeof price.product === 'string' ? price.product : price.product?.id || null,
        };
      } catch (error) {
        checks[plan] = {
          ok: false,
          error: error?.code || error?.type || 'price_lookup_failed',
        };
      }
    }

    const accountResponse = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${connection.secretKey}` },
    });
    const account = accountResponse.ok ? await accountResponse.json() : null;

    let venuePaymentConfig = null;
    try {
      const configs = await base44.asServiceRole.entities.VenuePaymentConfig.filter(
        { venue_id: 'dream_palace', active: true }, null, 1,
      );
      venuePaymentConfig = configs?.[0] || null;
    } catch {
      // Reported below as configuration not ready.
    }

    const configuredConnectedAccountId =
      venuePaymentConfig?.stripe_connected_account_id || EXPECTED_CONNECTED_ACCOUNT_ID;
    let connectedAccount = null;
    let connectedAccountError = null;
    try {
      connectedAccount = await stripe.accounts.retrieve(configuredConnectedAccountId);
    } catch (error) {
      connectedAccountError = error?.code || error?.type || 'connected_account_lookup_failed';
    }

    const catalogReady = Object.values(checks).every((check) => check.ok === true);
    const webhookReady = connection.webhookSecretCount >= REQUIRED_WEBHOOK_SECRET_COUNT;
    const accountMatches = Boolean(account?.id && account.id === EXPECTED_ACCOUNT_ID);
    const accountReadable = Boolean(account);
    const connectedAccountMatches = Boolean(
      connectedAccount?.id && connectedAccount.id === EXPECTED_CONNECTED_ACCOUNT_ID,
    );
    const connectedAccountReady = Boolean(
      connectedAccountMatches &&
      connectedAccount?.capabilities?.card_payments === 'active' &&
      connectedAccount?.charges_enabled === true &&
      connectedAccount?.controller?.stripe_dashboard?.type === 'full' &&
      connectedAccount?.controller?.fees?.payer === 'account' &&
      connectedAccount?.controller?.losses?.payments === 'stripe'
    );
    const venueMode = String(venuePaymentConfig?.mode || 'UNCONFIGURED').toUpperCase();
    const liveCredential = /_(live)_/.test(connection.secretKey);
    const environmentReady = venueMode === 'REAL' ? liveCredential : !liveCredential;

    return Response.json({
      ok: catalogReady && webhookReady && accountMatches && accountReadable && connectedAccountReady && environmentReady,
      source: connection.source,
      connectorConnected: connection.connectorConnected,
      webhookReady,
      requiredWebhookSecretCount: REQUIRED_WEBHOOK_SECRET_COUNT,
      webhookSecretCount: connection.webhookSecretCount,
      connectionConfigFields: connection.connectionConfigFields,
      expectedAccountId: EXPECTED_ACCOUNT_ID,
      accountMatches,
      venueMode,
      credentialEnvironment: liveCredential ? 'live' : 'sandbox',
      environmentReady,
      account: account ? {
        id: account.id,
        livemode: Boolean(account.livemode),
        chargesEnabled: Boolean(account.charges_enabled),
        payoutsEnabled: Boolean(account.payouts_enabled),
        detailsSubmitted: Boolean(account.details_submitted),
        country: account.country || null,
        defaultCurrency: account.default_currency || null,
      } : {
        readable: false,
        status: accountResponse.status,
      },
      connectedAccount: connectedAccount ? {
        id: connectedAccount.id,
        expectedId: EXPECTED_CONNECTED_ACCOUNT_ID,
        matches: connectedAccountMatches,
        ready: connectedAccountReady,
        cardPayments: connectedAccount.capabilities?.card_payments || null,
        dashboard: connectedAccount.controller?.stripe_dashboard?.type || null,
        feesPayer: connectedAccount.controller?.fees?.payer || null,
        lossesPayer: connectedAccount.controller?.losses?.payments || null,
      } : {
        id: configuredConnectedAccountId,
        expectedId: EXPECTED_CONNECTED_ACCOUNT_ID,
        matches: false,
        ready: false,
        error: connectedAccountError,
      },
      catalogReady,
      prices: checks,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Stripe integration health check failed:`, error);
    return Response.json({
      ok: false,
      error: 'Stripe health check failed',
      error_id: errorId,
    }, { status: 500 });
  }
});
