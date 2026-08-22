import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const checklist = read('src/components/admin/DailyChecklistEditor.jsx');
const playlistClient = read('src/lib/nups/entertainerPlaylists.js');
const djFallbacks = read('src/components/mixer/automation/djDirectFallbacks.js');
const djGateway = read('base44/functions/nupsDJGateway/entry.ts');
const retiredPlaylistEndpoint = read('base44/functions/manageEntertainerPlaylist/entry.ts');
const playlistSchema = JSON.parse(read('base44/entities/Playlist.jsonc'));

assert.doesNotMatch(checklist, /base44\.entities\.DailyChecklistConfig\.(?:create|update|delete)\s*\(/, 'DailyChecklistEditor must not write directly.');
assert.match(checklist, /writeEntity\s*\(\s*\{[\s\S]*entity:\s*['"]DailyChecklistConfig['"]/, 'DailyChecklistEditor must use writeEntity.');
assert.match(checklist, /Checklist belongs to another venue/, 'Checklist update must prevent venue reassignment.');

assert.doesNotMatch(playlistClient, /base44\.entities\.Playlist\.(?:create|update|delete)\s*\(/, 'Playlist client must not write directly.');
assert.match(playlistClient, /invokeDJGateway\(["']savePlaylist["']/, 'Playlist persistence must use nupsDJGateway.');
assert.match(playlistClient, /venue_id:\s*resolvedVenueId/, 'Playlist persistence must pass active venue context.');
assert.doesNotMatch(djFallbacks, /Playlist\.(?:create|update|delete)\s*\(/, 'DJ fallback must not mutate Playlist.');

assert.match(djGateway, /PLAYLIST_ROLES/, 'DJ gateway must enforce playlist roles.');
assert.match(djGateway, /DJ operation is bound to another venue/, 'DJ gateway must deny cross-venue playlist access.');
assert.match(djGateway, /Entertainer does not belong to this venue/, 'DJ gateway must validate entertainer venue ownership.');
assert.match(djGateway, /action === ["']probePlaylistPermission["']/, 'DJ gateway must expose a non-mutating capability probe.');
const probeBlock = djGateway.match(/if \(action === ["']probePlaylistPermission["']\) \{([\s\S]*?)\n    \}/)?.[1] || '';
assert.ok(probeBlock, 'DJ gateway capability block is missing.');
assert.doesNotMatch(probeBlock, /\.create\(|\.update\(|\.delete\(/, 'DJ capability probe must not mutate data.');
assert.match(djGateway, /action === ["']savePlaylist["']/, 'DJ gateway playlist save action is missing.');
assert.match(djGateway, /matching\.slice\(1\)/, 'DJ gateway must archive duplicate active playlists.');
assert.match(djGateway, /ENTERTAINER_PLAYLIST_(?:CREATED|UPDATED)/, 'Playlist saves must emit explicit audit evidence.');

assert.match(retiredPlaylistEndpoint, /PLAYLIST_ENDPOINT_RETIRED/, 'Unused duplicate playlist endpoint must be an explicit tombstone.');
assert.match(retiredPlaylistEndpoint, /status:\s*410/, 'Unused duplicate playlist endpoint must return 410 Gone.');
assert.doesNotMatch(retiredPlaylistEndpoint, /Playlist\.(?:create|update|delete)|E\.Playlist/, 'Retired playlist endpoint must contain no persistence logic.');

assert.equal(playlistSchema?.properties?.venue_id?.type, 'string', 'Playlist schema must include venue_id.');
assert.ok((playlistSchema.required || []).includes('venue_id'), 'Playlist venue_id must be required.');

console.log('[check:nups-final-operational-writes] passed: checklist and playlist writes are governed, the DJ probe is non-mutating, and the duplicate playlist endpoint is retired.');
