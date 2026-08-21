import assert from 'node:assert/strict';
import { protectedEvidenceDecision } from '../base44/functions/_shared/protectedEvidencePolicy.js';

const allow = (input) => assert.equal(protectedEvidenceDecision(input).allowed, true, JSON.stringify(input));
const deny = (input) => assert.equal(protectedEvidenceDecision(input).allowed, false, JSON.stringify(input));

allow({ role: 'VENUE_MANAGER', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_TAX' });
allow({ role: 'DOORMAN', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_IDENTITY' });
allow({ role: 'SOVEREIGN', actorVenueId: 'A', evidenceVenueId: 'B', classification: 'PRIVATE_BIOMETRIC' });
deny({ role: 'BARTENDER', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_IDENTITY' });
deny({ role: 'DOORMAN', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_TAX' });
deny({ role: 'DOOR_GIRL', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_BIOMETRIC' });
deny({ role: 'VENUE_MANAGER', actorVenueId: 'A', evidenceVenueId: 'B', classification: 'PRIVATE_IDENTITY' });
deny({ role: 'DJ', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_CONTRACT' });

console.log('[check:protected-evidence-policy] passed: role, classification, and cross-venue matrix fails closed.');
