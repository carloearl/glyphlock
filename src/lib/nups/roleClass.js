/**
 * DACO Directive 003 §2 — Canonical Role Matrix
 *
 * Every NUPS role resolves to exactly ONE role class:
 *   STAFF · ENTERTAINER · MANAGER · ADMIN
 *
 * Consumers (post-login router, sidebar, role-scoped guards) MUST read
 * from this map only. Never map role → screen anywhere else — this is
 * the single source of truth for role-scoped navigation.
 *
 * Phase 1 = navigation scaffolding only. NO business logic changes.
 * Phases 2–4 remain blocked pending MDL ID-01 remediation.
 */

export const ROLE_CLASS = {
  STAFF: "STAFF",
  ENTERTAINER: "ENTERTAINER",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
};

// Home screen per §2. One class = one home = one linear flow.
// STAFF and ENTERTAINER go to purpose-built minimal landings — never
// the operator hub — so their surface is bounded by design.
export const HOME_BY_CLASS = {
  STAFF:       "/StaffHome",
  ENTERTAINER: "/EntertainerHome",
  MANAGER:     "/NUPSHub",
  // §6 — back office has its own portal, separate from live floor ops.
  ADMIN:       "/NUPSAdminPortal",
};

/**
 * Resolve a user's canonical role class.
 *
 * Priority:
 *  1. Base44 admin flag / SOVEREIGN → ADMIN
 *  2. NUPS operational role (uppercase, from NUPSUser.role) → mapped class
 *  3. Simple lowercase role hints from base44 User.role → mapped class
 *  4. Fallback → STAFF (safest — no cross-role visibility)
 */
export function resolveRoleClass({ user, nupsUser, sovereign = false } = {}) {
  if (sovereign) return ROLE_CLASS.ADMIN;
  if (user?.role === "admin") return ROLE_CLASS.ADMIN;

  const raw = String(nupsUser?.role || user?.role || "").toUpperCase();

  // Admins / back office
  if (["PLATFORM_ADMIN", "VENUE_OWNER", "SOVEREIGN", "OWNER", "ADMIN", "BOOKKEEPER"].includes(raw)) {
    return ROLE_CLASS.ADMIN;
  }
  // Managers (elevated floor)
  if (["VENUE_MANAGER", "MANAGER", "DEMO"].includes(raw)) {
    return ROLE_CLASS.MANAGER;
  }
  // Entertainers (independent contractors)
  if (["PERFORMER", "ENTERTAINER"].includes(raw)) {
    return ROLE_CLASS.ENTERTAINER;
  }
  // Staff (W-2 employees)
  if (["FLOOR_HOST", "DOOR_GIRL", "DOORMAN", "BARTENDER", "SECURITY", "DJ", "HOSTESS", "KIOSK", "STAFF"].includes(raw)) {
    return ROLE_CLASS.STAFF;
  }
  return ROLE_CLASS.STAFF;
}

/**
 * Post-login destination for the resolved role class.
 * Reads HOME_BY_CLASS — never hardcode paths at call sites.
 */
export function homeForRoleClass(cls) {
  return HOME_BY_CLASS[cls] || HOME_BY_CLASS.STAFF;
}