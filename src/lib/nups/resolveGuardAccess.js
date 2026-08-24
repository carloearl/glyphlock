import { base44 } from "@/api/base44Client";
import { getActiveVenueId, saveActiveVenue } from "@/hooks/useActiveVenue";

async function invokeAccess(venueId, requiredRoles, allowAdmin) {
  const response = await base44.functions.invoke("nupsAccessControl", {
    action: "checkAccess",
    ...(venueId ? { venue_id: venueId } : {}),
    mode: "REAL",
    required_roles: requiredRoles,
    allow_admin: allowAdmin,
  });
  return response.data || {};
}

async function saveResolvedVenue(venueRef) {
  if (!venueRef) return false;
  let venue = await base44.entities.Venue.get(venueRef).catch(() => null);
  if (!venue) {
    venue = (await base44.entities.Venue.filter({ venue_id: venueRef, status: "active" }, "-created_date", 1).catch(() => []))?.[0] || null;
  }
  if (!venue || venue.status !== "active") return false;
  saveActiveVenue(venue);
  return true;
}

export async function resolveGuardAccess({ requiredRoles = [], allowAdmin = true } = {}) {
  const cachedVenueId = getActiveVenueId();
  if (cachedVenueId) {
    const scoped = await invokeAccess(cachedVenueId, requiredRoles, allowAdmin);
    if (scoped.authorized === true) return scoped;
  }

  // A missing/stale cached venue is resolved from the caller's own approved
  // REAL scopes, never from the globally newest venue.
  const unscoped = await invokeAccess(null, requiredRoles, allowAdmin);
  if (unscoped.authorized !== true) return unscoped;
  if (unscoped.venue_id && await saveResolvedVenue(unscoped.venue_id)) return unscoped;

  // Canonical sovereign identities have no grant-bound venue. They may seed an
  // active venue, then receive a fresh scoped server verdict.
  if (unscoped.decision_tier === "SOVEREIGN") {
    const venue = (await base44.entities.Venue.filter({ status: "active" }, "-created_date", 1).catch(() => []))?.[0] || null;
    if (venue) {
      saveActiveVenue(venue);
      return invokeAccess(venue.id, requiredRoles, allowAdmin);
    }
  }
  return { authorized: false, reason: "No authorized active venue is available." };
}
