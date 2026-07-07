/**
 * DACO WAVE 2 — ID-01 Identity Remediation.
 *
 * Live identity rebind for every protected write path. Before any
 * identity-stamped write (StaffShift, EntertainerShift, VIPContractRecord,
 * DriverPayout, ContractorPayout, JournalEntry, DailySettlement, VIPRoom,
 * ActivityLog, AuditEvent, and all financial entities), the claimed actor
 * must be rebound against a live base44.auth.me() call.
 *
 * Trust model:
 *   claimed_actor.email  MUST MATCH  live_auth.me().email
 *   EXCEPT when the claimed actor is SOVEREIGN AND the live user is also
 *   SOVEREIGN (explicit override — audited separately).
 *
 * Return shape (on success):
 *   { ok: true, live, identity_verified: true, sovereign_override: bool,
 *     claimed_actor_id, verified_actor_id, live_authenticated_email,
 *     verification_timestamp }
 *
 * identity_verified is TRUE after ANY successful live rebind (both match
 * and sovereign_override paths). sovereign_override is tracked SEPARATELY
 * so audit trails can distinguish a direct match from an override.
 *
 * Never trusts: browser storage, client props, or URL params as identity authority.
 */
import { base44 } from '@/api/base44Client';

export const IDENTITY_CRITICAL_ENTITIES = new Set([
  'StaffShift',
  'EntertainerShift',
  'VIPContractRecord',
  'DriverPayout',
  'ContractorPayout',
  'JournalEntry',
  'DailySettlement',
  'VIPRoom',
  'ActivityLog',
  'AuditEvent',
]);

function normalizeEmail(e) {
  return e ? String(e).trim().toLowerCase() : '';
}

function isSovereignActor(actor) {
  if (!actor) return false;
  if (actor.sovereign_flag === true) return true;
  if (actor.role === 'SOVEREIGN') return true;
  return false;
}

/**
 * Rebind a claimed actor against the live authenticated session.
 *
 * @param {object} claimedActor — { email, id, role, sovereign_flag? }
 * @returns {Promise<object>} see module JSDoc for full shape
 */
export async function rebindIdentity(claimedActor) {
  const verification_timestamp = new Date().toISOString();
  let live;
  try {
    live = await base44.auth.me();
  } catch (e) {
    return { ok: false, reason: `auth_me_failed: ${e.message}`, verification_timestamp };
  }
  if (!live?.email) {
    return { ok: false, reason: 'no_live_session_email', verification_timestamp };
  }

  const claimedEmail = normalizeEmail(claimedActor?.email || claimedActor?.id);
  const liveEmail = normalizeEmail(live.email);
  const claimed_actor_id = claimedActor?.id || claimedActor?.email || null;
  const verified_actor_id = live.id || live.email;
  const live_authenticated_email = live.email;

  // ── Match: claimed actor IS the live user ──
  if (claimedEmail && claimedEmail === liveEmail) {
    return {
      ok: true,
      live,
      identity_verified: true,
      sovereign_override: false,
      claimed_actor_id,
      verified_actor_id,
      live_authenticated_email,
      verification_timestamp,
    };
  }

  // ── SOVEREIGN override: claimed sovereign + live user is also sovereign ──
  if (isSovereignActor(claimedActor)) {
    try {
      const matches = await base44.entities.NUPSUser.filter({ created_by: live.email });
      const liveIsSovereign = (matches || []).some(
        (u) => u?.sovereign_flag === true || u?.role === 'SOVEREIGN'
      );
      if (liveIsSovereign) {
        return {
          ok: true,
          live,
          identity_verified: true,          // rebind succeeded → verified
          sovereign_override: true,          // tracked separately
          claimed_actor_id,
          verified_actor_id,
          live_authenticated_email,
          verification_timestamp,
        };
      }
    } catch {
      // Fall through to block
    }
  }

  // ── Contamination: claimed email does not match live, no override ──
  return {
    ok: false,
    reason: `identity_contamination_detected: claimed=${claimedEmail || '(empty)'} live=${liveEmail}`,
    live,
    claimed_actor_id,
    verified_actor_id,
    live_authenticated_email,
    verification_timestamp,
  };
}

/**
 * Synchronous check: is this entity in the identity-critical set?
 * Used by the gateway to decide whether to run the full rebind or skip it
 * for non-identity-critical reads/public paths.
 */
export function isIdentityCritical(entity) {
  return IDENTITY_CRITICAL_ENTITIES.has(entity);
}