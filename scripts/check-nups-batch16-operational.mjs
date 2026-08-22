import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const checklist = read('src/components/admin/DailyChecklistEditor.jsx');
const playlists = read('src/lib/nups/entertainerPlaylists.js');
const playlistDock = read('src/components/mixer/EntertainerPlaylistDock.jsx');
const directFallbacks = read('src/components/mixer/automation/djDirectFallbacks.js');
const gatewayClient = read('src/components/mixer/automation/djGatewayClient.js');
const djGateway = read('base44/functions/nupsDJGateway/entry.ts');
const playlistSchema = read('base44/entities/Playlist.jsonc');
const terminalFunction = read('base44/functions/manageVenueTerminal/entry.ts');
const terminalUi = read('src/components/admin/TerminalManagementEditor.jsx');
const venueSettings = read('src/pages/VenueAdminSettings.jsx');
const clockV2 = read('base44/functions/nupsClockInV2/entry.ts');
const nupsUserSchema = read('base44/entities/NUPSUser.jsonc');

assert.doesNotMatch(checklist, /DailyChecklistConfig\.(?:create|update)\s*\(/, 'DailyChecklistEditor still writes directly.');
assert.match(checklist, /writeEntity\s*\(\s*\{[\s\S]*entity:\s*['"]DailyChecklistConfig['"]/, 'Daily checklist must use writeEntity.');
assert.match(checklist, /recordVenueId\s*!==\s*String\(venueId\)/, 'Checklist updates must block venue changes.');

assert.doesNotMatch(playlists, /base44\.entities\.Playlist\.(?:create|update|delete)/, 'Playlist helper still writes directly.');
assert.match(playlists, /invokeDJGateway\(["']savePlaylist["']/, 'Playlist saves must use the authenticated DJ gateway.');
assert.match(playlists, /venueId/, 'Playlist helper must require venue context.');
assert.match(playlistDock, /useActiveVenue/, 'Playlist dock must resolve the active venue.');
assert.match(playlistDock, /saveEntertainerPlaylist\([\s\S]*venueId/, 'Playlist dock must pass venue to saves.');

assert.doesNotMatch(directFallbacks, /Playlist\.(?:create|delete)/, 'Mutating DJ permission probe still exists.');
assert.doesNotMatch(gatewayClient, /probePlaylistWriteDirect/, 'DJ gateway client still falls back to a mutating probe.');
const probeBlock = djGateway.match(/if \(action === ["']probePlaylistPermission["']\) \{([\s\S]*?)\n    \}/)?.[1] || '';
assert.ok(probeBlock, 'DJ gateway capability action is missing.');
assert.doesNotMatch(probeBlock, /\.create\(|\.delete\(|\.update\(/, 'DJ capability probe must be non-mutating.');
assert.match(djGateway, /PLAYLIST_ROLES/, 'DJ gateway must enforce playlist roles.');
assert.match(djGateway, /Entertainer\.get\(entertainerId\)/, 'Playlist save must validate the entertainer.');
assert.match(djGateway, /venue_id:\s*canonicalVenueId/, 'Playlist persistence must stamp canonical venue.');
assert.match(djGateway, /matching\.slice\(1\)/, 'Duplicate active playlists must be archived.');
assert.match(playlistSchema, /"venue_id"/, 'Playlist schema must be venue scoped.');
assert.match(playlistSchema, /"required"\s*:\s*\[[\s\S]*"venue_id"/, 'Playlist venue must be required.');

for (const action of ['list', 'getCurrentBinding', 'provision', 'update', 'activate', 'deactivate', 'revoke']) {
  assert.match(terminalFunction, new RegExp(`action === ['"]${action}['"]|\\[.*['"]${action}['"]`), `Terminal backend is missing ${action}.`);
}
assert.match(terminalFunction, /ADMIN_ROLES/, 'Terminal backend must enforce administrative NUPS roles.');
assert.match(terminalFunction, /Cross-venue terminal administration denied/, 'Terminal backend must deny cross-venue management.');
assert.match(terminalFunction, /TERMINAL_PROVISIONED/, 'Terminal provisioning must be audited.');
assert.match(terminalFunction, /TERMINAL_REVOKED/, 'Terminal revocation must be audited.');
assert.doesNotMatch(terminalFunction, /VenueTerminal\.delete/, 'Normal terminal management must preserve history rather than hard delete.');
assert.match(terminalUi, /getNUPSTerminalId/, 'Terminal UI must use a stable browser terminal identifier.');
assert.match(terminalUi, /Provision Terminal/, 'Terminal provisioning UI is missing.');
assert.match(terminalUi, /Revoke/, 'Terminal revocation UI is missing.');
assert.match(venueSettings, /TerminalManagementEditor/, 'Terminal management is not mounted in venue settings.');

assert.match(clockV2, /NKS2\./, 'Clock-in V2 must issue NKS2 sessions.');
assert.doesNotMatch(clockV2, /NKS1\./, 'Clock-in V2 must not accept NKS1 sessions.');
assert.match(clockV2, /pin_lookup_v2/, 'Clock-in V2 must use the versioned PIN index.');
assert.doesNotMatch(clockV2, /\bpin_lookup\b(?!_v2)/, 'Clock-in V2 still references the retired PIN index.');
assert.match(nupsUserSchema, /"pin_lookup_v2"/, 'NUPSUser schema lacks the NKS2 PIN index.');
assert.doesNotMatch(nupsUserSchema, /"pin_lookup"\s*:/, 'Legacy PIN index remains in the NUPSUser schema.');
const retiredClock = read('base44/functions/nupsClockIn/entry.ts');
assert.match(retiredClock, /NKS1_ENDPOINT_RETIRED/, 'Retired nupsClockIn route must be an explicit tombstone.');
assert.match(retiredClock, /status:\s*410/, 'Retired nupsClockIn tombstone must return HTTP 410.');
assert.doesNotMatch(retiredClock, /NUPSUser|StaffShift|pin_lookup|sweepStale|getPublicMode/, 'Retired nupsClockIn tombstone must contain no operational logic.');

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}
for (const file of [...walk('src'), ...walk('base44/functions')]) {
  const source = read(file);
  assert.doesNotMatch(source, /functions\.invoke\(\s*['"]nupsClockIn['"]/, `${file} still invokes the retired clock-in function.`);
}

console.log('[check:nups-batch16-operational] passed: final six NUPS writes are governed, playlist diagnostics are non-mutating, terminal provisioning is audited, and NKS2 is the only live clock-in boundary.');
