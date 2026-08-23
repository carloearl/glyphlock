#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@base44/sdk';

const appId = process.env.VITE_BASE44_APP_ID || '697a087fb354faebb72df54b';
const client = createClient({ appId });
const prefix = `B18-SYNTHETIC-${Date.now()}`;
const created = [];

function parseJsonc(path) {
  return JSON.parse(fs.readFileSync(path,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,''));
}
function valueFor(name, schema) {
  if (schema?.enum?.length) return schema.enum[0];
  if (schema?.type === 'boolean') return false;
  if (schema?.type === 'number' || schema?.type === 'integer') return 1;
  if (schema?.type === 'array') return [];
  if (schema?.type === 'object') return {};
  if (schema?.format === 'date-time') return new Date().toISOString();
  if (schema?.format === 'date') return new Date().toISOString().slice(0,10);
  if (/email/i.test(name)) return 'batch18-synthetic@example.invalid';
  if (/phone/i.test(name)) return '000-000-0000';
  return `${prefix}-${name}`;
}
function requiredData(entity) {
  const schema = parseJsonc(`base44/entities/${entity}.jsonc`);
  return Object.fromEntries((schema.required || []).map(name => [name,valueFor(name,schema.properties?.[name])]));
}
async function invoke(body) {
  try {
    const response = await client.functions.invoke('writeGlyphLockRecord',body);
    return { status: response.status || 200, data: response.data || {} };
  } catch (error) {
    return { status: error?.response?.status || 0, data: error?.response?.data || { error: error?.message || String(error) } };
  }
}

const consultation = await invoke({
  entity:'Consultation', operation:'create', intent:'B18_RUNTIME_PUBLIC_CONSULTATION',
  data:{...requiredData('Consultation'),name:`${prefix} Consultation`,email:'batch18-synthetic@example.invalid',message:'Synthetic Batch 18 public intake. Not a real customer.',status:'approved',assigned_to:'attacker@example.invalid',internal_notes:'must be stripped'},
});
assert.equal(consultation.status,200,`Consultation create failed: ${JSON.stringify(consultation.data)}`);
assert.equal(consultation.data.success,true);
assert.notEqual(consultation.data.record?.status,'approved','Public intake controlled privileged status.');
assert.equal(Object.hasOwn(consultation.data.record || {},'assigned_to'),false,'Public intake retained assigned_to.');
created.push({entity:'Consultation',id:consultation.data.record.id});

const contact = await invoke({
  entity:'ContactEvent', operation:'create', intent:'B18_RUNTIME_PUBLIC_CONTACT',
  data:{...requiredData('ContactEvent'),name:`${prefix} Contact`,email:'batch18-synthetic@example.invalid',message:'Synthetic contact event.',status:'approved',assigned_to:'attacker@example.invalid'},
});
assert.equal(contact.status,200,`Contact create failed: ${JSON.stringify(contact.data)}`);
assert.equal(contact.data.success,true);
assert.ok(contact.data.public_write_token,'Public contact update token was not returned.');
assert.equal(Object.hasOwn(contact.data.record || {},'public_update_token_hash'),false,'Token hash leaked to client.');
created.push({entity:'ContactEvent',id:contact.data.record.id});

const badUpdate = await invoke({entity:'ContactEvent',operation:'update',id:contact.data.record.id,intent:'B18_RUNTIME_BAD_TOKEN',public_write_token:'wrong',data:{delivery_status:'sent'}});
assert.equal(badUpdate.status,403,'Wrong public update token did not fail closed.');
const goodUpdate = await invoke({entity:'ContactEvent',operation:'update',id:contact.data.record.id,intent:'B18_RUNTIME_GOOD_TOKEN',public_write_token:contact.data.public_write_token,data:{delivery_status:'sent',status:'approved',assigned_to:'attacker@example.invalid'}});
assert.equal(goodUpdate.status,200,`Same-submission contact update failed: ${JSON.stringify(goodUpdate.data)}`);
assert.equal(goodUpdate.data.record?.delivery_status,'sent');
assert.notEqual(goodUpdate.data.record?.status,'approved');

const usageData={...requiredData('ServiceUsage'),service_name:'batch18_synthetic',feature:'runtime_governance',action:'test',units:-999,request_id:prefix,idempotency_key:prefix,metadata:{synthetic:true}};
const usage1=await invoke({entity:'ServiceUsage',operation:'create',intent:'B18_RUNTIME_USAGE',data:usageData});
assert.equal(usage1.status,200,`Usage create failed: ${JSON.stringify(usage1.data)}`);
assert.equal(Number(usage1.data.record?.units),1,'Anonymous usage units were not server-controlled.');
created.push({entity:'ServiceUsage',id:usage1.data.record.id});
const usage2=await invoke({entity:'ServiceUsage',operation:'create',intent:'B18_RUNTIME_USAGE_REPLAY',data:usageData});
assert.equal(usage2.status,200);
assert.equal(usage2.data.record?.id,usage1.data.record?.id,'Usage idempotency did not return the original record.');
assert.equal(usage2.data.idempotent_replay,true);

const feedback=await invoke({entity:'LLMFeedback',operation:'create',intent:'B18_RUNTIME_FEEDBACK',data:{...requiredData('LLMFeedback'),rating:5,feedback:'Synthetic governance verification. Not real user feedback.',metadata:{synthetic:true},admin_status:'approved'}});
assert.equal(feedback.status,200,`Feedback create failed: ${JSON.stringify(feedback.data)}`);
created.push({entity:'LLMFeedback',id:feedback.data.record.id});

for (const [entity,operation] of [['FeatureRegistry','create'],['ArchitecturalDecisionRecord','create'],['Conversation','create'],['InteractiveImage','create'],['PartnerDocument','update']]) {
  const result=await invoke({entity,operation,id:operation==='update'?'B18-NOT-REAL':'',intent:'B18_RUNTIME_ANONYMOUS_DENIAL',data:{}});
  assert.equal(result.status,401,`${entity}.${operation} did not require authentication.`);
}

fs.mkdirSync('artifacts/release18',{recursive:true});
fs.writeFileSync('artifacts/release18/runtime-created-records.json',JSON.stringify({prefix,created},null,2));
console.log(JSON.stringify({status:'PASS',synthetic_only:true,public_intake:true,public_contact_token:true,wrong_token_denied:true,usage_idempotency:true,anonymous_privileged_denials:true,created_records:created.length,cleanup_manifest:'artifacts/release18/runtime-created-records.json'},null,2));
