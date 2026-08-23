#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const snapshot = JSON.parse(execFileSync('node', ['scripts/check-nups-write-gateway.mjs', '--snapshot'], { encoding: 'utf8' }));
const snapshotTotal = Object.values(snapshot.files || {}).reduce((sum, entry) => sum + Number(entry?.total || 0), 0);
assert.equal(Number.isInteger(snapshotTotal) && snapshotTotal > 0, true, 'Write-gateway snapshot did not contain a valid positive file-total sum.');
const countPattern = new RegExp(`${snapshotTotal}\\s*\\/\\s*287`);
const architecture = fs.readFileSync('ARCHITECTURE.md', 'utf8');
const context = fs.readFileSync('CONTEXT.md', 'utf8');
const handoff = fs.readFileSync('docs/NUPS-CURRENT-HANDOFF.md', 'utf8');
const issues = fs.readFileSync('KNOWN_ISSUES.md', 'utf8');
const inventory = fs.readFileSync('docs/audits/GLYPHLOCK-BATCH18-WRITE-INVENTORY.md', 'utf8');
const verification = fs.readFileSync('docs/audits/GLYPHLOCK-BATCH18-VERIFICATION.md', 'utf8');
const workaround = fs.readFileSync('docs/runbooks/NUPS-BATCH17-FINAL-COMPLETION-DIRECTIVE.md', 'utf8');

for (const [name, source] of [['architecture', architecture], ['context', context], ['handoff', handoff], ['issues', issues], ['inventory', inventory], ['verification', verification]]) {
  assert.match(source, countPattern, `${name} does not record the live ${snapshot.total}/287 write count.`);
}
assert.match(architecture, /App-wide GlyphLock write governance/, 'Architecture is missing the app-wide governed-write boundary.');
assert.match(context, /GOVERNANCE|public intake|USER_PRIVATE|CONTENT_OWNER|PARTNER|SERVER_METER/i, 'Context does not explain the app-wide scope families.');
assert.match(inventory, /\| \*\*Total\*\* \| \*\*41\*\* \|/, 'Batch 18 inventory must reconcile all 41 migrated calls.');
assert.match(issues, /Batch 18 app-wide business migration/, 'NUPS-0002 is missing the Batch 18 state.');
assert.match(verification, /Live GlyphLock business bypasses \| \*\*0\*\*/, 'Verification record must report zero classified live GlyphLock business bypasses.');
assert.match(handoff, /NUPSBatch17Acceptance/, 'Current handoff must document the no-token Batch 17 workaround.');
assert.match(workaround, /Preferred workaround: browser-session console/, 'Completion directive must document the browser-session workaround.');
assert.match(handoff, /NO-GO/, 'Current handoff must preserve the release NO-GO until physical and authenticated acceptance passes.');
assert.doesNotMatch(verification, /Release verdict:\s*(?:GO|CONDITIONAL GO)/, 'Batch 18 documentation must not silently promote the production release.');

console.log(`[check:glyphlock-batch18-documentation] PASS — Layer 3 state records ${snapshotTotal}/287, 41 governed migrations, zero live business bypasses, and the unchanged Batch 17 NO-GO release boundary.`);
