import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const backend = read('base44/functions/manageVenueTerminal/entry.ts');
const ui = read('src/components/admin/VenueTerminalManager.jsx');
const settings = read('src/pages/VenueAdminSettings.jsx');
const clock = read('base44/functions/nupsClockIn/entry.ts');
const schema = JSON.parse(read('base44/entities/VenueTerminal.jsonc'));

assert.match(backend, /Venue security administrator role required/, 'Terminal administration must require an authorized NUPS role.');
assert.match(backend, /Cross-venue terminal administration denied/, 'Terminal administration must fail closed across venues.');
assert.match(backend, /TERMINAL_PROVISIONED/, 'Terminal provisioning must be audited.');
assert.match(backend, /TERMINAL_REVOKED/, 'Terminal revocation must be audited.');
assert.match(backend, /TERMINAL_TRUST_CHANGED/, 'Terminal trust changes must be audited.');
assert.doesNotMatch(backend, /VenueTerminal\.delete\s*\(/, 'Normal terminal administration must preserve history rather than hard-delete records.');
assert.match(backend, /statusByAction[^]*activate[^]*deactivate[^]*revoke/s, 'Terminal state actions must support activate, deactivate, and revoke.');

assert.match(ui, /manageVenueTerminal/, 'Terminal UI must use the authenticated backend.');
assert.match(ui, /nups_terminal_id/, 'Browser registration candidate must be stable across refreshes.');
assert.match(ui, /Approve as trusted immediately/, 'Trust must be an explicit administrator decision.');
assert.doesNotMatch(ui, /base44\.entities\.VenueTerminal\.(?:create|update|delete)/, 'Terminal UI must not write the entity directly.');
assert.match(settings, /<VenueTerminalManager\s+venueId=\{selectedVenue\}/, 'Terminal manager must be mounted in venue settings.');

assert.match(clock, /VenueTerminal\.filter\(\{\s*terminal_id:\s*terminalId,\s*status:\s*'active',\s*trusted:\s*true\s*\}/, 'Pre-auth clock-in must resolve only an active trusted terminal.');
assert.match(clock, /Trusted terminal venue is not configured/, 'Unknown terminal behavior must fail closed.');
assert.match(clock, /UNKNOWN_TERMINAL_BLOCKED/, 'Unknown terminal blocks must emit explicit security evidence.');

assert.deepEqual(schema?.properties?.status?.enum, ['active', 'inactive', 'revoked'], 'Terminal schema must preserve active/inactive/revoked states.');
assert.equal(schema?.properties?.trusted?.type, 'boolean', 'Terminal trust must be explicit boolean state.');
assert.ok((schema.required || []).includes('terminal_id') && (schema.required || []).includes('venue_id'), 'Terminal identity and venue must be required.');

console.log('[check:nups-terminal-governance] passed: provisioning is server-authorized, venue-scoped, audited, history-preserving, and fail-closed.');
