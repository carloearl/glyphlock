/**
 * Admin Override — owner directive 2026-07-17.
 * Admins/owners default to STAFF-PARITY view on every operational surface.
 * Toggling override ON (header pill) unlocks admin-only tabs, the Admin
 * sidebar section, and the Legacy section. State is session-scoped and
 * shared across all NUPS pages via a sync-external-store hook.
 */
import { useSyncExternalStore } from "react";

const KEY = "nups_admin_override";
const EVT = "nups-admin-override";

export function isAdminOverride() {
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function setAdminOverride(on) {
  try { sessionStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

export function useAdminOverride() {
  return useSyncExternalStore(subscribe, isAdminOverride, () => false);
}