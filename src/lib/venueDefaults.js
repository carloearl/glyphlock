// ============================================================
// VENUE DEFAULTS — single source of truth for the live system
// ============================================================
// Every onboarding flow (staff, entertainers, drivers, etc.)
// defaults to Dream Palace unless the operator explicitly
// overrides the venue_id. Change this value in ONE place to
// re-scope the whole app to a different venue.
// ============================================================

export const DEFAULT_VENUE_ID = "dream_palace";
export const DEFAULT_VENUE_NAME = "Dream Palace";

// Normalizes any incoming venue value to the default when empty.
export function resolveVenueId(venueId) {
  const trimmed = typeof venueId === "string" ? venueId.trim() : "";
  return trimmed || DEFAULT_VENUE_ID;
}