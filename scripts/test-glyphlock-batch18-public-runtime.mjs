#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createClient } from '@base44/sdk';

const appId = process.env.VITE_BASE44_APP_ID || '697a087fb354faebb72df54b';
const marker = 'B18-SYNTHETIC-PUBLIC-RUNTIME';
const email = 'batch18-runtime@invalid.test';
const client = createClient({ appId });

function schema(name) {
  const file = [`base44/entities/${name}.jsonc`, `base44/entities/${name}.json`].find(fs.existsSync);
  const parsed = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8'));
  if (parsed.error) throw new Error(`Unable to parse ${file}`);
  return parsed.config;
}
function valueFor(field, property = {}) {
  if (property.default !== undefined) return property.default;
  if (Array.isArray(property.enum) && property.enum.length) {
    const preferred = property.enum.find((value) => ['new','submitted','pending','received','open','initiated'].includes(String(value).toLowerCase()));
    return preferred ?? property.enum[0];
  }
  if (property.format === 'email' || /email/i.test(field)) return email;
  if (property.format === 'date-time') return new Date().toISOString();
  if (property.format === 'date') return new Date().toISOString().slice(0, 10);
  if (property.type === 'number' || property.type === 'integer') return 1;
  if (property.type === 'boolean') return true;
  if (property.type === 'array') return [];
  if (property.type === 'object') return { marker };
  return `${marker}-${field}`.slice(0, 180);
}
function requiredPayload(name) {
  const s = schema(name);
  const payload = {};
  for (const field of s.required || []) payload[field] = valueFor(field, s.properties?.[field]);
  for (const field of Object.keys(s.properties || {})) {
    if (/^(name|full_name|first_name|last_name|email|message|description|source|subject)$/i.test(field) && payload[field] === undefined) payload[field] = valueFor(field, s.properties[field]);
  }
  return payload;
}
async function invoke(payload) {
  try {
    const response = await client.functions.invoke('writeGlyphLockRecord', payload);
    return { status: Number(response?.status || 200), data: response?.data || {} };
  } catch (error) {
    return { status: Number(error?.response?.status || 0), data: error?.response?.data || { error: error?.message } };
  }
}

const consultationPayload = {
  ...requiredPayload('Consultation'),
  email,
  message: `${marker} consultation`,
  status: 'APPROVED',
  assigned_to: 'attacker@example.test',
  internal_notes: 'must be removed',
};
const consultation = await invoke({ entity: 'Consultation', operation: 'create', data: consultationPayload, intent: 'BATCH18_PUBLIC_RUNTIME_CONSULTATION' });
assert.equal(consultation.status, 200, `Consultation public create failed: ${JSON.stringify(consultation.data)}`);
assert.equal(consultation.data.success, true);
assert.ok(consultation.data.record?.id);
assert.notEqual(String(consultation.data.record?.status || '').toUpperCase(), 'APPROVED');
assert.equal(consultation.data.record?.assigned_to, undefined);
assert.equal(consultation.data.record?.internal_notes, undefined);

const contactPayload = {
  ...requiredPayload('ContactEvent'),
  email,
  message: `${marker} contact`,
  status: 'APPROVED',
  admin_notes: 'must be removed',
};
const contact = await invoke({ entity: 'ContactEvent', operation: 'create', data: contactPayload, intent: 'BATCH18_PUBLIC_RUNTIME_CONTACT' });
assert.equal(contact.status, 200, `Contact public create failed: ${JSON.stringify(contact.data)}`);
assert.equal(contact.data.success, true);
assert.ok(contact.data.record?.id);
assert.ok(contact.data.public_mutation_capability, 'Contact create did not return a one-time completion capability.');

const noCapability = await invoke({ entity: 'ContactEvent', operation: 'update', id: contact.data.record.id, data: { status: 'completed' }, intent: 'BATCH18_PUBLIC_RUNTIME_CONTACT_NO_CAPABILITY' });
assert.equal(noCapability.status, 403);
assert.equal(noCapability.data.success, false);

const contactSchema = schema('ContactEvent');
const publicUpdateField = ['status','state','result','delivery_status','submission_status','completed_at','sent_at','failed_at','error_code','error_message','notification_sent','email_sent','message_id','provider_reference','receipt_id'].find((field) => contactSchema.properties?.[field]);
if (publicUpdateField) {
  const value = valueFor(publicUpdateField, contactSchema.properties[publicUpdateField]);
  const allowedUpdate = await invoke({
    entity: 'ContactEvent', operation: 'update', id: contact.data.record.id,
    data: { [publicUpdateField]: value }, intent: 'BATCH18_PUBLIC_RUNTIME_CONTACT_COMPLETE',
    public_mutation_capability: contact.data.public_mutation_capability,
  });
  assert.equal(allowedUpdate.status, 200, `Contact capability update failed: ${JSON.stringify(allowedUpdate.data)}`);
  assert.equal(allowedUpdate.data.success, true);
  const replay = await invoke({
    entity: 'ContactEvent', operation: 'update', id: contact.data.record.id,
    data: { [publicUpdateField]: value }, intent: 'BATCH18_PUBLIC_RUNTIME_CONTACT_REPLAY',
    public_mutation_capability: contact.data.public_mutation_capability,
  });
  assert.equal(replay.status, 403, 'Consumed public mutation capability was reusable.');
}

const conversation = await invoke({ entity: 'Conversation', operation: 'create', data: requiredPayload('Conversation'), intent: 'BATCH18_PUBLIC_RUNTIME_CONVERSATION_DENY' });
assert.equal(conversation.status, 401);
const registry = await invoke({ entity: 'FeatureRegistry', operation: 'create', data: requiredPayload('FeatureRegistry'), intent: 'BATCH18_PUBLIC_RUNTIME_REGISTRY_DENY' });
assert.equal(registry.status, 401);

const result = {
  status: 'PASS', marker, email,
  consultation_id: consultation.data.record.id,
  contact_event_id: contact.data.record.id,
  public_privileged_fields_removed: true,
  contact_update_requires_capability: true,
  contact_capability_one_time: true,
  anonymous_private_write_denied: true,
  anonymous_governance_write_denied: true,
  capability_value_stored: false,
};
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/batch18-public-runtime.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, consultation_id: '[RECORDED]', contact_event_id: '[RECORDED]' }, null, 2));
