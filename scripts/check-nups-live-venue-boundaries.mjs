import fs from 'node:fs';
import path from 'node:path';

const targets = [
  'src/components/nups/TipBreakdown.jsx',
  'src/components/nups/StaffOnboardingPanel.jsx',
  'src/components/nups/glyphbucks/GlyphBucksSaleFlow.jsx',
  'src/components/nups/contracts/UnifiedContractFlowV2.jsx',
  'base44/functions/nupsClockInV2/entry.ts',
  'base44/functions/registerVIPBills/entry.ts',
  'base44/functions/vipContractGenerate/entry.ts',
  'base44/functions/stripe-integration-health/entry.ts',
  'base44/functions/getSessionVenueId/entry.ts',
  'base44/functions/vipWorkflow/entry.ts',
];

const forbidden = /\bdream_palace\b|\bDP-TEMPE-001\b|Diamond Palace Tempe|The Dream Palace|815 N\. Scottsdale/i;
const failures = [];
for (const target of targets) {
  const source = fs.readFileSync(target, 'utf8');
  if (forbidden.test(source)) failures.push(`${target}: contains a fixed production venue identifier/name/address`);
}

const clockIn = fs.readFileSync('base44/functions/nupsClockInV2/entry.ts', 'utf8');
if (!/VenueTerminal\.filter\(\{\s*terminal_id:\s*terminalId\s*\}/.test(clockIn)
  || !/terminalRecord\.status\s*===\s*'active'/.test(clockIn)
  || !/terminalRecord\.trusted\s*===\s*true/.test(clockIn)) {
  failures.push('nupsClockInV2: trusted pre-auth venue binding must require an active trusted VenueTerminal record.');
}
if (/VenuePaymentConfig\.filter\(\{\s*terminal_id/.test(clockIn) || /legacyPaymentTerminal/.test(clockIn)) {
  failures.push('nupsClockInV2: payment configuration must not confer pre-authentication terminal trust.');
}
if (!/Trusted terminal venue is not configured/.test(clockIn)
  || !/UNKNOWN_TERMINAL_BLOCKED/.test(clockIn)
  || !/TERMINAL_ACCESS_BLOCKED/.test(clockIn)) {
  failures.push('nupsClockInV2: unknown and non-trusted terminal states must fail closed with security evidence.');
}
if (!/NKS2\./.test(clockIn) || /NKS1\./.test(clockIn)) {
  failures.push('nupsClockInV2: kiosk sessions must use only the NKS2 token version.');
}
if (!/pin_lookup_v2/.test(clockIn) || /\bpin_lookup\b(?!_v2)/.test(clockIn)) {
  failures.push('nupsClockInV2: only the versioned PIN lookup index may be used.');
}
const legacyClockPath = 'base44/functions/nupsClockIn/entry.ts';
if (!fs.existsSync(legacyClockPath)) {
  failures.push('Retired nupsClockIn route must remain represented by an explicit 410 tombstone.');
} else {
  const legacyClock = fs.readFileSync(legacyClockPath, 'utf8');
  if (!/NKS1_ENDPOINT_RETIRED/.test(legacyClock) || !/status:\s*410/.test(legacyClock)) {
    failures.push('Retired nupsClockIn route is not a 410 NKS1 tombstone.');
  }
  if (/NUPSUser|StaffShift|pin_lookup|sweepStale|getPublicMode/.test(legacyClock)) {
    failures.push('Retired nupsClockIn tombstone contains operational authentication, shift, PIN, or venue logic.');
  }
}

const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (sourceExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}
for (const file of [...walk('src'), ...walk('base44/functions')]) {
  const source = fs.readFileSync(file, 'utf8');
  if (/functions\.invoke\(\s*['"]nupsClockIn['"]/.test(source)) {
    failures.push(`${file}: live caller still invokes retired nupsClockIn instead of nupsClockInV2.`);
  }
}

const nupsUserSchema = fs.readFileSync('base44/entities/NUPSUser.jsonc', 'utf8');
if (!/"pin_lookup_v2"/.test(nupsUserSchema) || /"pin_lookup"\s*:/.test(nupsUserSchema)) {
  failures.push('NUPSUser schema must retain pin_lookup_v2 and remove the legacy pin_lookup field.');
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

console.log(`[check:nups-live-venue-boundaries] passed: ${targets.length} live venue paths are dynamic/fail-closed, NKS2 is the only live kiosk session boundary, and the terminal registry is canonical.`);
