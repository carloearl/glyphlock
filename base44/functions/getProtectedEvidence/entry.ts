import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { protectedEvidenceDecision } from './protectedEvidencePolicy.js';

const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);
const MANAGER_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const EVIDENCE_MODES = new Set(['REAL', 'DEMO', 'SANDBOX']);
const NUPS_ROLE_BY_GRANT: Record<string, string> = {
  OWNER: 'VENUE_OWNER', ADMINISTRATOR: 'PLATFORM_ADMIN', MANAGER: 'VENUE_MANAGER',
  ENTERTAINER: 'PERFORMER', HOSTESS: 'HOSTESS', DOORMAN: 'DOORMAN',
  DOOR_GIRL: 'DOOR_GIRL', BARTENDER: 'BARTENDER', DJ: 'DJ', SECURITY: 'SECURITY',
};

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const accountMode = (account: any) => account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');

async function resolveActiveVenue(base44: any, venueRef: unknown) {
  const ref = String(venueRef || '').trim();
  if (!ref) return null;
  let venue = await base44.asServiceRole.entities.Venue.get(ref).catch(() => null);
  if (!venue) {
    venue = (await base44.asServiceRole.entities.Venue.filter({ venue_id: ref }, '-created_date', 2).catch(() => []))?.[0] || null;
  }
  if (venue?.status !== 'active') return null;
  return { canonicalId: String(venue.venue_id || venue.id || '').trim() };
}

async function resolveGrantedIdentity(base44: any, email: string, venueId: string, mode: string) {
  if (SOVEREIGN_EMAILS.has(email)) {
    return { role: 'SOVEREIGN', venue_id: venueId, access_mode: mode, sovereign: true };
  }
  const E = base44.asServiceRole.entities;
  const grants = await E.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id: venueId, mode }, '-created_date').catch(() => []);
  for (const grant of grants || []) {
    if (grant.venue_id !== venueId || grant.mode !== mode || !grant.nups_user_id) continue;
    const account = await E.NUPSUser.get(grant.nups_user_id).catch(() => null);
    const expectedRole = NUPS_ROLE_BY_GRANT[grant.granted_role];
    if (
      account?.status === 'active'
      && expectedRole
      && account.role === expectedRole
      && account.venue_id === venueId
      && accountMode(account) === mode
    ) return account;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const evidenceId = String(body.evidence_id || '').trim();
    const purpose = String(body.purpose || 'view').trim().slice(0, 120);
    if (!evidenceId) return Response.json({ error: 'evidence_id required' }, { status: 400 });
    const evidence = await base44.asServiceRole.entities.ProtectedEvidence.get(evidenceId).catch(() => null);
    if (!evidence) return Response.json({ error: 'Protected evidence not found' }, { status: 404 });

    const evidenceMode = EVIDENCE_MODES.has(evidence.mode) ? evidence.mode : 'REAL';
    const venue = await resolveActiveVenue(base44, evidence.venue_id);
    if (!venue) return Response.json({ error: 'Protected evidence venue is not active' }, { status: 403 });
    const email = normalizeEmail(user.email);
    const nups = await resolveGrantedIdentity(base44, email, venue.canonicalId, evidenceMode);
    if (!nups) return Response.json({ error: 'An active NUPS identity with a matching approved venue and mode grant is required' }, { status: 403 });

    const decision = protectedEvidenceDecision({
      role: nups.role,
      actorVenueId: nups.venue_id,
      evidenceVenueId: venue.canonicalId,
      classification: evidence.classification,
    });

    if (!decision.allowed) {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'PROTECTED_EVIDENCE_ACCESS_DENIED',
        description: `Protected evidence access denied for ${evidence.evidence_id}`,
        actor_email: user.email,
        status: 'blocked', severity: 'high',
        metadata: { evidence_id: evidence.evidence_id, venue_id: venue.canonicalId, classification: evidence.classification, purpose, actor_role: nups.role, access_mode: evidenceMode, decision_reason: decision.reason },
      }).catch(() => null);
      return Response.json({ error: 'Protected evidence access denied' }, { status: 403 });
    }

    let expiresIn = 120;
    const requestedTestTtl = Number(body.test_ttl || 0);
    const syntheticBatch17 = evidenceMode === 'SANDBOX'
      && evidence.subject_entity === 'Batch17SyntheticEvidence'
      && purpose.startsWith('batch17:');
    if (requestedTestTtl) {
      const managerClass = MANAGER_ROLES.has(nups.role || '');
      if (!syntheticBatch17 || !managerClass || requestedTestTtl < 5 || requestedTestTtl > 15) {
        return Response.json({ error: 'Test TTL is restricted to manager-authorized Batch 17 SANDBOX evidence.' }, { status: 403 });
      }
      expiresIn = requestedTestTtl;
    }

    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: evidence.file_uri, expires_in: expiresIn });
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'PROTECTED_EVIDENCE_ACCESSED',
      description: `Authorized protected evidence retrieval for ${evidence.evidence_id}`,
      actor_email: user.email,
      status: 'success', severity: 'medium',
      metadata: { evidence_id: evidence.evidence_id, venue_id: venue.canonicalId, classification: evidence.classification, purpose, actor_role: nups.role, access_mode: evidenceMode },
    }).catch(() => null);
    return Response.json({ success: true, signed_url, expires_in: expiresIn, evidence: { evidence_id: evidence.evidence_id, artifact_type: evidence.artifact_type, classification: evidence.classification } });
  } catch (error) {
    return Response.json({ error: error?.message || 'Protected evidence retrieval failed' }, { status: 500 });
  }
});
