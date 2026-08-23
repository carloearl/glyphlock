import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const GLOBAL = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const LEVELS = ['configured', 'connected', 'authenticated', 'request_succeeded', 'response_validated', 'end_to_end_verified'];
const RESULTS = new Set(['PASS', 'FAIL', 'PARTIAL', 'BLOCKED']);

const text = (value: unknown, max = 500) => String(value || '').trim().slice(0, max);
const key = (value: unknown) => text(value, 160).replace(/[^A-Za-z0-9._:-]/g, '');

async function resolveNupsUser(E: any, email: string) {
  const direct = await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []);
  if (direct?.[0]) return direct[0];
  return (await E.NUPSUser.filter({ username: email.split('@')[0], status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

function safeMetadata(value: unknown) {
  const metadata = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const serialized = JSON.stringify(metadata);
  if (/secret|password|pin|access[_-]?token|refresh[_-]?token|private[_-]?key|signed[_-]?url|file[_-]?uri/i.test(serialized)) {
    throw new Error('Integration maturity metadata contains a forbidden secret or private reference field.');
  }
  if (serialized.length > 5000) throw new Error('Integration maturity metadata is too large.');
  return metadata;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const E = base44.asServiceRole.entities;
    const email = String(user.email).toLowerCase();
    const nups = await resolveNupsUser(E, email);
    const role = nups?.role || (user.role === 'admin' ? 'PLATFORM_ADMIN' : null);
    if (!role || !ROLES.has(role)) return Response.json({ error: 'Integration administrator role required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const requestedVenue = text(body.venue_id, 160);
    if (!GLOBAL.has(role) && requestedVenue && requestedVenue !== String(nups?.venue_id || '')) {
      return Response.json({ error: 'Cross-venue integration status denied' }, { status: 403 });
    }

    if (action === 'list') {
      const rows = requestedVenue
        ? await E.IntegrationMaturity.filter({ venue_id: requestedVenue }, '-tested_at', 200).catch(() => [])
        : await E.IntegrationMaturity.list('-tested_at', 500).catch(() => []);
      return Response.json({ success: true, records: rows });
    }
    if (action !== 'record') return Response.json({ error: 'Unsupported action' }, { status: 400 });

    const integrationKey = key(body.integration_key);
    const environment = String(body.environment || 'PLATFORM').toUpperCase();
    const venueId = requestedVenue || '';
    const maturity = String(body.maturity || 'configured');
    const result = String(body.result || 'PARTIAL').toUpperCase();
    if (!integrationKey) return Response.json({ error: 'integration_key is required' }, { status: 400 });
    if (!['PLATFORM', 'REAL', 'DEMO', 'SANDBOX'].includes(environment)) return Response.json({ error: 'Invalid environment' }, { status: 400 });
    if (!LEVELS.includes(maturity)) return Response.json({ error: 'Invalid maturity' }, { status: 400 });
    if (!RESULTS.has(result)) return Response.json({ error: 'Invalid result' }, { status: 400 });

    const statusKey = `${integrationKey}:${environment}:${venueId || 'GLOBAL'}`;
    const payload = {
      status_key: statusKey,
      integration_key: integrationKey,
      display_name: text(body.display_name || integrationKey, 200),
      environment,
      venue_id: venueId || undefined,
      maturity,
      maturity_rank: LEVELS.indexOf(maturity) + 1,
      result,
      tested_action: text(body.tested_action, 500),
      tested_at: new Date().toISOString(),
      evidence_reference: text(body.evidence_reference, 500),
      known_limitation: text(body.known_limitation, 1000),
      recorded_by: email,
      metadata: safeMetadata(body.metadata),
    };
    if (!payload.tested_action) return Response.json({ error: 'tested_action is required' }, { status: 400 });

    const existing = (await E.IntegrationMaturity.filter({ status_key: statusKey }, '-tested_at', 1).catch(() => []))?.[0] || null;
    const record = existing
      ? await E.IntegrationMaturity.update(existing.id, payload)
      : await E.IntegrationMaturity.create(payload);

    await E.SystemAuditLog.create({
      event_type: 'INTEGRATION_MATURITY_RECORDED',
      description: `Integration maturity recorded for ${integrationKey}`,
      actor_email: email,
      resource_id: record.id,
      status: result === 'FAIL' ? 'failure' : 'success',
      severity: result === 'FAIL' ? 'high' : 'low',
      metadata: {
        integration_key: integrationKey,
        environment,
        venue_id: venueId || null,
        maturity,
        result,
        evidence_reference: payload.evidence_reference || null,
        actor_role: role,
      },
    }).catch(() => null);

    return Response.json({ success: true, created: !existing, record });
  } catch (error) {
    return Response.json({ error: error?.message || 'Integration maturity update failed' }, { status: 500 });
  }
});