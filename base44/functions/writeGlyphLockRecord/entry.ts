import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { GLYPHLOCK_WRITE_POLICIES } from './policies.ts';

const GLOBAL_ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN', 'VENUE_OWNER', 'VENUE_MANAGER']);
const SYSTEM_FIELDS = new Set(['id', 'created_date', 'updated_date', 'created_by', 'created_by_id', 'is_sample']);
const SECRET_KEY_PATTERN = /(password|passcode|secret|token|authorization|cookie|otp|pin|private[_-]?key|file_uri|signed_url|ssn|tin|biometric|thumbprint|fingerprint)/i;
const SAFE_PUBLIC_STATUS = ['new', 'submitted', 'pending', 'received', 'open', 'initiated', 'sent', 'completed', 'failed'];

type PolicyName = keyof typeof GLYPHLOCK_WRITE_POLICIES;

type ActorContext = {
  user: any;
  nups: any;
  authenticated: boolean;
  actorId: string;
  email: string;
  role: string;
  globalAdmin: boolean;
  admin: boolean;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stable((value as any)[key])}`).join(',')}}`;
}

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[MAX_DEPTH]';
  if (Array.isArray(value)) return value.slice(0, 200).map((item) => scrub(item, depth + 1));
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' && value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = scrub(nested, depth + 1);
    }
  }
  return result;
}

function safeMetadata(data: Record<string, unknown>) {
  return {
    field_names: Object.keys(data).filter((key) => !SECRET_KEY_PATTERN.test(key)).slice(0, 100),
    field_count: Object.keys(data).length,
  };
}

async function resolveNupsUser(base44: any, email: string) {
  if (!email) return null;
  const E = base44.asServiceRole.entities;
  const normalized = email.toLowerCase();
  const byEmail = await E.NUPSUser.filter({ platform_email: normalized, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = normalized.split('@')[0];
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

async function actorContext(base44: any): Promise<ActorContext> {
  const user = await base44.auth.me().catch(() => null);
  const email = String(user?.email || '').toLowerCase();
  const nups = email ? await resolveNupsUser(base44, email) : null;
  const role = String(nups?.role || user?.role || (user ? 'user' : 'anonymous')).toUpperCase();
  const globalAdmin = user?.role === 'admin' || GLOBAL_ADMIN_ROLES.has(role);
  return {
    user,
    nups,
    authenticated: Boolean(user?.id && email),
    actorId: String(user?.id || ''),
    email: email || 'anonymous',
    role,
    globalAdmin,
    admin: globalAdmin || ADMIN_ROLES.has(role),
  };
}

function filterFields(policy: any, data: Record<string, unknown>, fields: readonly string[]) {
  const allowed = new Set(fields);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (!SYSTEM_FIELDS.has(key) && allowed.has(key) && !SECRET_KEY_PATTERN.test(key)) result[key] = value;
  }
  return result;
}

function applyDefaults(policy: any, data: Record<string, unknown>) {
  const result = { ...data };
  for (const [field, value] of Object.entries(policy.defaults || {})) {
    if (result[field] === undefined) result[field] = value;
  }
  return result;
}

function normalizePublicStatus(policy: any, data: Record<string, unknown>) {
  const result = { ...data };
  for (const field of ['status', 'state', 'result']) {
    if (!policy.fields.includes(field)) continue;
    const values = Array.isArray(policy.enums?.[field]) ? policy.enums[field] : [];
    const requested = String(data[field] || '').toLowerCase();
    const safe = values.find((value: unknown) => SAFE_PUBLIC_STATUS.includes(String(value).toLowerCase()) && String(value).toLowerCase() === requested)
      || values.find((value: unknown) => SAFE_PUBLIC_STATUS.includes(String(value).toLowerCase()))
      || policy.defaults?.[field];
    if (safe !== undefined) result[field] = safe;
    else delete result[field];
  }
  return result;
}

function actorValues(actor: ActorContext) {
  return new Set([actor.actorId, actor.email, actor.email.split('@')[0]].filter(Boolean).map(String));
}

function flattenIdentityValues(value: unknown, result = new Set<string>()) {
  if (value === null || value === undefined) return result;
  if (typeof value === 'string' || typeof value === 'number') result.add(String(value));
  else if (Array.isArray(value)) value.forEach((item) => flattenIdentityValues(item, result));
  else if (typeof value === 'object') {
    for (const key of ['id', 'user_id', 'email', 'platform_email', 'owner_id', 'owner_email', 'partner_id', 'organization_id']) {
      if ((value as any)[key] !== undefined) flattenIdentityValues((value as any)[key], result);
    }
  }
  return result;
}

function recordIdentityValues(record: any) {
  const result = new Set<string>();
  for (const key of [
    'created_by_id', 'created_by', 'user_id', 'user_email', 'owner_id', 'owner_email',
    'platform_email', 'email', 'partner_id', 'organization_id', 'account_id', 'member_id',
    'participant_ids', 'participants', 'members', 'collaborators',
  ]) {
    if (record?.[key] !== undefined) flattenIdentityValues(record[key], result);
  }
  return result;
}

function ownsRecord(actor: ActorContext, record: any) {
  if (actor.globalAdmin) return true;
  const actorSet = actorValues(actor);
  const recordSet = recordIdentityValues(record);
  for (const value of recordSet) if (actorSet.has(value)) return true;
  return false;
}

function partnerScopeMatches(actor: ActorContext, record: any) {
  if (ownsRecord(actor, record)) return true;
  const actorScopes = new Set([
    actor.user?.partner_id, actor.user?.organization_id, actor.nups?.partner_id, actor.nups?.organization_id,
  ].filter(Boolean).map(String));
  return [record?.partner_id, record?.organization_id].some((value) => value && actorScopes.has(String(value)));
}

function stampSelfOwnership(policy: any, data: Record<string, unknown>, actor: ActorContext) {
  const result = { ...data };
  const fields = new Set(policy.fields || []);
  for (const field of ['user_id', 'owner_id', 'created_by_id']) if (fields.has(field)) result[field] = actor.actorId;
  for (const field of ['user_email', 'owner_email', 'platform_email', 'created_by']) if (fields.has(field)) result[field] = actor.email;
  if (fields.has('email') && !result.email) result.email = actor.email;
  if (fields.has('participant_ids')) {
    const participants = Array.isArray(result.participant_ids) ? result.participant_ids.map(String) : [];
    if (!participants.includes(actor.actorId)) participants.push(actor.actorId);
    result.participant_ids = participants;
  }
  if (fields.has('participants') && Array.isArray(result.participants)) {
    const serialized = JSON.stringify(result.participants);
    if (!serialized.includes(actor.actorId) && !serialized.includes(actor.email)) result.participants = [...result.participants, actor.actorId];
  }
  return result;
}

async function audit(base44: any, actor: ActorContext, eventType: string, entity: string, recordId: string, operation: string, intent: string, status: 'success' | 'failure' | 'security_action', metadata: Record<string, unknown>) {
  await base44.asServiceRole.entities.SystemAuditLog.create({
    event_type: eventType,
    description: `${operation} ${entity} ${recordId || ''}`.trim(),
    actor_email: actor.email,
    resource_id: recordId || '',
    status,
    severity: operation === 'delete' || operation === 'archive' ? 'high' : 'medium',
    metadata: scrub({ entity, record_id: recordId, operation, intent, actor_role: actor.role, ...metadata }),
  }).catch(() => null);
}

async function archiveBeforeDelete(base44: any, actor: ActorContext, entity: string, record: any, operation: 'archive' | 'delete', policy: any, intent: string, reason: string) {
  const original = stable(record);
  const snapshot = policy.retention === 'GOVERNANCE_SNAPSHOT' || policy.retention === 'AUDIT_SNAPSHOT' ? scrub(record) : {};
  const scopeId = String(record?.partner_id || record?.organization_id || record?.owner_id || record?.user_id || record?.created_by_id || record?.created_by || '');
  await base44.asServiceRole.entities.GlyphLockWriteArchive.create({
    archive_id: crypto.randomUUID(),
    entity_name: entity,
    source_record_id: String(record.id),
    operation: operation === 'archive' ? 'ARCHIVE' : 'DELETE_TOMBSTONE',
    retention_class: policy.retention || 'CONTENT_TOMBSTONE',
    content_hash: await sha256(original),
    sanitized_snapshot: snapshot,
    actor_id: actor.actorId,
    actor_email: actor.email,
    actor_role: actor.role,
    scope_type: policy.scope,
    scope_id: scopeId,
    intent,
    reason: String(reason || '').slice(0, 500),
    created_at: new Date().toISOString(),
    metadata: { snapshot_retained: Object.keys(snapshot as any).length > 0 },
  });
}

async function requestFingerprint(req: Request) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  const agent = req.headers.get('user-agent') || 'unknown';
  return sha256(`${ip}|${agent}`);
}

async function createPublicGrant(base44: any, req: Request, entity: string, recordId: string, allowedFields: readonly string[], returnToken: boolean) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const now = Date.now();
  const grant = {
    grant_id: crypto.randomUUID(),
    token_hash: await sha256(token),
    entity_name: entity,
    record_id: recordId,
    allowed_fields: [...allowedFields],
    purpose: returnToken ? 'PUBLIC_INTAKE_COMPLETION' : 'PUBLIC_INTAKE_RATE_LIMIT',
    status: 'ACTIVE',
    expires_at: new Date(now + 15 * 60 * 1000).toISOString(),
    created_at: new Date(now).toISOString(),
    request_fingerprint: await requestFingerprint(req),
  };
  await base44.asServiceRole.entities.PublicMutationGrant.create(grant);
  return returnToken ? token : null;
}

async function enforcePublicRateLimit(base44: any, req: Request, entity: string) {
  const fingerprint = await requestFingerprint(req);
  const grants = await base44.asServiceRole.entities.PublicMutationGrant.filter({ entity_name: entity, request_fingerprint: fingerprint, status: 'ACTIVE' }, '-created_at', 10).catch(() => []);
  const active = (grants || []).filter((grant: any) => Date.parse(grant.expires_at || '') > Date.now());
  if (active.length >= 5) throw Object.assign(new Error('Public intake rate limit exceeded.'), { status: 429 });
}

async function verifyPublicCapability(base44: any, entity: string, id: string, token: string, data: Record<string, unknown>, policy: any) {
  if (!token) throw Object.assign(new Error('Public update capability required.'), { status: 403 });
  const grants = await base44.asServiceRole.entities.PublicMutationGrant.filter({ entity_name: entity, record_id: id, status: 'ACTIVE' }, '-created_at', 10).catch(() => []);
  const tokenHash = await sha256(token);
  const grant = (grants || []).find((item: any) => item.token_hash === tokenHash && Date.parse(item.expires_at || '') > Date.now());
  if (!grant) throw Object.assign(new Error('Public update capability invalid or expired.'), { status: 403 });
  const allowed = new Set(grant.allowed_fields || policy.publicUpdateFields || []);
  if (Object.keys(data).some((key) => !allowed.has(key))) throw Object.assign(new Error('Public update contains a privileged or unsupported field.'), { status: 403 });
  await base44.asServiceRole.entities.PublicMutationGrant.update(grant.id, { status: 'CONSUMED', consumed_at: new Date().toISOString() });
}

function authorize(actor: ActorContext, policy: any, operation: string, record: any) {
  switch (policy.scope) {
    case 'PLATFORM_ADMIN': return actor.globalAdmin;
    case 'PUBLIC_CREATE_ADMIN_UPDATE': return operation === 'create' ? true : actor.admin;
    case 'PUBLIC_CAPABILITY': return operation === 'create' ? true : actor.admin;
    case 'SELF_OWNED': return actor.authenticated && (operation === 'create' || ownsRecord(actor, record));
    case 'OWNER_OR_ADMIN': return actor.authenticated && (actor.admin || operation === 'create' || ownsRecord(actor, record));
    case 'ADMIN_OR_OWNER': return actor.authenticated && (actor.admin || operation === 'create' || ownsRecord(actor, record));
    case 'PARTNER_OR_ADMIN': return actor.authenticated && (actor.admin || partnerScopeMatches(actor, record));
    default: return false;
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const actor = await actorContext(base44);
  let body: any = {};
  try {
    body = await req.json();
    const entity = String(body.entity || '') as PolicyName;
    const operation = String(body.operation || '').toLowerCase();
    const id = String(body.id || '').trim();
    const intent = String(body.intent || '').trim().slice(0, 200);
    const reason = String(body.reason || '').trim().slice(0, 500);
    const policy: any = (GLYPHLOCK_WRITE_POLICIES as any)[entity];

    if (!policy) return jsonResponse({ success: false, error: 'Entity is not governed by the app-wide write boundary.' }, 400);
    if (!policy.operations.includes(operation)) return jsonResponse({ success: false, error: 'Operation is not allowed for this governed entity.' }, 400);
    if (!intent) return jsonResponse({ success: false, error: 'Write intent is required.' }, 400);
    if (operation !== 'create' && !id) return jsonResponse({ success: false, error: 'Record id is required.' }, 400);

    const E = base44.asServiceRole.entities;
    const record = operation === 'create' ? null : await E[entity].get(id).catch(() => null);
    if (operation !== 'create' && !record) return jsonResponse({ success: false, error: 'Record not found.' }, 404);

    const publicCreate = Boolean(policy.publicCreate && operation === 'create');
    const publicCapabilityUpdate = Boolean(policy.publicUpdate && operation === 'update' && !actor.admin);
    if (!publicCreate && !actor.authenticated) return jsonResponse({ success: false, error: 'Authentication required.' }, 401);
    if (!authorize(actor, policy, operation, record) && !publicCapabilityUpdate) {
      await audit(base44, actor, 'GLYPHLOCK_WRITE_DENIED', entity, id, operation, intent, 'failure', { reason: 'scope_or_ownership_denied' });
      return jsonResponse({ success: false, error: 'Write scope or ownership denied.' }, 403);
    }

    let data = filterFields(policy, body.data || {}, policy.fields || []);
    if (publicCreate) {
      await enforcePublicRateLimit(base44, req, entity);
      data = filterFields(policy, data, policy.publicCreateFields || []);
      data = normalizePublicStatus(policy, applyDefaults(policy, data));
    } else if (publicCapabilityUpdate) {
      data = filterFields(policy, data, policy.publicUpdateFields || []);
      await verifyPublicCapability(base44, entity, id, String(body.public_mutation_capability || ''), data, policy);
      data = normalizePublicStatus(policy, data);
    } else {
      data = applyDefaults(policy, data);
    }

    if (policy.scope === 'SELF_OWNED' || policy.scope === 'OWNER_OR_ADMIN' || policy.scope === 'ADMIN_OR_OWNER') {
      if (!actor.authenticated) return jsonResponse({ success: false, error: 'Authentication required.' }, 401);
      if (operation === 'create') data = stampSelfOwnership(policy, data, actor);
    }

    if (entity === 'ServiceUsage' && operation === 'create') {
      const requestId = String((data as any).request_id || (data as any).idempotency_key || '').trim();
      if (requestId) {
        const query: any = { request_id: requestId };
        if (policy.fields.includes('user_id')) query.user_id = actor.actorId;
        if (policy.fields.includes('user_email')) query.user_email = actor.email;
        const existing = await E.ServiceUsage.filter(query, '-created_date', 1).catch(() => []);
        if (existing?.[0]) return jsonResponse({ success: true, record: existing[0], idempotent_replay: true });
      }
      for (const key of ['usage', 'units', 'quantity', 'count', 'amount']) {
        if (typeof (data as any)[key] === 'number' && (data as any)[key] < 0) return jsonResponse({ success: false, error: 'Negative usage is not allowed.' }, 400);
      }
    }

    let result: any = null;
    let publicMutationCapability: string | null = null;
    if (operation === 'create') {
      result = await E[entity].create(data);
      if (publicCreate) {
        publicMutationCapability = await createPublicGrant(base44, req, entity, String(result.id), policy.publicUpdateFields || [], Boolean(policy.publicUpdate));
      }
    } else if (operation === 'update') {
      result = await E[entity].update(id, data);
    } else if (operation === 'archive' || operation === 'delete') {
      if (!authorize(actor, policy, operation, record)) return jsonResponse({ success: false, error: 'Archive/delete ownership denied.' }, 403);
      await archiveBeforeDelete(base44, actor, entity, record, operation as 'archive' | 'delete', policy, intent, reason);
      await E[entity].delete(id);
      result = { ...record, archived_by_governance: operation === 'archive' };
    }

    await audit(base44, actor, operation === 'archive' || operation === 'delete' ? 'GLYPHLOCK_RECORD_RETIRED' : 'GLYPHLOCK_RECORD_WRITTEN', entity, String(result?.id || id), operation, intent, operation === 'archive' || operation === 'delete' ? 'security_action' : 'success', {
      scope_type: policy.scope,
      retention: policy.retention || null,
      ...safeMetadata(data),
    });

    return jsonResponse({ success: true, record: result, public_mutation_capability: publicMutationCapability });
  } catch (error: any) {
    const status = Number(error?.status || 500);
    await audit(base44, actor, 'GLYPHLOCK_WRITE_FAILED', String(body.entity || 'unknown'), String(body.id || ''), String(body.operation || 'unknown'), String(body.intent || 'unknown'), 'failure', { error: String(error?.message || 'Write failed').slice(0, 300) });
    return jsonResponse({ success: false, error: error?.message || 'Governed GlyphLock write failed.' }, status);
  }
});
