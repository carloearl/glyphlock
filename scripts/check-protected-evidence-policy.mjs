import assert from 'node:assert/strict';
import fs from 'node:fs';
import { protectedEvidenceDecision } from '../base44/functions/_shared/protectedEvidencePolicy.js';

const allow = (input) => assert.equal(protectedEvidenceDecision(input).allowed, true, JSON.stringify(input));
const deny = (input) => assert.equal(protectedEvidenceDecision(input).allowed, false, JSON.stringify(input));

allow({ role: 'VENUE_MANAGER', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_TAX' });
allow({ role: 'DOORMAN', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_IDENTITY' });
allow({ role: 'SOVEREIGN', actorVenueId: 'A', evidenceVenueId: 'B', classification: 'PRIVATE_BIOMETRIC' });
deny({ role: 'BARTENDER', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_IDENTITY' });
deny({ role: 'DOORMAN', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_TAX' });
deny({ role: 'DOOR_GIRL', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_BIOMETRIC' });
deny({ role: 'VENUE_MANAGER', actorVenueId: 'A', evidenceVenueId: 'B', classification: 'PRIVATE_IDENTITY' });
deny({ role: 'DJ', actorVenueId: 'A', evidenceVenueId: 'A', classification: 'PRIVATE_CONTRACT' });

const read = (path) => fs.readFileSync(path, 'utf8');
const roster = read('src/components/nups/entertainers/EntertainerCredentialRoster.jsx');
const transactionSearch = read('src/components/nups/glyphbucks/TransactionSearch.jsx');
const taxForms = read('src/components/nups/payroll/ContractorTaxFormsList.jsx');
const contractArchiveUi = [
  'src/components/nups/ContractViewer.jsx',
  'src/components/nups/ContractDetailCard.jsx',
  'src/components/nups/ContractDetailModal.jsx',
].map(read).join('\n');
const retrieval = read('base44/functions/getProtectedEvidence/entry.ts');

assert.doesNotMatch(roster, /<img[^>]+license_photo_url/i, 'Credential roster must not render the stored credential reference directly.');
assert.doesNotMatch(transactionSearch, /href=\{media\.media_url\}/, 'Transaction search must not expose legacy VerificationMedia URLs.');
assert.doesNotMatch(taxForms, /href=\{r\.form\.scanned_form_url\}/, 'Tax-form list must not expose stored W-9 references directly.');
assert.doesNotMatch(contractArchiveUi, /<(?:img|a)[^>]+(?:id_photo|thumbprint|signed_hardcopy|guest_photo)_url/i, 'Contract archives must not render stored protected-media references directly.');
assert.doesNotMatch(retrieval, /metadata\s*:\s*\{[^}]*\b(?:file_uri|signed_url)\b/is, 'Protected-evidence audit metadata must not contain private file URIs or signed URLs.');
assert.match(retrieval, /expires_in:\s*120/, 'Authorized retrieval must issue a short-lived signed URL.');

console.log('[check:protected-evidence-policy] passed: role/classification/venue matrix fails closed and protected archive UIs emit no raw evidence URLs.');
