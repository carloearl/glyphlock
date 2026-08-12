/**
 * ohipReadiness — secure preflight for the NUPS ↔ Oracle Hospitality integration.
 *
 * This endpoint never calls Oracle and never returns secret values. It only
 * confirms whether the server-side settings required for the OHIP BFF exist.
 * The live API adapter should be enabled only after a successful Partner
 * Sandbox OAuth + read-only API test.
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

Deno.serve(async (req) => {
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
    if (body.action && body.action !== 'status') {
      return Response.json(
        { error: 'Only the non-billable status action is enabled during onboarding.' },
        { status: 400 },
      );
    }

    const missing = REQUIRED_SETTINGS.filter((name) => !Deno.env.get(name));
    const authScheme = Deno.env.get('OHIP_AUTH_SCHEME') || null;

    return Response.json({
      ok: true,
      integration: 'Oracle Hospitality Integration Platform',
      application: 'GlyphLock NUPS',
      cloud_account: 'glyphlocknups',
      subscription_id: '107857124',
      mode: 'onboarding',
      outbound_calls_enabled: false,
      configured: missing.length === 0,
      auth_scheme: authScheme,
      required_settings: REQUIRED_SETTINGS,
      missing_settings: missing,
      scope: 'urn:opc:hgbu:ws:__myscopes__',
      next_gate: missing.length === 0
        ? 'Run the first read-only Partner Sandbox test and verify HTTP 200 in OHIP Analytics.'
        : 'Add the missing values from the OHIP Developer Portal as Base44 server secrets.',
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ohipReadiness error:', error);
    return Response.json(
      { ok: false, error: 'OHIP readiness check failed.' },
      { status: 500 },
    );
  }
});
