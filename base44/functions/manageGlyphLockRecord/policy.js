const GLOBAL_ROLES = new Set(['admin', 'PLATFORM_ADMIN', 'SOVEREIGN']);
const ADMIN_ROLES = new Set(['admin', 'PLATFORM_ADMIN', 'SOVEREIGN', 'VENUE_OWNER', 'VENUE_MANAGER']);

export const POLICIES = Object.freeze({
  AgentChangeSet: {
    create: null,
    update: null,
    delete: 'OWNER_OR_GLOBAL',
    scope: 'GOVERNANCE',
    retention: 'FULL_REDACTED_SNAPSHOT',
    safeDeleteStatuses: ['draft', 'proposed', 'rejected', 'cancelled', 'failed'],
  },
  GlyphBotAudit: {
    create: 'AUTHENTICATED',
    update: 'OWNER_OR_GLOBAL',
    delete: 'OWNER_OR_GLOBAL',
    scope: 'GOVERNANCE',
    retention: 'FULL_REDACTED_SNAPSHOT',
    versionOnUpdate: true,
  },
  FeatureRegistry: {
    create: 'GLOBAL',
    update: 'GLOBAL',
    delete: null,
    scope: 'GOVERNANCE',
    idempotentCreate: true,
  },
  ArchitecturalDecisionRecord: {
    create: 'GLOBAL',
    update: 'GLOBAL',
    delete: null,
    scope: 'GOVERNANCE',
    versionOnUpdate: true,
  },
  Consultation: {
    create: 'PUBLIC_INTAKE',
    update: 'ADMIN',
    delete: null,
    scope: 'PUBLIC_INTAKE',
  },
  ContactEvent: {
    create: 'PUBLIC_INTAKE',
    update: 'PUBLIC_RECENT_UPDATE',
    delete: null,
    scope: 'PUBLIC_INTAKE',
  },
  UserPreferences: {
    create: 'SELF',
    update: 'OWNER_OR_GLOBAL',
    delete: null,
    scope: 'USER_PRIVATE',
  },
  Conversation: {
    create: 'SELF',
    update: 'OWNER_OR_MEMBER',
    delete: null,
    scope: 'USER_PRIVATE',
  },
  HotspotPayload: {
    create: null,
    update: null,
    delete: 'OWNER_OR_GLOBAL',
    scope: 'CONTENT_OWNER',
    retention: 'SAFE_TOMBSTONE',
  },
  InteractiveImage: {
    create: 'AUTHENTICATED',
    update: 'OWNER_OR_GLOBAL',
    delete: 'OWNER_OR_GLOBAL',
    scope: 'CONTENT_OWNER',
    retention: 'SAFE_TOMBSTONE',
  },
  QRGenHistory: {
    create: 'AUTHENTICATED',
    update: null,
    delete: null,
    scope: 'CONTENT_OWNER',
  },
  QrPreview: {
    create: 'AUTHENTICATED',
    update: 'OWNER_OR_GLOBAL',
    delete: 'OWNER_OR_GLOBAL',
    scope: 'CONTENT_OWNER',
    retention: 'SAFE_TOMBSTONE',
  },
  QRAIScore: {
    create: 'AUTHENTICATED',
    update: null,
    delete: null,
    scope: 'CONTENT_OWNER',
  },
  ServiceUsage: {
    create: 'SERVER_METER',
    update: null,
    delete: null,
    scope: 'USER_PRIVATE',
    idempotentCreate: true,
  },
  LLMFeedback: {
    create: 'LIMITED_FEEDBACK',
    update: null,
    delete: null,
    scope: 'USER_PRIVATE',
  },
  PartnerDocument: {
    create: null,
    update: 'PARTNER_OWNER_OR_GLOBAL',
    delete: null,
    scope: 'PARTNER',
    versionOnUpdate: true,
  },
  MarketingAsset: {
    create: null,
    update: 'PARTNER_OWNER_OR_GLOBAL',
    delete: null,
    scope: 'PARTNER',
    versionOnUpdate: true,
  },
});

const SENSITIVE_KEY = /(password|passcode|otp|pin(?:_hash)?|secret|token|authorization|cookie|session|file_uri|signed_url|ssn|social_security|tax_id|tin\b|government_id|id_number|thumbprint|fingerprint|biometric|signature_image|private_key|client_secret)/i;
const IMMUTABLE_KEY = /^(id|created_by|created_by_id|created_date|created_at|owner_id|owner_email|user_id|user_email|platform_email|actor_email|actor_id|venue_id|mode|is_demo|role|permissions?|assigned_to|approved_by|reviewed_by)$/i;
const PUBLIC_PRIVILEGED_KEY = /(internal|admin|role|permission|assign|approve|review|resolve|owner|actor|created_by|updated_by|venue_id|mode|is_demo|private|secret|token|password|otp|pin|file_uri|signed_url)/i;

export function normalizeRole(actor = {}) {
  return String(actor.nupsRole || actor.platformRole || '').trim();
}

export function isGlobalActor(actor = {}) {
  return GLOBAL_ROLES.has(normalizeRole(actor));
}

export function isAdminActor(actor = {}) {
  return ADMIN_ROLES.has(normalizeRole(actor));
}

export function isAuthenticatedActor(actor = {}) {
  return Boolean(actor.email && actor.userId);
}

function values(value) {
  if (Array.isArray(value)) return value.flatMap(values);
  if (value && typeof value === 'object') return Object.values(value).flatMap(values);
  return value == null ? [] : [String(value).toLowerCase()];
}

export function recordOwnerMatches(record = {}, actor = {}) {
  if (!isAuthenticatedActor(actor)) return false;
  const email = String(actor.email || '').toLowerCase();
  const userId = String(actor.userId || '').toLowerCase();
  const ownerFields = [
    record.created_by,
    record.created_by_email,
    record.owner_email,
    record.user_email,
    record.platform_email,
    record.email,
    record.created_by_id,
    record.owner_id,
    record.user_id,
  ].flatMap(values);
  return ownerFields.includes(email) || ownerFields.includes(userId);
}

export function conversationMemberMatches(record = {}, actor = {}) {
  if (recordOwnerMatches(record, actor)) return true;
  const email = String(actor.email || '').toLowerCase();
  const userId = String(actor.userId || '').toLowerCase();
  const participantValues = [record.participants, record.members, record.user_ids, record.participant_ids, record.participant_emails]
    .flatMap(values);
  return participantValues.includes(email) || participantValues.includes(userId);
}

export function partnerScopeMatches(record = {}, actor = {}) {
  if (recordOwnerMatches(record, actor)) return true;
  const actorPartnerIds = [actor.partnerId, actor.organizationId].filter(Boolean).map((v) => String(v).toLowerCase());
  const recordPartnerIds = [record.partner_id, record.partnerId, record.organization_id, record.organizationId]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  return actorPartnerIds.some((id) => recordPartnerIds.includes(id));
}

export function sanitizeValue(value, { publicMode = false, updateMode = false } = {}, depth = 0) {
  if (depth > 8) return '[MAX_DEPTH]';
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => sanitizeValue(item, { publicMode, updateMode }, depth + 1));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') return value.slice(0, publicMode ? 5000 : 100000);
    return value;
  }
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (publicMode && PUBLIC_PRIVILEGED_KEY.test(key)) continue;
    if (updateMode && IMMUTABLE_KEY.test(key)) continue;
    result[key] = sanitizeValue(item, { publicMode, updateMode }, depth + 1);
  }
  return result;
}

export function sanitizeForArchive(value, kind = 'FULL_REDACTED_SNAPSHOT', depth = 0) {
  if (depth > 8) return '[MAX_DEPTH]';
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => sanitizeForArchive(item, kind, depth + 1));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') return value.slice(0, kind === 'SAFE_TOMBSTONE' ? 300 : 50000);
    return value;
  }
  const result = {};
  const tombstoneKeys = new Set(['id', 'name', 'title', 'status', 'type', 'created_by', 'created_date', 'updated_date', 'venue_id', 'owner_id', 'owner_email', 'user_id', 'partner_id', 'image_id', 'qr_id', 'preview_id']);
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      result[key] = '[REDACTED]';
      continue;
    }
    if (kind === 'SAFE_TOMBSTONE' && !tombstoneKeys.has(key)) continue;
    if (/^(messages?|conversation|prompt|response|document|raw|content|body|notes?)$/i.test(key)) {
      result[key] = '[CONTENT_REDACTED]';
      continue;
    }
    result[key] = sanitizeForArchive(item, kind, depth + 1);
  }
  return result;
}

export function publicRecentUpdateFields(data = {}) {
  const allowed = /^(status|delivery_status|email_status|notification_status|submission_status|result|success|error_code|error_message|sent_at|delivered_at|completed_at|updated_at|message_id|provider_reference)$/i;
  const result = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (!allowed.test(key) || SENSITIVE_KEY.test(key)) continue;
    if (key === 'status' && !/^(new|pending|queued|submitted|sent|delivered|completed|failed|error)$/i.test(String(value))) continue;
    result[key] = sanitizeValue(value, { publicMode: true, updateMode: true });
  }
  return result;
}

export function authorize({ policy, action, actor, record, data }) {
  const rule = policy?.[action];
  if (!rule) return { allowed: false, reason: 'operation_not_allowed' };
  if (rule === 'PUBLIC_INTAKE' || rule === 'PUBLIC_RECENT_UPDATE' || rule === 'LIMITED_FEEDBACK' || rule === 'SERVER_METER') {
    return { allowed: true, reason: rule.toLowerCase() };
  }
  if (!isAuthenticatedActor(actor)) return { allowed: false, reason: 'authentication_required' };
  if (rule === 'AUTHENTICATED' || rule === 'SELF') return { allowed: true, reason: rule.toLowerCase() };
  if (rule === 'GLOBAL') return isGlobalActor(actor)
    ? { allowed: true, reason: 'global_role' }
    : { allowed: false, reason: 'global_role_required' };
  if (rule === 'ADMIN') return isAdminActor(actor)
    ? { allowed: true, reason: 'admin_role' }
    : { allowed: false, reason: 'admin_role_required' };
  if (rule === 'OWNER_OR_GLOBAL') return isGlobalActor(actor) || recordOwnerMatches(record, actor)
    ? { allowed: true, reason: isGlobalActor(actor) ? 'global_role' : 'record_owner' }
    : { allowed: false, reason: 'record_owner_required' };
  if (rule === 'OWNER_OR_MEMBER') return isGlobalActor(actor) || conversationMemberMatches(record, actor)
    ? { allowed: true, reason: isGlobalActor(actor) ? 'global_role' : 'conversation_member' }
    : { allowed: false, reason: 'conversation_membership_required' };
  if (rule === 'PARTNER_OWNER_OR_GLOBAL') return isGlobalActor(actor) || partnerScopeMatches(record, actor)
    ? { allowed: true, reason: isGlobalActor(actor) ? 'global_role' : 'partner_scope' }
    : { allowed: false, reason: 'partner_scope_required' };
  return { allowed: false, reason: 'unsupported_policy_rule' };
}

export function policyFor(entity) {
  return POLICIES[entity] || null;
}

export function sensitiveKeyPattern() {
  return SENSITIVE_KEY;
}
