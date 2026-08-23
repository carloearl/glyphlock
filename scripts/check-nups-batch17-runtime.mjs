import assert from 'node:assert/strict';

const appId = process.env.VITE_BASE44_APP_ID
  || process.env.EXPO_PUBLIC_BASE44_APP_ID
  || '697a087fb354faebb72df54b';
const server = String(
  process.env.VITE_BASE44_BACKEND_URL
  || process.env.EXPO_PUBLIC_BASE44_BACKEND_URL
  || 'https://base44.app',
).replace(/\/$/, '');
const functionsVersion = process.env.VITE_BASE44_FUNCTIONS_VERSION
  || process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION
  || '';

async function invoke(name, body) {
  const headers = { 'Content-Type': 'application/json', 'X-App-Id': appId };
  if (functionsVersion) headers['Base44-Functions-Version'] = functionsVersion;
  const response = await fetch(`${server}/api/apps/${appId}/functions/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  return { response, text: await response.text() };
}

const diagnostic = await invoke('batch17SignedUrlExpiry', { action: 'issueSyntheticUrl' });
assert.equal(diagnostic.response.status, 410, `Temporary storage diagnostic must be retired; got ${diagnostic.response.status}: ${diagnostic.text.slice(0, 240)}`);
assert.match(diagnostic.text, /BATCH17_STORAGE_DIAGNOSTIC_RETIRED/);
assert.doesNotMatch(diagnostic.text, /signed_url|file_uri|https?:\/\//i, 'Retired diagnostic leaked a URL or private reference.');

const evidence = await invoke('getProtectedEvidence', {
  evidence_id: 'BATCH17-ANONYMOUS-SYNTHETIC',
  purpose: 'batch17_runtime_anonymous_denial',
});
assert.equal(evidence.response.status, 401, `Anonymous protected retrieval must return 401; got ${evidence.response.status}: ${evidence.text.slice(0, 240)}`);
assert.match(evidence.text, /Authentication required/i);
assert.doesNotMatch(evidence.text, /signed_url|file_uri|classification|venue_id/i, 'Anonymous denial leaked protected metadata.');

const maturity = await invoke('recordIntegrationMaturity', { action: 'list' });
assert.equal(maturity.response.status, 401, `Anonymous integration maturity listing must return 401; got ${maturity.response.status}: ${maturity.text.slice(0, 240)}`);
assert.doesNotMatch(maturity.text, /integration_key|evidence_reference|known_limitation/i, 'Anonymous maturity denial leaked integration records.');

console.log('[check:nups-batch17-runtime] passed: temporary diagnostics are retired and anonymous privacy/maturity boundaries fail closed.');