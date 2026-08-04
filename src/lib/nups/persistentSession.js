const NUPS_SESSION_KEY = "nups_session";

/**
 * NUPS operator context survives browser and device restarts.
 * This is UI/session context only; protected data still requires Base44 auth
 * and server-side RBAC. Explicit sign-out clears both storage locations.
 */
export function readNUPSSession() {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(NUPS_SESSION_KEY) ||
    window.sessionStorage.getItem(NUPS_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    // Migrate legacy tab-only sessions to persistent storage.
    window.localStorage.setItem(NUPS_SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.removeItem(NUPS_SESSION_KEY);
    return session;
  } catch {
    clearNUPSSession();
    return null;
  }
}

export function writeNUPSSession(session) {
  if (typeof window === "undefined" || !session) return;
  window.localStorage.setItem(NUPS_SESSION_KEY, JSON.stringify(session));
  window.sessionStorage.removeItem(NUPS_SESSION_KEY);
}

export function clearNUPSSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(NUPS_SESSION_KEY);
  window.sessionStorage.removeItem(NUPS_SESSION_KEY);
}
