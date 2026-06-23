/**
 * BPAA-NUPS-MASTER-001 §3 — Feature Registry runtime accessor.
 *
 * THE KEYSTONE. Nav, search, help, and assistant all use this module.
 * No consumer reads FeatureRegistry directly — always through here so the
 * filter contract (status/mode/role) is enforced uniformly.
 *
 * Invariants this module enforces at the consumer boundary:
 *   F-1 unique feature_id/route (validated on seed/CI)
 *   F-3 consumers render only registry features (this module is the only path)
 *   F-9 depth budget — getNavTree() returns groups -> features, ≤2 taps
 *   F-11 role + mode aware
 */

import { base44 } from "@/api/base44Client";

let _cache = null;
let _cacheTime = 0;
const CACHE_MS = 30_000;

/** Drop the cache. Called after seed/reconcile. */
export function invalidateRegistryCache() {
  _cache = null;
  _cacheTime = 0;
}

/** Load full registry (cached). Returns array of feature rows. */
export async function loadRegistry() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_MS) return _cache;
  const rows = await base44.entities.FeatureRegistry.list("order", 500);
  _cache = Array.isArray(rows) ? rows : [];
  _cacheTime = now;
  return _cache;
}

/** True if the feature is visible to this role + mode and ACTIVE. */
function isVisible(feature, { role, mode }) {
  if (!feature) return false;
  if (feature.status !== "ACTIVE") return false;
  const modes = Array.isArray(feature.modes) && feature.modes.length
    ? feature.modes
    : ["REAL", "DEMO", "SANDBOX"];
  if (mode && !modes.includes(mode)) return false;
  const roles = Array.isArray(feature.roles) && feature.roles.length ? feature.roles : ["all"];
  if (!role) return true;
  if (roles.includes("all")) return true;
  return roles.includes(role);
}

/** Group order for nav rendering. Fixed (§4). */
const GROUP_ORDER = ["Operations", "Currency", "Accounting", "Staff", "Admin", "System"];

/**
 * Returns nav tree: [{ group, items: [feature, ...] }] — sorted, filtered.
 * Single source for the app shell's primary nav (F-3, F-10).
 */
export async function getNavTree({ role, mode } = {}) {
  const rows = await loadRegistry();
  const visible = rows.filter(f => isVisible(f, { role, mode }));
  const groups = new Map();
  for (const f of visible) {
    const g = f.group || "System";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(f);
  }
  return GROUP_ORDER
    .filter(g => groups.has(g))
    .map(g => ({
      group: g,
      items: groups.get(g).sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
}

/**
 * Resolve a feature by its id. Returns null if not registered.
 * Help/assistant use this — never invent a feature.
 */
export async function getFeatureById(feature_id) {
  const rows = await loadRegistry();
  return rows.find(f => f.feature_id === feature_id) || null;
}

/**
 * Resolve a feature by its canonical route. Used by router→help linking.
 */
export async function getFeatureByRoute(route) {
  if (!route) return null;
  const norm = route.toLowerCase().replace(/\/+$/, "") || "/";
  const rows = await loadRegistry();
  return rows.find(f => (f.route || "").toLowerCase().replace(/\/+$/, "") === norm) || null;
}

/**
 * Global "Go to" search (§4). Matches label + keywords (case-insensitive).
 * Returns only features visible to {role, mode}.
 */
export async function searchFeatures(query, { role, mode, limit = 12 } = {}) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const rows = await loadRegistry();
  const scored = [];
  for (const f of rows) {
    if (!isVisible(f, { role, mode })) continue;
    const label = (f.label || "").toLowerCase();
    const keywords = (f.keywords || []).map(k => String(k).toLowerCase());
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    for (const k of keywords) {
      if (k === q) score = Math.max(score, 70);
      else if (k.startsWith(q)) score = Math.max(score, 50);
      else if (k.includes(q)) score = Math.max(score, 30);
    }
    if (score > 0) scored.push({ feature: f, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.feature);
}