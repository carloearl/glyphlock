#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { File as NodeFile } from 'node:buffer';
import { createClient } from '@base44/sdk';

if (!globalThis.File) globalThis.File = NodeFile;

const REQUIRED = [
  'B17_MANAGER_A_TOKEN',
  'B17_DOOR_A_TOKEN',
  'B17_STAFF_A_TOKEN',
  'B17_MANAGER_B_TOKEN',
  'B17_GLOBAL_TOKEN',
  'B17_VENUE_A_ID',
  'B17_VENUE_B_ID',
];
const missing = REQUIRED.filter((name) => !String(process.env[name] || '').trim());
if (missing.length) {
  console.error(`[test:nups-batch17-authenticated] BLOCKED — missing secure runtime variables: ${missing.join(', ')}`);
  console.error('Tokens must be supplied at runtime only. Do not create, print, or commit an .env file.');
  process.exit(2);
}

const appId = process.env.VITE_BASE44_APP_ID
  || process.env.EXPO_PUBLIC_BASE44_APP_ID
  || '697a087fb354faebb72df54b';
const serverUrl = String(
  process.env.VITE_BASE44_BACKEND_URL
  || process.env.EXPO_PUBLIC_BASE44_BACKEND_URL
  || 'https://base44.app',
).replace(/\/$/, '');
const functionsVersion = process.env.VITE_BASE44_FUNCTIONS_VERSION
  || process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION
  || '';
const venueA = String(process.env.B17_VENUE_A_ID).trim();
const venueB = String(process.env.B17_VENUE_B_ID).trim();
const startedAt = new Date().toISOString();

const tokens = {
  managerA: process.env.B17_MANAGER_A_TOKEN,
  doorA: process.env.B17_DOOR_A_TOKEN,
  staffA: process.env.B17_STAFF_A_TOKEN,
  managerB: process.env.B17_MANAGER_B_TOKEN,
  global: process.env.B17_GLOBAL_TOKEN,
};
const clients = Object.fromEntries(Object.entries(tokens).map(([key, token]) => [key, createClient({ appId, token })]));

function cleanError(error) {
  const raw = error?.response?.data?.error || error?.message || String(error);
  return String(raw)
    .replace(/https?:\/\/\S+/g, '[URL REDACTED]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[TOKEN REDACTED]')
    .slice(0, 300);
}

async function identity(key) {
  const user = await clients[key].auth.me();
  return { id: user.id, email: user.email, role: user.role };
}

async function uploadSynthetic(classification, artifactType) {
  const issuedAt = new Date().toISOString();
  const text = [
    'GLYPHLOCK BATCH 17 SYNTHETIC EVIDENCE',
    'NOT A REAL GOVERNMENT ID',
    'NOT A REAL TAX DOCUMENT',
    'NOT BIOMETRIC DATA',
    'NOT A REAL CONTRACT',
    classification,
    issuedAt,
  ].join('\n');
  const bytes = Buffer.from(text, 'utf8');
  const contentHash = createHash('sha256').update(bytes).digest('hex');
  const file = new NodeFile([bytes], `batch17-${classification.toLowerCase()}.txt`, { type: 'text/plain' });
  const { file_uri } = await clients.managerA.integrations.Core.UploadPrivateFile({ file });
  assert.ok(file_uri, 'Private upload returned no file_uri');
  const response = await clients.managerA.functions.invoke('registerProtectedEvidence', {
    file_uri,
    venue_id: venueA,
    artifact_type: artifactType,
    classification,
    subject_entity: 'Batch17SyntheticEvidence',
    subject_id: `B17-${classification}-${Date.now()}`,
    purpose: 'batch17_authenticated_security_acceptance',
    mode: 'SANDBOX',
    content_hash: contentHash,
    mime_type: 'text/plain',
    file_name: file.name,
  });
  assert.equal(response?.data?.success, true, `Registration failed for ${classification}`);
  return { evidenceId: response.data.evidence_id, evidenceRef: response.data.evidence_ref, contentHash };
}

async function invokeEvidence(clientKey, evidenceId, purpose) {
  try {
    const response = await clients[clientKey].functions.invoke('getProtectedEvidence', { evidence_id: evidenceId, purpose });
    const data = response?.data || {};
    return {
      status: response.status || 200,
      allowed: data.success === true && Boolean(data.signed_url),
      signedUrl: data.signed_url || null,
      expiresIn: data.expires_in || null,
      hasFileUri: Object.hasOwn(data, 'file_uri') || JSON.stringify(data).includes('file_uri'),
      classification: data.evidence?.classification || null,
    };
  } catch (error) {
    const data = error?.response?.data || {};
    return {
      status: error?.response?.status || 0,
      allowed: false,
      signedUrl: null,
      expiresIn: null,
      hasFileUri: JSON.stringify(data).includes('file_uri'),
      error: cleanError(error),
    };
  }
}

async function fetchSigned(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
  return response;
}

const identities = {};
for (const key of Object.keys(tokens)) identities[key] = await identity(key);
assert.equal(new Set(Object.values(identities).map((item) => item.id)).size, 5, 'Five distinct Base44 users are required.');

const evidence = {
  identity: await uploadSynthetic('PRIVATE_IDENTITY', 'government_id_front'),
  tax: await uploadSynthetic('PRIVATE_TAX', 'w9_scan'),
  biometric: await uploadSynthetic('PRIVATE_BIOMETRIC', 'thumbprint'),
  contract: await uploadSynthetic('PRIVATE_CONTRACT', 'signed_hardcopy_contract'),
};

const cases = [];
async function runCase(name, clientKey, evidenceKey, expectedAllowed, expectedStatus = expectedAllowed ? 200 : 403) {
  const result = await invokeEvidence(clientKey, evidence[evidenceKey].evidenceId, `batch17:${name}`);
  assert.equal(result.allowed, expectedAllowed, `${name}: unexpected decision ${JSON.stringify({ status: result.status, error: result.error })}`);
  assert.equal(result.status, expectedStatus, `${name}: expected HTTP ${expectedStatus}, received ${result.status}`);
  assert.equal(result.hasFileUri, false, `${name}: private file URI leaked`);
  if (!expectedAllowed) assert.equal(result.signedUrl, null, `${name}: denied response returned a signed URL`);
  cases.push({ name, client: clientKey, evidence: evidenceKey, expectedAllowed, status: result.status, passed: true });
  return result;
}

const managerIdentity = await runCase('same_venue_manager_identity_allow', 'managerA', 'identity', true);
await runCase('same_venue_manager_tax_allow', 'managerA', 'tax', true);
await runCase('same_venue_manager_biometric_allow', 'managerA', 'biometric', true);
await runCase('same_venue_manager_contract_allow', 'managerA', 'contract', true);
await runCase('door_identity_allow', 'doorA', 'identity', true);
await runCase('door_tax_deny', 'doorA', 'tax', false);
await runCase('door_biometric_deny', 'doorA', 'biometric', false);
await runCase('ordinary_staff_identity_deny', 'staffA', 'identity', false);
await runCase('ordinary_staff_contract_deny', 'staffA', 'contract', false);
await runCase('wrong_venue_manager_deny', 'managerB', 'identity', false);
await runCase('global_cross_venue_allow', 'global', 'identity', true);

assert.ok(managerIdentity.signedUrl, 'Manager allow result did not contain a signed URL');
const immediate = await fetchSigned(managerIdentity.signedUrl, tokens.managerA);
const immediateBytes = Buffer.from(await immediate.arrayBuffer());
const immediateHash = createHash('sha256').update(immediateBytes).digest('hex');
assert.equal(immediate.ok, true, `Signed URL immediate fetch failed with ${immediate.status}`);
assert.equal(immediateHash, evidence.identity.contentHash, 'Signed URL returned unexpected synthetic content');
const expiresIn = Number(managerIdentity.expiresIn || 120);
await new Promise((resolve) => setTimeout(resolve, (expiresIn + 4) * 1000));
const expired = await fetchSigned(managerIdentity.signedUrl, tokens.managerA);
assert.equal(expired.ok, false, `Signed URL remained valid after ${expiresIn + 4} seconds`);

const auditRows = await clients.global.entities.SystemAuditLog.filter({
  event_type: { $in: ['PROTECTED_EVIDENCE_ACCESSED', 'PROTECTED_EVIDENCE_ACCESS_DENIED'] },
}, '-created_date', 250);
const evidenceRefs = new Set(Object.values(evidence).map((item) => item.evidenceRef));
const relevantAudits = (auditRows || []).filter((row) => evidenceRefs.has(row?.metadata?.evidence_id));
const accesses = relevantAudits.filter((row) => row.event_type === 'PROTECTED_EVIDENCE_ACCESSED');
const denials = relevantAudits.filter((row) => row.event_type === 'PROTECTED_EVIDENCE_ACCESS_DENIED');
assert.ok(accesses.length >= 6, `Expected at least 6 access audits, found ${accesses.length}`);
assert.ok(denials.length >= 5, `Expected at least 5 denial audits, found ${denials.length}`);
for (const row of relevantAudits) {
  const serialized = JSON.stringify(row.metadata || {});
  assert.doesNotMatch(serialized, /file_uri|signed_url|https?:\/\//i, 'Audit metadata contains a URL or private URI');
}

const completedAt = new Date().toISOString();
const report = {
  status: 'PASS',
  synthetic_only: true,
  started_at: startedAt,
  completed_at: completedAt,
  venues: { venue_a: venueA, venue_b: venueB },
  identities: Object.fromEntries(Object.entries(identities).map(([key, value]) => [key, { id: value.id, email: value.email, platform_role: value.role }])),
  cases,
  signed_url_expiry: {
    expires_in: expiresIn,
    immediate_status: immediate.status,
    immediate_hash_matches: true,
    post_expiry_status: expired.status,
    post_expiry_rejected: true,
  },
  audit: { access_events: accesses.length, denial_events: denials.length, raw_urls_present: false },
  retained_synthetic_evidence_ids: Object.fromEntries(Object.entries(evidence).map(([key, value]) => [key, value.evidenceId])),
  secrets_printed: false,
  signed_urls_printed: false,
  private_file_uris_printed: false,
};

fs.mkdirSync('artifacts/batch17', { recursive: true });
fs.writeFileSync('artifacts/batch17/authenticated-security-result.json', `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({
  status: report.status,
  cases_passed: cases.length,
  signed_url_expiry: report.signed_url_expiry,
  audit: report.audit,
  result_file: 'artifacts/batch17/authenticated-security-result.json',
}, null, 2));
console.log('[test:nups-batch17-authenticated] PASS — authenticated role, venue, private retrieval, expiry, and audit checks passed.');