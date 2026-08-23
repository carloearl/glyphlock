import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

type AnyRecord = Record<string, any>;

class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const PUBLIC_ACTIONS = new Set([
  'consultation_submit',
  'contact_submit',
  'service_usage_check',
  'llm_feedback_submit',
  'qr_record_generation',
]);
const ADMIN_ROLES = new Set(['admin', 'PLATFORM_ADMIN', 'SOVEREIGN']);
const ADR_STATUSES = new Set(['Proposed', 'Approved', 'Superseded', 'Deprecated', 'Rejected']);
const ADR_CATEGORIES = new Set([
  'Financial Calculation', 'Business Rule', 'Database Schema', 'Entity / Relationship',
  'Workflow', 'Approval Chain', 'RBAC', 'API Contract', 'Audit Behavior',
  'Compliance Logic', 'Reporting', 'Security Control', 'AI Decision Boundary',
  'Integration Architecture', 'Governance',
]);
const CONSULTATION_STATUSES = new Set(['submitted', 'under_review', 'qualified', 'not_qualified', 'engagement_started']);
const QR_TYPES = new Set(['url', 'text', 'email', 'phone', 'sms', 'wifi', 'vcard', 'location', 'event']);
const SERVICE_NAMES = new Set(['QRGenerator', 'Steganography', 'Blockchain', 'HotzoneMapper', 'HSSS', 'GlyphBot']);
const AUDIT_SAFE_METADATA_KEYS = new Set([
  'count', 'created', 'updated', 'archived', 'deleted_cache', 'status', 'classification',
  'record_count', 'partner_id', 'asset_id', 'document_id', 'service_name', 'usage_count',
  'vaulted', 'source', 'scope', 'superseded_record', 'registry_seeded', 'registry_updated',
  'registry_crawled', 'delivery_status', 'rating', 'target_type', 'hotspot_count',
]);

const text = (value: unknown, max = 1000) => String(value ?? '').trim().slice(0, max);
const bool = (value: unknown) => value === true;
const numberIn = (value: unknown, min: number, max: number, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

async function sha256(value: unknown) {
  const source = typeof value === 'string' ? value : JSON.stringify(stable(value ?? null));
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeMetadata(input: AnyRecord = {}) {
  const output: AnyRecord = {};
  for (const [key, value] of Object.entries(input)) {
    if (!AUDIT_SAFE_METADATA_KEYS.has(key)) continue;
    if (typeof value === 'string') output[key] = value.slice(0, 200);
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) output[key] = value;
  }
  return output;
}

async function resolveNupsUser(base44: any, email: string) {
  if (!email) return null;
  const E = base44.asServiceRole.entities;
  const byEmail = await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = email.split('@')[0].toLowerCase();
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

function actorRole(user: any, nups: any) {
  return nups?.role || user?.role || 'anonymous';
}

function isAdmin(user: any, nups: any) {
  return ADMIN_ROLES.has(String(user?.role || '')) || ADMIN_ROLES.has(String(nups?.role || ''));
}

function requireUser(user: any) {
  if (!user?.email || !user?.id) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required.');
}

function requireAdmin(user: any, nups: any) {
  requireUser(user);
  if (!isAdmin(user, nups)) throw new HttpError(403, 'ADMIN_REQUIRED', 'Administrative authorization required.');
}

async function recordAudit(base44: any, details: AnyRecord) {
  const now = new Date().toISOString();
  const entry = {
    event_id: crypto.randomUUID(),
    action: text(details.action, 120),
    entity_name: text(details.entity_name, 100),
    record_id: text(details.record_id, 160),
    operation: details.operation,
    actor_email: text(details.actor_email || 'anonymous', 200),
    actor_role: text(details.actor_role || 'anonymous', 80),
    scope_type: details.scope_type,
    owner_ref: text(details.owner_ref, 200),
    intent: text(details.intent, 300),
    fields_changed: Array.isArray(details.fields_changed) ? details.fields_changed.map((v: any) => text(v, 80)).slice(0, 100) : [],
    before_hash: details.before === undefined ? '' : await sha256(details.before),
    after_hash: details.after === undefined ? '' : await sha256(details.after),
    result: details.result,
    reason: text(details.reason, 300),
    severity: details.severity || 'low',
    created_at: now,
    metadata: safeMetadata(details.metadata),
  };
  try {
    await base44.asServiceRole.entities.GlyphLockWriteAudit.create(entry);
  } catch (error) {
    try {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'GLYPHLOCK_WRITE_AUDIT_FALLBACK',
        description: `${entry.action} ${entry.entity_name} ${entry.result}`,
        actor_email: entry.actor_email,
        resource_id: entry.record_id,
        status: entry.result === 'allowed' ? 'success' : 'failure',
        severity: entry.severity,
        metadata: {
          event_id: entry.event_id,
          action: entry.action,
          entity_name: entry.entity_name,
          operation: entry.operation,
          scope_type: entry.scope_type,
          reason: entry.reason,
        },
      });
    } catch { /* final fallback cannot change the business result */ }
    console.error('[glyphlockWriteGateway] audit persistence failed:', error?.message || error);
  }
}

async function getRecord(E: any, entity: string, id: string) {
  if (!id) throw new HttpError(400, 'ID_REQUIRED', 'Record id is required.');
  const record = await E[entity].get(id).catch(() => null);
  if (!record) throw new HttpError(404, 'NOT_FOUND', `${entity} record not found.`);
  return record;
}

function owns(record: AnyRecord, user: any) {
  const candidates = [record.created_by, record.created_by_id, record.user_id, record.ownerEmail, record.owner_id, record.creator_id, record.actor_email];
  return candidates.some((candidate) => candidate && (String(candidate).toLowerCase() === String(user?.email || '').toLowerCase() || String(candidate) === String(user?.id || '')));
}

function cleanMessages(messages: any) {
  if (!Array.isArray(messages)) throw new HttpError(400, 'MESSAGES_REQUIRED', 'Conversation messages must be an array.');
  if (messages.length > 200) throw new HttpError(400, 'TOO_MANY_MESSAGES', 'Conversation exceeds the 200-message save limit.');
  return messages.map((message: any) => {
    const role = message?.role === 'assistant' ? 'assistant' : 'user';
    const body = text(message?.text, 8000);
    if (!body) throw new HttpError(400, 'EMPTY_MESSAGE', 'Conversation contains an empty message.');
    const timestamp = /^\d{4}-\d{2}-\d{2}T/.test(String(message?.timestamp || '')) ? String(message.timestamp) : new Date().toISOString();
    return { role, text: body, timestamp };
  });
}

async function resolvePartner(E: any, user: any) {
  requireUser(user);
  const rows = await E.Partner.filter({ email: String(user.email).toLowerCase() }, null, 5).catch(() => []);
  const partner = rows.find((row: any) => row.status === 'active') || null;
  return partner;
}

async function publicActor(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  const digest = await sha256(`${forwarded}|${ua}`);
  return `anonymous:${digest.slice(0, 24)}`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const E = base44.asServiceRole.entities;
  let user: any = null;
  try { user = await base44.auth.me(); } catch { user = null; }
  let body: AnyRecord = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = text(body.action, 100);
  let nups: any = null;
  if (user?.email) nups = await resolveNupsUser(base44, String(user.email).toLowerCase());
  const role = actorRole(user, nups);
  const anonymousRef = await publicActor(req);
  const actorEmail = user?.email || anonymousRef;

  if (!action) return Response.json({ ok: false, code: 'ACTION_REQUIRED', error: 'Action is required.' }, { status: 400 });
  if (!user && !PUBLIC_ACTIONS.has(action)) return Response.json({ ok: false, code: 'AUTH_REQUIRED', error: 'Authentication required.' }, { status: 401 });

  try {
    let value: any = null;
    let audit: AnyRecord = {
      action,
      entity_name: 'Unknown',
      operation: 'update',
      actor_email: actorEmail,
      actor_role: role,
      scope_type: 'GLOBAL_SYSTEM',
      intent: text(body.intent || action, 300),
      result: 'allowed',
    };

    if (action === 'archive_agent_change_set') {
      requireAdmin(user, nups);
      const before = await getRecord(E, 'AgentChangeSet', text(body.id, 160));
      const after = await E.AgentChangeSet.update(before.id, {
        archived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: user.email,
        archiveReason: text(body.reason || 'Removed from active Deploy Center', 300),
      });
      value = after;
      audit = { ...audit, entity_name: 'AgentChangeSet', record_id: before.id, operation: 'archive', scope_type: 'GOVERNANCE', before, after, fields_changed: ['archived', 'archivedAt', 'archivedBy', 'archiveReason'], severity: before.status === 'applied' ? 'high' : 'medium' };
    } else if (action === 'glyphbot_audit_create') {
      requireUser(user);
      const input = body.audit || {};
      const targetType = ['business', 'person', 'agency'].includes(input.targetType) ? input.targetType : 'business';
      const targetIdentifier = text(input.targetIdentifier, 500);
      if (!targetIdentifier) throw new HttpError(400, 'TARGET_REQUIRED', 'Audit target is required.');
      const after = await E.GlyphBotAudit.create({
        user_id: user.email,
        targetType,
        targetIdentifier,
        auditMode: ['SURFACE', 'CONCISE', 'MEDIUM', 'DEEP', 'ENTERPRISE_A', 'ENTERPRISE_B'].includes(input.auditMode) ? input.auditMode : 'SURFACE',
        rawInput: text(input.rawInput || targetIdentifier, 2000),
        notes: text(input.notes, 2000),
        status: 'PENDING',
        findings: '{}',
        summary: '',
        riskScore: 0,
        overallGrade: '',
        isArchived: false,
      });
      value = after;
      audit = { ...audit, entity_name: 'GlyphBotAudit', record_id: after.id, operation: 'create', scope_type: 'USER_PRIVATE', owner_ref: user.email, after, fields_changed: Object.keys(after), metadata: { target_type: targetType } };
    } else if (action === 'glyphbot_audit_update') {
      requireUser(user);
      const before = await getRecord(E, 'GlyphBotAudit', text(body.id, 160));
      if (!owns(before, user) && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Audit ownership required.');
      const input = body.updates || {};
      const update: AnyRecord = {};
      if (input.status !== undefined) {
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETE', 'FAILED'].includes(input.status)) throw new HttpError(400, 'INVALID_STATUS', 'Invalid audit status.');
        update.status = input.status;
      }
      if (input.findings !== undefined) update.findings = text(typeof input.findings === 'string' ? input.findings : JSON.stringify(input.findings), 100000);
      if (input.summary !== undefined) update.summary = text(input.summary, 10000);
      if (input.riskScore !== undefined) update.riskScore = numberIn(input.riskScore, 0, 100);
      if (input.overallGrade !== undefined) update.overallGrade = text(input.overallGrade, 10);
      if (input.notes !== undefined) update.notes = text(input.notes, 5000);
      if (!Object.keys(update).length) throw new HttpError(400, 'NO_FIELDS', 'No allowed audit fields supplied.');
      const after = await E.GlyphBotAudit.update(before.id, update);
      value = after;
      audit = { ...audit, entity_name: 'GlyphBotAudit', record_id: before.id, operation: 'update', scope_type: 'USER_PRIVATE', owner_ref: before.user_id, before, after, fields_changed: Object.keys(update) };
    } else if (action === 'glyphbot_audit_archive' || action === 'glyphbot_audit_unarchive') {
      requireUser(user);
      const before = await getRecord(E, 'GlyphBotAudit', text(body.id, 160));
      if (!owns(before, user) && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Audit ownership required.');
      const archived = action === 'glyphbot_audit_archive';
      const update = archived ? {
        isArchived: true,
        archived_at: new Date().toISOString(),
        archived_by: user.email,
        archive_reason: text(body.reason || 'Archived by owner', 300),
      } : { isArchived: false, archived_at: null, archived_by: '', archive_reason: '' };
      const after = await E.GlyphBotAudit.update(before.id, update);
      value = after;
      audit = { ...audit, entity_name: 'GlyphBotAudit', record_id: before.id, operation: 'archive', scope_type: 'USER_PRIVATE', owner_ref: before.user_id, before, after, fields_changed: Object.keys(update), metadata: { archived } };
    } else if (action === 'reconcile_feature_registry') {
      requireAdmin(user, nups);
      const seedRows = Array.isArray(body.seed_rows) ? body.seed_rows.slice(0, 300) : [];
      const liveRoutes = Array.isArray(body.live_routes) ? body.live_routes.map((route: any) => text(route, 300)).filter(Boolean).slice(0, 1000) : [];
      if (!seedRows.length) throw new HttpError(400, 'SEED_REQUIRED', 'Feature registry seed is required.');
      const groups = new Set(['Operations', 'Currency', 'Accounting', 'Staff', 'Admin', 'System']);
      const statuses = new Set(['ACTIVE', 'DEPRECATED', 'ROADMAP']);
      const ids = new Set<string>();
      const routes = new Set<string>();
      const cleanRows = seedRows.map((row: any) => {
        const feature_id = text(row.feature_id, 120);
        const route = text(row.route, 300).toLowerCase().replace(/\/+$/, '') || '/';
        if (!feature_id || !route || ids.has(feature_id) || routes.has(route)) throw new HttpError(409, 'REGISTRY_DUPLICATE', 'Feature registry seed contains a duplicate id or route.');
        ids.add(feature_id); routes.add(route);
        if (!groups.has(row.group)) throw new HttpError(400, 'INVALID_GROUP', `Invalid feature group for ${feature_id}.`);
        return {
          feature_id,
          label: text(row.label, 160),
          route,
          icon: text(row.icon, 80),
          group: row.group,
          order: numberIn(row.order, 0, 10000),
          roles: Array.isArray(row.roles) ? row.roles.map((v: any) => text(v, 80)).slice(0, 50) : [],
          modes: Array.isArray(row.modes) ? row.modes.filter((v: any) => ['REAL', 'DEMO', 'SANDBOX'].includes(v)) : ['REAL', 'DEMO', 'SANDBOX'],
          help_anchor: text(row.help_anchor || `help-${feature_id}`, 160),
          keywords: Array.isArray(row.keywords) ? row.keywords.map((v: any) => text(v, 100)).slice(0, 100) : [],
          status: statuses.has(row.status) ? row.status : 'ACTIVE',
          discovered_by_crawl: bool(row.discovered_by_crawl),
          notes: text(row.notes, 1000),
        };
      });
      const existing = await E.FeatureRegistry.list('order', 1000);
      const byId = new Map(existing.map((row: any) => [row.feature_id, row]));
      const byRoute = new Map(existing.map((row: any) => [String(row.route || '').toLowerCase().replace(/\/+$/, '') || '/', row]));
      let created = 0; let updated = 0; let crawled = 0;
      for (const row of cleanRows) {
        const current: any = byId.get(row.feature_id);
        const routeOwner: any = byRoute.get(row.route);
        if (routeOwner && routeOwner.feature_id !== row.feature_id) throw new HttpError(409, 'ROUTE_OWNED', `${row.route} is already owned by another feature.`);
        if (!current) { await E.FeatureRegistry.create(row); created += 1; }
        else {
          const update = { ...row, ...(current.status === 'DEPRECATED' ? { status: 'DEPRECATED' } : {}) };
          if (await sha256(current) !== await sha256({ ...current, ...update })) { await E.FeatureRegistry.update(current.id, update); updated += 1; }
        }
      }
      const refreshed = await E.FeatureRegistry.list('order', 1000);
      const ownerRoutes = new Set(refreshed.map((row: any) => String(row.route || '').toLowerCase().replace(/\/+$/, '') || '/'));
      for (const rawRoute of liveRoutes) {
        const route = rawRoute.toLowerCase().replace(/\/+$/, '') || '/';
        if (ownerRoutes.has(route)) continue;
        const feature_id = `crawl_${route.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || crypto.randomUUID()}`;
        await E.FeatureRegistry.create({ feature_id, label: route.replace(/^\//, '') || 'Root', route, group: 'System', order: 999, roles: ['Manager'], modes: ['REAL', 'DEMO', 'SANDBOX'], status: 'ROADMAP', discovered_by_crawl: true, help_anchor: `help-${feature_id}`, keywords: [], notes: 'Auto-registered by governed reconciliation crawl.' });
        ownerRoutes.add(route); crawled += 1;
      }
      value = { seeded: created, updated, addedFromCrawl: crawled, duplicates: [] };
      audit = { ...audit, entity_name: 'FeatureRegistry', record_id: 'canonical-registry', operation: 'reconcile', scope_type: 'GOVERNANCE', fields_changed: ['seed_rows', 'live_routes'], metadata: { registry_seeded: created, registry_updated: updated, registry_crawled: crawled }, after: value, severity: 'high' };
    } else if (action === 'adr_save') {
      requireAdmin(user, nups);
      const input = body.record || {};
      const adrNumber = text(input.adr_number, 40);
      if (!/^ADR-\d{3,}$/.test(adrNumber)) throw new HttpError(400, 'INVALID_ADR_NUMBER', 'ADR number must use ADR-### format.');
      if (!ADR_STATUSES.has(input.status) || !ADR_CATEGORIES.has(input.category)) throw new HttpError(400, 'INVALID_ADR', 'Invalid ADR status or category.');
      const clean: AnyRecord = {
        adr_number: adrNumber,
        title: text(input.title, 300),
        status: input.status,
        category: input.category,
        decision: text(input.decision, 50000),
        context: text(input.context, 50000),
        alternatives_considered: text(input.alternatives_considered, 50000),
        rationale: text(input.rationale, 50000),
        consequences: text(input.consequences, 50000),
        approval_authority: text(input.approval_authority || 'DACO', 200),
        approval_date: text(input.approval_date, 20),
        directive_references: Array.isArray(input.directive_references) ? input.directive_references.map((v: any) => text(v, 300)).slice(0, 100) : [],
        supersedes: text(input.supersedes, 40),
        supersession_notes: text(input.supersession_notes, 10000),
        tags: Array.isArray(input.tags) ? input.tags.map((v: any) => text(v, 100)).slice(0, 100) : [],
        notes: text(input.notes, 10000),
      };
      if (!clean.title || !clean.decision) throw new HttpError(400, 'ADR_FIELDS_REQUIRED', 'ADR title and decision are required.');
      let before: any = null; let after: any;
      if (body.id) {
        before = await getRecord(E, 'ArchitecturalDecisionRecord', text(body.id, 160));
        if (before.adr_number !== adrNumber) throw new HttpError(409, 'ADR_NUMBER_IMMUTABLE', 'ADR number cannot be changed.');
        const material = ['title', 'category', 'decision', 'context', 'alternatives_considered', 'rationale', 'consequences'];
        if (before.status !== 'Proposed' && material.some((field) => JSON.stringify(before[field] ?? '') !== JSON.stringify(clean[field] ?? ''))) {
          throw new HttpError(409, 'APPROVED_ADR_IMMUTABLE', 'Approved or historical ADR text is immutable. Create a superseding ADR instead.');
        }
        after = await E.ArchitecturalDecisionRecord.update(before.id, clean);
      } else {
        const duplicate = await E.ArchitecturalDecisionRecord.filter({ adr_number: adrNumber }, null, 1).catch(() => []);
        if (duplicate.length) throw new HttpError(409, 'ADR_EXISTS', 'ADR number already exists.');
        after = await E.ArchitecturalDecisionRecord.create(clean);
      }
      let supersededRecord = '';
      if (clean.supersedes) {
        const rows = await E.ArchitecturalDecisionRecord.filter({ adr_number: clean.supersedes }, null, 5).catch(() => []);
        const previous = rows[0];
        if (!previous) throw new HttpError(409, 'SUPERSEDED_ADR_MISSING', 'Superseded ADR was not found.');
        if (previous.id === after.id) throw new HttpError(409, 'SELF_SUPERSESSION', 'An ADR cannot supersede itself.');
        await E.ArchitecturalDecisionRecord.update(previous.id, { status: 'Superseded', superseded_by: adrNumber, supersession_notes: clean.supersession_notes });
        supersededRecord = previous.id;
      }
      value = after;
      audit = { ...audit, entity_name: 'ArchitecturalDecisionRecord', record_id: after.id, operation: before ? 'update' : 'create', scope_type: 'GOVERNANCE', before, after, fields_changed: Object.keys(clean), metadata: { superseded_record: supersededRecord }, severity: 'high' };
    } else if (action === 'consultation_submit') {
      const input = body.consultation || {};
      const contactEmail = text(input.contact_email, 254).toLowerCase();
      if (!emailOk(contactEmail)) throw new HttpError(400, 'INVALID_EMAIL', 'A valid contact email is required.');
      const recent = await E.Consultation.filter({ contact_email: contactEmail, created_date: { $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() } }, '-created_date', 5).catch(() => []);
      if (recent.length >= 3) throw new HttpError(429, 'RATE_LIMITED', 'Too many recent consultation requests.');
      const record = {
        consultation_id: crypto.randomUUID(),
        organization_name: text(input.organization_name, 200),
        contact_name: text(input.contact_name, 200),
        contact_email: contactEmail,
        contact_phone: text(input.contact_phone, 40),
        organization_size: ['1-10', '11-50', '51-200', '201-1000', '1000+'].includes(input.organization_size) ? input.organization_size : undefined,
        industry: text(input.industry, 200),
        verification_interest: ['founding_cohort', 'standard_verification', 'not_sure'].includes(input.verification_interest) ? input.verification_interest : 'not_sure',
        current_governance_maturity: ['none', 'basic', 'intermediate', 'advanced', 'enterprise'].includes(input.current_governance_maturity) ? input.current_governance_maturity : 'none',
        primary_concern: text(input.primary_concern, 5000),
        documentation_ready: bool(input.documentation_ready),
        budget_range: ['under_5k', '5k_10k', '10k_25k', '25k_plus', 'not_disclosed'].includes(input.budget_range) ? input.budget_range : 'not_disclosed',
        timeline: ['immediate', '1_month', '3_months', '6_months', 'exploratory'].includes(input.timeline) ? input.timeline : 'exploratory',
        status: 'submitted',
        payment_status: 'unpaid',
      };
      if (!record.organization_name || !record.contact_name || !record.primary_concern) throw new HttpError(400, 'FIELDS_REQUIRED', 'Organization, contact name, and primary concern are required.');
      const after = await E.Consultation.create(record);
      value = after;
      audit = { ...audit, entity_name: 'Consultation', record_id: after.id, operation: 'create', scope_type: 'PUBLIC_INTAKE', owner_ref: contactEmail, after: { ...record, primary_concern: '[HASHED]' }, fields_changed: Object.keys(record), metadata: { source: 'verification_intake' }, severity: 'medium' };
    } else if (action === 'consultation_status') {
      requireAdmin(user, nups);
      const before = await getRecord(E, 'Consultation', text(body.id, 160));
      const status = text(body.status, 40);
      if (!CONSULTATION_STATUSES.has(status)) throw new HttpError(400, 'INVALID_STATUS', 'Invalid consultation status.');
      const after = await E.Consultation.update(before.id, { status });
      value = after;
      audit = { ...audit, entity_name: 'Consultation', record_id: before.id, operation: 'update', scope_type: 'PLATFORM_ADMIN', owner_ref: before.contact_email, before: { status: before.status }, after: { status }, fields_changed: ['status'], metadata: { status }, severity: 'medium' };
    } else if (action === 'contact_submit') {
      const input = body.contact || {};
      const contactEmail = text(input.email, 254).toLowerCase();
      const contactName = text(input.name, 100);
      const subject = text(input.subject, 200);
      const message = text(input.message, 2000);
      if (!emailOk(contactEmail) || contactName.length < 2 || subject.length < 2 || message.length < 10) throw new HttpError(400, 'INVALID_CONTACT', 'Contact form validation failed.');
      const recent = await E.ContactEvent.filter({ contact_email: contactEmail, created_date: { $gte: new Date(Date.now() - 30 * 60 * 1000).toISOString() } }, '-created_date', 5).catch(() => []);
      if (recent.length >= 3) throw new HttpError(429, 'RATE_LIMITED', 'Too many recent contact requests.');
      const contact = await E.ContactEvent.create({ contact_email: contactEmail, contact_name: contactName, subject, message, status: 'pending', ip_address: anonymousRef });
      let deliveryStatus = 'sent'; let errorMessage = '';
      try {
        await base44.integrations.Core.SendEmail({ to: 'carloearl@glyphlock.com', subject: `Contact Form: ${subject}`, body: `Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${message}` });
      } catch (error) { deliveryStatus = 'failed'; errorMessage = text(error?.message || 'Send failed', 500); }
      const after = await E.ContactEvent.update(contact.id, { status: deliveryStatus });
      await E.EmailDeliveryLog.create({ source: 'contact_form', recipient: 'carloearl@glyphlock.com', subject: `Contact Form: ${subject}`, reference: contact.id, organization: '', contact_email: contactEmail, status: deliveryStatus, error_message: errorMessage, attempted_at: new Date().toISOString() }).catch(() => null);
      value = { id: after.id, delivery_status: deliveryStatus, delivery_error: errorMessage };
      audit = { ...audit, entity_name: 'ContactEvent', record_id: after.id, operation: 'create', scope_type: 'PUBLIC_INTAKE', owner_ref: contactEmail, after: { contact_email_hash: await sha256(contactEmail), status: deliveryStatus }, fields_changed: ['contact_email', 'contact_name', 'subject', 'message', 'status'], metadata: { source: 'contact_form', delivery_status: deliveryStatus }, severity: 'medium' };
    } else if (action === 'preferences_save') {
      requireUser(user);
      const settings = body.voice_settings;
      if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new HttpError(400, 'SETTINGS_REQUIRED', 'Voice settings are required.');
      const clean = {
        provider: text(settings.provider || 'openai', 40),
        voice: text(settings.voice || 'alloy', 80),
        speed: numberIn(settings.speed, 0.5, 2, 1),
        pitch: numberIn(settings.pitch, 0.5, 2, 1),
        naturalness: numberIn(settings.naturalness, 0, 1, 0.8),
        volume: numberIn(settings.volume, 0, 1, 1),
        bass: numberIn(settings.bass, -20, 20, 0),
        treble: numberIn(settings.treble, -20, 20, 0),
        mid: numberIn(settings.mid, -20, 20, 0),
        stability: numberIn(settings.stability, 0, 1, 0.5),
        similarity: numberIn(settings.similarity, 0, 1, 0.75),
        style: numberIn(settings.style, 0, 1, 0),
        useSpeakerBoost: settings.useSpeakerBoost !== false,
        effects: settings.effects && typeof settings.effects === 'object' ? settings.effects : {},
      };
      const rows = await base44.entities.UserPreferences.list(null, 5).catch(() => []);
      const before = rows[0] || null;
      const after = before ? await base44.entities.UserPreferences.update(before.id, { voiceSettings: clean }) : await base44.entities.UserPreferences.create({ voiceSettings: clean });
      value = after;
      audit = { ...audit, entity_name: 'UserPreferences', record_id: after.id, operation: before ? 'update' : 'create', scope_type: 'USER_PRIVATE', owner_ref: user.email, before: before ? { voiceSettings: before.voiceSettings } : null, after: { voiceSettings: clean }, fields_changed: ['voiceSettings'] };
    } else if (action === 'conversation_save') {
      requireUser(user);
      const clean = { title: text(body.title || 'New Chat', 120), messages: cleanMessages(body.messages), last_message_at: new Date().toISOString() };
      let before: any = null; let after: any;
      if (body.id) {
        before = await base44.entities.Conversation.get(text(body.id, 160)).catch(() => null);
        if (!before) throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found or not owned by this user.');
        after = await base44.entities.Conversation.update(before.id, clean);
      } else {
        after = await base44.entities.Conversation.create(clean);
      }
      value = after;
      audit = { ...audit, entity_name: 'Conversation', record_id: after.id, operation: before ? 'update' : 'create', scope_type: 'USER_PRIVATE', owner_ref: user.email, before: before ? { title: before.title, message_count: before.messages?.length || 0 } : null, after: { title: clean.title, message_count: clean.messages.length }, fields_changed: ['title', 'messages', 'last_message_at'], metadata: { count: clean.messages.length } };
    } else if (action === 'service_usage_check') {
      const serviceName = text(body.service_name, 80);
      if (!SERVICE_NAMES.has(serviceName)) throw new HttpError(400, 'INVALID_SERVICE', 'Unknown service name.');
      const sessionId = text(body.session_id, 160);
      // Anonymous identity is server-derived from the request fingerprint. A
      // browser-generated session id is retained only as non-authoritative
      // diagnostics; clearing storage must not mint another free trial.
      const subjectKey = user?.email ? `user:${String(user.email).toLowerCase()}` : anonymousRef;
      const rows = await E.ServiceUsage.filter({ subject_key: subjectKey, service_name: serviceName }, '-created_date', 5).catch(() => []);
      const before = rows[0] || null;
      const usageCount = Number(before?.usage_count || 0) + 1;
      const requestId = text(body.request_id, 160) || crypto.randomUUID();
      let after: any;
      if (before && before.request_id === requestId) after = before;
      else if (before) after = await E.ServiceUsage.update(before.id, { usage_count: usageCount, request_id: requestId, last_used_at: new Date().toISOString() });
      else after = await E.ServiceUsage.create({ user_email: user?.email || subjectKey, service_name: serviceName, usage_count: 1, is_trial: true, session_id: user ? '' : sessionId, subject_key: subjectKey, request_id: requestId, first_used_at: new Date().toISOString(), last_used_at: new Date().toISOString() });
      const count = Number(after.usage_count || 1);
      value = { can_access: count === 1, usage_count: count, is_trial: true };
      audit = { ...audit, entity_name: 'ServiceUsage', record_id: after.id, operation: before ? 'update' : 'create', scope_type: user ? 'USER_PRIVATE' : 'PUBLIC_INTAKE', owner_ref: subjectKey, before: before ? { usage_count: before.usage_count } : null, after: { usage_count: count }, fields_changed: ['usage_count', 'request_id', 'last_used_at'], metadata: { service_name: serviceName, usage_count: count } };
    } else if (action === 'llm_feedback_submit') {
      const input = body.feedback || {};
      const rating = text(input.rating, 20);
      if (!['positive', 'negative'].includes(rating)) throw new HttpError(400, 'INVALID_RATING', 'Feedback rating must be positive or negative.');
      const conversationId = text(input.conversation_id, 160);
      if (!conversationId) throw new HttpError(400, 'CONVERSATION_REQUIRED', 'Conversation or message id is required.');
      const recent = await E.LLMFeedback.filter({ conversation_id: conversationId, user_email: user?.email || anonymousRef, created_date: { $gte: new Date(Date.now() - 60 * 1000).toISOString() } }, '-created_date', 5).catch(() => []);
      if (recent.length >= 3) throw new HttpError(429, 'RATE_LIMITED', 'Too many feedback submissions.');
      const after = await E.LLMFeedback.create({ conversation_id: conversationId, provider_id: text(input.provider_id || 'unknown', 100), model: text(input.model || 'unknown', 100), persona: text(input.persona || 'GENERAL', 100), rating, feedback_text: text(input.feedback_text, 500), response_latency_ms: numberIn(input.response_latency_ms, 0, 600000), prompt_snippet: '', response_snippet: '', user_email: user?.email || anonymousRef });
      value = { id: after.id };
      audit = { ...audit, entity_name: 'LLMFeedback', record_id: after.id, operation: 'create', scope_type: user ? 'USER_PRIVATE' : 'PUBLIC_INTAKE', owner_ref: user?.email || anonymousRef, after: { rating, provider_id: after.provider_id, model: after.model }, fields_changed: ['conversation_id', 'provider_id', 'model', 'persona', 'rating', 'feedback_text', 'response_latency_ms', 'user_email'], metadata: { rating }, severity: 'low' };
    } else if (action === 'interactive_image_create') {
      requireUser(user);
      const input = body.image || {};
      const fileUrl = text(input.fileUrl || input.image_url, 5000);
      if (!/^https?:\/\//i.test(fileUrl)) throw new HttpError(400, 'FILE_URL_REQUIRED', 'Uploaded image URL is required.');
      const clean = { asset_id: crypto.randomUUID(), name: text(input.name || 'Untitled image', 300), fileUrl, image_url: fileUrl, source: ['generated', 'uploaded'].includes(input.source) ? input.source : 'uploaded', status: 'draft', ownerEmail: user.email, owner_id: user.id, fingerprint: await sha256(fileUrl), fingerprint_method: 'sha256', published: false, hotspots: [], width: numberIn(input.width, 0, 100000), height: numberIn(input.height, 0, 100000), archived: false };
      const after = await base44.entities.InteractiveImage.create(clean);
      value = after;
      audit = { ...audit, entity_name: 'InteractiveImage', record_id: after.id, operation: 'create', scope_type: 'CONTENT_OWNER', owner_ref: user.email, after: { ...clean, fileUrl: '[URL HASHED]', image_url: '[URL HASHED]' }, fields_changed: Object.keys(clean), severity: 'medium' };
    } else if (action === 'interactive_image_update') {
      requireUser(user);
      const before = await getRecord(E, 'InteractiveImage', text(body.id, 160));
      if (!owns(before, user) && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Image ownership required.');
      if (before.status === 'active') throw new HttpError(409, 'FINALIZED_IMMUTABLE', 'Finalized images cannot be modified.');
      const hotspots = Array.isArray(body.hotspots) ? body.hotspots.slice(0, 500).map((spot: any) => ({ id: text(spot.id || crypto.randomUUID(), 120), x: numberIn(spot.x, 0, 100), y: numberIn(spot.y, 0, 100), width: numberIn(spot.width, 0, 100), height: numberIn(spot.height, 0, 100), shape: ['rect', 'circle'].includes(spot.shape) ? spot.shape : 'rect', label: text(spot.label, 200), description: text(spot.description, 1000), actionType: text(spot.actionType || 'none', 80), actionValue: text(spot.actionValue, 2000), aiDetected: bool(spot.aiDetected), confidence: numberIn(spot.confidence, 0, 100) })) : [];
      const after = await E.InteractiveImage.update(before.id, { hotspots });
      value = after;
      audit = { ...audit, entity_name: 'InteractiveImage', record_id: before.id, operation: 'update', scope_type: 'CONTENT_OWNER', owner_ref: before.ownerEmail || before.owner_id, before: { hotspot_count: before.hotspots?.length || 0 }, after: { hotspot_count: hotspots.length }, fields_changed: ['hotspots'], metadata: { hotspot_count: hotspots.length }, severity: 'medium' };
    } else if (action === 'interactive_image_finalize') {
      requireUser(user);
      const before = await getRecord(E, 'InteractiveImage', text(body.id, 160));
      if (!owns(before, user) && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Image ownership required.');
      if (before.archived) throw new HttpError(409, 'IMAGE_ARCHIVED', 'Archived images cannot be finalized.');
      const fileUrl = text(before.fileUrl || before.image_url, 5000);
      if (!/^https?:\/\//i.test(fileUrl)) throw new HttpError(409, 'IMAGE_URL_MISSING', 'Image file URL is unavailable.');
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) throw new HttpError(502, 'IMAGE_FETCH_FAILED', 'Image file could not be retrieved for finalization.');
      const bytes = new Uint8Array(await fileResponse.arrayBuffer());
      const fileDigest = await crypto.subtle.digest('SHA-256', bytes);
      const imageFileHash = Array.from(new Uint8Array(fileDigest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      const immutableHash = await sha256(`${imageFileHash}|${JSON.stringify(stable(before.hotspots || []))}`);
      const after = await E.InteractiveImage.update(before.id, { status: 'active', immutableHash, imageFileHash, published: bool(body.published) });
      await E.ImageHashLog.create({
        imageId: before.id,
        hash: immutableHash,
        imageFileHash,
        hotspotsSnapshot: JSON.stringify(stable(before.hotspots || [])),
        ownerEmail: user.email,
        description: `Finalized interactive image with ${(before.hotspots || []).length} hotspot(s).`,
      }).catch(() => null);
      value = { image: after, hash: immutableHash, imageFileHash, hotspotsCount: (before.hotspots || []).length };
      audit = { ...audit, entity_name: 'InteractiveImage', record_id: before.id, operation: 'update', scope_type: 'CONTENT_OWNER', owner_ref: before.ownerEmail || before.owner_id, before: { status: before.status, hotspot_count: before.hotspots?.length || 0 }, after: { status: 'active', hotspot_count: before.hotspots?.length || 0, immutable_hash: immutableHash }, fields_changed: ['status', 'immutableHash', 'imageFileHash', 'published'], metadata: { hotspot_count: before.hotspots?.length || 0 }, severity: 'high' };
    } else if (action === 'interactive_image_archive') {
      requireUser(user);
      const before = await getRecord(E, 'InteractiveImage', text(body.id, 160));
      if (!owns(before, user) && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Image ownership required.');
      const after = await E.InteractiveImage.update(before.id, { archived: true, archived_at: new Date().toISOString(), archived_by: user.email, archive_reason: text(body.reason || 'Archived by owner', 300), status: 'revoked', published: false });
      value = after;
      audit = { ...audit, entity_name: 'InteractiveImage', record_id: before.id, operation: 'archive', scope_type: 'CONTENT_OWNER', owner_ref: before.ownerEmail || before.owner_id, before: { status: before.status, published: before.published, archived: before.archived }, after: { status: 'revoked', published: false, archived: true }, fields_changed: ['archived', 'archived_at', 'archived_by', 'archive_reason', 'status', 'published'], severity: before.status === 'active' || before.published ? 'high' : 'medium' };
    } else if (action === 'hotspot_payload_archive') {
      requireAdmin(user, nups);
      const before = await getRecord(E, 'HotspotPayload', text(body.id, 160));
      const after = await E.HotspotPayload.update(before.id, { archived: true, archived_at: new Date().toISOString(), archived_by: user.email, archive_reason: text(body.reason || 'Archived by administrator', 300) });
      value = after;
      audit = { ...audit, entity_name: 'HotspotPayload', record_id: before.id, operation: 'archive', scope_type: 'CONTENT_OWNER', before, after, fields_changed: ['archived', 'archived_at', 'archived_by', 'archive_reason'], severity: 'medium' };
    } else if (action === 'qr_record_generation') {
      const records = Array.isArray(body.records) ? body.records.slice(0, 100) : [body.record || {}];
      if (!records.length) throw new HttpError(400, 'QR_RECORD_REQUIRED', 'QR generation record is required.');
      const creator = user?.email || anonymousRef;
      const recent = await E.QRGenHistory.filter({
        creator_id: creator,
        created_date: { $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      }, '-created_date', 250).catch(() => []);
      if ((recent?.length || 0) + records.length > 200) {
        throw new HttpError(429, 'QR_RATE_LIMITED', 'Hourly QR generation limit exceeded.');
      }
      const results = [];
      for (const input of records) {
        const payload = text(input.payload, 10000);
        if (!payload) throw new HttpError(400, 'PAYLOAD_REQUIRED', 'QR payload is required.');
        const type = QR_TYPES.has(input.type) ? input.type : 'url';
        const codeId = text(input.code_id, 160) || `qr_${Date.now()}_${crypto.randomUUID()}`;
        const history = await E.QRGenHistory.create({ code_id: codeId, payload, payload_sha256: await sha256(payload), size: numberIn(input.size, 64, 4096, 512), creator_id: creator, status: ['safe', 'suspicious', 'blocked'].includes(input.status) ? input.status : 'safe', type, image_format: ['png', 'svg', 'jpg'].includes(input.image_format) ? input.image_format : 'png', error_correction: ['L', 'M', 'Q', 'H'].includes(input.error_correction) ? input.error_correction : 'H', foreground_color: text(input.foreground_color || '#000000', 20), background_color: text(input.background_color || '#ffffff', 20), has_logo: bool(input.has_logo), logo_url: text(input.logo_url, 5000) });
        let score: any = null;
        if (input.ai_score && typeof input.ai_score === 'object') {
          const ai = input.ai_score;
          score = await E.QRAIScore.create({ code_id: codeId, final_score: numberIn(ai.final_score, 0, 100), domain_trust: numberIn(ai.domain_trust, 0, 100), sentiment_score: numberIn(ai.sentiment_score, 0, 100), entity_legitimacy: numberIn(ai.entity_legitimacy, 0, 100), risk_level: ['safe', 'low', 'medium', 'high', 'critical'].includes(ai.risk_level) ? ai.risk_level : 'safe', ml_version: text(ai.ml_version || 'unknown', 100), phishing_indicators: Array.isArray(ai.phishing_indicators) ? ai.phishing_indicators.map((v: any) => text(v, 300)).slice(0, 100) : [], threat_types: Array.isArray(ai.threat_types) ? ai.threat_types.map((v: any) => text(v, 300)).slice(0, 100) : [] });
        }
        results.push({ history, score });
      }
      value = results;
      audit = { ...audit, entity_name: 'QRGenHistory', record_id: results[0]?.history?.id || '', operation: 'create', scope_type: user ? 'CONTENT_OWNER' : 'PUBLIC_INTAKE', owner_ref: creator, after: { record_count: results.length }, fields_changed: ['code_id', 'payload', 'payload_sha256', 'creator_id', 'status', 'type'], metadata: { record_count: results.length }, severity: 'low' };
    } else if (action === 'qr_preview_save') {
      requireUser(user);
      const input = body.preview || {};
      const existing = await E.QrPreview.filter({ user_id: user.email, vaulted: false, archived: { $ne: true } }, 'created_date', 20).catch(() => []);
      if (!bool(input.vaulted) && existing.length >= 10) {
        const oldest = existing[0];
        await E.QrPreview.delete(oldest.id);
        await recordAudit(base44, { action: 'qr_preview_cache_evicted', entity_name: 'QrPreview', record_id: oldest.id, operation: 'delete_cache', actor_email: user.email, actor_role: role, scope_type: 'USER_PRIVATE', owner_ref: user.email, intent: 'Enforce ten-item ephemeral preview limit', before: { code_id: oldest.code_id, vaulted: false }, result: 'allowed', metadata: { deleted_cache: true } });
      }
      const record = { user_id: user.email, code_id: text(input.code_id, 160), payload: text(input.payload, 10000), payload_type: text(input.payload_type || 'url', 80), image_data_url: text(input.image_data_url, 3000000), thumbnail_url: text(input.thumbnail_url, 5000), customization: input.customization && typeof input.customization === 'object' ? input.customization : {}, size: numberIn(input.size, 64, 4096, 512), error_correction: ['L', 'M', 'Q', 'H'].includes(input.error_correction) ? input.error_correction : 'H', risk_score: numberIn(input.risk_score, 0, 100), risk_flags: Array.isArray(input.risk_flags) ? input.risk_flags.map((v: any) => text(v, 300)).slice(0, 100) : [], immutable_hash: text(input.immutable_hash, 128), vaulted: bool(input.vaulted), vault_date: bool(input.vaulted) ? new Date().toISOString() : null, archived: false };
      if (!record.code_id || !record.payload) throw new HttpError(400, 'PREVIEW_FIELDS_REQUIRED', 'QR code id and payload are required.');
      const after = await base44.entities.QrPreview.create(record);
      value = after;
      audit = { ...audit, entity_name: 'QrPreview', record_id: after.id, operation: 'create', scope_type: 'USER_PRIVATE', owner_ref: user.email, after: { code_id: record.code_id, payload_hash: await sha256(record.payload), vaulted: record.vaulted }, fields_changed: Object.keys(record), metadata: { vaulted: record.vaulted } };
    } else if (action === 'qr_preview_vault') {
      requireUser(user);
      const before = await getRecord(E, 'QrPreview', text(body.id, 160));
      if (before.user_id !== user.email && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Preview ownership required.');
      const after = await E.QrPreview.update(before.id, { vaulted: true, vault_date: new Date().toISOString(), archived: false });
      value = after;
      audit = { ...audit, entity_name: 'QrPreview', record_id: before.id, operation: 'update', scope_type: 'USER_PRIVATE', owner_ref: before.user_id, before: { vaulted: before.vaulted }, after: { vaulted: true }, fields_changed: ['vaulted', 'vault_date'], metadata: { vaulted: true } };
    } else if (action === 'qr_preview_remove') {
      requireUser(user);
      const before = await getRecord(E, 'QrPreview', text(body.id, 160));
      if (before.user_id !== user.email && !isAdmin(user, nups)) throw new HttpError(403, 'OWNER_REQUIRED', 'Preview ownership required.');
      if (before.vaulted) {
        value = await E.QrPreview.update(before.id, { archived: true, archived_at: new Date().toISOString(), archived_by: user.email, archive_reason: text(body.reason || 'Removed from vault', 300) });
        audit = { ...audit, entity_name: 'QrPreview', record_id: before.id, operation: 'archive', scope_type: 'USER_PRIVATE', owner_ref: before.user_id, before: { vaulted: true, archived: before.archived }, after: { vaulted: true, archived: true }, fields_changed: ['archived', 'archived_at', 'archived_by', 'archive_reason'], metadata: { vaulted: true, archived: true } };
      } else {
        await E.QrPreview.delete(before.id); value = { deleted: true, id: before.id };
        audit = { ...audit, entity_name: 'QrPreview', record_id: before.id, operation: 'delete_cache', scope_type: 'USER_PRIVATE', owner_ref: before.user_id, before: { code_id: before.code_id, vaulted: false }, fields_changed: [], metadata: { deleted_cache: true } };
      }
    } else if (action === 'partner_document_list') {
      requireUser(user);
      const partner = await resolvePartner(E, user);
      if (!partner && !isAdmin(user, nups)) throw new HttpError(403, 'PARTNER_REQUIRED', 'Active partner account required.');
      const partnerId = partner?.id || 'platform-admin';
      const [documents, accessRows] = await Promise.all([
        E.PartnerDocument.list('-created_date', 500),
        E.PartnerDocumentAccess.filter({ partner_id: partnerId }, '-last_action_at', 500).catch(() => []),
      ]);
      const accessByDocument = new Map((accessRows || []).map((row: any) => [row.document_id, row]));
      value = (documents || [])
        .filter((document: any) => isAdmin(user, nups) || !document.partner_id || document.partner_id === partnerId)
        .map((document: any) => {
          const access = accessByDocument.get(document.id);
          return {
            id: document.id,
            document_name: document.document_name,
            document_type: document.document_type,
            description: document.description,
            partner_id: document.partner_id || null,
            is_confidential: Boolean(document.is_confidential),
            requires_signature: Boolean(document.requires_signature),
            signed: Boolean(document.signed),
            signed_date: document.signed_date || null,
            expiry_date: document.expiry_date || null,
            version: document.version || '1.0',
            viewed: access?.viewed === true,
            viewed_date: access?.viewed_at || null,
            created_date: document.created_date,
          };
        });
      audit = { ...audit, entity_name: 'PartnerDocument', record_id: `catalog:${partnerId}`, operation: 'access', scope_type: 'PARTNER', owner_ref: partnerId, after: { record_count: value.length }, fields_changed: [], metadata: { partner_id: partnerId, record_count: value.length } };
    } else if (action === 'marketing_asset_list') {
      requireUser(user);
      const partner = await resolvePartner(E, user);
      if (!partner && !isAdmin(user, nups)) throw new HttpError(403, 'PARTNER_REQUIRED', 'Active partner account required.');
      const partnerId = partner?.id || 'platform-admin';
      const tier = partner?.tier || 'admin';
      const assets = await E.MarketingAsset.list('-created_date', 500);
      value = (assets || [])
        .filter((asset: any) => asset.is_active !== false)
        .filter((asset: any) => isAdmin(user, nups) || !Array.isArray(asset.partner_tier_access) || asset.partner_tier_access.length === 0 || asset.partner_tier_access.includes(tier))
        .map((asset: any) => ({
          id: asset.id,
          asset_name: asset.asset_name,
          asset_type: asset.asset_type,
          description: asset.description,
          thumbnail_url: asset.thumbnail_url,
          file_size: asset.file_size,
          file_format: asset.file_format,
          partner_tier_access: asset.partner_tier_access || [],
          download_count: Number(asset.download_count || 0),
          is_active: asset.is_active !== false,
          tags: asset.tags || [],
          created_date: asset.created_date,
        }));
      audit = { ...audit, entity_name: 'MarketingAsset', record_id: `catalog:${partnerId}`, operation: 'access', scope_type: 'PARTNER', owner_ref: partnerId, after: { record_count: value.length }, fields_changed: [], metadata: { partner_id: partnerId, record_count: value.length } };
    } else if (action === 'partner_document_access') {
      requireUser(user);
      const partner = await resolvePartner(E, user);
      if (!partner && !isAdmin(user, nups)) throw new HttpError(403, 'PARTNER_REQUIRED', 'Active partner account required.');
      const document = await getRecord(E, 'PartnerDocument', text(body.document_id, 160));
      if (!isAdmin(user, nups) && document.partner_id && document.partner_id !== partner.id) throw new HttpError(403, 'PARTNER_SCOPE_DENIED', 'Document belongs to another partner.');
      const actionType = body.access_action === 'download' ? 'download' : 'view';
      const partnerId = partner?.id || 'platform-admin';
      const accessKey = `${partnerId}:${document.id}`;
      const rows = await E.PartnerDocumentAccess.filter({ access_key: accessKey }, null, 2).catch(() => []);
      const now = new Date().toISOString();
      const update = { partner_id: partnerId, document_id: document.id, actor_email: user.email, viewed: true, viewed_at: rows[0]?.viewed_at || now, ...(actionType === 'download' ? { downloaded_at: now } : {}), last_action: actionType, last_action_at: now };
      const before = rows[0] || null;
      const access = before ? await E.PartnerDocumentAccess.update(before.id, update) : await E.PartnerDocumentAccess.create({ access_key: accessKey, ...update });
      value = { access, file_url: document.file_url, document_name: document.document_name };
      audit = { ...audit, entity_name: 'PartnerDocumentAccess', record_id: access.id, operation: 'access', scope_type: 'PARTNER', owner_ref: partnerId, before: before ? { last_action: before.last_action } : null, after: { last_action: actionType }, fields_changed: Object.keys(update), metadata: { partner_id: partnerId, document_id: document.id }, severity: document.is_confidential ? 'medium' : 'low' };
    } else if (action === 'marketing_asset_download') {
      requireUser(user);
      const partner = await resolvePartner(E, user);
      if (!partner && !isAdmin(user, nups)) throw new HttpError(403, 'PARTNER_REQUIRED', 'Active partner account required.');
      const asset = await getRecord(E, 'MarketingAsset', text(body.asset_id, 160));
      if (!asset.is_active) throw new HttpError(409, 'ASSET_INACTIVE', 'Marketing asset is inactive.');
      if (!isAdmin(user, nups) && Array.isArray(asset.partner_tier_access) && asset.partner_tier_access.length && !asset.partner_tier_access.includes(partner.tier)) throw new HttpError(403, 'TIER_DENIED', 'Partner tier cannot access this asset.');
      const partnerId = partner?.id || 'platform-admin';
      const event = await E.MarketingAssetDownload.create({ event_id: crypto.randomUUID(), asset_id: asset.id, partner_id: partnerId, actor_email: user.email, partner_tier: partner?.tier || 'admin', downloaded_at: new Date().toISOString() });
      const count = Number(asset.download_count || 0) + 1;
      await E.MarketingAsset.update(asset.id, { download_count: count });
      value = { event_id: event.id, file_url: asset.file_url, download_count: count };
      audit = { ...audit, entity_name: 'MarketingAssetDownload', record_id: event.id, operation: 'access', scope_type: 'PARTNER', owner_ref: partnerId, after: { asset_id: asset.id, partner_id: partnerId }, fields_changed: ['asset_id', 'partner_id', 'downloaded_at'], metadata: { partner_id: partnerId, asset_id: asset.id }, severity: 'low' };
    } else {
      throw new HttpError(400, 'UNKNOWN_ACTION', 'Unsupported governed write action.');
    }

    await recordAudit(base44, audit);
    return Response.json({ ok: true, value });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const code = error instanceof HttpError ? error.code : 'WRITE_FAILED';
    await recordAudit(base44, {
      action,
      entity_name: text(body.entity_name || 'Unknown', 100),
      record_id: text(body.id || body.record_id, 160),
      operation: 'update',
      actor_email: actorEmail,
      actor_role: role,
      scope_type: PUBLIC_ACTIONS.has(action) ? 'PUBLIC_INTAKE' : 'GLOBAL_SYSTEM',
      intent: text(body.intent || action, 300),
      result: status >= 500 ? 'failed' : 'blocked',
      reason: code,
      severity: status >= 500 ? 'high' : 'medium',
    });
    return Response.json({ ok: false, code, error: error?.message || 'Governed write failed.' }, { status });
  }
});
