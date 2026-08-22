import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const taxForms = read('src/components/nups/payroll/ContractorTaxFormsList.jsx');
const tips = read('src/components/nups/TipBreakdown.jsx');
const contracts = read('src/components/nups/ContractManager.jsx');
const audits = read('src/components/nups/AuditLogDashboard.jsx');
const contractViewer = read('src/components/nups/ContractViewer.jsx');
const contractArchive = read('src/pages/ContractArchive.jsx');
const contractSearch = read('src/pages/ContractSearch.jsx');
const contractLookup = read('src/pages/ContractLookup.jsx');
const transactionLookup = read('base44/functions/transactionLookup/entry.ts');

assert.match(taxForms, /Entertainer\.filter\(\{\s*venue_id:\s*venueId\s*\}/, 'Contractor roster must be venue scoped.');
assert.match(taxForms, /ContractorTaxForm\.filter\(\{[^}]*tax_year:\s*taxYear[^}]*venue_id:\s*venueId/, 'W-9 list must be venue scoped.');
assert.match(taxForms, /ContractorPayout\.filter\(\{[^}]*tax_year:\s*taxYear[^}]*venue_id:\s*venueId/, 'Contractor payout list must be venue scoped.');
assert.doesNotMatch(taxForms, /href=\{r\.form\.scanned_form_url\}/, 'W-9 stored references must not be emitted as direct links.');

assert.match(tips, /NUPSUser\.filter\(\{\s*status:\s*["']active["'],\s*venue_id:\s*venueId\s*\}/, 'Tip roster must be venue scoped.');
assert.doesNotMatch(tips, /Dream Palace\s*[—-]\s*815 N\. Scottsdale/i, 'Tip payout printout must not contain a fixed production venue.');

assert.doesNotMatch(contracts, /Venue\.list\(/, 'Contract Manager must not select the first venue from an unscoped list.');
assert.match(contracts, /POSBatch\.filter\(\{\s*status:\s*["']open["'],\s*venue_id\s*\}/, 'Contract Manager open-batch lookup must be venue scoped.');
assert.match(contracts, /VenueContract\.filter\(\{\s*venue_id\s*\}/, 'Contract Manager contracts must be venue scoped.');

assert.match(audits, /AuditEvent\.filter\(\{\s*venue_id:\s*venueId\s*\}/, 'NUPS audit dashboard must be venue scoped.');
assert.doesNotMatch(audits, /AuditEvent\.list\(/, 'NUPS audit dashboard must not retrieve a cross-venue audit list.');

assert.match(contractViewer, /VIPContractRecord\.filter\(\{\s*venue_id:\s*venueId\s*\}/, 'Contract Viewer must be venue scoped.');
assert.match(contractArchive, /VIPContractRecord\.filter\(\{[^}]*status:\s*["']signed["'][^}]*venue_id:\s*venueId/, 'Contract Archive must be venue scoped.');
assert.match(contractSearch, /filter\.venue_id\s*=\s*venueId/, 'Contract Search must add active venue to the server query.');
assert.match(contractLookup, /VenueContract\.filter\(\{\s*venue_id:\s*venueId\s*\}/, 'Contract Lookup must be venue scoped.');
assert.match(contractLookup, /POSTransaction\.filter\(\{\s*venue_id:\s*venueId\s*\}/, 'Transaction vault lookup must be venue scoped.');

assert.match(transactionLookup, /Manager-class NUPS identity required/, 'Evidence transaction lookup must require a manager-class NUPS identity.');
assert.match(transactionLookup, /Cross-venue transaction search denied/, 'Evidence transaction lookup must deny cross-venue search.');
assert.doesNotMatch(transactionLookup, /identity:\s*identities\[0\]\s*[,}]/, 'Evidence lookup must not return a raw identity record.');
assert.match(transactionLookup, /identity:\s*identities\[0\]\s*\?\s*\{\s*present:\s*true,\s*status:/s, 'Evidence lookup must project identity presence/status only.');
assert.doesNotMatch(transactionLookup, /records:\s*\{[^}]*verification_media:\s*verificationMedia/s, 'Evidence lookup must not return raw verification-media records.');

console.log('[check:nups-sensitive-read-boundaries] passed: tax, tip, contract, audit, and evidence reads are venue scoped and protected references are not emitted directly.');
