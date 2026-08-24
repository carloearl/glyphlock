import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);
const MANAGER_ROLES = new Set(['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER','SOVEREIGN']);
const DOOR_ROLES = new Set(['DOOR_GIRL','DOORMAN']);
const VIP_ROLES = new Set(['FLOOR_HOST','HOSTESS']);
const ALLOWED_CLASSES = new Set(['PRIVATE_IDENTITY','PRIVATE_TAX','PRIVATE_BIOMETRIC','PRIVATE_CONTRACT','UNKNOWN']);
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
  const [accounts, grants] = await Promise.all([
    E.NUPSUser.filter({ platform_email: email, status: 'active' }, '-created_date', 20).catch(() => []),
    E.NUPSAccessRequest.filter({ email, status: 'APPROVED' }, '-created_date', 50).catch(() => []),
  ]);
  for (const grant of grants || []) {
    if (grant.venue_id !== venueId || grant.mode !== mode || !grant.nups_user_id) continue;
    const account = (accounts || []).find((candidate: any) => candidate.id === grant.nups_user_id);
    const expectedRole = NUPS_ROLE_BY_GRANT[grant.granted_role];
    if (account && expectedRole && account.role === expectedRole && account.venue_id === venueId && accountMode(account) === mode) {
      return account;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const venueRef = String(body.venue_id || '').trim();
    const fileUri = String(body.file_uri || '').trim();
    const classification = String(body.classification || 'UNKNOWN').toUpperCase();
    const artifactType = String(body.artifact_type || 'other');
    const mode = String(body.mode || '').toUpperCase();
    if (!venueRef || !fileUri || !fileUri.startsWith('file://')) return Response.json({ error: 'venue_id and private file_uri required' }, { status: 400 });
    if (!ALLOWED_CLASSES.has(classification)) return Response.json({ error: 'Invalid classification' }, { status: 400 });
    if (!EVIDENCE_MODES.has(mode)) return Response.json({ error: 'An explicit REAL, DEMO, or SANDBOX mode is required' }, { status: 400 });
    const venue = await resolveActiveVenue(base44, venueRef);
    if (!venue) return Response.json({ error: 'An active venue is required' }, { status: 400 });

    const email = normalizeEmail(user.email);
    const nups = await resolveGrantedIdentity(base44, email, venue.canonicalId, mode);
    if (!nups) return Response.json({ error: 'An active NUPS identity with a matching approved venue and mode grant is required' }, { status: 403 });

    if (!MANAGER_ROLES.has(nups.role) && !DOOR_ROLES.has(nups.role) && !VIP_ROLES.has(nups.role)) return Response.json({ error: 'Role not authorized to register protected evidence' }, { status: 403 });
    if (DOOR_ROLES.has(nups.role) && classification !== 'PRIVATE_IDENTITY') return Response.json({ error: 'Door role may register identity evidence only' }, { status: 403 });
    if (VIP_ROLES.has(nups.role) && classification === 'PRIVATE_TAX') return Response.json({ error: 'VIP operational roles cannot register tax evidence' }, { status: 403 });

    const evidence = await base44.asServiceRole.entities.ProtectedEvidence.create({
      evidence_id: crypto.randomUUID(),
      file_uri: fileUri,
      artifact_type: artifactType,
      classification,
      subject_entity: String(body.subject_entity || ''),
      subject_id: String(body.subject_id || ''),
      venue_id: venueRef,
      content_hash: String(body.content_hash || ''),
      mime_type: String(body.mime_type || ''),
      file_name: String(body.file_name || '').slice(0, 200),
      purpose: String(body.purpose || '').slice(0, 200),
      created_by: user.email,
      created_at: new Date().toISOString(),
      mode,
    });
    return Response.json({ success: true, evidence_id: evidence.id, evidence_ref: evidence.evidence_id });
  } catch (error) {
    return Response.json({ error: error?.message || 'Protected evidence registration failed' }, { status: 500 });
  }
});
