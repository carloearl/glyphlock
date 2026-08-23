import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const current = read('docs/NUPS-CURRENT-HANDOFF.md');
const historical = read('src/docs/HANDOFF.md');
const architecture = read('ARCHITECTURE.md');
const context = read('CONTEXT.md');
const invariants = read('INVARIANTS.md');
const integrations = read('INTEGRATIONS.md');
const issues = read('KNOWN_ISSUES.md');
const completionDirective = read('docs/runbooks/NUPS-BATCH17-FINAL-COMPLETION-DIRECTIVE.md');
const postRun = read('docs/audits/NUPS-BATCH17-POST-RUN.md');

assert.match(historical, /HISTORICAL \/ SUPERSEDED/, 'Old handoff must be unmistakably historical.');
assert.match(historical, /docs\/NUPS-CURRENT-HANDOFF\.md/, 'Old handoff must point to the current handoff.');
assert.match(current, /161/, 'Current handoff must record the current direct-write count.');
assert.match(current, /GuestProfile = canonical minimized guest identity/, 'Current handoff must define canonical guest identity.');
assert.match(current, /VenueTerminal.*sole pre-authentication/s, 'Current handoff must define terminal trust.');
assert.match(current, /NKS2 only/, 'Current handoff must define the kiosk-session version.');
assert.match(current, /test:nups-batch17-authenticated/, 'Current handoff must link authenticated acceptance.');
assert.match(current, /emailed OTP/, 'Current handoff must record the actual authenticated-session blocker.');
assert.match(current, /Current release verdict: NO-GO/, 'Current handoff must state the evidence-backed release verdict.');
assert.match(architecture, /161\/287/, 'Architecture must use the current migration state.');
assert.match(architecture, /GuestProfile.*canonical minimized/s, 'Architecture must define GuestProfile ownership.');
assert.match(architecture, /ADR-0002 resolves the audit-ledger boundary/, 'Architecture must reflect the accepted audit decision.');
assert.match(context, /zero live high-risk NUPS/, 'Context must report current live-risk classification.');
assert.match(context, /VenueTerminal.*sole pre-authentication/s, 'Context must describe terminal trust.');
assert.match(invariants, /161\/287/, 'Invariant evidence must reflect current verification.');
assert.match(integrations, /IntegrationMaturity/, 'Integration documentation must identify the authoritative maturity record.');
assert.match(issues, /NUPS-0008[\s\S]*RESOLVED — CURRENT HANDOFF PUBLISHED/, 'Documentation debt must be resolved with evidence.');
assert.match(completionDirective, /five distinct Base44 sessions/i, 'Completion directive must require distinct authenticated sessions.');
assert.match(completionDirective, /30 continuous minutes/i, 'Completion directive must require a real DJ soak.');
assert.match(completionDirective, /Do not publish production/i, 'Completion directive must preserve the production boundary.');
assert.doesNotMatch(completionDirective, /eyJ[A-Za-z0-9._-]{20,}/, 'Completion directive contains token-like material.');
assert.match(postRun, /Batch status:\*\* `IMPLEMENTED \/ UNVERIFIED`/, 'Post-run record must preserve the honest Batch status.');
assert.match(postRun, /Release verdict:\*\* `NO-GO`/, 'Post-run record must preserve the evidence-backed release verdict.');
assert.match(postRun, /Human email verification completed \| BLOCKED/, 'Post-run record must state the authenticated-session blocker.');
assert.doesNotMatch(postRun, /eyJ[A-Za-z0-9._-]{20,}/, 'Post-run record contains token-like material.');

for (const source of [architecture, context, current]) {
  assert.doesNotMatch(source, /current[^\n]{0,80}287\/287/i, 'Current documentation still presents 287/287 as live state.');
}

console.log('[check:nups-batch17-documentation] passed: current handoff and Layer 3 state match the verified Batch 17 architecture.');