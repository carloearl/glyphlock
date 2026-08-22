import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const backend = read('base44/functions/manageVenueTerminal/entry.ts');
const ui = read('src/components/admin/TerminalManagementEditor.jsx');
const settings = read('src/pages/VenueAdminSettings.jsx');
const kioskPinPad = read('src/components/nups/kiosk/KioskPinPad.jsx');
const timeClock = read('src/components/nups/TimeClock.jsx');
const clock = read('base44/functions/nupsClockInV2/entry.ts');
const schema = JSON.parse(read('base44/entities/VenueTerminal.jsonc'));

assert.match(backend, /ADMIN_ROLES/, 'Terminal administration must require an authorized NUPS role.');
assert.match(backend, /Cross-venue terminal administration denied/, 'Terminal administration must fail closed across venues.');
assert.match(backend, /action === 'provision' \|\| action === 'approve'/, 'Terminal backend must distinguish pending registration from approval.');
assert.match(backend, /TERMINAL_PROVISIONED/, 'Terminal registration must be audited.');
assert.match(backend, /TERMINAL_APPROVED/, 'Terminal approval must be audited.');
assert.match(backend, /TERMINAL_REVOKED/, 'Terminal revocation must be audited.');
assert.match(backend, /TERMINAL_TRUST_CHANGED/, 'Terminal trust changes must be audited.');
assert.match(backend, /Revoked terminals cannot be re-approved/, 'Revoked terminals must not be silently re-approved.');
assert.match(backend, /Revoked terminals cannot be reactivated/, 'Revoked terminals must not be silently reactivated.');
assert.doesNotMatch(backend, /VenueTerminal\.delete\s*\(/, 'Normal terminal administration must preserve history rather than hard-delete records.');

assert.match(ui, /manageVenueTerminal/, 'Terminal UI must use the authenticated backend.');
assert.match(ui, /getNUPSTerminalId/, 'Browser registration candidate must be stable across refreshes.');
assert.match(ui, /Approve This Device/, 'Current-device approval must be a clear explicit action.');
assert.match(ui, /Register Pending/, 'Remote devices must be registerable without granting trust.');
assert.match(ui, /Approve & Activate/, 'Approval must explicitly activate and trust the selected device.');
assert.doesNotMatch(ui, /base44\.entities\.VenueTerminal\.(?:create|update|delete)/, 'Terminal UI must not write the entity directly.');
assert.match(settings, /<TerminalManagementEditor\s+venueId=\{selectedVenue\}/, 'Terminal manager must be mounted in the dedicated Terminals tab.');
assert.doesNotMatch(settings, /VenueTerminalManager/, 'Duplicate terminal-management panel must not remain mounted.');
assert.equal(fs.existsSync('src/components/admin/VenueTerminalManager.jsx'), false, 'Duplicate VenueTerminalManager source must be removed.');

assert.match(clock, /VenueTerminal\.filter\(\{\s*terminal_id:\s*terminalId\s*\}/, 'Pre-auth clock-in must resolve a VenueTerminal record by exact device ID.');
assert.match(clock, /terminalRecord\.status\s*===\s*'active'/, 'Pre-auth clock-in must require active terminal status.');
assert.match(clock, /terminalRecord\.trusted\s*===\s*true/, 'Pre-auth clock-in must require server-side trust.');
assert.doesNotMatch(clock, /VenuePaymentConfig\.filter\(\{\s*terminal_id/, 'Payment configuration must never confer terminal trust.');
assert.match(clock, /Trusted terminal venue is not configured/, 'Unknown terminal behavior must fail closed.');
assert.match(clock, /UNKNOWN_TERMINAL_BLOCKED/, 'Unknown terminal blocks must emit explicit security evidence.');
assert.match(clock, /last_seen_at:\s*now\(\)/, 'Trusted terminal use must update last-seen evidence.');

assert.match(kioskPinPad, /action:\s*["']getPublicMode["'][\s\S]*terminal_id:\s*terminalId/, 'Kiosk PIN screen must preflight device approval.');
assert.match(kioskPinPad, /Device Approval Required/, 'Blocked kiosks must explain the device-approval requirement.');
assert.match(kioskPinPad, /Copy Device ID/, 'Blocked kiosks must expose the non-secret device ID for manager registration.');
assert.match(kioskPinPad, /Check Approval/, 'Blocked kiosks must allow the operator to re-check approval without refreshing.');
assert.match(timeClock, /getNUPSTerminalId/, 'TimeClock must use the canonical terminal identity.');
assert.match(timeClock, /action:\s*action === ["']in["'] \? ["']clockIn["'] : ["']clockOut["'][\s\S]*terminal_id:\s*terminalId/, 'TimeClock clock-in/out must submit terminal_id.');

assert.deepEqual(schema?.properties?.status?.enum, ['active', 'inactive', 'revoked'], 'Terminal schema must preserve active/inactive/revoked states.');
assert.equal(schema?.properties?.trusted?.type, 'boolean', 'Terminal trust must be explicit boolean state.');
assert.ok((schema.required || []).includes('terminal_id') && (schema.required || []).includes('venue_id'), 'Terminal identity and venue must be required.');

console.log('[check:nups-terminal-governance] passed: one explicit device-approval flow is server-authorized, venue-scoped, audited, history-preserving, and fail-closed.');
