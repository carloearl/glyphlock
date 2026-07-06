// DACO WAVE 1 — Phase 4 Mode Resolver (session override removed, per-venue added)
//
// Priority (highest wins):
//   1. Request context override (per-call argument)
//   2. SystemConfig per-venue record (config_key: 'venue', venue_id match)
//   3. SystemConfig global record (config_key: 'global')
//
// Modes: REAL | DEMO | SANDBOX
// Default if nothing is set: 'REAL'.
//
// DACO WAVE 1 CHANGE: The client-side session override layer has been
// REMOVED. Mode overrides must go through SystemConfig (per-venue or global)
// so that UI and write gateway always agree. Session-based mode functions
// are no longer exported.

import { base44 } from '@/api/base44Client';

const VALID_MODES = ['REAL', 'DEMO', 'SANDBOX'];

let _globalCache = null;
const _venueCache = {};

/**
 * Read per-venue SystemConfig record. Returns null if not found.
 */
async function readVenueConfig(venue_id) {
  if (!venue_id) return null;
  if (_venueCache[venue_id]) return _venueCache[venue_id];
  try {
    const rows = await base44.entities.SystemConfig.filter({ venue_id, config_key: 'venue' });
    _venueCache[venue_id] = rows?.[0] || null;
  } catch {
    _venueCache[venue_id] = null;
  }
  return _venueCache[venue_id];
}

/**
 * Read global SystemConfig record. Returns null if not found.
 */
async function readGlobalConfig() {
  if (_globalCache) return _globalCache;
  try {
    const rows = await base44.entities.SystemConfig.filter({ config_key: 'global' });
    _globalCache = rows?.[0] || null;
  } catch {
    _globalCache = null;
  }
  return _globalCache;
}

/**
 * Invalidate the mode cache. Call after a mode toggle so subsequent reads
 * pick up the new value.
 */
export function invalidateModeCache(venue_id) {
  if (venue_id) {
    delete _venueCache[venue_id];
  } else {
    _globalCache = null;
    Object.keys(_venueCache).forEach((k) => delete _venueCache[k]);
  }
}

/**
 * Resolve mode using the three-layer priority.
 * @param {object} requestContext optional { mode: 'REAL' | 'DEMO' | 'SANDBOX' }
 * @param {string} venue_id optional venue scope for per-venue resolution
 */
export async function getMode(requestContext, venue_id) {
  // Layer 1: request context
  if (requestContext?.mode && VALID_MODES.includes(requestContext.mode)) {
    return requestContext.mode;
  }
  // Layer 2: per-venue SystemConfig
  if (venue_id) {
    const venueCfg = await readVenueConfig(venue_id);
    if (venueCfg?.mode && VALID_MODES.includes(venueCfg.mode)) return venueCfg.mode;
  }
  // Layer 3: global SystemConfig
  const cfg = await readGlobalConfig();
  if (cfg?.mode && VALID_MODES.includes(cfg.mode)) return cfg.mode;
  // Default
  return 'REAL';
}

/**
 * Convenience for callers that have no request context.
 * @param {string} venue_id optional venue scope
 */
export async function getActiveMode(venue_id) {
  return getMode(undefined, venue_id);
}

/**
 * Returns all layers for diagnostics / mode-badge UI.
 * @param {string} venue_id optional venue scope
 */
export async function describeMode(venue_id) {
  const venueCfg = venue_id ? await readVenueConfig(venue_id) : null;
  const globalCfg = await readGlobalConfig();
  return {
    venue_config: venueCfg?.mode || null,
    global_config: globalCfg?.mode || null,
    request: null,
    resolved: await getActiveMode(venue_id),
  };
}