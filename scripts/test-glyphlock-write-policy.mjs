#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  authorize,
  isGlobalActor,
  policyFor,
  publicRecentUpdateFields,
  recordOwnerMatches,
  sanitizeForArchive,
  sanitizeValue,
} from '../base44/functions/manageGlyphLockRecord/policy.js';

const globalActor = { email: 'global@test.invalid', userId: 'u-global', nupsRole: 'PLATFORM_ADMIN' };
const owner = { email: 'owner@test.invalid', userId: 'u-owner', nupsRole: 'DJ' };
const stranger = { email: 'stranger@test.invalid', userId: 'u-stranger', nupsRole: 'DJ' };
const manager = { email: 'manager@test.invalid', userId: 'u-manager', nupsRole: 'VENUE_MANAGER' };
const anonymous = { email: '', userId: '', nupsRole: '' };

assert.equal(isGlobalActor(globalActor), true);
assert.equal(isGlobalActor(manager), false);
assert.equal(recordOwnerMatches({ created_by: owner.email }, owner), true);
assert.equal(recordOwnerMatches({ created_by: owner.email }, stranger), false);

assert.deepEqual(
  authorize({ policy: policyFor('Consultation'), action: 'create', actor: anonymous, record: null, data: {} }),
  { allowed: true, reason: 'public_intake' },
);
assert.equal(authorize({ policy: policyFor('Consultation'), action: 'update', actor: anonymous, record: {}, data: {} }).allowed, false);
assert.equal(authorize({ policy: policyFor('Consultation'), action: 'update', actor: manager, record: {}, data: {} }).allowed, true);
assert.equal(authorize({ policy: policyFor('FeatureRegistry'), action: 'create', actor: owner, record: null, data: {} }).allowed, false);
assert.equal(authorize({ policy: policyFor('FeatureRegistry'), action: 'create', actor: globalActor, record: null, data: {} }).allowed, true);
assert.equal(authorize({ policy: policyFor('InteractiveImage'), action: 'update', actor: owner, record: { created_by: owner.email }, data: {} }).allowed, true);
assert.equal(authorize({ policy: policyFor('InteractiveImage'), action: 'update', actor: stranger, record: { created_by: owner.email }, data: {} }).allowed, false);
assert.equal(authorize({ policy: policyFor('PartnerDocument'), action: 'update', actor: stranger, record: { created_by: owner.email }, data: {} }).allowed, false);
assert.equal(authorize({ policy: policyFor('PartnerDocument'), action: 'update', actor: globalActor, record: { created_by: owner.email }, data: {} }).allowed, true);
assert.equal(authorize({ policy: policyFor('Conversation'), action: 'update', actor: owner, record: { participants: [owner.email] }, data: {} }).allowed, true);
assert.equal(authorize({ policy: policyFor('Conversation'), action: 'update', actor: stranger, record: { participants: [owner.email] }, data: {} }).allowed, false);

const publicData = sanitizeValue({
  name: 'Synthetic Contact',
  email: 'synthetic@test.invalid',
  role: 'PLATFORM_ADMIN',
  permissions: ['*'],
  internal_notes: 'not allowed',
  token: 'not allowed',
  message: 'safe public message',
}, { publicMode: true });
assert.equal(publicData.name, 'Synthetic Contact');
assert.equal(publicData.message, 'safe public message');
assert.equal('role' in publicData, false);
assert.equal('permissions' in publicData, false);
assert.equal('internal_notes' in publicData, false);
assert.equal('token' in publicData, false);

const update = sanitizeValue({ title: 'Updated', owner_id: 'attacker', created_by: 'attacker', file_uri: 'file://private' }, { updateMode: true });
assert.deepEqual(update, { title: 'Updated' });

assert.deepEqual(
  publicRecentUpdateFields({ status: 'delivered', admin_status: 'approved', owner_id: 'attacker', delivered_at: '2026-08-23T00:00:00Z' }),
  { status: 'delivered', delivered_at: '2026-08-23T00:00:00Z' },
);

const archive = sanitizeForArchive({
  id: 'record-1',
  title: 'Retained evidence',
  file_uri: 'file://private/object',
  signed_url: 'https://private.invalid/signed',
  password: 'never',
  notes: 'private narrative',
}, 'FULL_REDACTED_SNAPSHOT');
assert.equal(archive.id, 'record-1');
assert.equal(archive.file_uri, '[REDACTED]');
assert.equal(archive.signed_url, '[REDACTED]');
assert.equal(archive.password, '[REDACTED]');
assert.equal(archive.notes, '[CONTENT_REDACTED]');

for (const entity of [
  'AgentChangeSet', 'GlyphBotAudit', 'FeatureRegistry', 'ArchitecturalDecisionRecord',
  'Consultation', 'ContactEvent', 'UserPreferences', 'Conversation', 'HotspotPayload',
  'InteractiveImage', 'QRGenHistory', 'QrPreview', 'QRAIScore', 'ServiceUsage',
  'LLMFeedback', 'PartnerDocument', 'MarketingAsset',
]) assert.ok(policyFor(entity), `Missing policy for ${entity}`);

console.log('[test:glyphlock-write-policy] PASS — ownership, privilege, public intake, retention redaction, and entity allow-list rules fail closed.');
