/**
 * Session-scoped cache for NUPSRouteGuard verdicts.
 *
 * Admins and SOVEREIGN users kept getting a full-screen loading spinner every
 * time they navigated inside NUPS because the guard re-ran auth.me() +
 * getUserPermissions on every mount. This module remembers the verdict for
 * the session so a granted user glides between pages with no re-verification
 * flash. Verdict is cleared on logout (see AuthContext.logout).
 */
const KEY = "nups.routeGuard.session";

export function readVerdict() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 30 minutes as a safety net.
    if (!parsed?.at || Date.now() - parsed.at > 30 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeVerdict(verdict) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ...verdict, at: Date.now() })
    );
  } catch {
    /* storage unavailable — degrade gracefully */
  }
}

export function clearVerdict() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}