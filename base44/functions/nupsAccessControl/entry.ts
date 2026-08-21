import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §4–7 — Owner/Admin access request, approval, and back-office authorization.
// Approval authority: sovereign owner accounts plus any expressly approved
// OWNER or ADMINISTRATOR. Owners and administrators may approve their own
// request. All decisions append to the request's decision_log.

const OWNER_EMAIL = 'carloearl@glyphlock.com';

// Sovereign accounts — never need an access request (owner directive 2026-08-19).
const SOVEREIGN_EMAILS = ['carloearl@glyphlock.com', 'carloearl@gmail.com', 'svsantos@outlook.com'];

// Any staff role may request access; ADMINISTRATOR / OWNER are privileged tiers.
const STAFF_ROLES = ['ENTERTAINER', 'HOSTESS', 'DOORMAN', 'DOOR_GIRL', 'BARTENDER', 'DJ', 'SECURITY', 'MANAGER'];
const REQUESTABLE_ROLES = [...STAFF_ROLES, 'ADMINISTRATOR', 'OWNER'];

// Requested role → NUPSUser.role
const NUPS_ROLE_MAP = {
  OWNER: 'VENUE_OWNER',
  ADMINISTRATOR: 'PLATFORM_ADMIN',
  MANAGER: 'VENUE_MANAGER',
  ENTERTAINER: 'PERFORMER',
  HOSTESS: 'HOSTESS',
  DOORMAN: 'DOORMAN',
  DOOR_GIRL: 'DOOR_GIRL',
  BARTENDER: 'BARTENDER',
  DJ: 'DJ',
  SECURITY: 'SECURITY',
};

// Decision authority (owner directive 2026-08-21): sovereign accounts plus
// any APPROVED OWNER or ADMINISTRATOR may decide — including on their own
// request (self-approval permitted for owner/admin authority).
async function isAuthorizedOwner(base44, email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  if (SOVEREIGN_EMAILS.includes(e)) return true;
  const approved = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email: e, status: 'APPROVED' });
  return (approved || []).some(r => ['OWNER', 'ADMINISTRATOR'].includes(r.granted_role));
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
      if (!full_legal_name || !requested_role || !reason || !venue_id) {
        return Response.json({ error: 'Full legal name, requested access type, reason, and active venue are required.' }, { status: 400 });
      }
      if (!REQUESTABLE_ROLES.includes(requested_role)) {
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
        venue_id,
        reason,
        status: 'PENDING_OWNER_APPROVAL',
        mode: ['SANDBOX', 'DEMO'].includes(mode) ? mode : 'SANDBOX',
        decision_log: [{ decision: 'SUBMITTED', by: email, note: '', timestamp: new Date().toISOString() }],
      });
      // Owner notification — requests can be approved in-app (NUPSAdminPortal /
      // AccessRequests) or acted on from this email.
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          from_name: 'NUPS Access Control',
          subject: `NUPS access request — ${full_legal_name} (${requested_role})`,
          body: [
            'A new NUPS access request is pending owner approval.',
            '',
            `Name: ${full_legal_name}`,
            `Email: ${email}`,
            `Phone: ${phone || '—'}`,
            `Requested role: ${requested_role}`,
            `Mode: ${rec.mode}`,
            `Venue: ${rec.venue_id}`,
            `Reason: ${reason}`,
            '',
            `Request ID: ${rec.id}`,
            'Approve or reject in the app: /AccessRequests',
          ].join('\n'),
        });
      } catch (mailErr) {
        console.warn('Access request notification failed:', mailErr.message);
      }

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
      if (SOVEREIGN_EMAILS.includes(email)) {
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
      const destination =
        grant.granted_role === 'ENTERTAINER' ? '/EntertainerHome'
        : ['ADMINISTRATOR', 'OWNER'].includes(grant.granted_role) ? '/NUPSAdminPortal'
        : '/StaffHome';
      return Response.json({ authorized: true, granted_role: grant.granted_role, destination, full_name: grant.full_legal_name });
    }

    // ─── OWNER-ONLY ACTIONS BELOW (§5) ──────────────────────────────────────
    const ownerOk = await isAuthorizedOwner(base44, email);
    if (!ownerOk) return Response.json({ error: 'Owner approval authority required.' }, { status: 403 });

    if (action === 'listRequests') {
      const all = await base44.asServiceRole.entities.NUPSAccessRequest.list('-created_date', 200);
      return Response.json({ requests: (all || []).map(safeRequest) });
    }

    if (action === 'decide') {
      // Decision authority already verified above (isAuthorizedOwner):
      // sovereign accounts and approved OWNER/ADMINISTRATOR grants.
      // Self-approval is permitted for owner/admin authority (directive 2026-08-21).
      const { request_id, decision, note } = body;
      const valid = ['APPROVE_ENTERTAINER', 'APPROVE_STAFF', 'APPROVE_ADMIN', 'APPROVE_OWNER', 'REJECT', 'REQUEST_INFO', 'SUSPEND', 'REVOKE'];
      if (!request_id || !valid.includes(decision)) {
        return Response.json({ error: 'request_id and a valid decision are required.' }, { status: 400 });
      }
      const r = await base44.asServiceRole.entities.NUPSAccessRequest.get(request_id).catch(() => null);
      if (!r) return Response.json({ error: 'Request not found.' }, { status: 404 });

      const now = new Date().toISOString();
      const log = [...(r.decision_log || []), { decision, by: email, note: note || '', timestamp: now }];
      const patch = { decided_by: email, decided_at: now, decision_note: note || '', decision_log: log };

      if (['APPROVE_ENTERTAINER', 'APPROVE_STAFF', 'APPROVE_ADMIN', 'APPROVE_OWNER'].includes(decision)) {
        if (!r.venue_id) return Response.json({ error: 'Request is missing an active venue assignment.' }, { status: 409 });
        // APPROVE_STAFF grants exactly the staff role that was requested.
        const grantedRole =
          decision === 'APPROVE_OWNER' ? 'OWNER'
          : decision === 'APPROVE_ADMIN' ? 'ADMINISTRATOR'
          : decision === 'APPROVE_STAFF' && STAFF_ROLES.includes(r.requested_role) ? r.requested_role
          : 'ENTERTAINER';
        // Create (or reactivate) the NUPS account bound to the platform email.
        let nupsUserId = r.nups_user_id;
        const nupsRole = NUPS_ROLE_MAP[grantedRole] || 'PERFORMER';
        if (nupsUserId) {
          await base44.asServiceRole.entities.NUPSUser.update(nupsUserId, { status: 'active', role: nupsRole, approved_by: email });
        } else {
          const nu = await base44.asServiceRole.entities.NUPSUser.create({
            username: r.email,
            full_name: r.full_legal_name,
            role: nupsRole,
            venue_id: r.venue_id,
            platform_email: r.email,
            approved_by: email,
            status: 'active',
            is_demo: ['SANDBOX', 'DEMO', 'TEST'].includes(r.mode),
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