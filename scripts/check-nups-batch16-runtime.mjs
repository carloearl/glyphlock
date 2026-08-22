import assert from 'node:assert/strict';

const appId = process.env.VITE_BASE44_APP_ID
  || process.env.EXPO_PUBLIC_BASE44_APP_ID
  || '697a087fb354faebb72df54b';
const serverUrl = String(
  process.env.VITE_BASE44_BACKEND_URL
  || process.env.EXPO_PUBLIC_BASE44_BACKEND_URL
  || 'https://base44.app',
).replace(/\/$/, '');
const functionsVersion = process.env.VITE_BASE44_FUNCTIONS_VERSION
  || process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION
  || '';
const headers = { 'Content-Type': 'application/json', 'X-App-Id': appId };
if (functionsVersion) headers['Base44-Functions-Version'] = functionsVersion;

async function invoke(name, body) {
  const response = await fetch(`${serverUrl}/api/apps/${appId}/functions/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  return { response, text: await response.text() };
}

const terminalAdmin = await invoke('manageVenueTerminal', { action: 'list', venue_id: 'dream_palace' });
assert.equal(terminalAdmin.response.status, 401, `Anonymous terminal administration must return 401; got ${terminalAdmin.response.status}: ${terminalAdmin.text.slice(0, 240)}`);
assert.match(terminalAdmin.text, /Authentication required/i);
assert.doesNotMatch(terminalAdmin.text, /terminal_id|trusted|venue_id|provisioned_by/i, 'Anonymous terminal denial leaked terminal metadata.');

const dj = await invoke('nupsDJGateway', { action: 'probePlaylistPermission', venue_id: 'dream_palace' });
assert.equal(dj.response.status, 403, `Anonymous DJ capability request must return 403; got ${dj.response.status}: ${dj.text.slice(0, 240)}`);
assert.match(dj.text, /authorized dj|manager identity|required/i);
assert.doesNotMatch(dj.text, /playlist_id|entertainer_id|ordered_tracks/i, 'Anonymous DJ denial leaked playlist data.');

const unknownTerminalId = `BATCH16-UNKNOWN-${Date.now()}`;
const publicMode = await invoke('nupsClockInV2', { action: 'getPublicMode', terminal_id: unknownTerminalId });
assert.equal(publicMode.response.status, 409, `Unknown NKS2 terminal must fail closed with 409; got ${publicMode.response.status}: ${publicMode.text.slice(0, 240)}`);
assert.match(publicMode.text, /Trusted terminal venue is not configured/i);
assert.match(publicMode.text, /"terminal_state":"unknown"/i);
assert.doesNotMatch(publicMode.text, /payment_provider|operating_mode|venue":/i, 'Unknown terminal response leaked venue or payment configuration.');

const unknownClockIn = await invoke('nupsClockInV2', { action: 'clockIn', pin: '0000', terminal_id: unknownTerminalId });
assert.equal(unknownClockIn.response.status, 409, `Unknown NKS2 terminal must be blocked before PIN verification; got ${unknownClockIn.response.status}: ${unknownClockIn.text.slice(0, 240)}`);
assert.match(unknownClockIn.text, /TRUSTED_TERMINAL_REQUIRED/);
assert.doesNotMatch(unknownClockIn.text, /kiosk_session|shift_id|clocked_in_at/i, 'Unknown NKS2 terminal issued a session or shift response.');

const revoked = await invoke('nupsClockInV2', { action: 'getPublicMode', terminal_id: 'B16-SBX-20260821-7F9C2A' });
assert.equal(revoked.response.status, 403, `Permanently revoked Batch 16 test terminal must remain denied; got ${revoked.response.status}: ${revoked.text.slice(0, 240)}`);
assert.match(revoked.text, /"terminal_state":"revoked"/i);

const sweep = await invoke('nupsClockInV2', { action: 'sweepStale' });
assert.equal(sweep.response.status, 401, `Anonymous stale-shift sweep must be denied; got ${sweep.response.status}: ${sweep.text.slice(0, 240)}`);

const legacyPin = await invoke('nupsClockIn', { action: 'clockIn', pin: '0000', terminal_id: unknownTerminalId });
assert.ok([401, 404, 409].includes(legacyPin.response.status), `Retired NKS1 route must not authenticate a PIN; got ${legacyPin.response.status}: ${legacyPin.text.slice(0, 240)}`);
assert.doesNotMatch(legacyPin.text, /kiosk_session|shift_id|clocked_in_at/i, 'Retired NKS1 route issued a session or shift response.');

console.log('[check:nups-batch16-runtime] passed: terminal admin and DJ functions deny anonymous access, NKS2 rejects unknown/revoked terminals before PIN verification, anonymous sweeps are denied, and the retired NKS1 route does not issue a session.');
