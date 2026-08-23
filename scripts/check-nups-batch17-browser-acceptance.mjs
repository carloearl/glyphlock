#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('src/pages/NUPSBatch17Acceptance.jsx', 'utf8');
const backend = fs.readFileSync('base44/functions/recordBatch17AcceptanceResult/entry.ts', 'utf8');
const schema = fs.readFileSync('base44/entities/Batch17AcceptanceResult.jsonc', 'utf8');
const runbook = fs.readFileSync('docs/runbooks/NUPS-BATCH17-FINAL-COMPLETION-DIRECTIVE.md', 'utf8');

assert.match(page, /base44\.auth\.me\(\)/, 'Acceptance page must use the real current Base44 browser session.');
assert.match(page, /functions\.invoke\('getProtectedEvidence'/, 'Acceptance page must call the deployed protected-evidence boundary.');
assert.match(page, /functions\.invoke\('recordBatch17AcceptanceResult'/, 'Acceptance page must reconcile the result server-side.');
assert.match(page, /setTimeout\(resolve, waitSeconds \* 1000\)/, 'Acceptance page must wait beyond the actual signed-link lifetime.');
assert.match(page, /signedUrl = ''/, 'Signed URL must be cleared from component-local execution state.');
assert.doesNotMatch(page, /type=["']password["']|otpCode|access_token|localStorage\.setItem\([^)]*(?:token|password|otp)/i, 'Acceptance page must not collect or store credentials.');
assert.doesNotMatch(page, /console\.(?:log|error)\([^)]*(?:signedUrl|token|password|otp)/is, 'Acceptance page must not log credentials or signed links.');
assert.match(page, /NOT A REAL GOVERNMENT ID/, 'Synthetic evidence labeling is required.');
assert.match(page, /mode: 'SANDBOX'/, 'Acceptance evidence must remain SANDBOX-only.');
assert.match(backend, /Only synthetic SANDBOX evidence may be used/, 'Server must reject non-synthetic or non-SANDBOX evidence.');
assert.match(backend, /expectedDecision\(nups, evidence\)/, 'Server must derive the expected result from the authenticated role and evidence.');
assert.match(backend, /SystemAuditLog\.filter/, 'Server must reconcile the production security audit.');
assert.match(backend, /signed_url_recorded: false/, 'Result evidence must state that signed URLs are not retained.');
assert.match(schema, /__APPEND_ONLY_BLOCK__/, 'Acceptance results must be append-only.');
assert.doesNotMatch(
  schema,
  /"(?:file_uri|signed_url|access_token|password|otp|pin)"\s*:/i,
  'Acceptance result schema must not define secret or protected-reference fields.',
);
assert.match(runbook, /five distinct Base44 sessions/i, 'Completion runbook must still require distinct authenticated sessions.');

console.log('[check:nups-batch17-browser-acceptance] PASS — the no-token browser-session workaround preserves real authentication, SANDBOX evidence, audit reconciliation, expiry timing, and append-only sanitized results.');
