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

const headers = {
  'Content-Type': 'application/json',
  'X-App-Id': appId,
};
if (functionsVersion) headers['Base44-Functions-Version'] = functionsVersion;

const response = await fetch(`${serverUrl}/api/apps/${appId}/functions/getProtectedEvidence`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    evidence_id: 'BATCH15-ANONYMOUS-SYNTHETIC',
    purpose: 'batch15_anonymous_denial',
  }),
  signal: AbortSignal.timeout(20_000),
});

const text = await response.text();
assert.equal(
  response.status,
  401,
  `Anonymous protected-evidence retrieval must return HTTP 401; received ${response.status}: ${text.slice(0, 300)}`,
);
assert.match(text, /Authentication required/i, 'Anonymous denial must not leak protected metadata.');
assert.doesNotMatch(text, /file_uri|signed_url|classification|venue_id/i, 'Anonymous denial response leaked protected metadata.');

console.log('[check:nups-anonymous-protected-evidence] passed: deployed function starts and anonymous retrieval is denied with HTTP 401.');
