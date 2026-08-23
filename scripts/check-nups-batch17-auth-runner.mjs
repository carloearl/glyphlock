import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('scripts/test-nups-batch17-authenticated.mjs', 'utf8');
const runbook = fs.readFileSync('docs/runbooks/NUPS-BATCH17-AUTHENTICATED-ACCEPTANCE.md', 'utf8');

for (const name of [
  'B17_MANAGER_A_TOKEN',
  'B17_DOOR_A_TOKEN',
  'B17_STAFF_A_TOKEN',
  'B17_MANAGER_B_TOKEN',
  'B17_GLOBAL_TOKEN',
  'B17_VENUE_A_ID',
  'B17_VENUE_B_ID',
]) {
  assert.match(source, new RegExp(name), `Authenticated runner is missing ${name}`);
}

assert.match(source, /PRIVATE_IDENTITY/, 'Runner must test identity evidence.');
assert.match(source, /PRIVATE_TAX/, 'Runner must test tax evidence.');
assert.match(source, /PRIVATE_BIOMETRIC/, 'Runner must test biometric evidence.');
assert.match(source, /PRIVATE_CONTRACT/, 'Runner must test contract evidence.');
assert.match(source, /wrong_venue_manager_deny/, 'Runner must test wrong-venue denial.');
assert.match(source, /door_tax_deny/, 'Runner must test door tax denial.');
assert.match(source, /door_biometric_deny/, 'Runner must test door biometric denial.');
assert.match(source, /global_cross_venue_allow/, 'Runner must test documented global behavior.');
assert.match(source, /setTimeout\(resolve, \(expiresIn \+ 4\) \* 1000\)/, 'Runner must wait through the actual signed URL TTL.');
assert.match(source, /PROTECTED_EVIDENCE_ACCESSED/, 'Runner must reconcile access audits.');
assert.match(source, /PROTECTED_EVIDENCE_ACCESS_DENIED/, 'Runner must reconcile denial audits.');
assert.match(source, /doesNotMatch\(serialized, \/file_uri\|signed_url/, 'Runner must reject URL/private-URI audit metadata.');
assert.match(source, /signed_urls_printed:\s*false/, 'Runner report must state signed URLs were not printed.');
assert.match(source, /private_file_uris_printed:\s*false/, 'Runner report must state private URIs were not printed.');
assert.doesNotMatch(source, /console\.log\([^\n]*(?:TOKEN|signedUrl|fileUri)/i, 'Runner must not log credential or URL variables.');
assert.doesNotMatch(source, /dotenv|\.env/, 'Runner must not load committed dotenv files.');
assert.match(runbook, /Do not create an `.env` file/, 'Runbook must prohibit dotenv persistence.');
assert.match(runbook, /five distinct Base44 users/i, 'Runbook must require distinct authenticated users.');

console.log('[check:nups-batch17-auth-runner] passed: authenticated acceptance runner is token-only, synthetic, role/venue complete, expiry-aware, and secret-safe.');