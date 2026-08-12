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
    if (!['status', 'test'].includes(action)) {
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
    const oauthRequestId = crypto.randomUUID();
    const oauthController = new AbortController();
    const oauthTimer = setTimeout(() => oauthController.abort(), 15000);
    let oauthResponse: Response;

    try {
      oauthResponse = await fetch(`${gateway}/oauth/v1/tokens`, {
        method: 'POST',
        signal: oauthController.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-app-key': config.OHIP_APP_KEY,
          'enterpriseId': config.OHIP_ENTERPRISE_ID,
          Authorization: `Basic ${btoa(`${config.OHIP_CLIENT_ID}:${config.OHIP_CLIENT_SECRET}`)}`,
          'X-Request-Id': oauthRequestId,
        },
        body: new URLSearchParams({ scope: SCOPE, grant_type: 'client_credentials' }),
      });
    } finally {
      clearTimeout(oauthTimer);
    }

    const oauthPayload = await oauthResponse.json().catch(() => ({}));
    if (!oauthResponse.ok || !oauthPayload?.access_token) {
      const code = typeof oauthPayload?.error === 'string' ? oauthPayload.error : null;
      return Response.json({
        ok: false,
        ...baseResult,
        stage: 'oauth',
        oauth_ok: false,
        http_status: oauthResponse.status,
        error_code: code,
        request_id: oauthRequestId,
        message: code === 'invalid_client' || oauthResponse.status === 401
          ? 'Oracle rejected the Client ID or Client Secret for this environment.'
          : oauthResponse.status === 403
            ? 'Oracle denied OAuth. Verify the Application Key and Enterprise ID.'
            : `Oracle OAuth returned HTTP ${oauthResponse.status}.`,
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    const apiRequestId = crypto.randomUUID();
    const apiController = new AbortController();
    const apiTimer = setTimeout(() => apiController.abort(), 15000);
    let apiResponse: Response;

    try {
      const url = new URL('/lov/v1/listOfValues/Titles', gateway);
      url.searchParams.set('parameterName', 'LanguageCode');
      url.searchParams.set('includeInactiveFlag', 'false');
      url.searchParams.set('parameterValue', 'E');
      apiResponse = await fetch(url, {
        method: 'GET',
        signal: apiController.signal,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${oauthPayload.access_token}`,
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
        oauth_http_status: oauthResponse.status,
        http_status: apiResponse.status,
        request_id: apiRequestId,
        message: apiResponse.status === 403
          ? 'OAuth succeeded, but Oracle denied the API call. Verify the application subscription and sandbox Hotel ID.'
          : `OAuth succeeded, but the read-only API returned HTTP ${apiResponse.status}.`,
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    return Response.json({
      ok: true,
      ...baseResult,
      stage: 'complete',
      oauth_ok: true,
      property_api_ok: true,
      oauth_http_status: oauthResponse.status,
      property_api_http_status: apiResponse.status,
      request_id: apiRequestId,
      token_expires_in: oauthPayload.expires_in || null,
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
