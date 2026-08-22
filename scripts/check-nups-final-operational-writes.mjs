import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const checklist = read('src/components/admin/DailyChecklistEditor.jsx');
const playlistClient = read('src/lib/nups/entertainerPlaylists.js');
const djFallbacks = read('src/components/mixer/automation/djDirectFallbacks.js');
const playlistBackend = read('base44/functions/manageEntertainerPlaylist/entry.ts');
const playlistSchema = JSON.parse(read('base44/entities/Playlist.jsonc'));

assert.doesNotMatch(checklist, /base44\.entities\.DailyChecklistConfig\.(?:create|update|delete)\s*\(/, 'DailyChecklistEditor must not write directly.');
assert.match(checklist, /writeEntity\s*\(/, 'DailyChecklistEditor must use writeEntity.');
assert.match(checklist, /Checklist belongs to another venue and cannot be moved/, 'Checklist update must prevent venue reassignment.');

assert.doesNotMatch(playlistClient, /base44\.entities\.Playlist\.(?:create|update|delete)\s*\(/, 'Playlist client must not write directly.');
assert.match(playlistClient, /manageEntertainerPlaylist/, 'Playlist persistence must use the governed backend.');
assert.doesNotMatch(djFallbacks, /base44\.entities\.Playlist\.(?:create|update|delete)\s*\(/, 'DJ capability probe must not mutate Playlist.');
assert.match(djFallbacks, /action:\s*["']capability["']/, 'DJ capability probe must use a non-mutating backend action.');

assert.match(playlistBackend, /DJ or manager-class NUPS role required/, 'Playlist backend must enforce actor role.');
assert.match(playlistBackend, /Cross-venue playlist access denied/, 'Playlist backend must deny cross-venue access.');
assert.match(playlistBackend, /Entertainer is not assigned to this venue/, 'Playlist backend must validate entertainer venue ownership.');
assert.match(playlistBackend, /Multiple active playlists require manager cleanup/, 'Playlist backend must enforce one active playlist.');
assert.match(playlistBackend, /ENTERTAINER_PLAYLIST_SAVED/, 'Playlist saves must emit explicit audit evidence.');
assert.equal(playlistSchema?.properties?.venue_id?.type, 'string', 'Playlist schema must include venue_id.');
assert.ok((playlistSchema.required || []).includes('venue_id'), 'Playlist venue_id must be required.');

console.log('[check:nups-final-operational-writes] passed: checklist and playlist writes are governed and the DJ probe is non-mutating.');
