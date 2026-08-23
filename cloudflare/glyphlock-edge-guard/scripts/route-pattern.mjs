export function routePatternCoversApex(pattern, zoneName) {
  const zone = String(zoneName || '').trim().toLowerCase();
  if (!zone) return false;

  const normalized = String(pattern || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  const slash = normalized.indexOf('/');
  const hostnamePattern = slash === -1 ? normalized : normalized.slice(0, slash);

  // Cloudflare's leading `*` matches zero or more characters, so
  // `*glyphlock.io` covers the apex while `*.glyphlock.io` does not.
  return hostnamePattern === zone
    || hostnamePattern === `*${zone}`
    || hostnamePattern === '*';
}
