/**
 * DACO-NUPS-VIP-20260716-01 §1 — VIP Hostess cohort identity resolver.
 *
 * VENUE-ARENA PRINCIPLE (§0.1): every resolution is parameterized on venue_id.
 * A hostess provisioned at one venue resolves ONLY within that venue's scope.
 * No hardcoded venue references anywhere in this module.
 *
 * This is the ID-01 ROUTE-AROUND — NOT an ID-01 resolution. ID-01 remains open.
 *
 * Hard rules, all fail-closed:
 *  §1b  Fuzzy-match DISABLED (not UI-hidden): binding requires EXACT staff_id
 *       AND exact pin. There is no name comparison, no toLowerCase(), and no
 *       fallback branch in this file — the fuzzy path literally does not exist.
 *  §1c  venue_id + mode + exact-identity enforced on every resolve call.
 *  §1d  Seed isolation: only REAL-mode records resolve; DEMO/SANDBOX are rejected
 *       so no non-REAL identity can bleed into this REAL cohort.
 */

export const VIP_HOSTESS_ROLE = 'VIP_HOSTESS';

/**
 * Build the venue-scoped, REAL-only hostess cohort from a NUPSUser list.
 * Anything not REAL / not this venue / not an active vip_hostess is excluded.
 */
export function buildHostessCohort(nupsUsers, venueId) {
  if (!venueId) return []; // fail closed — no venue, no cohort
  return (nupsUsers || []).filter((u) =>
    u.role === VIP_HOSTESS_ROLE &&
    u.venue_id === venueId &&
    (u.mode || 'REAL') === 'REAL' &&
    u.status === 'active'
  );
}

/**
 * Resolve a hostess identity for clock-in / contract binding.
 *
 * Returns { ok:false, reason } on ANY failure (fail-closed) or
 * { ok:true, identity } on an EXACT venue_id + REAL-mode + staff_id + pin match.
 *
 * @param {Object}   p
 * @param {string}   p.pin       Exact PIN entered.
 * @param {string}   p.staffId   Exact staff ID presented.
 * @param {string}   p.venueId   Venue scope — required.
 * @param {Array}    p.cohort    Candidate records (use buildHostessCohort()).
 * @param {string}   [p.mode]    Ledger mode; only 'REAL' resolves (§1d).
 */
export function resolveHostessIdentity({ pin, staffId, venueId, cohort, mode = 'REAL' }) {
  // §1c — every scope parameter is mandatory. Missing any → fail closed.
  if (!pin || !staffId || !venueId) return { ok: false, reason: 'MISSING_SCOPE' };

  // §1d — seed isolation. Non-REAL never resolves into the REAL cohort.
  if (mode !== 'REAL') return { ok: false, reason: 'MODE_NOT_REAL' };

  const pool = Array.isArray(cohort) ? cohort : [];

  // §1b / §1c — EXACT match on the full tuple. No fuzzy, no name, no fallback.
  const match = pool.find((u) =>
    u.venue_id === venueId &&
    (u.mode || 'REAL') === 'REAL' &&
    u.role === VIP_HOSTESS_ROLE &&
    u.status === 'active' &&
    u.staff_id === staffId &&
    u.pin === pin
  );

  if (!match) return { ok: false, reason: 'NO_EXACT_MATCH' }; // fail closed

  return {
    ok: true,
    identity: {
      id: match.id,
      staff_id: match.staff_id,
      venue_id: match.venue_id,
      full_name: match.full_name,
      role: VIP_HOSTESS_ROLE,
      mode: 'REAL',
    },
  };
}

/**
 * Contract-path scope guard (§1c). Returns true only when a contract write is
 * being made by the exact same hostess identity, in the same venue, REAL mode.
 * Callers pass the resolved identity and the intended contract payload.
 */
export function assertContractScope({ identity, venueId, mode = 'REAL' }) {
  return Boolean(
    identity &&
    identity.role === VIP_HOSTESS_ROLE &&
    identity.venue_id === venueId &&
    mode === 'REAL'
  );
}