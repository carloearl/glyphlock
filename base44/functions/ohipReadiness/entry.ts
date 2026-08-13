/**
 * Secure NUPS ↔ OHIP preflight and one-shot Partner Sandbox connection test.
 * Never returns or logs credential values or access tokens.
 */
import { createClientFromRequest } from 'npm:@base44/sdk';

const ALLOWED_ROLES = new Set(['admin', 'PLATFORM_ADMIN', 'SOVEREIGN', 'VENUE_OWNER']);
const REQUIRED_SETTINGS = [
  'OHIP_GATEWAY_URL',
  'OHIP_AUTH_SCHEME',
  'OHIP_CLIENT_ID',
  'OHIP_CLIENT_SECRET',
  'OHIP_APP_KEY',
  'OHIP_ENTERPRISE_ID',
  'OHIP_HOTEL_ID',
];
const SCOPE = 'urn:opc:hgbu:ws:__myscopes__';
const TOKEN_REFRESH_SKEW_MS = 120_000;

type OhipConfig = Record<string, string>;

let tokenCache: {
  accessToken: string;
  expiresAt: number;
  gateway: string;
  clientId: string;
} | null = null;

function settings() {
  return Object.fromEntries(
    REQUIRED_SETTINGS.map((name) => [name, Deno.env.get(name)?.trim() || '']),
  );
}

function gatewayUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('OHIP_GATEWAY_URL must use HTTPS.');
  return url.toString().replace(/\/$/, '');
}

function safeResortChains(payload: unknown) {
  const items = (payload as any)?.listOfValues?.items;
  if (!Array.isArray(items)) return [];

  return items.slice(0, 50).map((item: any) => {
    const fields = Object.fromEntries(
      (Array.isArray(item?.flexfields) ? item.flexfields : [])
        .filter((field: any) =>
          typeof field?.parameterName === 'string' &&
          typeof field?.parameterValue === 'string'
        )
        .map((field: any) => [field.parameterName, field.parameterValue]),
    );

    return {
      chain_code: fields.ChainCode || null,
      chain_name: fields.ChainName || null,
      chain_description: fields.ChainDesc || null,
    };
  }).filter((chain: any) => chain.chain_code || chain.chain_name);
}

async function getOAuthToken(config: OhipConfig, gateway: string) {
  const now = Date.now();
  if (
    tokenCache &&
    tokenCache.gateway === gateway &&
    tokenCache.clientId === config.OHIP_CLIENT_ID &&
    tokenCache.expiresAt - TOKEN_REFRESH_SKEW_MS > now
  ) {
    return {
      ok: true,
      accessToken: tokenCache.accessToken,
      httpStatus: 200,
      expiresIn: Math.max(0, Math.floor((tokenCache.expiresAt - now) / 1000)),
      requestId: null,
      cacheHit: true,
      errorCode: null,
    };
  }

  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response: Response;

  try {
    response = await fetch(`${gateway}/oauth/v1/tokens`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-app-key': config.OHIP_APP_KEY,
        enterpriseId: config.OHIP_ENTERPRISE_ID,
        Authorization: `Basic ${btoa(`${config.OHIP_CLIENT_ID}:${config.OHIP_CLIENT_SECRET}`)}`,
        'X-Request-Id': requestId,
      },
      body: new URLSearchParams({ scope: SCOPE, grant_type: 'client_credentials' }),
    });
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json().catch(() => ({}));
  const accessToken = typeof payload?.access_token === 'string'
    ? payload.access_token
    : '';
  const expiresIn = Number(payload?.expires_in) || 0;

  if (response.ok && accessToken) {
    tokenCache = {
      accessToken,
      expiresAt: now + Math.max(0, expiresIn) * 1000,
      gateway,
      clientId: config.OHIP_CLIENT_ID,
    };
  }

  return {
    ok: response.ok && Boolean(accessToken),
    accessToken,
    httpStatus: response.status,
    expiresIn,
    requestId,
    cacheHit: false,
    errorCode: typeof payload?.error === 'string' ? payload.error : null,
  };
}

Deno.serve(async (req) => {
  const startedAt = performance.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.role || user.nups_role;
    if (!ALLOWED_ROLES.has(role)) {
      return Response.json({ error: 'Forbidden — owner/admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';
    if (!['status', 'test', 'snapshot'].includes(action)) {
      return Response.json({ error: 'Unsupported OHIP action.' }, { status: 400 });
    }

    const config = settings();
    const missing = REQUIRED_SETTINGS.filter((name) => !config[name]);
    const configuredAuthScheme = config.OHIP_AUTH_SCHEME || null;
    // Early onboarding stored the Oracle OAuth scope in OHIP_AUTH_SCHEME.
    // This function only implements Oracle's OCIM client-credentials flow, so
    // normalize that legacy value without exposing or rewriting any secret.
    const usesLegacyScopeAlias = configuredAuthScheme === SCOPE;
    const authScheme = usesLegacyScopeAlias ? 'OCIM' : configuredAuthScheme;
    const baseResult = {
      integration: 'Oracle Hospitality Integration Platform',
      application: 'GlyphLock NUPS',
      cloud_account: 'glyphlocknups',
      subscription_id: '107857124',
      configured: missing.length === 0,
      auth_scheme: authScheme,
      missing_settings: missing,
      scope: SCOPE,
      checked_at: new Date().toISOString(),
    };

    if (action === 'status') {
      return Response.json({
        ok: true,
        ...baseResult,
        mode: 'onboarding',
        outbound_calls_enabled: true,
        next_gate: missing.length === 0
          ? 'Run one live Partner Sandbox connection test.'
          : 'Add the missing values as Base44 server secrets.',
      });
    }

    if (missing.length > 0) {
      return Response.json({
        ok: false,
        ...baseResult,
        stage: 'configuration',
        message: 'OHIP server configuration is incomplete.',
      });
    }

    const normalizedScheme = authScheme.toUpperCase();
    if (!normalizedScheme.includes('OCIM') && !normalizedScheme.includes('CLIENT')) {
      return Response.json({
        ok: false,
        ...baseResult,
        stage: 'configuration',
        message: 'The one-shot test supports the OHIP OCIM/client-credentials sandbox.',
      });
    }

    const gateway = gatewayUrl(config.OHIP_GATEWAY_URL);
    const oauthResult = await getOAuthToken(config, gateway);
    if (!oauthResult.ok) {
      const code = oauthResult.errorCode;
      return Response.json({
        ok: false,
        ...baseResult,
        stage: 'oauth',
        oauth_ok: false,
        http_status: oauthResult.httpStatus,
        error_code: code,
        request_id: oauthResult.requestId,
        message: code === 'invalid_client' || oauthResult.httpStatus === 401
          ? 'Oracle rejected the Client ID or Client Secret for this environment.'
          : oauthResult.httpStatus === 403
            ? 'Oracle denied OAuth. Verify the Application Key and Enterprise ID.'
            : `Oracle OAuth returned HTTP ${oauthResult.httpStatus}.`,
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    const apiRequestId = crypto.randomUUID();
    const apiController = new AbortController();
    const apiTimer = setTimeout(() => apiController.abort(), 15000);
    let apiResponse: Response;

    try {
      const url = action === 'snapshot'
        ? new URL('/lov/v1/listOfValues/ResortChains', gateway)
        : new URL('/lov/v1/listOfValues/Titles', gateway);
      if (action === 'test') {
        url.searchParams.set('parameterName', 'LanguageCode');
        url.searchParams.set('includeInactiveFlag', 'false');
        url.searchParams.set('parameterValue', 'E');
      }
      apiResponse = await fetch(url, {
        method: 'GET',
        signal: apiController.signal,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${oauthResult.accessToken}`,
          'x-app-key': config.OHIP_APP_KEY,
          'x-hotelid': config.OHIP_HOTEL_ID,
          'X-Request-Id': apiRequestId,
        },
      });
    } finally {
      clearTimeout(apiTimer);
    }

    if (!apiResponse.ok) {
      return Response.json({
        ok: false,
        ...baseResult,
        stage: 'property_api',
        oauth_ok: true,
        property_api_ok: false,
        oauth_http_status: oauthResult.httpStatus,
        http_status: apiResponse.status,
        request_id: apiRequestId,
        message: apiResponse.status === 403
          ? 'OAuth succeeded, but Oracle denied the API call. Verify the application subscription and sandbox Hotel ID.'
          : `OAuth succeeded, but the read-only API returned HTTP ${apiResponse.status}.`,
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    if (action === 'snapshot') {
      const apiPayload = await apiResponse.json().catch(() => ({}));
      const chains = safeResortChains(apiPayload);
      return Response.json({
        ok: true,
        ...baseResult,
        stage: 'complete',
        oauth_ok: true,
        property_api_ok: true,
        oauth_http_status: oauthResult.httpStatus,
        oauth_cache_hit: oauthResult.cacheHit,
        property_api_http_status: apiResponse.status,
        request_id: apiRequestId,
        token_expires_in: oauthResult.expiresIn || null,
        property_configuration: {
          hotel_id: config.OHIP_HOTEL_ID,
          chain_count: chains.length,
          chains,
        },
        message: 'Loaded a sanitized OHIP resort-chain configuration snapshot. No guest or reservation data was requested.',
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    return Response.json({
      ok: true,
      ...baseResult,
      stage: 'complete',
      oauth_ok: true,
      property_api_ok: true,
      oauth_http_status: oauthResult.httpStatus,
      oauth_cache_hit: oauthResult.cacheHit,
      property_api_http_status: apiResponse.status,
      request_id: apiRequestId,
      token_expires_in: oauthResult.expiresIn || null,
      message: 'NUPS authenticated with Oracle and completed one read-only OHIP Partner Sandbox call.',
      latency_ms: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    console.error('ohipReadiness:', timedOut ? 'Oracle request timed out' : 'Internal test error');
    return Response.json({
      ok: false,
      stage: timedOut ? 'network' : 'internal',
      message: timedOut
        ? 'Oracle did not respond before the 15-second timeout.'
        : error instanceof Error ? error.message : 'OHIP connection test failed.',
      checked_at: new Date().toISOString(),
      latency_ms: Math.round(performance.now() - startedAt),
    }, { status: 500 });
  }
});
