// DACO OMEGA v6.0 — Phase 3: Three-layer mode resolver
//
// Priority (highest wins):
//   1. Request context override (per-call argument)
//   2. Session storage flag (runtime override, set by SOVEREIGN)
//   3. SystemConfig.mode (operator default)
//
// Modes: REAL | DEMO | SANDBOX
// Default if nothing is set: 'DEMO'.

import { base44 } from '@/api/base44Client';

const VALID_MODES = ['REAL', 'DEMO', 'SANDBOX'];
const SESSION_KEY = 'nups_mode_override';

/**
 * Layer 3: SystemConfig (operator default). Cached for the page lifetime.
 */
let _configCache = null;
async function readSystemConfig() {
  if (_configCache) return _configCache;
  try {
    const rows = await base44.entities.SystemConfig.filter({ config_key: 'global' });
    _configCache = rows?.[0] || null;
  } catch {
    _configCache = null;
  }
  return _configCache;
}

/**
 * Layer 2: session-storage override. Returns null if unset or invalid.
 */
function readSessionOverride() {
  try {
    if (typeof window === 'undefined') return null;
    const v = window.sessionStorage.getItem(SESSION_KEY);
    return VALID_MODES.includes(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Set the session-level mode override. SOVEREIGN-only at the app level
 * (caller must enforce). Audited by writeEntity() when used in writes.
 */
export function setSessionMode(mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`INVALID_MODE: ${mode}`);
  }
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_KEY, mode);
  }
}

export function clearSessionMode() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Resolve mode using all three layers.
 * @param {object} requestContext optional { mode: 'REAL' | 'DEMO' | 'SANDBOX' }
 */
export async function getMode(requestContext) {
  // Layer 1
  if (requestContext?.mode && VALID_MODES.includes(requestContext.mode)) {
    return requestContext.mode;
  }
  // Layer 2
  const sess = readSessionOverride();
  if (sess) return sess;
  // Layer 3
  const cfg = await readSystemConfig();
  if (cfg?.mode && VALID_MODES.includes(cfg.mode)) return cfg.mode;
  // Default
  return 'DEMO';
}

/**
 * Convenience for callers that have no request context.
 */
export async function getActiveMode() {
  return getMode(undefined);
}

/**
 * Returns all three layers for diagnostics / mode-badge UI.
 */
export async function describeMode() {
  const cfg = await readSystemConfig();
  return {
    layer1_systemConfig: cfg?.mode || null,
    layer2_session: readSessionOverride(),
    layer3_request: null,
    resolved: await getActiveMode(),
  };
}