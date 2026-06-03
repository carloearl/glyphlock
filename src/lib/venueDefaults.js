// ============================================================
// VENUE DEFAULTS — BPAAA v3.0 / DACO-FRONTDOOR-DRIVER
// ============================================================
// Hardcoded "dream_palace" string was purged 2026-06-03 per DACO
// directive. Venue resolution is now DYNAMIC — derived from
// auth/session/active-venue context, never from a string literal.
//
// `resolveVenueId(...)` returns null when no venue can be resolved.
// Callers MUST handle null (block the action, force venue selection)
// instead of silently writing to a default. This prevents cross-venue
// data contamination on multi-tenant deployments.
// ============================================================

export const DEFAULT_VENUE_ID = null;
export const DEFAULT_VENUE_NAME = "Active Venue";

// Returns the trimmed venue_id or null. NEVER returns a hardcoded fallback.
export function resolveVenueId(venueId) {
  const trimmed = typeof venueId === "string" ? venueId.trim() : "";
  return trimmed || null;
}