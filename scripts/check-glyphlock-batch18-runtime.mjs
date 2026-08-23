#!/usr/bin/env node
import assert from 'node:assert/strict';

const appId = process.env.VITE_BASE44_APP_ID || process.env.EXPO_PUBLIC_BASE44_APP_ID || '697a087fb354faebb72df54b';
const serverUrl = String(process.env.VITE_BASE44_BACKEND_URL || process.env.EXPO_PUBLIC_BASE44_BACKEND_URL || 'https://base44.app').replace(/\/$/, '');
const functionsVersion = process.env.VITE_BASE44_FUNCTIONS_VERSION || process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION || '';
const suffix = functionsVersion ? `?version=${encodeURIComponent(functionsVersion)}` : '';
const url = `${serverUrl}/api/apps/${appId}/functions/manageGlyphLockRecord${suffix}`;

async function post(body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 200) }; }
  const serialized = JSON.stringify(data);
  assert.doesNotMatch(serialized, /file:\/\/|signed_url|eyJ[A-Za-z0-9._-]{20,}/i, 'Anonymous response leaked a private reference or token.');
  return { status: response.status, data };
}

const governance = await post({ action: 'create', entity: 'FeatureRegistry', data: { feature_key: 'B18-ANON-PROBE' }, intent: 'B18_ANONYMOUS_GOVERNANCE_PROBE' });
assert.equal(governance.status, 401, `Anonymous governance create must return 401, received ${governance.status}`);

const creative = await post({ action: 'create', entity: 'InteractiveImage', data: { title: 'B18 anonymous probe' }, intent: 'B18_ANONYMOUS_CREATIVE_PROBE' });
assert.equal(creative.status, 401, `Anonymous creative create must return 401, received ${creative.status}`);

const privilegedPublic = await post({
  action: 'create',
  entity: 'Consultation',
  data: { name: 'B18 SYNTHETIC', email: 'b18-probe@example.invalid', role: 'PLATFORM_ADMIN', internal_notes: 'forbidden' },
  intent: 'B18_PUBLIC_PRIVILEGE_PROBE',
});
assert.equal(privilegedPublic.status, 400, `Privileged public intake must return 400, received ${privilegedPublic.status}`);

const forgedUsage = await post({
  action: 'create',
  entity: 'ServiceUsage',
  data: { service_name: 'B18_SYNTHETIC', usage_count: -999, user_id: 'victim' },
  intent: 'B18_FORGED_USAGE_PROBE',
});
assert.equal(forgedUsage.status, 400, `Forged negative usage must return 400, received ${forgedUsage.status}`);

const unknownEntity = await post({ action: 'create', entity: 'User', data: { role: 'admin' }, intent: 'B18_UNKNOWN_ENTITY_PROBE' });
assert.equal(unknownEntity.status, 400, `Non-allow-listed entity must return 400, received ${unknownEntity.status}`);

console.log('[check:glyphlock-batch18-runtime] PASS — deployed anonymous requests cannot write governance/content, inject privileged public fields, forge usage, or reach unapproved entities.');
