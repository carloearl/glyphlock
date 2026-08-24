const MANAGER_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const DOOR_ROLES = new Set(['DOOR_GIRL', 'DOORMAN']);

export function protectedEvidenceDecision({ role, actorVenueId, evidenceVenueId, classification }) {
  const sameVenue = Boolean(actorVenueId && evidenceVenueId && actorVenueId === evidenceVenueId);
  if (role === 'SOVEREIGN') return { allowed: true, reason: 'sovereign' };
  if (MANAGER_ROLES.has(role) && sameVenue) return { allowed: true, reason: 'venue_manager' };
  if (DOOR_ROLES.has(role) && sameVenue && classification === 'PRIVATE_IDENTITY') {
    return { allowed: true, reason: 'door_identity_only' };
  }
  if (!sameVenue) return { allowed: false, reason: 'venue_mismatch' };
  return { allowed: false, reason: 'role_or_classification_denied' };
}
