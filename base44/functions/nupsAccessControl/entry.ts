import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import {
  APPROVAL_DECISIONS,
  STAFF_ROLES,
  VALID_DECISIONS,
  canAuthorityActOnRequest,
  decisionMatchesRequestedRole,
  isDecisionAllowedFromStatus,
  isValidIdempotencyKey,
  normalizeEmail,
} from './policy.mjs';

// DACO-NUPS Phase 18.1 — Owner/Admin access request, approval, and back-office authorization.
// Approval authority: sovereign owner accounts plus expressly approved OWNER
// or ADMINISTRATOR grants. Self-approval is forbidden, and administrators
// cannot grant OWNER. All decisions append to the request's decision_log.

const OWNER_EMAIL = 'carloearl@glyphlock.com';

// Sovereign accounts — never need an access request (owner directive 2026-08-19).
const SOVEREIGN_EMAILS = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];

// Any staff role may request access; ADMINISTRATOR / OWNER are privileged tiers.
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

// Return the actor's exact decision tier so server-side policy can distinguish
// OWNER from ADMINISTRATOR. UI visibility is never used as authorization.
async function getDecisionAuthority(base44, email) {
  const e = normalizeEmail(email);
  if (!e) return null;
  if (SOVEREIGN_EMAILS.includes(e)) return { tier: 'SOVEREIGN', venue_id: null, mode: null };
  const approved = await base44.asServiceRole.entities.NUPSAccessRequest.filter(
    { email: e, status: 'APPROVED' }, '-created_date', 20,
  );
  for (const tier of ['OWNER', 'ADMINISTRATOR']) {
    for (const grant of (approved || []).filter((r) => r.granted_role === tier)) {
      if (!grant.nups_user_id) continue;
      const account = await base44.asServiceRole.entities.NUPSUser.get(grant.nups_user_id).catch(() => null);
      if (
        account?.status === 'active'
        && normalizeEmail(account.platform_email) === e
        && account.venue_id === grant.venue_id
      ) {
        return { tier, venue_id: grant.venue_id, mode: grant.mode, nups_user_id: grant.nups_user_id };
      }
    }
  }
  return null;
}

async function getActiveVenue(base44, venueRef) {
  const ref = String(venueRef || '').trim();
  if (!ref) return null;
  let venue = await base44.asServiceRole.entities.Venue.get(ref).catch(() => null);
  if (!venue) {
    const matches = await base44.asServiceRole.entities.Venue.filter({ venue_id: ref }, '-created_date', 2);
    venue = (matches || [])[0] || null;
  }
  return venue?.status === 'active' ? venue : null;
}

function canonicalVenueId(venue) {
  return String(venue?.venue_id || venue?.id || '').trim();
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
    const email = normalizeEmail(user.email);

    // ─── SUBMIT ACCESS REQUEST (§4) ─────────────────────────────────────────
    if (action === 'submitRequest') {
      const { full_legal_name, phone, requested_role, venue_id, reason, mode } = body;
      if (!full_legal_name || !requested_role || !reason || !venue_id) {
        return Response.json({ error: 'Full legal name, requested access type, reason, and active venue are required.' }, { status: 400 });
      }
      if (!REQUESTABLE_ROLES.includes(requested_role)) {
        return Response.json({ error: 'Invalid access type.' }, { status: 400 });
      }
      const venue = await getActiveVenue(base44, venue_id);
      if (!venue) return Response.json({ error: 'Select an active venue before requesting access.' }, { status: 400 });
      const resolvedVenueId = canonicalVenueId(venue);
      const resolvedMode = ['SANDBOX', 'DEMO'].includes(mode) ? mode : 'SANDBOX';
      const existing = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email });
      const sameScope = (existing || []).filter((r) => r.venue_id === resolvedVenueId && r.mode === resolvedMode);
      const open = sameScope.find(r => ['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION'].includes(r.status));
      if (open) return Response.json({ error: 'You already have a pending access request.', request: safeRequest(open) }, { status: 409 });
      const approvedAlready = sameScope.find(r => r.status === 'APPROVED');
      if (approvedAlready) return Response.json({ error: 'You already have approved access. Use Owner/Admin Sign In.', request: safeRequest(approvedAlready) }, { status: 409 });

      const rec = await base44.asServiceRole.entities.NUPSAccessRequest.create({
        full_legal_name,
        email,
        phone: phone || '',
        requested_role,
        venue_id: resolvedVenueId,
        reason,
        status: 'PENDING_OWNER_APPROVAL',
        mode: resolvedMode,
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
        return Response.json({ authorized: true, granted_role: 'OWNER', decision_tier: 'SOVEREIGN', destination: '/NUPSAdminPortal', full_name: user.full_name, actor_email: email });
      }
      const authority = await getDecisionAuthority(base44, email);
      if (authority) {
        return Response.json({
          authorized: true,
          granted_role: authority.tier,
          decision_tier: authority.tier,
          destination: '/NUPSAdminPortal',
          full_name: user.full_name,
          actor_email: email,
        });
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
      if (!grant.nups_user_id) {
        return Response.json({ authorized: false, reason: 'Approved access is missing its linked NUPS account.' });
      }
      const nu = await base44.asServiceRole.entities.NUPSUser.get(grant.nups_user_id).catch(() => null);
      if (
        !nu
        || nu.status !== 'active'
        || normalizeEmail(nu.platform_email) !== email
        || nu.venue_id !== grant.venue_id
      ) {
        return Response.json({ authorized: false, reason: 'Account has been suspended, revoked, or is not bound to this approval.' });
      }
      const destination =
        grant.granted_role === 'ENTERTAINER' ? '/EntertainerHome'
        : ['ADMINISTRATOR', 'OWNER'].includes(grant.granted_role) ? '/NUPSAdminPortal'
        : '/StaffHome';
      return Response.json({ authorized: true, granted_role: grant.granted_role, decision_tier: grant.granted_role, destination, full_name: grant.full_legal_name, actor_email: email });
    }

    // ─── OWNER-ONLY ACTIONS BELOW (§5) ──────────────────────────────────────
    const decisionAuthority = await getDecisionAuthority(base44, email);
    if (!decisionAuthority) return Response.json({ error: 'Owner or administrator approval authority required.' }, { status: 403 });

    if (action === 'listRequests') {
      const all = await base44.asServiceRole.entities.NUPSAccessRequest.list('-created_date', 200);
      const scoped = decisionAuthority.tier === 'SOVEREIGN'
        ? (all || [])
        : (all || []).filter((r) => r.venue_id === decisionAuthority.venue_id && r.mode === decisionAuthority.mode);
      return Response.json({ requests: scoped.map(safeRequest) });
    }

    if (action === 'decide') {
      // Decision authority is verified above. Self-approval is always denied.
      // Administrators may manage operational access but cannot grant OWNER.
      const { request_id, decision, note, idempotency_key } = body;
      if (!request_id || !VALID_DECISIONS.includes(decision)) {
        return Response.json({ error: 'request_id and a valid decision are required.' }, { status: 400 });
      }
      if (!isValidIdempotencyKey(idempotency_key)) {
        return Response.json({ error: 'A valid idempotency_key is required.' }, { status: 400 });
      }
      const r = await base44.asServiceRole.entities.NUPSAccessRequest.get(request_id).catch(() => null);
      if (!r) return Response.json({ error: 'Request not found.' }, { status: 404 });
      if (normalizeEmail(r.email) === email) {
        return Response.json({ error: 'You cannot approve, reject, suspend, or revoke your own access request.' }, { status: 403 });
      }
      if (!canAuthorityActOnRequest(decisionAuthority, r, decision)) {
        return Response.json({ error: 'This request is outside your venue, mode, or decision authority.' }, { status: 403 });
      }
      const prior = (r.decision_log || []).find((entry) => entry.idempotency_key === idempotency_key);
      if (prior) {
        if (prior.decision !== decision || normalizeEmail(prior.by) !== email) {
          return Response.json({ error: 'The idempotency_key was already used for a different decision or actor.' }, { status: 409 });
        }
        return Response.json({ success: true, idempotent_replay: true, request: safeRequest(r) });
      }
      if (!isDecisionAllowedFromStatus(r.status, decision)) {
        return Response.json({ error: `Decision ${decision} is not allowed from status ${r.status}.` }, { status: 409 });
      }
      if (APPROVAL_DECISIONS.includes(decision) && !decisionMatchesRequestedRole(r.requested_role, decision)) {
        return Response.json({ error: 'The approval decision must match the access role that was requested.' }, { status: 409 });
      }

      const now = new Date().toISOString();
      const log = [...(r.decision_log || []), { decision, by: email, note: note || '', timestamp: now, idempotency_key }];
      const patch = { decided_by: email, decided_at: now, decision_note: note || '', decision_log: log };

      if (APPROVAL_DECISIONS.includes(decision)) {
        const venue = await getActiveVenue(base44, r.venue_id);
        if (!venue) return Response.json({ error: 'Request is missing an active venue assignment.' }, { status: 409 });
        const resolvedVenueId = canonicalVenueId(venue);
        // APPROVE_STAFF grants exactly the staff role that was requested.
        const grantedRole =
          decision === 'APPROVE_OWNER' ? 'OWNER'
          : decision === 'APPROVE_ADMIN' ? 'ADMINISTRATOR'
          : decision === 'APPROVE_STAFF' && STAFF_ROLES.includes(r.requested_role) ? r.requested_role
          : 'ENTERTAINER';
        // Create (or reactivate) the NUPS account bound to the platform email.
        let nupsUserId = r.nups_user_id;
        const nupsRole = NUPS_ROLE_MAP[grantedRole] || 'PERFORMER';
        if (!nupsUserId) {
          const existingUsers = await base44.asServiceRole.entities.NUPSUser.filter({
            platform_email: normalizeEmail(r.email), venue_id: resolvedVenueId,
          }, '-created_date', 5);
          nupsUserId = (existingUsers || [])[0]?.id || null;
        }
        if (nupsUserId) {
          const linkedUser = await base44.asServiceRole.entities.NUPSUser.get(nupsUserId).catch(() => null);
          if (
            !linkedUser
            || normalizeEmail(linkedUser.platform_email) !== normalizeEmail(r.email)
            || linkedUser.venue_id !== resolvedVenueId
          ) {
            return Response.json({ error: 'The linked NUPS account does not match this request.' }, { status: 409 });
          }
          await base44.asServiceRole.entities.NUPSUser.update(nupsUserId, {
            status: 'active', role: nupsRole, approved_by: email,
            platform_email: normalizeEmail(r.email), venue_id: resolvedVenueId,
          });
        } else {
          const nu = await base44.asServiceRole.entities.NUPSUser.create({
            username: r.email,
            full_name: r.full_legal_name,
            role: nupsRole,
            venue_id: resolvedVenueId,
            platform_email: normalizeEmail(r.email),
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
