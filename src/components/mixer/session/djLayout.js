export const WORKBENCH_PRESETS = Object.freeze({
  performance: { performance: 58, library: 24, visual: 18, intelligence: 0 },
  library: { performance: 42, library: 38, visual: 20, intelligence: 0 },
  visual: { performance: 42, library: 18, visual: 40, intelligence: 0 },
  compact: { performance: 52, library: 24, visual: 24, intelligence: 0 },
});

const MINIMUMS = { performance: 35, library: 18, visual: 18, intelligence: 0 };

export function createScopedLayoutKey({ venueId = "no-venue", operatorId = "anonymous", deviceId = "default" } = {}) {
  return `nups.dj.layout.v2:${venueId}:${operatorId}:${deviceId}`;
}

export function normalizeLayout(input = WORKBENCH_PRESETS.performance) {
  const values = {
    performance: Math.max(MINIMUMS.performance, Number(input.performance) || 0),
    library: Math.max(MINIMUMS.library, Number(input.library) || 0),
    visual: Math.max(MINIMUMS.visual, Number(input.visual) || 0),
    intelligence: Math.max(0, Number(input.intelligence) || 0),
  };
  const fixedTotal = values.performance + values.library + values.visual;
  if (fixedTotal <= 100) return { ...values, intelligence: Math.min(values.intelligence, 100 - fixedTotal) };
  const excess = fixedTotal - 100;
  const reducibleLibrary = Math.max(0, values.library - MINIMUMS.library);
  const fromLibrary = Math.min(excess, reducibleLibrary);
  values.library -= fromLibrary;
  const remaining = excess - fromLibrary;
  values.visual = Math.max(MINIMUMS.visual, values.visual - remaining);
  return values;
}

export function loadWorkbenchLayout(storage, scope, preset = "performance") {
  const fallback = WORKBENCH_PRESETS[preset] || WORKBENCH_PRESETS.performance;
  try {
    const raw = storage?.getItem(createScopedLayoutKey(scope));
    return raw ? normalizeLayout(JSON.parse(raw)) : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

export function saveWorkbenchLayout(storage, scope, layout) {
  const normalized = normalizeLayout(layout);
  try { storage?.setItem(createScopedLayoutKey(scope), JSON.stringify(normalized)); } catch { /* local cache is best effort */ }
  return normalized;
}
