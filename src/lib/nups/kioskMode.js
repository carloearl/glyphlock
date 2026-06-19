// NUPS Kiosk Mode — locks the operator session to NUPS-only UI.
// Exit requires Manager PIN (or admin override via ManagerPINVerifier).
//
// Stored in sessionStorage so it auto-clears when the tab/browser closes.

const KEY = "nups_kiosk_mode";

export function enterKioskMode() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch { /* ignore */ }
}

export function exitKioskMode() {
  try {
    sessionStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function isKioskMode() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}