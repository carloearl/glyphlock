import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const TARGET_ENTITIES = [
  'AgentChangeSet',
  'GlyphBotAudit',
  'FeatureRegistry',
  'ArchitecturalDecisionRecord',
  'Consultation',
  'ContactEvent',
  'UserPreferences',
  'Conversation',
  'HotspotPayload',
  'InteractiveImage',
  'QRGenHistory',
  'QrPreview',
  'QRAIScore',
  'ServiceUsage',
  'LLMFeedback',
  'PartnerDocument',
  'MarketingAsset',
];
const TARGET_WRITE = new RegExp(
  `\\bbase44\\.entities\\.(${TARGET_ENTITIES.join('|')})\\.(create|update|delete|bulkCreate)\\s*\\(`,
  'g',
);

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build', 'artifacts', 'internal_index'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) output.push(full);
  }
  return output;
}

const remaining = [];
for (const file of walk(path.join(ROOT, 'src'))) {
  const source = fs.readFileSync(file, 'utf8');
  TARGET_WRITE.lastIndex = 0;
  let match;
  while ((match = TARGET_WRITE.exec(source)) !== null) {
    const line = source.slice(0, match.index).split('\n').length;
    remaining.push(`${path.relative(ROOT, file).replaceAll(path.sep, '/')}:${line} ${match[1]}.${match[2]}`);
  }
}
assert.deepEqual(remaining, [], `Batch 18 target direct writes returned:\n${remaining.join('\n')}`);

const helper = read('src/lib/glyphlock/glyphlockWriteGateway.js');
const gateway = read('base44/functions/glyphlockWriteGateway/entry.ts');
const auditSchema = read('base44/entities/GlyphLockWriteAudit.jsonc');
const changeSetSchema = read('base44/entities/AgentChangeSet.jsonc');
const glyphBotSchema = read('base44/entities/GlyphBotAudit.jsonc');
const imageSchema = read('base44/entities/InteractiveImage.jsonc');
const hotspotSchema = read('base44/entities/HotspotPayload.jsonc');
const previewSchema = read('base44/entities/QrPreview.jsonc');
const usageSchema = read('base44/entities/ServiceUsage.jsonc');
const marketingSchema = read('base44/entities/MarketingAsset.jsonc');
const documentAccessSchema = read('base44/entities/PartnerDocumentAccess.jsonc');
const assetDownloadSchema = read('base44/entities/MarketingAssetDownload.jsonc');

assert.match(helper, /functions\.invoke\(['"]glyphlockWriteGateway['"]/, 'Frontend helper must call the explicit server gateway.');
assert.doesNotMatch(gateway, /(?:asServiceRole\.)?entities\s*\[\s*body\./, 'Gateway must not accept client-selected entity names.');
assert.doesNotMatch(gateway, /E\s*\[\s*(?:body|action|entity)/, 'Gateway must not dynamically select an entity from client input.');
assert.doesNotMatch(gateway, /body\.(?:actor_email|actor_role|owner_id|user_email)\s*(?:\?|\|\||,|})/, 'Client identity must not become authoritative actor identity.');

const expectedActions = [
  'archive_agent_change_set',
  'glyphbot_audit_create',
  'glyphbot_audit_update',
  'glyphbot_audit_archive',
  'glyphbot_audit_unarchive',
  'reconcile_feature_registry',
  'adr_save',
  'consultation_submit',
  'consultation_status',
  'contact_submit',
  'preferences_save',
  'conversation_save',
  'service_usage_check',
  'llm_feedback_submit',
  'interactive_image_create',
  'interactive_image_update',
  'interactive_image_finalize',
  'interactive_image_archive',
  'hotspot_payload_archive',
  'qr_record_generation',
  'qr_preview_save',
  'qr_preview_vault',
  'qr_preview_remove',
  'partner_document_list',
  'partner_document_access',
  'marketing_asset_list',
  'marketing_asset_download',
];
for (const action of expectedActions) {
  assert.match(gateway, new RegExp(`action === ['"]${action}['"]`), `Missing explicit governed action: ${action}`);
}

// Governance and retention.
assert.match(gateway, /action === 'archive_agent_change_set'[\s\S]*archived: true/, 'Agent change sets must archive rather than hard-delete.');
assert.doesNotMatch(gateway, /AgentChangeSet\.delete/, 'Agent change-set evidence must not be hard-deleted.');
assert.match(gateway, /action === 'glyphbot_audit_archive'[\s\S]*isArchived: true/, 'GlyphBot audits must archive.');
assert.doesNotMatch(gateway, /GlyphBotAudit\.delete/, 'GlyphBot audit evidence must not be hard-deleted.');
assert.match(gateway, /APPROVED_ADR_IMMUTABLE/, 'Approved or historical ADR text must fail closed.');
assert.match(gateway, /superseded_by: adrNumber/, 'ADR supersession relationship must be persisted.');
assert.match(gateway, /REGISTRY_DUPLICATE/, 'Registry reconciliation must reject duplicate IDs/routes.');
assert.match(gateway, /ROUTE_OWNED/, 'Registry reconciliation must reject route ownership collisions.');
assert.match(changeSetSchema, /"archived"/, 'AgentChangeSet archive fields are missing.');
assert.match(glyphBotSchema, /"archive_reason"/, 'GlyphBotAudit archive evidence is missing.');

// Public intake controls.
assert.match(gateway, /action === 'consultation_submit'[\s\S]*status: 'submitted'[\s\S]*payment_status: 'unpaid'/, 'Public consultation must receive server-controlled status/payment defaults.');
assert.doesNotMatch(gateway.match(/action === 'consultation_submit'[\s\S]*?action === 'consultation_status'/)?.[0] || '', /\.\.\.input/, 'Public consultation must not spread arbitrary client fields.');
assert.match(gateway, /action === 'contact_submit'[\s\S]*RATE_LIMITED/, 'Public contact intake must be rate limited.');
assert.match(gateway, /ContactEvent\.create[\s\S]*status: 'pending'/, 'Contact status must start server-side as pending.');
assert.match(gateway, /ContactEvent\.update\(contact\.id, \{ status: deliveryStatus \}\)/, 'Contact delivery outcome must be server-stamped.');

// Private data ownership.
assert.match(gateway, /action === 'preferences_save'[\s\S]*requireUser\(user\)/, 'Preferences must require authentication.');
assert.match(gateway, /base44\.entities\.UserPreferences\.(?:create|update)/, 'Preferences must mutate through the caller-scoped entity client.');
assert.match(gateway, /action === 'conversation_save'[\s\S]*requireUser\(user\)/, 'Conversation writes must require authentication.');
assert.match(gateway, /base44\.entities\.Conversation\.(?:create|update|get)/, 'Conversation writes must use caller-scoped RLS.');
assert.doesNotMatch(gateway, /E\.Conversation\.(?:create|update)/, 'Service role must not bypass conversation ownership.');
assert.match(gateway, /messages\.length > 200/, 'Conversation size must be bounded.');

// Content ownership and destructive action rules.
for (const action of ['interactive_image_update', 'interactive_image_finalize', 'interactive_image_archive']) {
  const block = gateway.match(new RegExp(`action === '${action}'[\\s\\S]*?(?=\\} else if \\(action ===|\\} else \\{)`))?.[0] || '';
  assert.match(block, /OWNER_REQUIRED/, `${action} must verify ownership.`);
}
assert.doesNotMatch(gateway, /InteractiveImage\.delete/, 'Interactive image evidence must not be hard-deleted.');
assert.match(imageSchema, /"delete"[\s\S]*"__ARCHIVE_ONLY__"/, 'InteractiveImage schema must block normal hard delete.');
assert.match(hotspotSchema, /"archived"/, 'HotspotPayload archive fields are missing.');
assert.match(previewSchema, /"archived"/, 'QrPreview archive fields are missing.');
assert.match(gateway, /if \(before\.vaulted\)[\s\S]*archived: true[\s\S]*else \{[\s\S]*QrPreview\.delete/, 'Only ephemeral, non-vaulted QR previews may be hard-deleted.');
assert.match(gateway, /QR_RATE_LIMITED/, 'QR generation must enforce a server-side hourly limit.');

// Trial and feedback safety.
assert.match(gateway, /const subjectKey = user\?\.email \?[^;]+: anonymousRef;/, 'Anonymous trial identity must be server-derived.');
assert.doesNotMatch(gateway, /body\.(?:user_email|usage_count|is_trial)/, 'Clients must not supply authoritative usage identity/count/plan fields.');
assert.match(usageSchema, /"subject_key"[\s\S]*"request_id"/, 'Usage schema must support server identity and idempotency.');
const feedbackBlock = gateway.match(/action === 'llm_feedback_submit'[\s\S]*?(?=\} else if \(action ===)/)?.[0] || '';
assert.doesNotMatch(feedbackBlock, /prompt_snippet|response_snippet/, 'Feedback persistence must not copy prompt/response content.');
assert.match(feedbackBlock, /RATE_LIMITED/, 'Feedback submission must be rate limited.');

// Partner isolation and evidence.
assert.match(gateway, /resolvePartner\(E, user\)/, 'Partner identity must be resolved server-side.');
assert.match(gateway, /PARTNER_SCOPE_DENIED/, 'Partner documents must reject cross-partner access.');
assert.match(gateway, /TIER_DENIED/, 'Marketing assets must enforce partner tier server-side.');
assert.match(gateway, /partner_document_list[\s\S]*document_name[\s\S]*created_date/, 'Partner document catalog must return a safe server-curated projection.');
const documentListBlock = gateway.match(/action === 'partner_document_list'[\s\S]*?(?=\} else if \(action === 'marketing_asset_list')/)?.[0] || '';
assert.doesNotMatch(documentListBlock, /file_url:/, 'Partner document catalog must not return file URLs before authorization.');
const assetListBlock = gateway.match(/action === 'marketing_asset_list'[\s\S]*?(?=\} else if \(action === 'partner_document_access')/)?.[0] || '';
assert.doesNotMatch(assetListBlock, /file_url:/, 'Marketing catalog must not return file URLs before authorization.');
assert.doesNotMatch(marketingSchema, /"partner"\s*\n\s*\]/, 'Generic partner role must not bypass marketing tier filtering.');
assert.match(documentAccessSchema, /"data\.actor_email": "\{\{user\.email\}\}"/, 'Partner access evidence must remain user scoped.');
assert.match(assetDownloadSchema, /"__APPEND_ONLY_BLOCK__"/, 'Partner asset-download evidence must be append-only.');

// Audit boundary.
assert.match(auditSchema, /"before_hash"[\s\S]*"after_hash"/, 'App-wide write audit must store safe before/after hashes.');
assert.match(auditSchema, /"update"[\s\S]*"__APPEND_ONLY_BLOCK__"[\s\S]*"delete"[\s\S]*"__APPEND_ONLY_BLOCK__"/, 'App-wide write audit must be append-only.');
assert.doesNotMatch(gateway, /metadata:\s*\{[^}]*?(?:file_uri|signed_url|password|otp|pin|token)/is, 'Audit metadata contains a forbidden protected field.');

// Scorecard. Count direct writes using the same syntax as the Tier-2 guard.
const allWritePattern = /\bbase44\.entities\.([A-Za-z_$][\w$]*)\.(create|update|delete|bulkCreate)\s*\(/g;
let totalWrites = 0;
for (const file of walk(path.join(ROOT, 'src'))) {
  const source = fs.readFileSync(file, 'utf8');
  allWritePattern.lastIndex = 0;
  while (allWritePattern.exec(source) !== null) totalWrites += 1;
}
assert.equal(totalWrites, 120, `Batch 18 expected 120 grandfathered frontend writes, found ${totalWrites}. Reclassify before changing this contract.`);

console.log('[check:glyphlock-write-governance] PASS');
console.log(' - 41 live non-NUPS business mutations are absent from frontend code');
console.log(' - governance and finalized evidence archive rather than disappear');
console.log(' - public intake, private chat, content ownership, usage, QR and partner scopes fail closed');
console.log(' - app-wide write audit is append-only and stores hashes, not private content');
console.log(` - direct-write scorecard: ${totalWrites}/287`);
