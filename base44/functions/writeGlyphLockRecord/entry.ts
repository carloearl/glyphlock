import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const POLICIES = {
  "AgentChangeSet": {
    "kind": "retention_owner",
    "operations": [],
    "fields": [
      "mode",
      "status",
      "summary",
      "userRequest",
      "executionPlan",
      "changes",
      "riskLevel",
      "requiresApproval",
      "approvedBy",
      "approvedAt",
      "appliedAt",
      "applyLog",
      "rollbackAvailable",
      "archived",
      "archivedAt",
      "archivedBy",
      "archiveReason",
      "model",
      "archived_at",
      "archived_by",
      "archive_reason"
    ]
  },
  "GlyphBotAudit": {
    "kind": "retention_owner",
    "operations": [],
    "fields": [
      "user_id",
      "targetType",
      "targetIdentifier",
      "auditMode",
      "rawInput",
      "notes",
      "status",
      "findings",
      "summary",
      "riskScore",
      "overallGrade",
      "isArchived",
      "archived_at",
      "archived_by",
      "archive_reason",
      "archived"
    ]
  },
  "FeatureRegistry": {
    "kind": "admin",
    "operations": [],
    "fields": [
      "feature_id",
      "label",
      "route",
      "icon",
      "group",
      "order",
      "roles",
      "modes",
      "help_anchor",
      "keywords",
      "status",
      "discovered_by_crawl",
      "notes"
    ]
  },
  "ArchitecturalDecisionRecord": {
    "kind": "retention_admin",
    "operations": [],
    "fields": [
      "adr_number",
      "title",
      "status",
      "category",
      "decision",
      "context",
      "alternatives_considered",
      "rationale",
      "consequences",
      "dependencies",
      "approval_authority",
      "approval_date",
      "directive_references",
      "supersedes",
      "superseded_by",
      "supersession_notes",
      "tags",
      "notes",
      "archived",
      "archived_at",
      "archived_by",
      "archive_reason"
    ]
  },
  "Consultation": {
    "kind": "public_intake",
    "operations": [],
    "fields": [
      "description",
      "consultation_id",
      "organization_name",
      "contact_name",
      "contact_email",
      "contact_phone",
      "organization_size",
      "industry",
      "verification_interest",
      "current_governance_maturity",
      "primary_concern",
      "documentation_ready",
      "budget_range",
      "timeline",
      "payment_status",
      "stripe_payment_intent_id",
      "stripe_charge_id",
      "stripe_connected_account_id",
      "amount_paid",
      "payment_date",
      "refund_id",
      "refund_status",
      "refund_amount",
      "refund_date",
      "status",
      "qualification_notes",
      "assigned_to"
    ]
  },
  "ContactEvent": {
    "kind": "public_contact",
    "operations": [],
    "fields": [
      "description",
      "contact_email",
      "contact_name",
      "subject",
      "message",
      "status",
      "ip_address",
      "public_update_token_hash",
      "public_update_token_expires_at"
    ]
  },
  "UserPreferences": {
    "kind": "self",
    "operations": [],
    "fields": [
      "description",
      "emailNotifications",
      "securityAlerts",
      "productUpdates",
      "defaultVoice",
      "voiceSpeed",
      "voicePitch",
      "voiceSettings",
      "chatSettings",
      "imageLabSettings",
      "toursSeen"
    ]
  },
  "Conversation": {
    "kind": "self",
    "operations": [],
    "fields": [
      "description",
      "title",
      "messages",
      "last_message_at"
    ]
  },
  "HotspotPayload": {
    "kind": "owner",
    "operations": [],
    "fields": [
      "description",
      "payload_id",
      "hotspot_id",
      "payload_type",
      "payload_url",
      "archived",
      "archived_at",
      "archived_by",
      "archive_reason"
    ]
  },
  "InteractiveImage": {
    "kind": "owner",
    "operations": [],
    "fields": [
      "asset_id",
      "name",
      "source",
      "fileUrl",
      "image_url",
      "ownerEmail",
      "owner_id",
      "fingerprint",
      "fingerprint_method",
      "status",
      "published",
      "hotspots",
      "immutableHash",
      "imageFileHash",
      "width",
      "height",
      "archived",
      "archived_at",
      "archived_by",
      "archive_reason",
      "description"
    ]
  },
  "QRGenHistory": {
    "kind": "owner",
    "operations": [],
    "fields": [
      "description",
      "code_id",
      "payload",
      "payload_sha256",
      "size",
      "creator_id",
      "status",
      "type",
      "image_format",
      "error_correction",
      "foreground_color",
      "background_color",
      "has_logo",
      "logo_url"
    ]
  },
  "QrPreview": {
    "kind": "owner",
    "operations": [],
    "fields": [
      "description",
      "user_id",
      "code_id",
      "payload",
      "payload_type",
      "image_data_url",
      "thumbnail_url",
      "customization",
      "size",
      "error_correction",
      "risk_score",
      "risk_flags",
      "immutable_hash",
      "vaulted",
      "vault_date",
      "archived",
      "archived_at",
      "archived_by",
      "archive_reason"
    ]
  },
  "QRAIScore": {
    "kind": "owner",
    "operations": [],
    "fields": [
      "description",
      "code_id",
      "final_score",
      "domain_trust",
      "sentiment_score",
      "entity_legitimacy",
      "risk_level",
      "ml_version",
      "phishing_indicators",
      "threat_types"
    ]
  },
  "ServiceUsage": {
    "kind": "metering",
    "operations": [],
    "fields": [
      "description",
      "user_email",
      "service_name",
      "usage_count",
      "is_trial",
      "session_id",
      "subject_key",
      "request_id",
      "first_used_at",
      "last_used_at",
      "idempotency_key"
    ]
  },
  "LLMFeedback": {
    "kind": "feedback",
    "operations": [],
    "fields": [
      "description",
      "conversation_id",
      "provider_id",
      "model",
      "persona",
      "rating",
      "feedback_text",
      "response_latency_ms",
      "prompt_snippet",
      "response_snippet",
      "user_email"
    ]
  },
  "PartnerDocument": {
    "kind": "partner",
    "operations": [],
    "fields": [
      "document_name",
      "document_type",
      "description",
      "file_url",
      "partner_id",
      "is_confidential",
      "requires_signature",
      "signed",
      "signed_date",
      "expiry_date",
      "version",
      "viewed",
      "viewed_date"
    ]
  },
  "MarketingAsset": {
    "kind": "partner",
    "operations": [],
    "fields": [
      "asset_name",
      "asset_type",
      "description",
      "file_url",
      "thumbnail_url",
      "file_size",
      "file_format",
      "partner_tier_access",
      "download_count",
      "is_active",
      "tags"
    ]
  }
} as const;
const ADMIN_ROLES = new Set(['admin','PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER','SOVEREIGN']);
const IMMUTABLE_FIELDS = new Set(['id','created_date','updated_date','created_by','created_by_id']);
const PUBLIC_FIELDS: Record<string, Set<string>> = {
  Consultation: new Set(['name','full_name','first_name','last_name','email','phone','company','organization','job_title','website','service','service_type','project_type','project_description','project_details','message','budget','budget_range','timeline','preferred_contact','source','referral_source','consent','privacy_consent','terms_accepted','availability']),
  ContactEvent: new Set(['name','full_name','first_name','last_name','email','phone','subject','message','category','source','page_url','referrer','utm_source','utm_medium','utm_campaign','event_type','contact_method','consent','privacy_consent','metadata']),
  LLMFeedback: new Set(['rating','feedback','comment','model','model_id','feature','conversation_id','message_id','category','helpful','reason','metadata']),
  ServiceUsage: new Set(['service_name','service','feature','action','units','request_id','idempotency_key','session_id','metadata']),
};
const PUBLIC_LIMITS: Record<string, number> = { Consultation: 5, ContactEvent: 20, LLMFeedback: 20, ServiceUsage: 120 };
const PUBLIC_CONTACT_UPDATE_FIELDS = new Set(['email_sent','notification_sent','delivery_status','submission_status','external_reference','notification_error']);
const TOKEN_CACHE_TTL_MS = 15 * 60 * 1000;

function json(data: unknown, status = 200) { return Response.json(data, { status }); }
function text(value: unknown, max = 500) { return String(value ?? '').trim().slice(0, max); }
function sha256(value: string) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')); }
function safeHash(value: unknown) { return sha256(JSON.stringify(value, Object.keys((value as any) || {}).sort())); }
function allowedFields(policy: any) { return new Set(policy.fields as string[]); }
function sanitizeData(entity: string, data: any, publicMode = false) {
  const policy: any = (POLICIES as any)[entity]; const allowed = allowedFields(policy); const publicAllowed = PUBLIC_FIELDS[entity]; const out: any = {};
  for (const [key, value] of Object.entries(data && typeof data === 'object' ? data : {})) {
    if (!allowed.has(key) || IMMUTABLE_FIELDS.has(key)) continue;
    if (publicMode && publicAllowed && !publicAllowed.has(key)) continue;
    if (/password|secret|token|otp|pin|file_uri|signed_url/i.test(key)) continue;
    if (typeof value === 'string') out[key] = value.slice(0, key === 'message' || key.includes('description') ? 10000 : 2000);
    else out[key] = value;
  }
  return out;
}
async function resolveNupsUser(base44: any, email: string) {
  const E = base44.asServiceRole.entities;
  const byEmail = await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = email.split('@')[0].toLowerCase();
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}
function isAdmin(user: any, nups: any) { return user?.role === 'admin' || ADMIN_ROLES.has(String(nups?.role || user?.role || '')); }
function owns(record: any, user: any) {
  const id = String(user?.id || ''); const email = String(user?.email || '').toLowerCase();
  const idFields = ['created_by_id','owner_id','user_id','account_id'];
  const emailFields = ['created_by','created_by_email','owner_email','user_email','email','partner_email'];
  if (id && idFields.some(k => String(record?.[k] || '') === id)) return true;
  if (email && emailFields.some(k => String(record?.[k] || '').toLowerCase() === email)) return true;
  for (const key of ['participants','members','participant_emails','collaborators']) {
    const values = Array.isArray(record?.[key]) ? record[key] : [];
    if (values.some((v:any) => String(typeof v === 'object' ? (v.email || v.id) : v).toLowerCase() === email || String(v?.id || '') === id)) return true;
  }
  return false;
}
async function audit(base44:any, event_type:string, user:any, entity:string, operation:string, recordId:string, intent:string, result:string, fieldsChanged:string[], extra:any={}) {
  await base44.asServiceRole.entities.SystemAuditLog.create({ event_type, description: `Governed ${entity}.${operation} ${result}`, actor_email: user?.email || 'anonymous', resource_id: recordId || '', status: result === 'DENIED' ? 'failure' : 'success', severity: result === 'DENIED' ? 'high' : (operation === 'delete' ? 'medium' : 'low'), metadata: { entity, operation, intent, result, fields_changed: fieldsChanged, ...extra } }).catch(() => null);
}
async function rateLimit(base44:any, req:Request, entity:string) {
  const limit = PUBLIC_LIMITS[entity] || 20; const now = new Date(); const windowStart = new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),now.getUTCHours()));
  const ip = text(req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown', 100);
  const bucket = await sha256(`${entity}:${windowStart.toISOString()}:${ip}`); const E = base44.asServiceRole.entities;
  const rows = await E.GlyphLockWriteRateLimit.filter({ bucket_key: bucket }, null, 1).catch(() => []); const row = rows?.[0];
  if (row && Number(row.count || 0) >= limit) return false;
  if (row) await E.GlyphLockWriteRateLimit.update(row.id, { count: Number(row.count || 0) + 1 });
  else await E.GlyphLockWriteRateLimit.create({ bucket_key: bucket, action: entity, window_start: windowStart.toISOString(), count: 1, expires_at: new Date(windowStart.getTime() + 2*60*60*1000).toISOString() });
  return true;
}
function stampOwner(data:any, fields:Set<string>, user:any) {
  const out={...data}; if (!user) return out;
  if (fields.has('user_id')) out.user_id=user.id; if(fields.has('user_email')) out.user_email=user.email;
  if(fields.has('owner_id')) out.owner_id=user.id; if(fields.has('owner_email')) out.owner_email=user.email;
  if(fields.has('created_by_email')) out.created_by_email=user.email; return out;
}
async function entityGet(E:any, entity:string, id:string){ return E[entity].get(id).catch(() => null); }

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let body:any = {}; try { body = await req.json(); } catch { return json({ error:'Valid JSON body required' },400); }
  const entity = text(body.entity,100); const operation = text(body.operation,20); const intent = text(body.intent || 'GLYPHLOCK_GOVERNED_WRITE',160); const policy:any = (POLICIES as any)[entity];
  if (!policy || !(policy.operations as readonly string[]).includes(operation)) return json({ error:'Entity or operation not allowed by governed write policy' },400);
  const user = await base44.auth.me().catch(() => null); const nups = user?.email ? await resolveNupsUser(base44,String(user.email).toLowerCase()) : null; const admin = isAdmin(user,nups); const publicCreate = operation === 'create' && ['public_intake','public_contact','feedback','metering'].includes(policy.kind);
  if (!user && !publicCreate && !(policy.kind === 'public_contact' && operation === 'update')) return json({ error:'Authentication required' },401);
  if (!user && !(await rateLimit(base44,req,entity))) return json({ error:'Submission rate limit exceeded' },429);
  const E = base44.asServiceRole.entities; const CallerE = base44.entities; const fields = allowedFields(policy); const id = text(body.id,200); let existing:any = null;
  if (operation !== 'create') { if(!id) return json({error:'Record id required'},400); existing = await entityGet(E,entity,id); if(!existing) return json({error:'Record not found'},404); }
  const adminKinds = new Set(['admin','retention_admin']);
  if (adminKinds.has(policy.kind) && !admin) { await audit(base44,'GLYPHLOCK_GOVERNED_WRITE_DENIED',user,entity,operation,id,intent,'DENIED',[],{reason:'admin_required'}); return json({error:'Administrative role required'},403); }
  if (['self','owner','retention_owner','partner'].includes(policy.kind) && operation !== 'create' && !admin && !owns(existing,user)) { await audit(base44,'GLYPHLOCK_GOVERNED_WRITE_DENIED',user,entity,operation,id,intent,'DENIED',[],{reason:'ownership_required'}); return json({error:'Record ownership required'},403); }
  if (policy.kind === 'public_intake' && operation === 'update' && !admin) return json({error:'Administrative role required'},403);
  let publicToken:string|null = null;
  if (policy.kind === 'public_contact' && operation === 'update' && !user) {
    const supplied=text(body.public_write_token,300); const validHash=supplied?await sha256(supplied):''; const expiry=Date.parse(existing.public_update_token_expires_at || '');
    if(!supplied || validHash !== existing.public_update_token_hash || !Number.isFinite(expiry) || expiry < Date.now()) { await audit(base44,'GLYPHLOCK_PUBLIC_UPDATE_DENIED',null,entity,operation,id,intent,'DENIED',[],{reason:'invalid_or_expired_submission_token'}); return json({error:'Public submission update denied'},403); }
  }
  let data = sanitizeData(entity,body.data,publicCreate && !user);
  if (policy.kind === 'public_contact' && operation === 'update' && !user) data = Object.fromEntries(Object.entries(data).filter(([k]) => PUBLIC_CONTACT_UPDATE_FIELDS.has(k)));
  if (policy.kind === 'metering') {
    const units = Number(data.units ?? 1); data.units = user ? Math.max(0,Math.min(units,100000)) : 1;
    const rawKey=text(data.idempotency_key || data.request_id || body.idempotency_key,200); const actorKey=user?.id || await sha256(text(req.headers.get('cf-connecting-ip') || 'anonymous',100)); data.idempotency_key=await sha256(`${actorKey}:${entity}:${rawKey || JSON.stringify(data)}`);
    const prior=await E.ServiceUsage.filter({idempotency_key:data.idempotency_key},null,1).catch(()=>[]); if(prior?.[0]) return json({success:true,record:prior[0],idempotent_replay:true});
  }
  if (operation === 'create') data = stampOwner(data,fields,user);
  if (policy.kind === 'public_contact' && operation === 'create' && !user) { publicToken=crypto.randomUUID()+crypto.randomUUID(); if(fields.has('public_update_token_hash'))data.public_update_token_hash=await sha256(publicToken); if(fields.has('public_update_token_expires_at'))data.public_update_token_expires_at=new Date(Date.now()+TOKEN_CACHE_TTL_MS).toISOString(); }
  if (entity === 'Consultation' && operation === 'create') { if(fields.has('status')) data.status='new'; if(fields.has('source') && !data.source)data.source='public_intake'; }
  if (entity === 'ContactEvent' && operation === 'create') { if(fields.has('status')) data.status='new'; }
  if (entity === 'FeatureRegistry' && operation === 'create') {
    const keyField=['feature_key','key','feature_id','name'].find(k=>fields.has(k)&&data[k]); if(keyField){const prior=await E.FeatureRegistry.filter({[keyField]:data[keyField]},null,1).catch(()=>[]);if(prior?.[0]){const record=await E.FeatureRegistry.update(prior[0].id,data);await audit(base44,'GLYPHLOCK_GOVERNED_WRITE',user,entity,'update',record.id,intent,'SUCCESS',Object.keys(data),{reconciled:true});return json({success:true,record,reconciled:true});}}
  }
  let record:any;
  if (operation === 'delete' && ['retention_owner','retention_admin'].includes(policy.kind)) {
    const archive:any={}; if(fields.has('archived'))archive.archived=true;if(fields.has('archived_at'))archive.archived_at=new Date().toISOString();if(fields.has('archived_by'))archive.archived_by=user?.email||'system';if(fields.has('archive_reason'))archive.archive_reason=text(body.reason||intent,500);
    record=await E[entity].update(id,archive); await audit(base44,'GLYPHLOCK_RECORD_ARCHIVED',user,entity,operation,id,intent,'SUCCESS',Object.keys(archive),{before_hash:await safeHash(existing),after_hash:await safeHash(record)});
    return json({success:true,record,archived:true});
  }
  if (operation === 'create') record = publicCreate && !user ? await E[entity].create(data) : await CallerE[entity].create(data);
  else if (operation === 'update') record = await E[entity].update(id,data);
  else { await audit(base44,'GLYPHLOCK_DESTRUCTIVE_WRITE_AUTHORIZED',user,entity,operation,id,intent,'SUCCESS',[],{before_hash:await safeHash(existing)}); await E[entity].delete(id); record={id,deleted:true}; }
  await audit(base44,operation === 'delete' ? 'GLYPHLOCK_DESTRUCTIVE_WRITE' : 'GLYPHLOCK_GOVERNED_WRITE',user,entity,operation,String(record?.id||id||''),intent,'SUCCESS',Object.keys(data),{before_hash:existing?await safeHash(existing):null,after_hash:operation==='delete'?null:await safeHash(record)});
  const safeRecord={...(record||{})}; delete safeRecord.public_update_token_hash; delete safeRecord.public_update_token_expires_at;
  return json({success:true,record:safeRecord,...(publicToken?{public_write_token:publicToken}:{})});
});
