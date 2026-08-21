import fs from 'node:fs';

const targets = [
  'src/components/nups/TipBreakdown.jsx',
  'src/components/nups/StaffOnboardingPanel.jsx',
  'src/components/nups/glyphbucks/GlyphBucksSaleFlow.jsx',
  'src/components/nups/contracts/UnifiedContractFlowV2.jsx',
  'base44/functions/nupsClockIn/entry.ts',
  'base44/functions/registerVIPBills/entry.ts',
  'base44/functions/vipContractGenerate/entry.ts',
  'base44/functions/stripe-integration-health/entry.ts',
  'base44/functions/getSessionVenueId/entry.ts',
  'base44/functions/vipWorkflow/entry.ts',
];

const forbidden = /\bdream_palace\b|\bDP-TEMPE-001\b|Diamond Palace Tempe|The Dream Palace|815 N\. Scottsdale/i;
const failures = [];
for (const path of targets) {
  const source = fs.readFileSync(path, 'utf8');
  if (forbidden.test(source)) failures.push(`${path}: contains a fixed production venue identifier/name/address`);
}

const clockIn = fs.readFileSync('base44/functions/nupsClockIn/entry.ts', 'utf8');
if (!/VenueTerminal\.filter\(\{\s*terminal_id:\s*terminalId,\s*status:\s*'active',\s*trusted:\s*true/.test(clockIn)) {
  failures.push('nupsClockIn: trusted pre-auth venue binding must use active VenueTerminal records.');
}
if (!/Trusted terminal venue is not configured/.test(clockIn)) {
  failures.push('nupsClockIn: missing terminal venue must fail closed.');
}

const sessionVenue = fs.readFileSync('base44/functions/getSessionVenueId/entry.ts', 'utf8');
if (/ALLOWED_VENUES/.test(sessionVenue)) failures.push('getSessionVenueId: source-coded venue allow-list reintroduced.');
if (!/Venue\.filter\(\{\s*venue_id,\s*status:\s*'active'/.test(sessionVenue)) {
  failures.push('getSessionVenueId: assigned venue must be validated against active Venue records.');
}

const tipBreakdown = fs.readFileSync('src/components/nups/TipBreakdown.jsx', 'utf8');
if (!/activeVenue\?\.name/.test(tipBreakdown) || !/printVenueAddress/.test(tipBreakdown)) {
  failures.push('TipBreakdown: printed payout sheet must use the active venue identity.');
}

if (failures.length) {
  console.error('[check:nups-live-venue-boundaries] FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(`[check:nups-live-venue-boundaries] passed: ${targets.length} live venue paths are dynamic/fail-closed and the terminal registry is canonical.`);
