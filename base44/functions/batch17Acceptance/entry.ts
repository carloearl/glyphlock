import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const MANAGER_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN', 'VENUE_OWNER', 'VENUE_MANAGER']);
const DOOR_ROLES = new Set(['DOORMAN', 'DOOR_GIRL']);
const STAFF_TEST_ROLES = new Set(['BARTENDER', 'DJ']);
const REQUIRED_ASSIGNMENTS = ['VENUE_A_MANAGER', 'VENUE_A_DOOR', 'VENUE_A_STAFF', 'VENUE_B_MANAGER', 'GLOBAL_ADMIN'];
const FORBIDDEN_RESULT_KEYS = /(token|password|otp|pin|secret|signed_url|file_uri|authorization|cookie|document|content)/i;

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

async function resolveNupsUser(base44: any, email: string, activeOnly = true) {
  const E = base44.asServiceRole.entities;
  const query: Record<string, unknown> = { platform_email: email.toLowerCase() };
  if (activeOnly) query.status = 'active';
  const byEmail = await E.NUPSUser.filter(query, '-created_date', 5).catch(() => []);
  return byEmail?.[0] || null;
}

function assignmentFor(nups: any, run: any) {
  const role = String(nups?.role || '').toUpperCase();
  if (GLOBAL_ROLES.has(role)) return 'GLOBAL_ADMIN';
  if (role === 'VENUE_MANAGER' && nups.venue_id === run.venue_b_id) return 'VENUE_B_MANAGER';
  if (MANAGER_ROLES.has(role) && nups.venue_id === run.venue_a_id) return 'VENUE_A_MANAGER';
  if (DOOR_ROLES.has(role) && nups.venue_id === run.venue_a_id) return 'VENUE_A_DOOR';
  if (STAFF_TEST_ROLES.has(role) && nups.venue_id === run.venue_a_id) return 'VENUE_A_STAFF';
  return null;
}

function sanitizeCase(value: any): any {
  if (Array.isArray(value)) return value.map(sanitizeCase);
  if (!value || typeof value !== 'object') return value;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (!FORBIDDEN_RESULT_KEYS.test(key)) result[key] = sanitizeCase(nested);
  }
  return result;
}

async function audit(base44: any, user: any, nups: any, eventType: string, runId: string, status: 'success' | 'failure' | 'security_action', metadata: Record<string, unknown>) {
  await base44.asServiceRole.entities.SystemAuditLog.create({
    event_type: eventType,
    description: `${eventType} for ${runId}`,
    actor_email: user?.email || 'unknown',
    resource_id: runId,
    status,
    severity: status === 'failure' ? 'high' : 'medium',
    metadata: sanitizeCase({ run_id: runId, actor_role: nups?.role || user?.role || 'unknown', actor_venue_id: nups?.venue_id || '', ...metadata }),
  }).catch(() => null);
}

async function invokeEvidence(base44: any, evidenceId: string, purpose: string, testTtl = 0) {
  try {
    const invocation = await base44.functions.invoke('getProtectedEvidence', {
      evidence_id: evidenceId,
      purpose,
      ...(testTtl ? { test_ttl: testTtl } : {}),
    });
    const data = invocation?.data || {};
    return {
      status: Number(invocation?.status || 200),
      allowed: data.success === true && Boolean(data.signed_url),
      expires_in: data.expires_in || null,
      signed_url: data.signed_url || null,
      file_uri_leaked: JSON.stringify(data).includes('file_uri'),
      classification: data.evidence?.classification || null,
    };
  } catch (error: any) {
    const data = error?.response?.data || {};
    return {
      status: Number(error?.response?.status || 0),
      allowed: false,
      expires_in: null,
      signed_url: null,
      file_uri_leaked: JSON.stringify(data).includes('file_uri'),
      error: String(data?.error || error?.message || 'request failed').replace(/https?:\/\/\S+/g, '[URL REDACTED]').slice(0, 240),
    };
  }
}

function expectedCase(name: string, result: any, allowed: boolean) {
  const passed = result.allowed === allowed
    && result.file_uri_leaked === false
    && (allowed ? result.status >= 200 && result.status < 300 : result.status === 403)
    && (!allowed ? result.signed_url === null : true);
  return sanitizeCase({ name, expected_allowed: allowed, observed_allowed: result.allowed, status: result.status, classification: result.classification || null, passed, error: result.error || null });
}

async function loadRun(E: any, runId: string) {
  const rows = await E.Batch17AcceptanceRun.filter({ run_id: runId }, '-started_at', 2).catch(() => []);
  return rows?.[0] || null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user?.email || !user?.id) return response({ success: false, error: 'Authentication required.' }, 401);

  let nups = await resolveNupsUser(base44, String(user.email), false);
  let body: any = {};
  try {
    body = await req.json();
    const action = String(body.action || '').trim();
    const E = base44.asServiceRole.entities;

    if (action === 'claim_test_identity') {
      if (!nups || nups.is_demo !== true || !String(nups.demo_label || '').startsWith('BATCH17 AUTH TEST')) {
        return response({ success: false, error: 'No pre-approved Batch 17 identity is bound to this verified Base44 account.' }, 403);
      }
      if (nups.status !== 'active') {
        const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        nups = await E.NUPSUser.update(nups.id, { status: 'active', demo_expires_at: expires, created_note: 'Self-claimed by the matching verified Base44 account for the controlled Batch 17 acceptance window.' });
      }
      await audit(base44, user, nups, 'BATCH17_TEST_IDENTITY_CLAIMED', 'identity-claim', 'security_action', { nups_user_id: nups.id });
      return response({ success: true, identity: { role: nups.role, venue_id: nups.venue_id, demo_expires_at: nups.demo_expires_at } });
    }

    if (!nups || nups.status !== 'active') return response({ success: false, error: 'Active NUPS test identity required. Use claim_test_identity after Base44 login.' }, 403);

    if (action === 'create_run') {
      if (!GLOBAL_ROLES.has(String(nups.role || '').toUpperCase())) return response({ success: false, error: 'Global Batch 17 administrator required.' }, 403);
      const venueA = String(body.venue_a_id || '').trim();
      const venueB = String(body.venue_b_id || '').trim();
      if (!venueA || !venueB || venueA === venueB) return response({ success: false, error: 'Two distinct test venues are required.' }, 400);
      const venueARows = await E.Venue.filter({ venue_id: venueA }, null, 2).catch(() => []);
      const venueBRows = await E.Venue.filter({ venue_id: venueB }, null, 2).catch(() => []);
      const rateB = await E.VenueRateConfig.filter({ venue_id: venueB, mode: 'SANDBOX' }, null, 2).catch(() => []);
      if (!venueARows?.[0] || !venueBRows?.[0] || !rateB?.[0]) return response({ success: false, error: 'Venue A and isolated SANDBOX Venue B must exist.' }, 400);
      if (venueB === 'B17_SANDBOX_VENUE') {
        if (venueBRows[0].status !== 'active') await E.Venue.update(venueBRows[0].id, { status: 'active' });
        if (rateB[0].active !== true) await E.VenueRateConfig.update(rateB[0].id, { active: true });
      }
      const now = new Date();
      const run = await E.Batch17AcceptanceRun.create({
        run_id: `B17-${crypto.randomUUID()}`,
        status: 'PREPARING',
        venue_a_id: venueA,
        venue_b_id: venueB,
        mode: 'SANDBOX',
        evidence_ids: {},
        required_assignments: REQUIRED_ASSIGNMENTS,
        completed_assignments: [],
        started_by: user.email,
        started_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        notes: 'Synthetic Batch 17 browser-session acceptance. No REAL evidence, money, liabilities, contracts, or staff operations.',
      });
      await audit(base44, user, nups, 'BATCH17_ACCEPTANCE_RUN_CREATED', run.run_id, 'security_action', { venue_a_id: venueA, venue_b_id: venueB });
      return response({ success: true, run: { run_id: run.run_id, status: run.status, venue_a_id: venueA, venue_b_id: venueB, expires_at: run.expires_at } });
    }

    const runId = String(body.run_id || '').trim();
    if (!runId) return response({ success: false, error: 'run_id required.' }, 400);
    const run = await loadRun(E, runId);
    if (!run) return response({ success: false, error: 'Acceptance run not found.' }, 404);
    if (Date.parse(run.expires_at || '') <= Date.now()) {
      if (run.status !== 'EXPIRED') await E.Batch17AcceptanceRun.update(run.id, { status: 'EXPIRED' });
      return response({ success: false, error: 'Acceptance run expired.' }, 410);
    }
    const assignment = assignmentFor(nups, run);
    if (!assignment) return response({ success: false, error: 'This NUPS role and venue are not assigned to the acceptance run.' }, 403);

    if (action === 'status') {
      return response({ success: true, assignment, run: { run_id: run.run_id, status: run.status, venue_a_id: run.venue_a_id, venue_b_id: run.venue_b_id, evidence_ready: Object.keys(run.evidence_ids || {}).length === 4, completed_assignments: run.completed_assignments || [], expiry_result: run.expiry_result || null, expires_at: run.expires_at } });
    }

    if (action === 'register_evidence') {
      if (assignment !== 'VENUE_A_MANAGER' && assignment !== 'GLOBAL_ADMIN') return response({ success: false, error: 'Venue A manager or global administrator required.' }, 403);
      const supplied = body.evidence_ids || {};
      const required = ['identity', 'tax', 'biometric', 'contract'];
      const validated: Record<string, string> = {};
      for (const key of required) {
        const record = await E.ProtectedEvidence.get(String(supplied[key] || '')).catch(() => null);
        if (!record || record.venue_id !== run.venue_a_id || record.mode !== 'SANDBOX' || record.subject_entity !== 'Batch17SyntheticEvidence') {
          return response({ success: false, error: `Invalid synthetic ${key} evidence.` }, 400);
        }
        validated[key] = record.id;
      }
      const updated = await E.Batch17AcceptanceRun.update(run.id, { evidence_ids: validated, status: 'READY' });
      await audit(base44, user, nups, 'BATCH17_SYNTHETIC_EVIDENCE_REGISTERED', runId, 'security_action', { evidence_types: required });
      return response({ success: true, run: { run_id: updated.run_id, status: updated.status, evidence_ready: true } });
    }

    if (action === 'execute_assignment') {
      const ids = run.evidence_ids || {};
      if (!ids.identity || !ids.tax || !ids.biometric || !ids.contract) return response({ success: false, error: 'Synthetic evidence is not ready.' }, 409);
      const startedAt = new Date().toISOString();
      const cases: any[] = [];
      let expiryProbe: any = null;
      if (assignment === 'VENUE_A_MANAGER') {
        const identity = await invokeEvidence(base44, ids.identity, 'batch17:manager_identity', 10);
        cases.push(expectedCase('same_venue_manager_identity_allow', identity, true));
        cases.push(expectedCase('same_venue_manager_tax_allow', await invokeEvidence(base44, ids.tax, 'batch17:manager_tax'), true));
        cases.push(expectedCase('same_venue_manager_biometric_allow', await invokeEvidence(base44, ids.biometric, 'batch17:manager_biometric'), true));
        cases.push(expectedCase('same_venue_manager_contract_allow', await invokeEvidence(base44, ids.contract, 'batch17:manager_contract'), true));
        expiryProbe = identity.allowed ? { signed_url: identity.signed_url, expires_in: identity.expires_in, evidence_id: ids.identity } : null;
      } else if (assignment === 'VENUE_A_DOOR') {
        cases.push(expectedCase('door_identity_allow', await invokeEvidence(base44, ids.identity, 'batch17:door_identity'), true));
        cases.push(expectedCase('door_tax_deny', await invokeEvidence(base44, ids.tax, 'batch17:door_tax'), false));
        cases.push(expectedCase('door_biometric_deny', await invokeEvidence(base44, ids.biometric, 'batch17:door_biometric'), false));
      } else if (assignment === 'VENUE_A_STAFF') {
        cases.push(expectedCase('ordinary_staff_identity_deny', await invokeEvidence(base44, ids.identity, 'batch17:staff_identity'), false));
        cases.push(expectedCase('ordinary_staff_contract_deny', await invokeEvidence(base44, ids.contract, 'batch17:staff_contract'), false));
      } else if (assignment === 'VENUE_B_MANAGER') {
        cases.push(expectedCase('wrong_venue_manager_deny', await invokeEvidence(base44, ids.identity, 'batch17:wrong_venue'), false));
      } else if (assignment === 'GLOBAL_ADMIN') {
        cases.push(expectedCase('global_cross_venue_allow', await invokeEvidence(base44, ids.identity, 'batch17:global_cross_venue'), true));
      }
      const passed = cases.length > 0 && cases.every((item) => item.passed === true);
      const previous = await E.Batch17AcceptanceResult.filter({ run_id: runId, assignment }, '-completed_at', 10).catch(() => []);
      if (previous.some((item: any) => item.status === 'PASS')) return response({ success: false, error: 'This assignment already passed.' }, 409);
      await E.Batch17AcceptanceResult.create({
        result_id: crypto.randomUUID(), run_id: runId, assignment,
        actor_user_id: user.id, actor_email: user.email, actor_role: nups.role, actor_venue_id: nups.venue_id || '',
        status: passed ? 'PASS' : 'FAIL', cases: sanitizeCase(cases), started_at: startedAt, completed_at: new Date().toISOString(),
        metadata: { signed_url_returned_to_assigned_browser: Boolean(expiryProbe), secret_material_stored: false },
      });
      const completed = new Set(run.completed_assignments || []);
      if (passed) completed.add(assignment);
      await E.Batch17AcceptanceRun.update(run.id, { status: 'RUNNING', completed_assignments: [...completed] });
      await audit(base44, user, nups, passed ? 'BATCH17_ASSIGNMENT_PASSED' : 'BATCH17_ASSIGNMENT_FAILED', runId, passed ? 'success' : 'failure', { assignment, cases: sanitizeCase(cases) });
      return response({ success: passed, assignment, cases: sanitizeCase(cases), expiry_probe: expiryProbe });
    }

    if (action === 'record_expiry') {
      if (assignment !== 'VENUE_A_MANAGER') return response({ success: false, error: 'Venue A manager must record the signed-link expiry result.' }, 403);
      const immediateStatus = Number(body.immediate_status || 0);
      const postExpiryStatus = Number(body.post_expiry_status || 0);
      const elapsedSeconds = Number(body.elapsed_seconds || 0);
      const passed = immediateStatus >= 200 && immediateStatus < 300 && !(postExpiryStatus >= 200 && postExpiryStatus < 300) && elapsedSeconds >= 10;
      const expiry = { status: passed ? 'PASS' : 'FAIL', immediate_status: immediateStatus, post_expiry_status: postExpiryStatus, elapsed_seconds: elapsedSeconds, signed_url_stored: false };
      await E.Batch17AcceptanceResult.create({
        result_id: crypto.randomUUID(), run_id: runId, assignment: 'SIGNED_URL_EXPIRY',
        actor_user_id: user.id, actor_email: user.email, actor_role: nups.role, actor_venue_id: nups.venue_id || '',
        status: passed ? 'PASS' : 'FAIL', cases: [expiry], started_at: new Date(Date.now() - Math.max(0, elapsedSeconds) * 1000).toISOString(), completed_at: new Date().toISOString(),
        metadata: { signed_url_stored: false },
      });
      await E.Batch17AcceptanceRun.update(run.id, { expiry_result: expiry });
      await audit(base44, user, nups, passed ? 'BATCH17_SIGNED_URL_EXPIRY_PASSED' : 'BATCH17_SIGNED_URL_EXPIRY_FAILED', runId, passed ? 'success' : 'failure', expiry);
      return response({ success: passed, expiry_result: expiry });
    }

    if (action === 'finalize') {
      if (assignment !== 'GLOBAL_ADMIN') return response({ success: false, error: 'Global administrator required.' }, 403);
      const results = await E.Batch17AcceptanceResult.filter({ run_id: runId }, '-completed_at', 100).catch(() => []);
      const passAssignments = new Set(results.filter((item: any) => item.status === 'PASS').map((item: any) => item.assignment));
      const assignmentsPassed = REQUIRED_ASSIGNMENTS.every((item) => passAssignments.has(item));
      const expiryPassed = passAssignments.has('SIGNED_URL_EXPIRY') && run.expiry_result?.status === 'PASS';
      const evidenceRecords = await Promise.all(Object.values(run.evidence_ids || {}).map((id: any) => E.ProtectedEvidence.get(String(id)).catch(() => null)));
      const evidenceRefs = new Set(evidenceRecords.filter(Boolean).map((item: any) => item.evidence_id));
      const audits = await E.SystemAuditLog.filter({ event_type: { $in: ['PROTECTED_EVIDENCE_ACCESSED', 'PROTECTED_EVIDENCE_ACCESS_DENIED'] } }, '-created_date', 500).catch(() => []);
      const relevant = audits.filter((item: any) => evidenceRefs.has(item?.metadata?.evidence_id));
      const serialized = JSON.stringify(relevant.map((item: any) => item.metadata || {}));
      const auditSafe = !/(file_uri|signed_url|https?:\/\/|password|token|otp|pin)/i.test(serialized);
      const accessCount = relevant.filter((item: any) => item.event_type === 'PROTECTED_EVIDENCE_ACCESSED').length;
      const denialCount = relevant.filter((item: any) => item.event_type === 'PROTECTED_EVIDENCE_ACCESS_DENIED').length;
      const auditPassed = auditSafe && accessCount >= 6 && denialCount >= 5;
      const passed = assignmentsPassed && expiryPassed && auditPassed;
      const auditResult = { status: auditPassed ? 'PASS' : 'FAIL', access_events: accessCount, denial_events: denialCount, protected_reference_leak: !auditSafe };
      await E.Batch17AcceptanceRun.update(run.id, { status: passed ? 'PASSED' : 'FAILED', audit_result: auditResult, completed_at: new Date().toISOString() });
      await audit(base44, user, nups, passed ? 'BATCH17_AUTHENTICATED_ACCEPTANCE_PASSED' : 'BATCH17_AUTHENTICATED_ACCEPTANCE_FAILED', runId, passed ? 'success' : 'failure', { assignments_passed: assignmentsPassed, expiry_passed: expiryPassed, audit_result: auditResult });
      return response({ success: passed, status: passed ? 'PASSED' : 'FAILED', assignments_passed: assignmentsPassed, expiry_passed: expiryPassed, audit_result: auditResult });
    }

    return response({ success: false, error: 'Unsupported Batch 17 acceptance action.' }, 400);
  } catch (error: any) {
    await audit(base44, user, nups, 'BATCH17_ACCEPTANCE_ERROR', String(body.run_id || 'unknown'), 'failure', { error: String(error?.message || 'Acceptance action failed').slice(0, 240) });
    return response({ success: false, error: error?.message || 'Batch 17 acceptance action failed.' }, 500);
  }
});
