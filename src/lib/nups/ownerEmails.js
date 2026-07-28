// Owner-tier emails that bypass all NUPS RBAC gates as OWNER / ADMIN.
//
// Carlo Earl's platform accounts — sovereign authority for the NUPS system.
// These emails are treated as SOVEREIGN / ADMIN at every frontend guard
// (RoleClassGuard, KioskSessionGuard, NUPSRouteGuard, useNUPSPermissions)
// regardless of whether a NUPSUser record exists for them.
//
// Backend enforcement (nupsAccessControl / getUserPermissions) is the
// source of truth for non-owner accounts; this helper is the frontend
// mirror for Carlo's two accounts so he is never locked out by a missing
// NUPSUser record or an un-approved NUPSAccessRequest.

export const OWNER_EMAILS = [
  'carloearl@glyphlock.com',
  'carloearl@gmail.com',
];

const OWNER_SET = new Set(OWNER_EMAILS.map((e) => e.toLowerCase()));

/**
 * Returns true if `email` is one of Carlo's owner-admin accounts.
 * Case-insensitive, trims whitespace, tolerates null/undefined.
 */
export function isOwnerEmail(email) {
  return OWNER_SET.has(String(email || '').trim().toLowerCase());
}