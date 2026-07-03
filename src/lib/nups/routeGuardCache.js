/**
 * Cache for NUPSRouteGuard verdicts.
 *
 * Two-tier store so admins and SOVEREIGN operators glide between pages
 * without the "Verifying access…" flash — AND don't get bounced to sign
 * in every time they return to the app in a new tab or after a reload.
 *
 * - sessionStorage: current tab, expires 30 min.
 * - localStorage:   remembers granted admins across tabs / return visits,
 *                   expires 30 days. Cleared on explicit logout.
 *
 * Verdict shape: { status: "granted", email, why, at }
 */
const SESSION_KEY = "nups.routeGuard.session";
const PERSIST_KEY = "nups.routeGuard.persist";

const SESSION_TTL_MS = 30 * 60 * 1000;        // 30 minutes
const PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function readVerdict() {
  try {
    // Prefer the fresh session cache; fall back to the persistent one.
    const session = safeParse(sessionStorage.getItem(SESSION_KEY));
    if (session?.at && Date.now() - session.at <= SESSION_TTL_MS) return session;

    const persist = safeParse(localStorage.getItem(PERSIST_KEY));
    if (persist?.at && Date.now() - persist.at <= PERSIST_TTL_MS) {
      // Rehydrate the session cache so subsequent reads are cheap.
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(persist)); } catch {}
      return persist;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeVerdict(verdict) {
  const payload = JSON.stringify({ ...verdict, at: Date.now() });
  try { sessionStorage.setItem(SESSION_KEY, payload); } catch {}
  // Persist across visits ONLY for granted verdicts — never cache denials.
  if (verdict?.status === "granted") {
    try { localStorage.setItem(PERSIST_KEY, payload); } catch {}
  }
}

export function clearVerdict() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  try { localStorage.removeItem(PERSIST_KEY); } catch {}
}