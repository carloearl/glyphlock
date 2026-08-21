import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const MANAGER_ROLES = new Set(['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER','SOVEREIGN']);
const DOOR_ROLES = new Set(['DOOR_GIRL','DOORMAN']);
const VIP_ROLES = new Set(['FLOOR_HOST','HOSTESS']);
const ALLOWED_CLASSES = new Set(['PRIVATE_IDENTITY','PRIVATE_TAX','PRIVATE_BIOMETRIC','PRIVATE_CONTRACT','UNKNOWN']);

async function resolveNupsUser(base44, email: string) {
  const E = base44.asServiceRole.entities;
  const byEmail = await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = email.split('@')[0].toLowerCase();
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const nups = await resolveNupsUser(base44, String(user.email).toLowerCase());
    if (!nups) return Response.json({ error: 'Active NUPS identity required' }, { status: 403 });

    const body = await req.json();
    const venueId = String(body.venue_id || '').trim();
    const fileUri = String(body.file_uri || '').trim();
    const classification = String(body.classification || 'UNKNOWN').toUpperCase();
    const artifactType = String(body.artifact_type || 'other');
    if (!venueId || !fileUri || !fileUri.startsWith('file://')) return Response.json({ error: 'venue_id and private file_uri required' }, { status: 400 });
    if (!ALLOWED_CLASSES.has(classification)) return Response.json({ error: 'Invalid classification' }, { status: 400 });

    const global = nups.role === 'PLATFORM_ADMIN' || nups.role === 'SOVEREIGN';
    if (!global && nups.venue_id !== venueId) return Response.json({ error: 'Cross-venue evidence registration denied' }, { status: 403 });
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
      venue_id: venueId,
      content_hash: String(body.content_hash || ''),
      mime_type: String(body.mime_type || ''),
      file_name: String(body.file_name || '').slice(0, 200),
      purpose: String(body.purpose || '').slice(0, 200),
      created_by: user.email,
      created_at: new Date().toISOString(),
      mode: ['REAL','DEMO','SANDBOX'].includes(String(body.mode || '').toUpperCase()) ? String(body.mode).toUpperCase() : 'REAL',
    });
    return Response.json({ success: true, evidence_id: evidence.id, evidence_ref: evidence.evidence_id });
  } catch (error) {
    return Response.json({ error: error?.message || 'Protected evidence registration failed' }, { status: 500 });
  }
});