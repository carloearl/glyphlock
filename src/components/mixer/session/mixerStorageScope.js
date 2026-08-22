function clean(value, fallback) {
  const normalized = String(value || fallback).trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized || fallback;
}

export function buildMixerStorageKey(kind, scope = {}) {
  return [
    "nups.dj.cache.v2",
    clean(scope.venueId, "no-venue"),
    clean(scope.operatorId, "anonymous"),
    clean(scope.deviceId, "default-device"),
    clean(scope.mode, "LIVE").toUpperCase(),
    clean(kind, "state"),
  ].join(":");
}
