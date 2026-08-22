import assert from 'node:assert/strict';

const appId = process.env.VITE_BASE44_APP_ID || process.env.EXPO_PUBLIC_BASE44_APP_ID || '697a087fb354faebb72df54b';
const server = String(process.env.VITE_BASE44_BACKEND_URL || process.env.EXPO_PUBLIC_BASE44_BACKEND_URL || 'https://base44.app').replace(/\/$/, '');
const functionsVersion = process.env.VITE_BASE44_FUNCTIONS_VERSION || process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION || '';

async function invokeAnonymous(name, body) {
  const headers = { 'Content-Type': 'application/json', 'X-App-Id': appId };
  if (functionsVersion) headers['Base44-Functions-Version'] = functionsVersion;
  const response = await fetch(`${server}/api/apps/${appId}/functions/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: response.status, data, text };
}

const terminalAdmin = await invokeAnonymous('manageVenueTerminal', { action: 'list' });
assert.equal(terminalAdmin.status, 401, `manageVenueTerminal anonymous status ${terminalAdmin.status}: ${terminalAdmin.text.slice(0, 240)}`);
assert.match(String(terminalAdmin.data?.error || ''), /Authentication required/i);
assert.doesNotMatch(terminalAdmin.text, /terminal_id|venue_id|trusted|provisioned_by/i, 'Anonymous terminal denial leaked terminal metadata.');

const djGateway = await invokeAnonymous('nupsDJGateway', { action: 'probePlaylistPermission', venue_id: 'dream_palace' });
assert.equal(djGateway.status, 403, `nupsDJGateway anonymous status ${djGateway.status}: ${djGateway.text.slice(0, 240)}`);
assert.match(String(djGateway.data?.error || ''), /Authorized DJ|manager identity|required/i);
assert.doesNotMatch(djGateway.text, /playlist_id|ordered_tracks|entertainer_id/i, 'Anonymous DJ denial leaked playlist data.');

const unknownId = `BATCH16-UNKNOWN-${Date.now()}`;
const publicMode = await invokeAnonymous('nupsClockInV2', { action: 'getPublicMode', terminal_id: unknownId });
assert.equal(publicMode.status, 409, `Unknown terminal status ${publicMode.status}: ${publicMode.text.slice(0, 240)}`);
assert.match(String(publicMode.data?.error || ''), /Trusted terminal venue is not configured/i);
assert.equal(publicMode.data?.terminal_state, 'unknown');
assert.equal(publicMode.data?.venue, undefined, 'Unknown terminal response must not disclose a venue.');
assert.equal(publicMode.data?.payment_provider, undefined, 'Unknown terminal response must not disclose payment configuration.');

const unknownClockIn = await invokeAnonymous('nupsClockInV2', { action: 'clockIn', pin: '0000', terminal_id: unknownId });
assert.equal(unknownClockIn.status, 409, `Unknown terminal clock-in status ${unknownClockIn.status}: ${unknownClockIn.text.slice(0, 240)}`);
assert.equal(unknownClockIn.data?.code, 'TRUSTED_TERMINAL_REQUIRED');
assert.doesNotMatch(unknownClockIn.text, /kiosk_session|shift_id|clocked_in_at/i, 'Unknown terminal issued a staff session.');

const retiredNks1 = await invokeAnonymous('nupsClockIn', { action: 'retirementStatus' });
assert.equal(retiredNks1.status, 410, `Retired NKS1 endpoint must return 410; got ${retiredNks1.status}: ${retiredNks1.text.slice(0, 240)}`);
assert.equal(retiredNks1.data?.code, 'NKS1_ENDPOINT_RETIRED');
assert.doesNotMatch(retiredNks1.text, /venue|payment_provider|kiosk_session|shift_id/i, 'Retired NKS1 endpoint leaked operational data.');

const retiredPlaylist = await invokeAnonymous('manageEntertainerPlaylist', { action: 'capability' });
assert.ok([401, 410].includes(retiredPlaylist.status), `Unused playlist endpoint must be closed to anonymous callers while its 410 tombstone synchronizes; got ${retiredPlaylist.status}: ${retiredPlaylist.text.slice(0, 240)}`);
if (retiredPlaylist.status === 410) {
  assert.equal(retiredPlaylist.data?.code, 'PLAYLIST_ENDPOINT_RETIRED');
} else {
  assert.match(String(retiredPlaylist.data?.error || ''), /Authentication required/i);
}
assert.doesNotMatch(retiredPlaylist.text, /playlist_id|ordered_tracks|entertainer_id|venue_id/i, 'Unused playlist endpoint leaked operational data.');

console.log('[check:nups-batch16-runtime-boundaries] passed: admin endpoints deny anonymous access, unknown NKS2 terminals fail closed, NKS1 returns 410, and the unused playlist endpoint is closed during tombstone synchronization.');
