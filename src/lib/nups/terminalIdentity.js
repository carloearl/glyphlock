const TERMINAL_ID_KEY = "nups_terminal_id";

/**
 * Returns a non-secret device/browser identifier used only for NUPS security
 * events and terminal-scoped throttling. It never contains a PIN, person name,
 * email address, payment value, or other protected data.
 */
export function getNUPSTerminalId() {
  if (typeof window === "undefined") return "unidentified";
  try {
    const existing = window.localStorage.getItem(TERMINAL_ID_KEY);
    if (existing) return existing;
    const random = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const created = `NUPS-TERM-${random}`;
    window.localStorage.setItem(TERMINAL_ID_KEY, created);
    return created;
  } catch {
    return `NUPS-SESSION-${Date.now()}`;
  }
}

export const NUPS_TERMINAL_ID_STORAGE_KEY = TERMINAL_ID_KEY;
