/**
 * demoSession.js — Client-side helpers for NUPS Demo Portal single-session access.
 * Token lives in sessionStorage (tab-scoped, dies on close).
 * 30-min idle expiration is enforced via a last-activity timestamp.
 */
const TOKEN_KEY = "nups_demo_token";
const LEAD_ID_KEY = "nups_demo_lead_id";
const LAST_ACTIVE_KEY = "nups_demo_last_active";
const IDLE_LIMIT_MS = 30 * 60 * 1000;

export function generateToken() {
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `dl_${Date.now().toString(36)}_${rand}`;
}

export function getDeviceFingerprint() {
  if (typeof window === "undefined") return "server";
  const nav = window.navigator || {};
  const scr = window.screen || {};
  return btoa(`${nav.userAgent || ""}|${nav.language || ""}|${scr.width}x${scr.height}|${new Date().getTimezoneOffset()}`).slice(0, 40);
}

export function startSession({ token, leadId }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(LEAD_ID_KEY, leadId);
  sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function touchSession() {
  if (sessionStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }
}

export function isSessionValid() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const last = parseInt(sessionStorage.getItem(LAST_ACTIVE_KEY) || "0", 10);
  if (!token || !last) return false;
  if (Date.now() - last > IDLE_LIMIT_MS) {
    clearSession();
    return false;
  }
  return true;
}

export function getSession() {
  if (!isSessionValid()) return null;
  return {
    token: sessionStorage.getItem(TOKEN_KEY),
    leadId: sessionStorage.getItem(LEAD_ID_KEY),
  };
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LEAD_ID_KEY);
  sessionStorage.removeItem(LAST_ACTIVE_KEY);
}