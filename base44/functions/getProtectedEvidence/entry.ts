import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { protectedEvidenceDecision } from './protectedEvidencePolicy.js';

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
    const evidenceId = String(body.evidence_id || '').trim();
    const purpose = String(body.purpose || 'view').trim().slice(0, 120);
    if (!evidenceId) return Response.json({ error: 'evidence_id required' }, { status: 400 });
    const evidence = await base44.asServiceRole.entities.ProtectedEvidence.get(evidenceId).catch(() => null);
    if (!evidence) return Response.json({ error: 'Protected evidence not found' }, { status: 404 });

    const decision = protectedEvidenceDecision({ role: nups.role, actorVenueId: nups.venue_id, evidenceVenueId: evidence.venue_id, classification: evidence.classification });

    if (!decision.allowed) {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'PROTECTED_EVIDENCE_ACCESS_DENIED',
        description: `Protected evidence access denied for ${evidence.evidence_id}`,
        actor_email: user.email,
        status: 'blocked', severity: 'high',
        metadata: { evidence_id: evidence.evidence_id, venue_id: evidence.venue_id, classification: evidence.classification, purpose, actor_role: nups.role, decision_reason: decision.reason },
      }).catch(() => null);
      return Response.json({ error: 'Protected evidence access denied' }, { status: 403 });
    }

    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: evidence.file_uri, expires_in: 120 });
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'PROTECTED_EVIDENCE_ACCESSED',
      description: `Authorized protected evidence retrieval for ${evidence.evidence_id}`,
      actor_email: user.email,
      status: 'success', severity: 'medium',
      metadata: { evidence_id: evidence.evidence_id, venue_id: evidence.venue_id, classification: evidence.classification, purpose, actor_role: nups.role },
    }).catch(() => null);
    return Response.json({ success: true, signed_url, expires_in: 120, evidence: { evidence_id: evidence.evidence_id, artifact_type: evidence.artifact_type, classification: evidence.classification } });
  } catch (error) {
    return Response.json({ error: error?.message || 'Protected evidence retrieval failed' }, { status: 500 });
  }
});