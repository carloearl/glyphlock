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
  });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: response.status, data };
}

const terminalAdmin = await invokeAnonymous('manageVenueTerminal', { action: 'list' });
assert.equal(terminalAdmin.status, 401, `manageVenueTerminal anonymous status ${terminalAdmin.status}: ${JSON.stringify(terminalAdmin.data)}`);
assert.match(String(terminalAdmin.data?.error || ''), /Authentication required/i);

const playlistAdmin = await invokeAnonymous('manageEntertainerPlaylist', { action: 'capability' });
assert.equal(playlistAdmin.status, 401, `manageEntertainerPlaylist anonymous status ${playlistAdmin.status}: ${JSON.stringify(playlistAdmin.data)}`);
assert.match(String(playlistAdmin.data?.error || ''), /Authentication required/i);

const unknownId = `BATCH16-UNKNOWN-${Date.now()}`;
const publicMode = await invokeAnonymous('nupsClockIn', { action: 'getPublicMode', terminal_id: unknownId });
assert.equal(publicMode.status, 409, `Unknown terminal status ${publicMode.status}: ${JSON.stringify(publicMode.data)}`);
assert.match(String(publicMode.data?.error || ''), /Trusted terminal venue is not configured/i);
assert.equal(publicMode.data?.venue, undefined, 'Unknown terminal response must not disclose a venue.');
assert.equal(publicMode.data?.payment_provider, undefined, 'Unknown terminal response must not disclose payment configuration.');

console.log('[check:nups-batch16-runtime-boundaries] passed: terminal and playlist admin endpoints require auth; unknown pre-auth terminals fail closed.');
