import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import {
  APPROVAL_DECISIONS,
  STAFF_ROLES,
  VALID_DECISIONS,
  canAuthorityActOnRequest,
  canRequestRoleInMode,
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
const DECISION_CLAIM_TTL_MS = 5 * 60 * 1000;

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

// Return every active decision scope held by the actor. A delegated operator
// may legitimately hold grants for more than one venue/mode; authorization is
// resolved against the request being acted on, never whichever grant sorts first.
async function getDecisionAuthorities(base44, email) {
  const e = normalizeEmail(email);
  if (!e) return [];
  if (SOVEREIGN_EMAILS.includes(e)) return [{ tier: 'SOVEREIGN', venue_id: null, mode: null }];
  const approved = await base44.asServiceRole.entities.NUPSAccessRequest.filter(
    { email: e, status: 'APPROVED' }, '-created_date',
  );
  const authorities = [];
  for (const tier of ['OWNER', 'ADMINISTRATOR']) {
    for (const grant of (approved || []).filter((r) => r.granted_role === tier)) {
      if (grant.mode !== 'REAL') continue;
      if (!grant.nups_user_id) continue;
      const account = await base44.asServiceRole.entities.NUPSUser.get(grant.nups_user_id).catch(() => null);
      if (accountMatchesGrant(account, grant, e, true)) {
        authorities.push({ tier, venue_id: grant.venue_id, mode: grant.mode, nups_user_id: grant.nups_user_id });
      }
    }
  }
  return authorities;
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

function accountMode(account) {
  return account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');
}

function accountIdentityMatchesGrant(account, grant, email, requireReal = false) {
  return Boolean(
    account
    && normalizeEmail(account.platform_email) === normalizeEmail(email)
    && account.venue_id === grant.venue_id
    && accountMode(account) === grant.mode
    && (!requireReal || (grant.mode === 'REAL' && accountMode(account) === 'REAL'))
  );
}

function accountMatchesGrant(account, grant, email, requireReal = false) {
  return account?.status === 'active' && accountIdentityMatchesGrant(account, grant, email, requireReal);
}

function isExpiredDecisionClaim(request) {
  if (!request?.decision_claim_active || !request?.decision_claimed_at) return false;
  const claimedAt = Date.parse(request.decision_claimed_at);
  return Number.isFinite(claimedAt) && Date.now() - claimedAt > DECISION_CLAIM_TTL_MS;
}

async function claimDecision(base44, request, idempotencyKey, actorEmail) {
  let current = request;
  if (isExpiredDecisionClaim(current)) {
    await base44.asServiceRole.entities.NUPSAccessRequest.updateMany({
      id: current.id,
      decision_claim_active: true,
      decision_claim_key: current.decision_claim_key,
      decision_claimed_at: current.decision_claimed_at,
    }, {
      $set: { decision_claim_active: false },
    });
    current = await base44.asServiceRole.entities.NUPSAccessRequest.get(current.id);
  }

  const claimedAt = new Date().toISOString();
  const result = await base44.asServiceRole.entities.NUPSAccessRequest.updateMany({
    $and: [
      { id: current.id },
      { status: current.status },
      { $or: [
        { decision_claim_active: false },
        { decision_claim_active: { $exists: false } },
      ] },
    ],
  }, {
    $set: {
      decision_claim_active: true,
      decision_claim_key: idempotencyKey,
      decision_claimed_by: actorEmail,
      decision_claimed_at: claimedAt,
    },
  });
  if (result?.updated !== 1) return null;
  return base44.asServiceRole.entities.NUPSAccessRequest.get(current.id);
}

async function releaseDecisionClaim(base44, requestId, idempotencyKey, actorEmail, claimedAt) {
  const result = await base44.asServiceRole.entities.NUPSAccessRequest.updateMany({
    id: requestId,
    decision_claim_active: true,
    decision_claim_key: idempotencyKey,
    decision_claimed_by: actorEmail,
    decision_claimed_at: claimedAt,
  }, {
    $set: { decision_claim_active: false },
  });
  return result?.updated === 1;
}

async function updateClaimedRequest(base44, requestId, idempotencyKey, actorEmail, claimedAt, patch) {
  const result = await base44.asServiceRole.entities.NUPSAccessRequest.updateMany({
    id: requestId,
    decision_claim_active: true,
    decision_claim_key: idempotencyKey,
    decision_claimed_by: actorEmail,
    decision_claimed_at: claimedAt,
  }, {
    $set: patch,
  });
  if (result?.updated !== 1) return null;
  return base44.asServiceRole.entities.NUPSAccessRequest.get(requestId);
}

async function updateAccountForClaim(base44, accountId, claimedAt, patch, expectedStatus = null) {
  if (!claimedAt) return false;
  const result = await base44.asServiceRole.entities.NUPSUser.updateMany({
    $and: [
      { id: accountId },
      ...(expectedStatus ? [{ status: expectedStatus }] : []),
      { $or: [
        { access_claimed_at: { $exists: false } },
        { access_claimed_at: { $lte: claimedAt } },
      ] },
    ],
  }, {
    $set: { ...patch, access_claimed_at: claimedAt },
  });
  return result?.updated === 1;
}

async function getDecisionReplayResponse(base44, request, decision, idempotencyKey, actorEmail) {
  const prior = (request?.decision_log || []).find((entry) => entry.idempotency_key === idempotencyKey);
  if (!prior) return null;
  if (prior.decision !== decision || normalizeEmail(prior.by) !== actorEmail) {
    return Response.json({ error: 'The idempotency_key was already used for a different decision or actor.' }, { status: 409 });
  }
  if (APPROVAL_DECISIONS.includes(decision)) {
    const account = request.nups_user_id
      ? await base44.asServiceRole.entities.NUPSUser.get(request.nups_user_id).catch(() => null)
      : null;
    if (!accountMatchesGrant(account, request, request.email)) {
      if (
        request.status === 'APPROVED'
        && account?.status === 'suspended'
        && accountIdentityMatchesGrant(account, request, request.email)
      ) {
        const claimed = await claimDecision(base44, request, idempotencyKey, actorEmail);
        if (!claimed) {
          return Response.json({ error: 'Approval reconciliation is already processing. Retry with the same idempotency key.' }, { status: 409 });
        }
        const claimTimestamp = claimed.decision_claimed_at;
        let claimHeld = true;
        try {
          const activated = await updateAccountForClaim(
            base44, account.id, claimTimestamp, { status: 'active' }, 'suspended',
          );
          if (!activated) {
            return Response.json({ error: 'Approval reconciliation lost its account claim. Retry with the same idempotency key.' }, { status: 409 });
          }
          const recovered = await updateClaimedRequest(
            base44, request.id, idempotencyKey, actorEmail, claimTimestamp, { decision_claim_active: false },
          );
          if (!recovered) {
            return Response.json({ error: 'Approval reconciliation lost its decision claim. Retry with the same idempotency key.' }, { status: 409 });
          }
          claimHeld = false;
          return Response.json({ success: true, idempotent_replay: true, reconciled: true, request: safeRequest(recovered) });
        } finally {
          if (claimHeld) {
            await releaseDecisionClaim(
              base44, request.id, idempotencyKey, actorEmail, claimTimestamp,
            ).catch(() => null);
          }
        }
      }
      return Response.json({ error: 'The prior approval did not finish activating its bound account. Owner reconciliation is required.' }, { status: 409 });
    }
    if (
      request.decision_claim_active
      && request.decision_claim_key === idempotencyKey
      && normalizeEmail(request.decision_claimed_by) === actorEmail
    ) {
      const released = await releaseDecisionClaim(
        base44, request.id, idempotencyKey, actorEmail, request.decision_claimed_at,
      );
      if (!released) {
        return Response.json({ error: 'Approval finalization state changed. Retry safely with the same idempotency key.' }, { status: 409 });
      }
      request = await base44.asServiceRole.entities.NUPSAccessRequest.get(request.id);
    }
  }
  return Response.json({ success: true, idempotent_replay: true, request: safeRequest(request) });
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
      const resolvedMode = ['REAL', 'SANDBOX', 'DEMO'].includes(mode) ? mode : 'SANDBOX';
      if (!canRequestRoleInMode(requested_role, resolvedMode)) {
        return Response.json({
          error: 'Administrator and Owner access cannot be provisioned from DEMO or SANDBOX requests.',
        }, { status: 403 });
      }
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
      const requestedMode = ['REAL', 'TEST', 'DEMO', 'SANDBOX'].includes(body.mode) ? body.mode : null;
      const requiredRoles = Array.isArray(body.required_roles)
        ? [...new Set(body.required_roles.filter((role) => Object.values(NUPS_ROLE_MAP).includes(role)))].slice(0, 20)
        : [];
      const allowAdmin = body.allow_admin !== false;
      let requestedVenueId = String(body.venue_id || '').trim() || null;
      if (requestedVenueId) {
        const requestedVenue = await getActiveVenue(base44, requestedVenueId);
        if (!requestedVenue) return Response.json({ authorized: false, reason: 'The requested venue is not active.' });
        requestedVenueId = canonicalVenueId(requestedVenue);
      }
      // DACO-NUPS-RBAC-CORRECTION-20260717 §5 — no implicit platform-admin ownership.
      // Back office requires Carlo's protected Owner identity or an explicit APPROVED grant.
      if (SOVEREIGN_EMAILS.includes(email)) {
        return Response.json({ authorized: true, granted_role: 'OWNER', decision_tier: 'SOVEREIGN', mode: requestedMode || 'REAL', venue_id: requestedVenueId, destination: '/NUPSAdminPortal', full_name: user.full_name, actor_email: email });
      }
      const grantQuery = {
        email,
        status: 'APPROVED',
        ...(requestedVenueId ? { venue_id: requestedVenueId } : {}),
        ...(requestedMode ? { mode: requestedMode } : {}),
      };
      const mine = await base44.asServiceRole.entities.NUPSAccessRequest.filter(grantQuery, '-created_date');
      let grant = null;
      let nu = null;
      for (const candidate of (mine || [])) {
        if (requestedVenueId && candidate.venue_id !== requestedVenueId) continue;
        if (requestedMode && candidate.mode !== requestedMode) continue;
        if (['ADMINISTRATOR', 'OWNER'].includes(candidate.granted_role) && candidate.mode !== 'REAL') continue;
        const candidateRole = NUPS_ROLE_MAP[candidate.granted_role];
        const candidateIsAdmin = ['ADMINISTRATOR', 'OWNER'].includes(candidate.granted_role);
        if (requiredRoles.length > 0 && !(allowAdmin && candidateIsAdmin) && !requiredRoles.includes(candidateRole)) continue;
        if (!candidate.nups_user_id) continue;
        const account = await base44.asServiceRole.entities.NUPSUser.get(candidate.nups_user_id).catch(() => null);
        if (accountMatchesGrant(account, candidate, email)) {
          grant = candidate;
          nu = account;
          break;
        }
      }
      if (!grant) {
        const pending = await base44.asServiceRole.entities.NUPSAccessRequest.filter({ email }, '-created_date', 1);
        const p = (pending || [])[0];
        return Response.json({
          authorized: false,
          reason: p ? `Access request status: ${p.status}` : 'No approved owner/administrator access for this account.',
        });
      }
      // Recheck the selected tuple before returning it to a route guard.
      if (!accountMatchesGrant(nu, grant, email)) {
        return Response.json({ authorized: false, reason: 'Account has been suspended, revoked, or is not bound to this approval.' });
      }
      const destination =
        grant.granted_role === 'ENTERTAINER' ? '/EntertainerHome'
        : ['ADMINISTRATOR', 'OWNER'].includes(grant.granted_role) ? '/NUPSAdminPortal'
        : '/StaffHome';
      return Response.json({ authorized: true, granted_role: grant.granted_role, decision_tier: grant.granted_role, mode: grant.mode, venue_id: grant.venue_id, destination, full_name: grant.full_legal_name, actor_email: email });
    }

    // ─── OWNER-ONLY ACTIONS BELOW (§5) ──────────────────────────────────────
    const decisionAuthorities = await getDecisionAuthorities(base44, email);
    if (decisionAuthorities.length === 0) return Response.json({ error: 'Owner or administrator approval authority required.' }, { status: 403 });

    if (action === 'listRequests') {
      const all = await base44.asServiceRole.entities.NUPSAccessRequest.list('-created_date', 200);
      const scoped = decisionAuthorities.some((authority) => authority.tier === 'SOVEREIGN')
        ? (all || [])
        : (all || []).filter((r) => decisionAuthorities.some((authority) =>
          r.venue_id === authority.venue_id && r.mode === authority.mode
        ));
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
      let r = await base44.asServiceRole.entities.NUPSAccessRequest.get(request_id).catch(() => null);
      if (!r) return Response.json({ error: 'Request not found.' }, { status: 404 });
      if (normalizeEmail(r.email) === email) {
        return Response.json({ error: 'You cannot approve, reject, suspend, or revoke your own access request.' }, { status: 403 });
      }
      if (!decisionAuthorities.some((authority) => canAuthorityActOnRequest(authority, r, decision))) {
        return Response.json({ error: 'This request is outside your venue, mode, or decision authority.' }, { status: 403 });
      }
      const replay = await getDecisionReplayResponse(base44, r, decision, idempotency_key, email);
      if (replay) return replay;
      if (!isDecisionAllowedFromStatus(r.status, decision)) {
        return Response.json({ error: `Decision ${decision} is not allowed from status ${r.status}.` }, { status: 409 });
      }
      if (APPROVAL_DECISIONS.includes(decision) && !decisionMatchesRequestedRole(r.requested_role, decision)) {
        return Response.json({ error: 'The approval decision must match the access role that was requested.' }, { status: 409 });
      }
      if (APPROVAL_DECISIONS.includes(decision) && !canRequestRoleInMode(r.requested_role, r.mode)) {
        return Response.json({ error: 'Privileged access cannot be approved from a non-live request.' }, { status: 403 });
      }

      r = await claimDecision(base44, r, idempotency_key, email);
      if (!r) {
        const latest = await base44.asServiceRole.entities.NUPSAccessRequest.get(request_id).catch(() => null);
        const completedReplay = await getDecisionReplayResponse(base44, latest, decision, idempotency_key, email);
        if (completedReplay) return completedReplay;
        return Response.json({ error: 'Another decision is already processing for this request. Retry safely with the same idempotency key.' }, { status: 409 });
      }
      const claimTimestamp = r.decision_claimed_at;

      // A status-preserving decision (REQUEST_INFO from NEEDS_INFORMATION) can
      // finish between the initial read and this successful claim. Re-check the
      // claimed record so the same key never appends a duplicate log entry.
      const completedAfterClaim = (r.decision_log || []).find((entry) => entry.idempotency_key === idempotency_key);
      if (completedAfterClaim) {
        const released = await releaseDecisionClaim(
          base44, request_id, idempotency_key, email, claimTimestamp,
        );
        if (!released) {
          return Response.json({ error: 'Decision finalization state changed. Retry safely with the same idempotency key.' }, { status: 409 });
        }
        if (completedAfterClaim.decision !== decision || normalizeEmail(completedAfterClaim.by) !== email) {
          return Response.json({ error: 'The idempotency_key was already used for a different decision or actor.' }, { status: 409 });
        }
        const replayed = await base44.asServiceRole.entities.NUPSAccessRequest.get(request_id);
        return Response.json({ success: true, idempotent_replay: true, request: safeRequest(replayed) });
      }

      let claimHeld = true;
      try {
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
            const requestMarker = `Approved via NUPSAccessRequest ${r.id} (`;
            nupsUserId = (existingUsers || []).find((candidate) =>
              accountMode(candidate) === r.mode
              && String(candidate.created_note || '').startsWith(requestMarker)
            )?.id || null;
          }
          if (nupsUserId) {
            const linkedUser = await base44.asServiceRole.entities.NUPSUser.get(nupsUserId).catch(() => null);
            if (
              !linkedUser
              || normalizeEmail(linkedUser.platform_email) !== normalizeEmail(r.email)
              || linkedUser.venue_id !== resolvedVenueId
              || accountMode(linkedUser) !== r.mode
            ) {
              return Response.json({ error: 'The linked NUPS account does not match this request.' }, { status: 409 });
            }
            if (linkedUser.status === 'active') {
              return Response.json({ error: 'A pre-existing active account cannot be rebound by this approval. Owner reconciliation is required.' }, { status: 409 });
            }
            const prepared = await updateAccountForClaim(base44, nupsUserId, claimTimestamp, {
              status: 'suspended', role: nupsRole, approved_by: email,
              platform_email: normalizeEmail(r.email), venue_id: resolvedVenueId,
              access_mode: r.mode, is_demo: r.mode !== 'REAL',
            });
            if (!prepared) {
              return Response.json({ error: 'The linked NUPS account changed during approval. Retry with the same idempotency key.' }, { status: 409 });
            }
          } else {
            const nu = await base44.asServiceRole.entities.NUPSUser.create({
              username: r.email,
              full_name: r.full_legal_name,
              role: nupsRole,
              venue_id: resolvedVenueId,
              platform_email: normalizeEmail(r.email),
              approved_by: email,
              status: 'suspended',
              is_demo: ['SANDBOX', 'DEMO', 'TEST'].includes(r.mode),
              access_mode: r.mode,
              access_claimed_at: claimTimestamp,
              created_note: `Approved via NUPSAccessRequest ${r.id} (${decision})`,
            });
            nupsUserId = nu.id;
          }
          // Two-phase activation: the account remains non-operational until the
          // approval record and its account binding have committed durably.
          const committedGrant = await updateClaimedRequest(
            base44, request_id, idempotency_key, email, claimTimestamp, {
              ...patch, status: 'APPROVED', granted_role: grantedRole, nups_user_id: nupsUserId,
              decision_claim_active: true,
            },
          );
          if (!committedGrant) {
            return Response.json({ error: 'Approval lost its decision claim before the grant committed.' }, { status: 409 });
          }
          const activated = await updateAccountForClaim(
            base44, nupsUserId, claimTimestamp, { status: 'active' }, 'suspended',
          );
          if (!activated) {
            return Response.json({ error: 'Approval lost its account claim before activation.' }, { status: 409 });
          }
          const updated = await updateClaimedRequest(
            base44, request_id, idempotency_key, email, claimTimestamp, { decision_claim_active: false },
          );
          if (!updated) {
            return Response.json({ error: 'Approval finalization lost its decision claim. Retry with the same idempotency key.' }, { status: 409 });
          }
          claimHeld = false;
          return Response.json({ success: true, request: safeRequest(updated) });
        }

        const statusMap = { REJECT: 'REJECTED', REQUEST_INFO: 'NEEDS_INFORMATION', SUSPEND: 'SUSPENDED', REVOKE: 'REVOKED' };
        const newStatus = statusMap[decision];
        // Revocation / suspension deactivates the linked account immediately.
        if ((decision === 'REVOKE' || decision === 'SUSPEND') && r.nups_user_id) {
          const deactivated = await updateAccountForClaim(base44, r.nups_user_id, claimTimestamp, {
            status: decision === 'REVOKE' ? 'terminated' : 'suspended',
          });
          if (!deactivated) {
            return Response.json({ error: 'The linked NUPS account changed during deactivation. Retry with the same idempotency key.' }, { status: 409 });
          }
        }
        const updated = await updateClaimedRequest(base44, request_id, idempotency_key, email, claimTimestamp, {
          ...patch, status: newStatus, granted_role: '', decision_claim_active: false,
        });
        if (!updated) {
          return Response.json({ error: 'Decision finalization lost its decision claim. Retry with the same idempotency key.' }, { status: 409 });
        }
        claimHeld = false;
        return Response.json({ success: true, request: safeRequest(updated) });
      } finally {
        if (claimHeld) {
          await releaseDecisionClaim(
            base44, request_id, idempotency_key, email, claimTimestamp,
          ).catch(() => null);
        }
      }
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
