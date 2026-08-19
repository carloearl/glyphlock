/**
 * Door PIN issuance for entertainers.
 * A PIN must be unique within the venue roster so a scan-free check-in
 * always resolves to exactly one performer.
 */
export function generateUniquePin(existing = []) {
  const taken = new Set(
    (existing || []).map((e) => String(e?.nups_pin || "")).filter(Boolean)
  );
  for (let i = 0; i < 500; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (!taken.has(pin)) return pin;
  }
  return null;
}

/** Match a scanned license against the roster (last-4 + state, then name). */
export function matchEntertainerByLicense(roster = [], parsed) {
  if (!parsed) return null;
  const last4 = (parsed.id_number || "").slice(-4);
  const state = (parsed.id_state || "").toUpperCase();
  const byLicense = roster.find(
    (e) =>
      last4 &&
      e.license_number_last4 === last4 &&
      (!state || !e.license_state || e.license_state.toUpperCase() === state)
  );
  if (byLicense) return byLicense;
  const name = (parsed.full_name || "").trim().toLowerCase();
  if (!name) return null;
  return roster.find((e) => (e.legal_name || "").trim().toLowerCase() === name) || null;
}