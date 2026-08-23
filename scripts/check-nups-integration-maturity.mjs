import assert from 'node:assert/strict';
import fs from 'node:fs';

const schema = JSON.parse(fs.readFileSync('base44/entities/IntegrationMaturity.jsonc', 'utf8'));
const backend = fs.readFileSync('base44/functions/recordIntegrationMaturity/entry.ts', 'utf8');
const integrations = fs.readFileSync('INTEGRATIONS.md', 'utf8');

const maturity = schema?.properties?.maturity?.enum || [];
assert.deepEqual(maturity, ['configured', 'connected', 'authenticated', 'request_succeeded', 'response_validated', 'end_to_end_verified']);
assert.ok((schema.required || []).includes('status_key'), 'IntegrationMaturity requires a stable status_key.');
assert.ok((schema.required || []).includes('tested_at'), 'IntegrationMaturity requires tested_at.');
assert.match(backend, /Integration administrator role required/, 'Maturity writes must require an integration administrator.');
assert.match(backend, /Cross-venue integration status denied/, 'Maturity writes must deny unauthorized cross-venue records.');
assert.match(backend, /INTEGRATION_MATURITY_RECORDED/, 'Maturity writes must emit explicit audit evidence.');
assert.match(backend, /forbidden secret or private reference field/, 'Maturity metadata must reject secrets and private references.');
assert.doesNotMatch(backend, /IntegrationMaturity\.delete/, 'Maturity history must not be hard-deleted by the normal service.');
assert.match(integrations, /configured → connected → authenticated → request succeeded → response validated → end-to-end verified/, 'Integration maturity vocabulary drifted.');
assert.match(integrations, /exactly three active Base44 OAuth connectors/, 'Current connector inventory is not documented.');
assert.match(integrations, /authenticated signed retrieval and expiry: \*\*not yet end-to-end verified\*\*/i, 'Private-file maturity must retain the authenticated limitation.');

console.log('[check:nups-integration-maturity] passed: maturity is persisted, governed, evidence-backed, secret-free, and uses the canonical ladder.');