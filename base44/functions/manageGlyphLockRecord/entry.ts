import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import {
  authorize,
  isAuthenticatedActor,
  isGlobalActor,
  policyFor,
  publicRecentUpdateFields,
  recordOwnerMatches,
  sanitizeForArchive,
  sanitizeValue,
} from './policy.js';

const ENTITY_NAME = /^[A-Za-z][A-Za-z0-9_]{1,80}$/;
const ACTIONS = new Set(['create', 'update', 'delete']);
const PUBLIC_CREATE_ENTITIES = new Set(['Consultation', 'ContactEvent', 'LLMFeedback']);
const PRIVATE_CONTENT_ENTITIES = new Set(['Conversation', 'UserPreferences']);
const VERSIONED_UPDATE_ENTITIES = new Set(['GlyphBotAudit', 'ArchitecturalDecisionRecord', 'PartnerDocument', 'MarketingAsset']);
const RETAINED_DELETE_ENTITIES = new Set(['AgentChangeSet', 'GlyphBotAudit', 'HotspotPayload', 'InteractiveImage', 'QrPreview']);

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

function clientIp(req: Request) {
  return String(req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim().slice(0, 128);
}

async function sha256(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
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

async function resolveActor(base44: any, req: Request) {
  const user = await base44.auth.me().catch(() => null);
  const email = String(user?.email || '').toLowerCase();
  const nups = email ? await resolveNupsUser(base44, email) : null;
  return {
    email,
    userId: String(user?.id || ''),
    platformRole: String(user?.role || ''),
    nupsRole: String(nups?.role || ''),
    venueId: String(nups?.venue_id || ''),
    partnerId: String(nups?.partner_id || user?.partner_id || ''),
    organizationId: String(nups?.organization_id || user?.organization_id || ''),
    authenticated: Boolean(email && user?.id),
    ipHash: await sha256(`${clientIp(req)}|${req.headers.get('user-agent') || ''}|glyphlock`),
  };
}

function scopeId(policy: any, actor: any, record: any, data: any) {
  if (policy?.scope === 'GOVERNANCE') return 'GLYPHLOCK_GLOBAL';
  if (policy?.scope === 'USER_PRIVATE') return String(actor.email || actor.ipHash || 'anonymous');
  if (policy?.scope === 'PARTNER') return String(record?.partner_id || data?.partner_id || actor.partnerId || actor.organizationId || 'UNRESOLVED');
  if (policy?.scope === 'CONTENT_OWNER') return String(record?.created_by || record?.owner_email || actor.email || 'UNRESOLVED');
  return String(data?.submission_id || actor.ipHash || 'PUBLIC');
}

async function createArchive(base44: any, { entity, record, kind, reason, actor, policy, metadata = {} }: any) {
  const sanitized = sanitizeForArchive(record, kind);
  const archive = await base44.asServiceRole.entities.GovernedRecordArchive.create({
    archive_id: crypto.randomUUID(),
    entity_name: entity,
    record_id: String(record?.id || record?.record_id || ''),
    archive_kind: kind,
    reason: String(reason || 'governed_retention').slice(0, 300),
    actor_email: actor.email || 'anonymous',
    actor_role: String(actor.nupsRole || actor.platformRole || 'PUBLIC'),
    scope_type: policy?.scope || 'UNKNOWN',
    scope_id: scopeId(policy, actor, record, record),
    record_hash: await sha256(record || {}),
    snapshot: sanitized,
    archived_at: new Date().toISOString(),
    source_mode: String(record?.mode || ''),
    metadata: sanitizeForArchive(metadata, 'SAFE_TOMBSTONE'),
  });
  return archive;
}

async function audit(base44: any, { entity, action, actor, recordId, policy, decision, intent, result, metadata = {} }: any) {
  const eventType = result === 'DENIED'
    ? 'GLYPHLOCK_GOVERNED_WRITE_DENIED'
    : action === 'delete'
      ? 'GLYPHLOCK_GOVERNED_DELETE'
      : 'GLYPHLOCK_GOVERNED_WRITE';
  await base44.asServiceRole.entities.SystemAuditLog.create({
    event_type: eventType,
    description: `${entity} ${action} ${result.toLowerCase()} through app-wide governed persistence`,
    actor_email: actor.email || 'anonymous',
    resource_id: String(recordId || ''),
    status: result === 'DENIED' ? 'security_action' : 'success',
    severity: result === 'DENIED' || action === 'delete' ? 'medium' : 'low',
    metadata: {
      entity_name: entity,
      operation: action,
      record_id: String(recordId || ''),
      scope_type: policy?.scope || 'UNKNOWN',
      decision_reason: decision?.reason || '',
      intent: String(intent || '').slice(0, 160),
      result,
      actor_role: String(actor.nupsRole || actor.platformRole || 'PUBLIC'),
      ...sanitizeForArchive(metadata, 'SAFE_TOMBSTONE'),
    },
  }).catch(() => null);
}

function rejectPrivilegedPublicData(data: any) {
  const serializedKeys = Object.keys(data || {});
  return serializedKeys.some((key) => /(role|permission|assign|approve|review|resolve|internal|admin|owner|actor|created_by|updated_by|venue_id|mode|is_demo|secret|token|password|otp|pin|file_uri|signed_url)/i.test(key));
}

async function enforcePublicRateLimit(base44: any, entity: string, data: any, actor: any) {
  const E = base44.asServiceRole.entities;
  const email = String(data?.email || data?.contact_email || data?.submitter_email || '').toLowerCase();
  if (!email) return;
  const candidates = await E[entity].filter({ email }, '-created_date', 10).catch(() => []);
  const cutoff = Date.now() - 10 * 60 * 1000;
  const recent = (candidates || []).filter((row: any) => Date.parse(row.created_date || row.created_at || 0) >= cutoff);
  if (recent.length >= 5) throw Object.assign(new Error('Public intake rate limit exceeded'), { status: 429 });
  if (actor.ipHash && recent.some((row: any) => row.ip_hash === actor.ipHash)) {
    const latest = Math.max(...recent.map((row: any) => Date.parse(row.created_date || row.created_at || 0)));
    if (Date.now() - latest < 10_000) throw Object.assign(new Error('Duplicate public intake suppressed'), { status: 429 });
  }
}

function safePublicCreateData(entity: string, data: any, actor: any) {
  if (rejectPrivilegedPublicData(data)) {
    throw Object.assign(new Error('Public submissions cannot assign privileged fields'), { status: 400 });
  }
  const clean: any = sanitizeValue(data, { publicMode: true });
  if (entity === 'LLMFeedback') {
    const rating = Number(clean.rating ?? clean.score ?? clean.value);
    if (Number.isFinite(rating) && (rating < -1 || rating > 5)) {
      throw Object.assign(new Error('Feedback rating is out of range'), { status: 400 });
    }
  }
  if ('ip_hash' in clean || entity === 'Consultation' || entity === 'ContactEvent') clean.ip_hash = actor.ipHash;
  if (actor.email && !clean.user_email) clean.user_email = actor.email;
  return clean;
}

function safeAuthenticatedData(entity: string, action: string, data: any, actor: any) {
  const clean: any = sanitizeValue(data, { updateMode: action === 'update' });
  if (entity === 'UserPreferences') {
    clean.user_id = actor.userId;
    clean.user_email = actor.email;
  }
  if (entity === 'Conversation' && action === 'create') {
    const participants = Array.isArray(clean.participants) ? clean.participants : [];
    const normalized = participants.map((value: any) => String(value).toLowerCase());
    if (!normalized.includes(actor.email) && !normalized.includes(actor.userId.toLowerCase())) participants.push(actor.email);
    clean.participants = participants;
  }
  if (entity === 'ServiceUsage') {
    clean.user_id = actor.userId || actor.ipHash;
    clean.user_email = actor.email || '';
    for (const [key, value] of Object.entries(clean)) {
      if (/(count|units|usage|amount|quantity)/i.test(key) && typeof value === 'number') {
        if (!Number.isFinite(value) || value < 0 || value > 10000) {
          throw Object.assign(new Error(`Invalid usage meter value for ${key}`), { status: 400 });
        }
      }
    }
  }
  return clean;
}

async function maybeIdempotentExisting(E: any, entity: string, data: any) {
  const idempotencyKey = String(data?.idempotency_key || data?.request_id || data?.usage_key || '').trim();
  if (!idempotencyKey) return null;
  for (const key of ['idempotency_key', 'request_id', 'usage_key']) {
    if (!data?.[key]) continue;
    const rows = await E[entity].filter({ [key]: data[key] }, null, 1).catch(() => []);
    if (rows?.[0]) return rows[0];
  }
  return null;
}

async function maybeFeatureRegistryUpsert(E: any, data: any) {
  for (const key of ['feature_key', 'feature_id', 'key', 'name']) {
    if (!data?.[key]) continue;
    const rows = await E.FeatureRegistry.filter({ [key]: data[key] }, null, 1).catch(() => []);
    if (rows?.[0]) return rows[0];
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const base44 = createClientFromRequest(req);
  let actor: any = { email: '', userId: '', platformRole: '', nupsRole: '', authenticated: false, ipHash: '' };
  let entity = '';
  let action = '';
  let policy: any = null;
  let record: any = null;
  let body: any = {};
  try {
    body = await req.json().catch(() => ({}));
    entity = String(body.entity || '').trim();
    action = String(body.action || '').trim().toLowerCase();
    const recordId = String(body.record_id || body.id || '').trim();
    const intent = String(body.intent || `${entity}_${action}`).slice(0, 160);
    if (!ENTITY_NAME.test(entity) || !ACTIONS.has(action)) return json(400, { error: 'Valid entity and action are required' });
    policy = policyFor(entity);
    if (!policy) return json(400, { error: 'Entity is not governed by the app-wide write service' });
    actor = await resolveActor(base44, req);
    const E = base44.asServiceRole.entities;
    if (action !== 'create') {
      if (!recordId) return json(400, { error: 'record_id is required' });
      record = await E[entity].get(recordId).catch(() => null);
      if (!record) return json(404, { error: 'Record not found' });
    }
    const decision = authorize({ policy, action, actor, record, data: body.data || {} });
    if (!decision.allowed) {
      await audit(base44, { entity, action, actor, recordId, policy, decision, intent, result: 'DENIED' });
      return json(actor.authenticated ? 403 : 401, { error: 'Governed write denied', reason: decision.reason });
    }

    if (action === 'create') {
      let clean: any;
      if (PUBLIC_CREATE_ENTITIES.has(entity) && !actor.authenticated) {
        await enforcePublicRateLimit(base44, entity, body.data || {}, actor);
        clean = safePublicCreateData(entity, body.data || {}, actor);
      } else {
        if (!actor.authenticated && entity !== 'ServiceUsage') return json(401, { error: 'Authentication required' });
        clean = safeAuthenticatedData(entity, action, body.data || {}, actor);
      }
      if (policy.idempotentCreate) {
        const existing = entity === 'FeatureRegistry'
          ? await maybeFeatureRegistryUpsert(E, clean)
          : await maybeIdempotentExisting(E, entity, clean);
        if (existing) {
          if (entity === 'FeatureRegistry') {
            const updated = await E.FeatureRegistry.update(existing.id, clean);
            await audit(base44, { entity, action: 'update', actor, recordId: existing.id, policy, decision: { reason: 'idempotent_upsert' }, intent, result: 'SUCCESS' });
            return json(200, { success: true, record: updated, action: 'update', idempotent: true });
          }
          return json(200, { success: true, record: existing, action: 'create', idempotent: true });
        }
      }
      const created = await E[entity].create(clean);
      await audit(base44, { entity, action, actor, recordId: created?.id, policy, decision, intent, result: 'SUCCESS' });
      return json(200, { success: true, record: created, action });
    }

    if (action === 'update') {
      let clean: any;
      if (policy.update === 'PUBLIC_RECENT_UPDATE' && !actor.authenticated) {
        const createdAt = Date.parse(record.created_date || record.created_at || 0);
        if (!createdAt || Date.now() - createdAt > 30 * 60 * 1000) {
          await audit(base44, { entity, action, actor, recordId, policy, decision: { reason: 'public_update_window_expired' }, intent, result: 'DENIED' });
          return json(403, { error: 'Public update window expired' });
        }
        clean = publicRecentUpdateFields(body.data || {});
        if (!Object.keys(clean).length) return json(400, { error: 'No permitted public update fields supplied' });
      } else {
        clean = safeAuthenticatedData(entity, action, body.data || {}, actor);
      }
      if (VERSIONED_UPDATE_ENTITIES.has(entity)) {
        await createArchive(base44, { entity, record, kind: 'PRE_UPDATE_VERSION', reason: intent, actor, policy, metadata: { operation: 'update' } });
      }
      const updated = await E[entity].update(recordId, clean);
      await audit(base44, { entity, action, actor, recordId, policy, decision, intent, result: 'SUCCESS', metadata: { changed_fields: Object.keys(clean).sort() } });
      return json(200, { success: true, record: updated, action });
    }

    if (action === 'delete') {
      if (entity === 'AgentChangeSet') {
        const status = String(record.status || '').toLowerCase();
        const deployed = record.deployed_at || record.applied_at || record.commit_sha || record.source_commit_sha;
        if (deployed || (status && !policy.safeDeleteStatuses.includes(status))) {
          await audit(base44, { entity, action, actor, recordId, policy, decision: { reason: 'retained_deployment_evidence' }, intent, result: 'DENIED' });
          return json(409, { error: 'Applied or deployment-linked change sets must be retained' });
        }
      }
      if (RETAINED_DELETE_ENTITIES.has(entity)) {
        await createArchive(base44, { entity, record, kind: policy.retention || 'SAFE_TOMBSTONE', reason: intent, actor, policy, metadata: { operation: 'delete' } });
      }
      await E[entity].delete(recordId);
      await audit(base44, { entity, action, actor, recordId, policy, decision, intent, result: 'SUCCESS', metadata: { retention: policy.retention || 'NONE' } });
      return json(200, { success: true, record: { id: recordId }, deleted: true, retained: Boolean(policy.retention), action });
    }

    return json(400, { error: 'Unsupported action' });
  } catch (error: any) {
    const status = Number(error?.status || 500);
    await audit(base44, {
      entity: entity || 'UNKNOWN',
      action: action || 'UNKNOWN',
      actor,
      recordId: String(body?.record_id || body?.id || ''),
      policy,
      decision: { reason: 'exception' },
      intent: String(body?.intent || ''),
      result: 'DENIED',
      metadata: { error_type: error?.name || 'Error' },
    }).catch(() => null);
    return json(status >= 400 && status < 600 ? status : 500, { error: error?.message || 'Governed write failed' });
  }
});
