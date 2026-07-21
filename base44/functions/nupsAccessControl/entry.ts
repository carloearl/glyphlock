import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §4–7 — Owner/Admin access request, approval, and back-office authorization.
// Approval authority: Carlo Earl's owner account, plus any expressly approved OWNER.
// No applicant may self-approve. All decisions append to the request's decision_log.

const OWNER_EMAIL = 'carloearl@glyphlock.com';

// Decision lockdown (owner directive 2026-07-21): ONLY Carlo Earl's accounts
// may approve/reject/suspend/revoke owner-admin access requests. Approved
// OWNERs may still VIEW the list, but cannot decide.
const DECISION_EMAILS = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];

async function isAuthorizedOwner(base44, email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  if (e === OWNER_EMAIL) return true;
  const approved = await base44.asServiceRole.entities.NUPSAccessRequest.filter({
    email: e, status: 'APPROVED', granted_role: 'OWNER'
  });
  return (approved || []).length > 0;
}

function safeRequest(r) {
  return {
    id: r.id,
    full_legal_name: r.full_legal_name,
    email: r.email,
    phone: r.phone,
    requested_role: r.requested_role,
    venue_id: r.venue_id,
    reason: r.reason,
    status: r.status,
    granted_role: r.granted_role || null,
    decided_by: r.decided_by || null,
    decided_at: r.decided_at || null,
    decision_note: r.decision_note || null,
    decision_log: r.decision_log || [],
    mode: r.mode,
    created_date: r.created_date,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // Every action requires an authenticated platform user (email is platform-verified).
    let user = null;
    try { user = await base44.auth.me(); } catch { /* not signed in */ }
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const email = String(user.email || '').trim().toLowerCase();

    // ─── SUBMIT ACCESS REQUEST (§4) ─────────────────────────────────────────
    if (action === 'submitRequest') {
      const { full_legal_name, phone, requested_role, venue_id, reason, mode } = body;
      if (!full_legal_name || !requested_role || !reason) {
        return Response.json({ error: 'Full legal name, requested access type, and reason are required.' }, { status: 400 });
      }
      if (!['ADMINISTRATOR', 'OWNER'].includes(requested_role)) {
        return Response.json({ error: 'Invalid access type.' }, { status: 400 });
      }
      const existing = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email });
      const open = (existing || []).find(r => ['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION'].includes(r.status));
      if (open) return Response.json({ error: 'You already have a pending access request.', request: safeRequest(open) }, { status: 409 });
      const approvedAlready = (existing || []).find(r => r.status === 'APPROVED');
      if (approvedAlready) return Response.json({ error: 'You already have approved access. Use Owner/Admin Sign In.', request: safeRequest(approvedAlready) }, { status: 409 });

      const rec = await base44.asServiceRole.entities.NUPSAccessRequest.create({
        full_legal_name,
        email,
        phone: phone || '',
        requested_role,
        venue_id: venue_id || 'dream_palace',
        reason,
        status: 'PENDING_OWNER_APPROVAL',
        mode: mode === 'TEST' ? 'TEST' : 'REAL',
        decision_log: [{ decision: 'SUBMITTED', by: email, note: '', timestamp: new Date().toISOString() }],
      });
      return Response.json({ success: true, request: safeRequest(rec) });
    }

    // ─── MY STATUS (requester checks own request) ───────────────────────────
    if (action === 'myStatus') {
      const mine = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email }, '-created_date', 5);
      return Response.json({ requests: (mine || []).map(safeRequest) });
    }

    // ─── CHECK BACK-OFFICE ACCESS (§6–7) ────────────────────────────────────
    if (action === 'checkAccess') {
      // DACO-NUPS-RBAC-CORRECTION-20260717 §5 — no implicit platform-admin ownership.
      // Back office requires Carlo's protected Owner identity or an explicit APPROVED grant.
      if (email === OWNER_EMAIL) {
        return Response.json({ authorized: true, granted_role: 'OWNER', destination: '/NUPSAdminPortal', full_name: user.full_name });
      }
      const mine = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email, status: 'APPROVED' }, '-created_date', 5);
      const grant = (mine || [])[0];
      if (!grant) {
        const pending = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email }, '-created_date', 1);
        const p = (pending || [])[0];
        return Response.json({
          authorized: false,
          reason: p ? `Access request status: ${p.status}` : 'No approved owner/administrator access for this account.',
        });
      }
      // Verify the linked NUPS account is still active (revocation takes effect immediately).
      if (grant.nups_user_id) {
        const nu = await base44.asServiceRole.entities.NUPSUser.get(grant.nups_user_id).catch(() => null);
        if (!nu || nu.status !== 'active') {
          return Response.json({ authorized: false, reason: 'Account has been suspended or revoked.' });
        }
      }
      return Response.json({ authorized: true, granted_role: grant.granted_role, destination: '/NUPSAdminPortal', full_name: grant.full_legal_name });
    }

    // ─── OWNER-ONLY ACTIONS BELOW (§5) ──────────────────────────────────────
    const ownerOk = await isAuthorizedOwner(base44, email);
    if (!ownerOk) return Response.json({ error: 'Owner approval authority required.' }, { status: 403 });

    if (action === 'listRequests') {
      const all = await base44.asServiceRole.entities.NUPSAccessRequest.list('-created_date', 200);
      return Response.json({ requests: (all || []).map(safeRequest) });
    }

    if (action === 'decide') {
      // §5 lockdown — decision authority is Carlo Earl only, regardless of
      // any granted OWNER role.
      if (!DECISION_EMAILS.includes(email)) {
        return Response.json({ error: 'Only Carlo Earl can approve or revoke owner/admin access.' }, { status: 403 });
      }
      const { request_id, decision, note } = body;
      const valid = ['APPROVE_ADMIN', 'APPROVE_OWNER', 'REJECT', 'REQUEST_INFO', 'SUSPEND', 'REVOKE'];
      if (!request_id || !valid.includes(decision)) {
        return Response.json({ error: 'request_id and a valid decision are required.' }, { status: 400 });
      }
      const r = await base44.asServiceRole.entities.NUPSAccessRequest.get(request_id).catch(() => null);
      if (!r) return Response.json({ error: 'Request not found.' }, { status: 404 });
      if (String(r.email).toLowerCase() === email) {
        return Response.json({ error: 'Self-approval is prohibited.' }, { status: 403 });
      }

      const now = new Date().toISOString();
      const log = [...(r.decision_log || []), { decision, by: email, note: note || '', timestamp: now }];
      const patch = { decided_by: email, decided_at: now, decision_note: note || '', decision_log: log };

      if (decision === 'APPROVE_ADMIN' || decision === 'APPROVE_OWNER') {
        const grantedRole = decision === 'APPROVE_OWNER' ? 'OWNER' : 'ADMINISTRATOR';
        // Create (or reactivate) the NUPS back-office account bound to the platform email.
        let nupsUserId = r.nups_user_id;
        const nupsRole = grantedRole === 'OWNER' ? 'VENUE_OWNER' : 'PLATFORM_ADMIN';
        if (nupsUserId) {
          await base44.asServiceRole.entities.NUPSUser.update(nupsUserId, { status: 'active', role: nupsRole, approved_by: email });
        } else {
          const nu = await base44.asServiceRole.entities.NUPSUser.create({
            username: r.email,
            full_name: r.full_legal_name,
            role: nupsRole,
            venue_id: r.venue_id || 'dream_palace',
            platform_email: r.email,
            approved_by: email,
            status: 'active',
            is_demo: r.mode === 'TEST',
            created_note: `Approved via NUPSAccessRequest ${r.id} (${decision})`,
          });
          nupsUserId = nu.id;
        }
        const updated = await base44.asServiceRole.entities.NUPSAccessRequest.update(request_id, {
          ...patch, status: 'APPROVED', granted_role: grantedRole, nups_user_id: nupsUserId,
        });
        return Response.json({ success: true, request: safeRequest(updated) });
      }

      const statusMap = { REJECT: 'REJECTED', REQUEST_INFO: 'NEEDS_INFORMATION', SUSPEND: 'SUSPENDED', REVOKE: 'REVOKED' };
      const newStatus = statusMap[decision];
      // Revocation / suspension deactivates the linked account immediately.
      if ((decision === 'REVOKE' || decision === 'SUSPEND') && r.nups_user_id) {
        await base44.asServiceRole.entities.NUPSUser.update(r.nups_user_id, {
          status: decision === 'REVOKE' ? 'terminated' : 'suspended',
        }).catch(() => null);
      }
      const updated = await base44.asServiceRole.entities.NUPSAccessRequest.update(request_id, {
        ...patch, status: newStatus, granted_role: decision.startsWith('APPROVE') ? r.granted_role : '',
      });
      return Response.json({ success: true, request: safeRequest(updated) });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});