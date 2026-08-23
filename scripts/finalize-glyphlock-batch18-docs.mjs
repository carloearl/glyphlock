#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const snapshot = JSON.parse(execFileSync('node', ['scripts/check-nups-write-gateway.mjs', '--snapshot'], { encoding: 'utf8' }));
const migration = JSON.parse(fs.readFileSync('artifacts/batch18/migration-summary.json', 'utf8'));
const remaining = Number(snapshot.total);
const totalRemoved = 287 - remaining;
const removedThisBatch = 161 - remaining;
if (migration.total !== 41 || removedThisBatch !== 41 || remaining !== 120) {
  throw new Error(`Batch 18 documentation cannot finalize: expected 41 migrated and 120 remaining, found migrated=${migration.total}, removed=${removedThisBatch}, remaining=${remaining}`);
}

function replaceCurrentState(path) {
  let source = fs.readFileSync(path, 'utf8');
  source = source
    .replace(/161\s*\/\s*287/g, `${remaining}/287`)
    .replace(/Current grandfathered frontend calls:\s*161/g, `Current grandfathered frontend calls: ${remaining}`)
    .replace(/Total removed:\s*126/g, `Total removed:                        ${totalRemoved}`)
    .replace(/current state is \*\*161\/287\*\*/gi, `current state is **${remaining}/287**`)
    .replace(/current Base44 CI extension executes/gi, 'current Base44 CI extension executes');
  fs.writeFileSync(path, source);
}

for (const path of ['ARCHITECTURE.md', 'CONTEXT.md', 'INVARIANTS.md', 'docs/NUPS-CURRENT-HANDOFF.md']) replaceCurrentState(path);

let architecture = fs.readFileSync('ARCHITECTURE.md', 'utf8');
if (!architecture.includes('## App-wide GlyphLock write governance')) {
  architecture += `\n\n## App-wide GlyphLock write governance\n\nBatch 18 extends governed persistence beyond venue operations without pretending every GlyphLock record is venue scoped.\n\n\`\`\`text\nUI / workflow\n  → glyphlockWrite\n  → manageGlyphLockRecord\n  → explicit entity + operation policy\n  → actor / owner / member / partner / public-intake scope validation\n  → mutation\n  → GovernedRecordArchive where retention is required\n  → sanitized SystemAuditLog evidence\n\`\`\`\n\nThe policy boundary covers governance decisions, consultations, contacts, private chat/preferences, QR and interactive-image records, usage metering, feedback, and partner content. Public forms cannot assign privileged fields; private conversations require ownership or membership; partner updates require partner scope; deployment and audit evidence is retained before destructive operations.\n\nThe direct-write inventory is now **${remaining}/287**. Classified live high-risk and live-medium NUPS writes remain zero, and the 41 previously live GlyphLock business bypasses outside NUPS have been migrated. The retained ${remaining} calls remain explicit audit/domain/telemetry evidence, demo/seed/sandbox utilities, legacy/unmounted compatibility, or gateway/audit internals.\n`;
  fs.writeFileSync('ARCHITECTURE.md', architecture);
}

let context = fs.readFileSync('CONTEXT.md', 'utf8');
if (!context.includes('App-wide governed write boundary')) {
  context += `\n\n## App-wide governed write boundary\n\nBatch 18 governs the remaining live GlyphLock business mutations outside NUPS through \`glyphlockWrite → manageGlyphLockRecord\`. The server distinguishes governance, public intake, user-private, content-owner, partner, and server-meter scopes. It does not force non-venue records into NUPS venue semantics. Destructive governance/content operations create an append-only redacted snapshot or tombstone before deletion.\n\nCurrent controlled direct-write state: **${remaining}/287**, with no new bypasses, no live high-risk or live-medium NUPS bypasses, and no remaining classified live GlyphLock business bypasses.\n`;
  fs.writeFileSync('CONTEXT.md', context);
}

let issues = fs.readFileSync('KNOWN_ISSUES.md', 'utf8');
issues = issues.replace(/(## NUPS-0002[\s\S]*?)(?=\n---\n|\n## NUPS-0003)/, (section) => {
  if (section.includes('### Batch 18 app-wide business migration')) return section.replace(/161\s*\/\s*287/g, `${remaining}/287`);
  return `${section.replace(/161\s*\/\s*287/g, `${remaining}/287`)}\n### Batch 18 app-wide business migration\nThe 41 classified live GlyphLock business writes outside NUPS were migrated through the app-wide governed write service. Governance, public intake, private chat/preferences, QR/interactive media, usage metering, feedback, and partner-content mutations now enforce explicit server-side scope and retention rules. The controlled remainder is **${remaining}/287** and contains no classified live NUPS or live GlyphLock business bypass. This issue remains open only as the umbrella register for intentional audit/domain/telemetry, demo/seed/sandbox, legacy/unmounted, and gateway-internal calls; it is not permission to delete those records for numerical completion.\n`;
});
fs.writeFileSync('KNOWN_ISSUES.md', issues);

let handoff = fs.readFileSync('docs/NUPS-CURRENT-HANDOFF.md', 'utf8');
if (!handoff.includes('## Batch 18 app-wide persistence')) {
  handoff += `\n\n## Batch 18 app-wide persistence\n\nThe remaining 41 live GlyphLock business writes outside NUPS were migrated. The current guard is **${remaining}/287** with zero new bypasses, zero classified live NUPS business bypasses, and zero classified live GlyphLock business bypasses. New writes use an explicit server policy for governance, public intake, private ownership/membership, creative ownership, partner scope, and usage metering. Retained destructive evidence is stored append-only in \`GovernedRecordArchive\` with sensitive values redacted.\n\nBatch 17's preferred workaround is the no-token route \`/NUPSBatch17Acceptance\`, which lets each disposable user run a real browser-session case after human email verification. It does not weaken the five-session requirement or the NO-GO production boundary.\n`;
  fs.writeFileSync('docs/NUPS-CURRENT-HANDOFF.md', handoff);
}

const report = `# GlyphLock / NUPS Batch 18 Verification Record\n\n**App:** Main GlyphLock / NUPS (\`697a087fb354faebb72df54b\`)  \n**Authority:** DACO / GlyphLock Engineering Protocol v5  \n**Recorded:** ${new Date().toISOString()}\n\n## Scorecard\n\n| Metric | Result |\n|---|---:|\n| Original baseline | 287 |\n| Batch 18 start | 161 |\n| Batch 18 end | **${remaining}** |\n| Removed this batch | **${removedThisBatch}** |\n| Total removed | **${totalRemoved}** |\n| New bypasses | **0** |\n| Live high-risk NUPS bypasses | **0** |\n| Live-medium NUPS bypasses | **0** |\n| Live GlyphLock business bypasses | **0** |\n\n## Implemented\n\n- explicit app-wide entity and operation allow-list;\n- server-derived authentication, ownership, conversation membership, partner and administrative scope;\n- narrow public consultation/contact/feedback intake;\n- public privileged-field rejection and bounded delivery updates;\n- server-derived usage identity, quantity validation and request-key idempotency;\n- append-only redacted retention snapshots/tombstones;\n- version evidence for ADRs, GlyphBot audits and partner content;\n- non-mutating FeatureRegistry idempotent reconciliation;\n- frontend migration of all 41 classified live business calls;\n- deployed anonymous probes for governance/content denial, public privilege injection, forged usage and allow-list escape;\n- no-token Batch 17 browser-session acceptance console with append-only sanitized result records.\n\n## Verification commands\n\n\`\`\`text\nnpm run test:glyphlock-write-policy\nnpm run check:glyphlock-write-governance\nnpm run check:glyphlock-batch18-runtime\nnpm run check:nups-batch17-browser-acceptance\nnpm run check:glyphlock-batch18\n\`\`\`\n\nThe ending-commit GitHub Actions result and Base44 checkpoint are recorded in the post-run report after the final commit is synchronized.\n\n## Batch 17 carryover\n\nThe no-token browser console removes bearer-token extraction as a blocker, but human Base44 email verification, five distinct browser sessions, physical device commissioning, the full authenticated DEMO/SANDBOX journey, and a real 30-minute provider soak remain release acceptance. Production release remains **NO-GO** until they pass.\n`;
fs.writeFileSync('docs/audits/GLYPHLOCK-BATCH18-VERIFICATION.md', report);

console.log(JSON.stringify({ remaining, removedThisBatch, totalRemoved, migrated: migration.total }, null, 2));
