import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');

const handoff = read('docs/NUPS-CURRENT-HANDOFF.md');
const historical = read('src/docs/HANDOFF.md');
const architecture = read('ARCHITECTURE.md');
const context = read('CONTEXT.md');
const integrations = read('INTEGRATIONS.md');
const issues = read('KNOWN_ISSUES.md');
const authHarness = read('scripts/test-nups-batch17-authenticated.mjs');
const authRunbook = read('docs/runbooks/NUPS-BATCH17-AUTHENTICATED-ACCEPTANCE.md');
const identityMatrix = read('docs/audits/NUPS-BATCH17-TEST-IDENTITY-MATRIX.md');
const terminalRunbook = read('docs/runbooks/NUPS-TERMINAL-APPROVAL.md');
const nks1 = read('base44/functions/nupsClockIn/entry.ts');
const playlistTombstone = read('base44/functions/manageEntertainerPlaylist/entry.ts');
const terminalClock = read('base44/functions/nupsClockInV2/entry.ts');
const protectedRetrieval = read('base44/functions/getProtectedEvidence/entry.ts');
const acceptanceAudit = read('base44/functions/getBatch17AcceptanceEvidence/entry.ts');

assert.match(historical, /HISTORICAL \/ SUPERSEDED/, 'Historical handoff is not clearly superseded.');
const writeSnapshot = JSON.parse(execFileSync('node', ['scripts/check-nups-write-gateway.mjs', '--snapshot'], { encoding: 'utf8' }));
const writeSnapshotTotal = Object.values(writeSnapshot.files || {}).reduce((sum, entry) => sum + Number(entry?.total || 0), 0);
assert.equal(Number.isInteger(writeSnapshotTotal) && writeSnapshotTotal > 0, true, 'Write-gateway snapshot did not contain a valid positive file-total sum.');
assert.match(handoff, new RegExp(`${writeSnapshotTotal}\\s*\\/\\s*287`), 'Current handoff does not record the live write baseline.');
assert.match(handoff, /GuestProfile = canonical minimized guest identity/, 'Current guest ownership is missing from the handoff.');
assert.match(handoff, /`?VenueTerminal`?\s+(?:=|is)\s+the?\s*sole pre-auth(?:entication)? device-to-venue trust boundary/i, 'Terminal trust boundary is missing from the handoff.');
assert.match(handoff, /NKS2/, 'NKS2-only session posture is missing from the current handoff.');
assert.match(architecture, /live high-risk NUPS\s+0/, 'Architecture does not record zero live high-risk NUPS writes.');
assert.match(context, /Batch 17 is an operational acceptance/, 'Context does not identify Batch 17 as acceptance work.');
assert.match(integrations, /Batch 17 integration maturity record/, 'Integration maturity record is missing.');
assert.match(issues, /NUPS-0008[\s\S]*RESOLVED — CURRENT HANDOFF PUBLISHED/, 'NUPS-0008 is not resolved with current documentation evidence.');

for (const name of [
  'B17_MANAGER_A_TOKEN',
  'B17_DOOR_A_TOKEN',
  'B17_STAFF_A_TOKEN',
  'B17_MANAGER_B_TOKEN',
  'B17_GLOBAL_TOKEN',
]) {
  assert.match(authHarness, new RegExp(name), `Authenticated harness is missing ${name}.`);
}
assert.doesNotMatch(
  authHarness,
  /console\.(?:log|error)\([^)]*(?:process\.env\.B17_|tokens(?:\.|\[)|signedUrl\b|fileUri\b|file_uri\b|signed_url\b)/is,
  'Authenticated harness may print an actual credential variable or protected reference.',
);
assert.match(authHarness, /setTimeout\(resolve, \(expiresIn \+ 4\) \* 1000\)/, 'Harness must wait beyond the real signed-URL expiry.');
assert.match(authHarness, /wrong_venue_manager_deny/, 'Wrong-venue authenticated test is missing.');
assert.match(authHarness, /door_tax_deny/, 'Door tax denial test is missing.');
assert.match(authHarness, /ordinary_staff_contract_deny/, 'Ordinary-staff contract denial test is missing.');
assert.match(
  authHarness,
  /SystemAuditLog\.filter|functions\.invoke\(['"]getBatch17AcceptanceEvidence['"]/, 
  'Authenticated audit reconciliation is missing.',
);
assert.doesNotMatch(authHarness, /localStorage|sessionStorage/, 'Authenticated harness must not place credentials in browser storage.');
assert.doesNotMatch(
  authHarness,
  /(?:read|write)FileSync\([^)]*['"][^'"]*\.env/i,
  'Authenticated harness must not read or write dotenv credential files.',
);
assert.match(authRunbook, /synthetic/i, 'Authenticated runbook does not require synthetic evidence.');
assert.match(identityMatrix, /No existing employee or customer account was repurposed/, 'Test identity safety decision is missing.');

assert.match(terminalRunbook, /Approve This Device/, 'Physical device approval runbook is missing.');
assert.doesNotMatch(terminalClock, /VenuePaymentConfig\.filter\(\{\s*terminal_id|legacyPaymentTerminal/, 'Payment configuration regained terminal-trust authority.');
assert.match(terminalClock, /NKS2\./, 'NKS2 session issuance is missing.');
assert.doesNotMatch(terminalClock, /NKS1\./, 'NKS1 logic returned to the supported clock-in service.');
assert.match(nks1, /NKS1_ENDPOINT_RETIRED/);
assert.match(nks1, /status:\s*410/);
assert.match(playlistTombstone, /PLAYLIST_ENDPOINT_RETIRED/);
assert.match(playlistTombstone, /status:\s*410/);

assert.match(protectedRetrieval, /CreateFileSignedUrl/);
const usesFixedShortTtl = /expires_in:\s*120/.test(protectedRetrieval);
const usesBoundedShortTtl = /let\s+expiresIn\s*=\s*120/.test(protectedRetrieval)
  && /CreateFileSignedUrl\s*\(\s*\{[^}]*expires_in:\s*expiresIn[^}]*\}\s*\)/s.test(protectedRetrieval)
  && /expires_in:\s*expiresIn/.test(protectedRetrieval)
  && /requestedTestTtl\s*<\s*5\s*\|\|\s*requestedTestTtl\s*>\s*15/.test(protectedRetrieval)
  && /(?:evidence\.mode|evidenceMode)\s*===\s*['"]SANDBOX['"]/.test(protectedRetrieval);
assert.ok(
  usesFixedShortTtl || usesBoundedShortTtl,
  'Protected-evidence retrieval must default to 120 seconds, with any reduced test TTL bounded to SANDBOX evidence.',
);
assert.doesNotMatch(protectedRetrieval, /metadata\s*:\s*\{[^}]*\b(?:file_uri|signed_url)\b/is, 'Protected-evidence audit metadata contains a file URI or signed URL.');
assert.match(acceptanceAudit, /GLOBAL_ROLES/);
assert.doesNotMatch(acceptanceAudit, /file_uri|signed_url/, 'Acceptance audit endpoint must not emit file or signed URLs.');

console.log('[check:nups-batch17-readiness] passed: current documentation, secret-safe authenticated harness, terminal/NKS2 boundaries, protected-evidence expiry plan, and sanitized audit reconciliation are present.');
