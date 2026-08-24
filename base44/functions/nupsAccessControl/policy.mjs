export const STAFF_ROLES = Object.freeze([
  'ENTERTAINER',
  'HOSTESS',
  'DOORMAN',
  'DOOR_GIRL',
  'BARTENDER',
  'DJ',
  'SECURITY',
  'MANAGER',
]);

export const APPROVAL_DECISIONS = Object.freeze([
  'APPROVE_ENTERTAINER',
  'APPROVE_STAFF',
  'APPROVE_ADMIN',
  'APPROVE_OWNER',
]);

export const VALID_DECISIONS = Object.freeze([
  ...APPROVAL_DECISIONS,
  'REJECT',
  'REQUEST_INFO',
  'SUSPEND',
  'REVOKE',
]);

const PRIVILEGED_ROLES = new Set(['ADMINISTRATOR', 'OWNER']);

const ALLOWED_SOURCE_STATUSES = Object.freeze({
  APPROVE_ENTERTAINER: new Set(['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION', 'SUSPENDED']),
  APPROVE_STAFF: new Set(['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION', 'SUSPENDED']),
  APPROVE_ADMIN: new Set(['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION', 'SUSPENDED']),
  APPROVE_OWNER: new Set(['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION', 'SUSPENDED']),
  REJECT: new Set(['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION']),
  REQUEST_INFO: new Set(['PENDING_OWNER_APPROVAL', 'NEEDS_INFORMATION']),
  SUSPEND: new Set(['APPROVED']),
  REVOKE: new Set(['APPROVED', 'SUSPENDED']),
});

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidIdempotencyKey(value) {
  return typeof value === 'string'
    && value.length >= 16
    && value.length <= 128
    && /^[A-Za-z0-9._:-]+$/.test(value);
}

export function decisionMatchesRequestedRole(requestedRole, decision) {
  if (requestedRole === 'OWNER') return decision === 'APPROVE_OWNER';
  if (requestedRole === 'ADMINISTRATOR') return decision === 'APPROVE_ADMIN';
  if (requestedRole === 'ENTERTAINER') return decision === 'APPROVE_ENTERTAINER';
  if (STAFF_ROLES.includes(requestedRole)) return decision === 'APPROVE_STAFF';
  return false;
}

export function isDecisionAllowedFromStatus(status, decision) {
  return Boolean(ALLOWED_SOURCE_STATUSES[decision]?.has(status));
}

export function canAuthorityActOnRequest(authority, request, decision) {
  if (!authority || !request || !VALID_DECISIONS.includes(decision)) return false;
  if (authority.tier === 'SOVEREIGN') return true;

  const requestRole = request.granted_role || request.requested_role;
  if (request.venue_id !== authority.venue_id || request.mode !== authority.mode) return false;

  if (authority.tier === 'OWNER') {
    return requestRole !== 'OWNER' && decision !== 'APPROVE_OWNER';
  }

  if (authority.tier === 'ADMINISTRATOR') {
    return !PRIVILEGED_ROLES.has(requestRole)
      && !['APPROVE_ADMIN', 'APPROVE_OWNER'].includes(decision);
  }

  return false;
}
