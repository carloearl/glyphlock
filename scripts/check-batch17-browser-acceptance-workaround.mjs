#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('src/pages/Batch17Acceptance.jsx', 'utf8');
const backend = fs.readFileSync('base44/functions/batch17Acceptance/entry.ts', 'utf8');
const evidence = fs.readFileSync('base44/functions/getProtectedEvidence/entry.ts', 'utf8');
const runSchema = fs.readFileSync('base44/entities/Batch17AcceptanceRun.jsonc', 'utf8');
const resultSchema = fs.readFileSync('base44/entities/Batch17AcceptanceResult.jsonc', 'utf8');
const parsedRunSchema = JSON.parse(runSchema);
const parsedResultSchema = JSON.parse(resultSchema);

function collectSchemaPropertyNames(node, names = new Set()) {
  if (!node || typeof node !== 'object') return names;

  if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
    for (const [name, child] of Object.entries(node.properties)) {
      names.add(name.toLowerCase().replace(/[^a-z0-9]/g, ''));
      collectSchemaPropertyNames(child, names);
    }
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === 'properties') continue;
    if (Array.isArray(child)) child.forEach((entry) => collectSchemaPropertyNames(entry, names));
    else if (child && typeof child === 'object') collectSchemaPropertyNames(child, names);
  }

  return names;
}

assert.match(page, /claim_test_identity/, 'Browser acceptance must support verified self-claim without an administrator copying tokens.');
assert.match(page, /create_run/, 'Browser acceptance must create a coordinated five-session run.');
assert.match(page, /Batch17SyntheticEvidence/, 'Browser acceptance must use explicitly synthetic evidence.');
assert.match(page, /execute_assignment/, 'Browser acceptance must execute the caller’s assigned role checks.');
assert.match(page, /record_expiry/, 'Browser acceptance must test signed-link expiry.');
assert.match(page, /finalize/, 'Browser acceptance must reconcile all five sessions.');
assert.doesNotMatch(page, /localStorage|sessionStorage/, 'Acceptance sessions must not store credentials or results in browser storage.');
assert.doesNotMatch(
  page,
  /\baccess_token\b|\bauthorization\b\s*[:=]|['"`]Bearer\s+(?:\$\{|[A-Za-z0-9._~-]{12,})/i,
  'Acceptance UI must never construct, store, or attach raw bearer tokens.',
);
assert.match(page, /credentials: 'include'/, 'Signed-link probe must use the current authenticated browser session.');
assert.match(page, /expiresIn \+ 3/, 'Expiry probe must reuse the exact link after its bounded test TTL.');

assert.match(backend, /REQUIRED_ASSIGNMENTS = \['VENUE_A_MANAGER', 'VENUE_A_DOOR', 'VENUE_A_STAFF', 'VENUE_B_MANAGER', 'GLOBAL_ADMIN'\]/, 'Five distinct role assignments are required.');
assert.match(backend, /claim_test_identity/, 'Verified test accounts must self-claim only pre-approved NUPS roles.');
assert.match(backend, /demo_label.*BATCH17 AUTH TEST/, 'Self-claim must be restricted to pre-approved Batch 17 identities.');
assert.match(backend, /wrong_venue_manager_deny/, 'Wrong-venue denial is missing.');
assert.match(backend, /door_tax_deny/, 'Door tax denial is missing.');
assert.match(backend, /door_biometric_deny/, 'Door biometric denial is missing.');
assert.match(backend, /ordinary_staff_contract_deny/, 'Ordinary-staff contract denial is missing.');
assert.match(backend, /global_cross_venue_allow/, 'Global-role behavior is missing.');
assert.match(backend, /SIGNED_URL_EXPIRY/, 'Signed-link expiry result is missing.');
assert.match(backend, /accessCount >= 6 && denialCount >= 5/, 'Audit reconciliation thresholds are missing.');
assert.doesNotMatch(backend, /Deno\.env\.get\([^)]*(?:TOKEN|PASSWORD|OTP)/i, 'Backend workaround must not depend on stored test credentials.');

assert.match(evidence, /requestedTestTtl < 5 \|\| requestedTestTtl > 15/, 'Test TTL must remain tightly bounded.');
assert.match(evidence, /(?:evidence\.mode|evidenceMode) === 'SANDBOX'/, 'Short TTL must be restricted to SANDBOX evidence.');
assert.match(evidence, /evidence\.subject_entity === 'Batch17SyntheticEvidence'/, 'Short TTL must be restricted to Batch 17 synthetic evidence.');
assert.match(evidence, /MANAGER_ROLES\.has/, 'Short TTL must require manager-class authorization.');
assert.deepEqual(parsedRunSchema?.properties?.mode?.enum, ['SANDBOX'], 'Acceptance runs must be SANDBOX-only.');
assert.equal(parsedRunSchema?.properties?.mode?.default, 'SANDBOX', 'Acceptance runs must default to SANDBOX.');
assert.match(resultSchema, /__APPEND_ONLY_BLOCK__/, 'Acceptance results must be append-only.');

const schemaPropertyNames = collectSchemaPropertyNames(parsedRunSchema);
collectSchemaPropertyNames(parsedResultSchema, schemaPropertyNames);
for (const forbiddenField of ['signedurl', 'fileuri', 'accesstoken', 'password', 'otp']) {
  assert.equal(
    schemaPropertyNames.has(forbiddenField),
    false,
    `Acceptance entities must not define the protected or secret field "${forbiddenField}".`,
  );
}

console.log('[check:batch17-browser-acceptance-workaround] PASS — five authenticated browser sessions can complete Batch 17 without exposing bearer tokens or weakening role, venue, or expiry gates.');
