/**
 * ohipConnectionTest — one deliberate OCIM OAuth request followed by one
 * read-only Partner Sandbox List of Values request.
 *
 * Secrets and access tokens remain server-side. The response contains only
 * stage/status metadata needed for owner/admin diagnostics.
 */
import { createClientFromRequest } from 'npm:@base44/sdk';

const ALLOWED_ROLES = new Set([
  'admin',
  'PLATFORM_ADMIN',
  'SOVEREIGN',
  'VENUE_OWNER',
]);

const REQUIRED_SETTINGS = [
  'OHIP_GATEWAY_URL',
  'OHIP_AUTH_SCHEME',
  'OHIP_CLIENT_ID',
  'OHIP_CLIENT_SECRET',
  'OHIP_APP_KEY',
  'OHIP_ENTERPRISE_ID',
  'OHIP_HOTEL_ID',
];

const OAUTH_SCOPE = 'urn:opc:hgbu:ws:__myscopes__';

function readSettings() {
  return Object.fromEntries(
    REQUIRED_SETTINGS.map((name) => [name, Deno.env.get(name)?.trim() || '']),
  );
}

function normalizeGateway(rawValue: string) {
  const gateway = new URL(rawValue);
  if (gateway.protocol !== 'https:') {
    throw new Error('OHIP_GATEWAY_URL must use HTTPS.');
  }
  return gateway.toString().replace(/\/$/, '');
}

function oauthMessage(status: number, code: string) {
  if (code === 'invalid_client' || status === 401) {
    return 'Oracle rejected the Client ID or Client Secret for this environment.';
  }
  if (code === 'invalid_scope') {
    return 'Oracle rejected the configured OAuth scope.';
  }
  if (status === 403) {
    return 'Oracle denied the OAuth request. Verify the Application Key and Enterprise ID.';
  }
  return `Oracle OAuth returned HTTP ${status}${code ? ` (${code})` : ''}.`;
}

Deno.serve(async (req) => {
  const startedAt = performance.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.role || user.nups_role;
    if (!ALLOWED_ROLES.has(role)) {
      return Response.json({ error: 'Forbidden — owner/admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.action !== 'full') {
      return Response.json(
        { error: 'Explicit action "full" is required for the live OHIP test.' },
        { status: 400 },
      );
    }

    const settings = readSettings();
    const missing = REQUIRED_SETTINGS.filter((name) => !settings[name]);

    if (missing.length > 0) {
      return Response.json({
        ok: false,
        stage: 'configuration',
        configured: false,
        missing_settings: missing,
        message: 'OHIP server configuration is incomplete.',
        checked_at: new Date().toISOString(),
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    const authScheme = settings.OHIP_AUTH_SCHEME.toUpperCase();
    if (!authScheme.includes('OCIM') && !authScheme.includes('CLIENT')) {
      return Response.json({
        ok: false,
        stage: 'configuration',
        configured: true,
        auth_scheme: authScheme,
        message: 'The live test supports the OCIM/client-credentials sandbox only.',
        checked_at: new Date().toISOString(),
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    const gateway = normalizeGateway(settings.OHIP_GATEWAY_URL);
    const oauthRequestId = crypto.randomUUID();
    const oauthController = new AbortController();
    const oauthTimeout = setTimeout(() => oauthController.abort(), 15000);

    let oauthResponse: Response;
    try {
      oauthResponse = await fetch(`${gateway}/oauth/v1/tokens`, {
        method: 'POST',
        signal: oauthController.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-app-key': settings.OHIP_APP_KEY,
          'enterpriseId': settings.OHIP_ENTERPRISE_ID,
          'Authorization': `Basic ${btoa(
            `${settings.OHIP_CLIENT_ID}:${settings.OHIP_CLIENT_SECRET}`,
          )}`,
          'X-Request-Id': oauthRequestId,
        },
        body: new URLSearchParams({
          scope: OAUTH_SCOPE,
          grant_type: 'client_credentials',
        }),
      });
    } finally {
      clearTimeout(oauthTimeout);
    }

    const oauthPayload = await oauthResponse.json().catch(() => ({}));
    const oauthCode =
      typeof oauthPayload?.error === 'string' ? oauthPayload.error : '';

    if (!oauthResponse.ok || !oauthPayload?.access_token) {
      return Response.json({
        ok: false,
        stage: 'oauth',
        configured: true,
        auth_scheme: authScheme,
        oauth_ok: false,
        http_status: oauthResponse.status,
        error_code: oauthCode || null,
        request_id: oauthRequestId,
        message: oauthMessage(oauthResponse.status, oauthCode),
        checked_at: new Date().toISOString(),
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    const propertyRequestId = crypto.randomUUID();
    const propertyController = new AbortController();
    const propertyTimeout = setTimeout(() => propertyController.abort(), 15000);

    let propertyResponse: Response;
    try {
      const propertyUrl = new URL('/lov/v1/listOfValues/Titles', gateway);
      propertyUrl.searchParams.set('parameterName', 'LanguageCode');
      propertyUrl.searchParams.set('includeInactiveFlag', 'false');
      propertyUrl.searchParams.set('parameterValue', 'E');

      propertyResponse = await fetch(propertyUrl, {
        method: 'GET',
        signal: propertyController.signal,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${oauthPayload.access_token}`,
          'x-app-key': settings.OHIP_APP_KEY,
          'x-hotelid': settings.OHIP_HOTEL_ID,
          'X-Request-Id': propertyRequestId,
        },
      });
    } finally {
      clearTimeout(propertyTimeout);
    }

    if (!propertyResponse.ok) {
      return Response.json({
        ok: false,
        stage: 'property_api',
        configured: true,
        auth_scheme: authScheme,
        oauth_ok: true,
        property_api_ok: false,
        oauth_http_status: oauthResponse.status,
        http_status: propertyResponse.status,
        request_id: propertyRequestId,
        message:
          propertyResponse.status === 403
            ? 'OAuth succeeded, but Oracle denied the Property API call. Verify the application API subscription and sandbox Hotel ID.'
            : `OAuth succeeded, but the read-only Property API returned HTTP ${propertyResponse.status}.`,
        checked_at: new Date().toISOString(),
        latency_ms: Math.round(performance.now() - startedAt),
      });
    }

    return Response.json({
      ok: true,
      stage: 'complete',
      configured: true,
      auth_scheme: authScheme,
      oauth_ok: true,
      property_api_ok: true,
      oauth_http_status: oauthResponse.status,
      property_api_http_status: propertyResponse.status,
      request_id: propertyRequestId,
      token_expires_in: oauthPayload.expires_in || null,
      message: 'NUPS authenticated with Oracle and completed one read-only OHIP Partner Sandbox call.',
      checked_at: new Date().toISOString(),
      latency_ms: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';

    console.error(
      'ohipConnectionTest failed:',
      timedOut ? 'Oracle request timed out' : 'Internal connection-test error',
    );

    return Response.json(
      {
        ok: false,
        stage: timedOut ? 'network' : 'internal',
        message: timedOut
          ? 'Oracle did not respond before the 15-second timeout.'
          : error instanceof Error
            ? error.message
            : 'Unexpected OHIP connection-test failure.',
        checked_at: new Date().toISOString(),
        latency_ms: Math.round(performance.now() - startedAt),
      },
      { status: 500 },
    );
  }
});
