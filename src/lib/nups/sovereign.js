// DACO OMEGA v6.0 — Phase 2: SOVEREIGN check helper
//
// Application-layer SOVEREIGN gate. Used by writeEntity() and any other
// privileged code path. Platform-layer enforcement gap is documented
// in docs/HANDOFF.md.

import { base44 } from '@/api/base44Client';

/**
 * Returns true if the given NUPSUser-shaped object has SOVEREIGN authority.
 * Accepts either a NUPSUser record or null/undefined.
 */
export function isSovereign(nupsUser) {
  if (!nupsUser) return false;
  return nupsUser.sovereign_flag === true || nupsUser.role === 'SOVEREIGN';
}

/**
 * Resolves the current SOVEREIGN-eligible NUPSUser, if any.
 * Looks up by Base44 auth email -> NUPSUser.created_by or username match.
 * Returns null if not signed in or not SOVEREIGN.
 */
export async function getCurrentSovereign() {
  try {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return null;
    const me = await base44.auth.me();
    if (!me?.email) return null;
    const matches = await base44.entities.NUPSUser.filter({ created_by: me.email });
    const sovereign = (matches || []).find((u) => u?.sovereign_flag === true || u?.role === 'SOVEREIGN');
    return sovereign || null;
  } catch {
    return null;
  }
}

/**
 * Throws if the caller is not SOVEREIGN. Use to gate privileged client-side
 * actions (e.g., admin buttons). Backend functions must repeat this check
 * server-side; never trust the client.
 */
export async function requireSovereign() {
  const s = await getCurrentSovereign();
  if (!s) {
    const err = new Error('SOVEREIGN_REQUIRED');
    err.code = 403;
    throw err;
  }
  return s;
}