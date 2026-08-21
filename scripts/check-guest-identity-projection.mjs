import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const vipSchema = read('base44/entities/VIPGuest.jsonc');
const guestSchema = read('base44/entities/GuestProfile.jsonc');
const checkIn = read('src/components/nups/GuestCheckIn.jsx');
const tracking = read('src/components/nups/GuestTracking.jsx');
const scanTab = read('src/components/scanner/ScanTab.jsx');
const scanBackend = read('base44/functions/scanCustomerID/entry.ts');
const vipWorkflow = read('base44/functions/vipWorkflow/entry.ts');
const contractSign = read('base44/functions/vipContractSign/entry.ts');

assert(/"guest_profile_id"\s*:/.test(vipSchema), 'VIPGuest must explicitly reference canonical GuestProfile.');
assert(/canonical GuestProfile identity/.test(vipSchema), 'VIPGuest schema must document projection ownership.');
assert(/raw license# never stored/i.test(guestSchema), 'GuestProfile must remain the minimized canonical identity.');
assert(/entity:\s*["']GuestProfile["'][\s\S]{0,300}operation:\s*["']create["']/.test(checkIn), 'GuestCheckIn must create/find the canonical GuestProfile first.');
assert(/guest_profile_id:\s*guestProfileId/.test(checkIn), 'GuestCheckIn must link VIPGuest to GuestProfile.');
assert(/GuestProfile\.filter\(\{\s*venue_id:\s*venueId/.test(tracking), 'GuestTracking must list canonical profiles for the active venue.');
assert(/guest_profile_id:\s*profile\.id/.test(tracking), 'GuestTracking must create/update only linked VIPGuest projections.');
assert(/Select a guest already verified by ID scan/.test(tracking), 'GuestTracking must not create an identity from a typed name alone.');
assert(/replace\(\/\\s\/g, ''\).*toUpperCase\(\)/s.test(scanTab), 'Mobile scanner credential hash must normalize whitespace/case.');
assert(!/scan_data\.id_number\s*\+\s*\(venue_id/.test(scanBackend), 'Backend identity key must not use a different venue-salted hash formula.');
assert(/GuestProfile\.filter\(\{\s*guest_id,\s*venue_id/.test(scanBackend), 'Backend scanner must locate the venue-scoped canonical profile by guest_id.');
assert(!/id_scan_front_url:\s*id_scan_front_url/.test(scanBackend), 'Temporary signed OCR URL must not be persisted on GuestProfile.');
assert(/guest_profile_id:\s*profile\.id/.test(vipWorkflow), 'vipWorkflow guest intake must link its VIPGuest projection.');
assert(/Verified ID number and date of birth are required/.test(vipWorkflow), 'vipWorkflow must reject unverified typed-name identity creation.');
assert(/guest_profile_id:\s*guestProfile\.id/.test(contractSign), 'vipContractSign must link its VIPGuest projection.');
assert(/protected evidence references/.test(contractSign), 'vipContractSign must reject raw protected-media URLs.');
assert(/normalizedGovernmentId/.test(contractSign) && /id_last4:\s*normalizedGovernmentId\.slice\(-4\)/.test(contractSign), 'vipContractSign must minimize government-ID persistence to hash + last four.');

const functionRoot = 'base44/functions';
const productionCreators = [];
for (const entry of fs.readdirSync(functionRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(functionRoot, entry.name, 'entry.ts');
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  if (/VIPGuest\.create\(/.test(source) && !/seed|demo/i.test(entry.name)) productionCreators.push({ name: entry.name, source });
}
for (const creator of productionCreators) {
  assert(/guest_profile_id/.test(creator.source), `${creator.name} creates VIPGuest without an explicit GuestProfile link.`);
}

if (failures.length) {
  console.error('[check:guest-identity-projection] FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`[check:guest-identity-projection] passed: GuestProfile canonical, VIPGuest projection linked across ${productionCreators.length} production backend creator(s), no raw-ID projection path.`);
