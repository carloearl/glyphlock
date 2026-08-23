import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const MANAGER_ROLES = new Set(['VENUE_OWNER', 'VENUE_MANAGER']);
const DOOR_ROLES = new Set(['DOOR_GIRL', 'DOORMAN']);

function response(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

async function resolveNupsUser(base44: any, email: string) {
  const E = base44.asServiceRole.entities;
  const normalized = email.toLowerCase();
  const byEmail = await E.NUPSUser.filter({ platform_email: normalized, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = normalized.split('@')[0];
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

function expectedDecision(nups: any, evidence: any) {
  const role = String(nups.role || '');
  const sameVenue = Boolean(nups.venue_id && evidence.venue_id && nups.venue_id === evidence.venue_id);
  if (GLOBAL_ROLES.has(role)) return { decision: 'ALLOW', reason: 'global_role' };
  if (MANAGER_ROLES.has(role) && sameVenue) return { decision: 'ALLOW', reason: 'same_venue_manager' };
  if (DOOR_ROLES.has(role) && sameVenue && evidence.classification === 'PRIVATE_IDENTITY') {
    return { decision: 'ALLOW', reason: 'door_identity_only' };
  }
  if (!sameVenue) return { decision: 'DENY', reason: 'venue_mismatch' };
  return { decision: 'DENY', reason: 'role_or_classification_denied' };
}

function cleanStatus(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 && number <= 599 ? number : 0;
}

Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return response(401, { error: 'Authentication required' });
    const nups = await resolveNupsUser(base44, String(user.email));
    if (!nups) return response(403, { error: 'Active NUPS identity required' });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'record');
    const E = base44.asServiceRole.entities;

    if (action === 'matrix') {
      if (!GLOBAL_ROLES.has(String(nups.role || ''))) return response(403, { error: 'Global acceptance role required' });
      const rows = await E.Batch17AcceptanceResult.list('-tested_at', 250).catch(() => []);
      return response(200, {
        success: true,
        results: (rows || []).map((row: any) => ({
          result_id: row.result_id,
          run_id: row.run_id,
          case_name: row.case_name,
          actor_email: row.actor_email,
          actor_role: row.actor_role,
          actor_venue_id: row.actor_venue_id,
          evidence_classification: row.evidence_classification,
          evidence_venue_id: row.evidence_venue_id,
          expected_decision: row.expected_decision,
          observed_decision: row.observed_decision,
          http_status: row.http_status,
          immediate_fetch_status: row.immediate_fetch_status,
          post_expiry_status: row.post_expiry_status,
          audit_event_found: row.audit_event_found,
          result: row.result,
          failure_reason: row.failure_reason,
          tested_at: row.tested_at,
        })),
      });
    }

    const evidenceId = String(body.evidence_id || '').trim();
    const runId = String(body.run_id || '').trim().slice(0, 120);
    const caseName = String(body.case_name || '').trim().slice(0, 120);
    const purpose = String(body.purpose || '').trim().slice(0, 160);
    if (!evidenceId || !runId || !caseName || !purpose) return response(400, { error: 'evidence_id, run_id, case_name and purpose are required' });
    if (!caseName.startsWith('B17_') || !purpose.startsWith('batch17:')) return response(400, { error: 'Batch 17 acceptance labels are required' });

    const evidence = await E.ProtectedEvidence.get(evidenceId).catch(() => null);
    if (!evidence) return response(404, { error: 'Protected evidence not found' });
    const synthetic = evidence.mode === 'SANDBOX'
      && (String(evidence.subject_entity || '') === 'Batch17SyntheticEvidence' || String(evidence.purpose || '').includes('batch17'));
    if (!synthetic) return response(403, { error: 'Only synthetic SANDBOX evidence may be used' });

    const expected = expectedDecision(nups, evidence);
    const observedDecision = ['ALLOW', 'DENY', 'ERROR'].includes(String(body.observed_decision || '').toUpperCase())
      ? String(body.observed_decision).toUpperCase()
      : 'ERROR';
    const httpStatus = cleanStatus(body.http_status);
    const immediateStatus = cleanStatus(body.immediate_fetch_status);
    const postExpiryStatus = cleanStatus(body.post_expiry_status);
    const expiresIn = Math.min(300, Math.max(0, Number(body.expires_in || 0)));
    const signedUrlHash = /^[a-f0-9]{64}$/i.test(String(body.signed_url_hash || '')) ? String(body.signed_url_hash).toLowerCase() : '';

    const auditRows = await E.SystemAuditLog.filter({ actor_email: user.email }, '-created_date', 200).catch(() => []);
    const expectedEvent = expected.decision === 'ALLOW' ? 'PROTECTED_EVIDENCE_ACCESSED' : 'PROTECTED_EVIDENCE_ACCESS_DENIED';
    const audit = (auditRows || []).find((row: any) => row.event_type === expectedEvent
      && row?.metadata?.evidence_id === evidence.evidence_id
      && row?.metadata?.purpose === purpose);

    let result = observedDecision === expected.decision && Boolean(audit) ? 'PASS' : 'FAIL';
    let failureReason = result === 'PASS' ? '' : 'Decision or corresponding audit evidence did not match the server-derived expectation.';
    if (caseName === 'B17_SIGNED_URL_EXPIRY') {
      const expiryPassed = expected.decision === 'ALLOW'
        && observedDecision === 'ALLOW'
        && immediateStatus >= 200 && immediateStatus < 300
        && postExpiryStatus >= 400
        && expiresIn > 0
        && Boolean(signedUrlHash)
        && Boolean(audit);
      result = expiryPassed ? 'PASS' : 'NOT_VERIFIED';
      failureReason = expiryPassed ? '' : 'Authenticated immediate-use and post-expiry rejection were not both proven.';
    }

    const row = await E.Batch17AcceptanceResult.create({
      result_id: crypto.randomUUID(),
      run_id: runId,
      case_name: caseName,
      actor_email: String(user.email).toLowerCase(),
      actor_role: String(nups.role || ''),
      actor_venue_id: String(nups.venue_id || ''),
      evidence_id: evidence.evidence_id,
      evidence_classification: evidence.classification,
      evidence_venue_id: evidence.venue_id,
      expected_decision: expected.decision,
      observed_decision: observedDecision,
      http_status: httpStatus,
      immediate_fetch_status: immediateStatus,
      post_expiry_status: postExpiryStatus,
      expires_in: expiresIn,
      signed_url_hash: signedUrlHash,
      audit_event_found: Boolean(audit),
      result,
      failure_reason: failureReason,
      synthetic_only: true,
      tested_at: new Date().toISOString(),
      metadata: {
        expected_reason: expected.reason,
        purpose,
        token_recorded: false,
        signed_url_recorded: false,
        private_file_uri_recorded: false,
      },
    });

    return response(200, {
      success: true,
      result: {
        result_id: row.result_id,
        case_name: row.case_name,
        expected_decision: row.expected_decision,
        observed_decision: row.observed_decision,
        audit_event_found: row.audit_event_found,
        result: row.result,
        failure_reason: row.failure_reason,
      },
    });
  } catch (error: any) {
    return response(500, { error: error?.message || 'Unable to record Batch 17 acceptance result' });
  }
});
