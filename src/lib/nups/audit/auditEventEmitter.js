/**
 * BPAA-NUPS-AUDIT-001 — AuditEvent emitter.
 *
 * Side effect of writeEntity(). Coverage is automatic for every gated write.
 * Identity is GATED behind MDL ID-01: identity_verified is always false,
 * gated event types (UserLogin / PermissionChange / ManualEntry /
 * ManagerApproval) are never emitted from this module.
 *
 * Hard invariants:
 *  §0.11 — observational, not source-of-truth
 *  §3.1  — total_sales_impact === cash_portion + card_portion (REJECT on violation)
 *  §5    — recursion guard: never self-audit AuditEvent writes; depth-capped
 *  §6    — identity_verified always false; gated types not emitted
 */

import { base44 } from '@/api/base44Client';

export const AUDIT_EVENT_VERSION = 1;
export const MAX_AUDIT_DEPTH = 1;

/* ──────────────────────────── EVENT TYPE METADATA ─────────────────────── */

// Identity-bound types — defined in the entity enum, but NEVER emitted
// from this module until MDL ID-01 clears. §6.
const GATED_EVENT_TYPES = new Set([
  'UserLogin',
  'PermissionChange',
  'ManualEntry',
  'ManagerApproval',
]);

// Default category per event_type. Caller may override via opts.event_category.
const EVENT_TYPE_CATEGORY = {
  GuestScan:           'identity',
  GuestEntry:          'sales',
  DoorSale:            'sales',
  PromoApplied:        'sales',
  DriverCredit:        'driver',
  Discount:            'sales',
  Comp:                'sales',
  CashPayment:         'cash',
  CardPayment:         'card',
  GlyphBucksPayment:   'glyphbucks',
  Refund:              'financial',
  Void:                'financial',
  InventoryDeduction:  'inventory',
  BottleSale:          'sales',
  StageFee:            'sales',
  VipCharge:           'sales',
  ShiftOpen:           'system',
  ShiftClose:          'system',
  DrawerCount:         'cash',
  PayoutCreated:       'payout',
  PayoutApproved:      'payout',
  PayoutPaid:          'payout',
  PriceOverride:       'sales',
  SystemError:         'system',
  PerformanceSnapshot: 'system',
  SelfAuditAlert:      'system',
};

// Categories that require financial_context per §3.
const FINANCIAL_CATEGORIES = new Set([
  'financial', 'cash', 'card', 'sales', 'glyphbucks', 'driver',
]);

// Map authoritative entity → likely category & event_type for default emission
// from writeEntity(). When the caller hasn't supplied an explicit event_type,
// we still emit an observational record so coverage is automatic.
const ENTITY_EVENT_DEFAULTS = {
  POSTransaction:        { event_type: 'DoorSale',           category: 'sales' },
  POSBatch:              { event_type: 'ShiftOpen',          category: 'system' },
  POSZReport:            { event_type: 'ShiftClose',         category: 'system' },
  PayrollRecord:         { event_type: 'PayoutPaid',         category: 'payout' },
  TipPayout:             { event_type: 'PayoutPaid',         category: 'payout' },
  GlyphBucksTransaction: { event_type: 'GlyphBucksPayment',  category: 'glyphbucks' },
  GlyphBucksOrder:       { event_type: 'GlyphBucksPayment',  category: 'glyphbucks' },
  VenueContract:         { event_type: 'GuestEntry',         category: 'sales' },
  DriverPayout:          { event_type: 'PayoutCreated',      category: 'payout' },
  DailySettlement:       { event_type: 'ShiftClose',         category: 'system' },
  JournalEntry:          { event_type: 'PerformanceSnapshot',category: 'financial' },
};

/* ─────────────────────────────── HELPERS ─────────────────────────────── */

// Gateway uses UPPERCASE REAL/DEMO; AuditEvent stores lowercase per §2.
function normalizeMode(m) {
  if (!m) return 'real';
  const s = String(m).toLowerCase();
  if (s === 'real' || s === 'demo' || s === 'sandbox') return s;
  return 'real';
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ───────────────────── §3.1 FINANCIAL INVARIANT ──────────────────────── */

/**
 * Validates the §3.1 hard invariant on financial_context.
 *   total_sales_impact === cash_portion + card_portion
 * Tolerance: 1 cent (covers float drift on legitimate splits).
 *
 * Returns { ok, reason } — caller decides what to do (reject + alert).
 */
export function validateFinancialContext(fc) {
  if (!fc || typeof fc !== 'object') {
    return { ok: false, reason: 'financial_context_missing' };
  }
  const cash = num(fc.cash_portion);
  const card = num(fc.card_portion);
  const impact = num(fc.total_sales_impact);
  const expected = cash + card;
  if (Math.abs(impact - expected) > 0.01) {
    return {
      ok: false,
      reason: `financial_invariant_violation: total_sales_impact(${impact}) !== cash_portion(${cash}) + card_portion(${card}) [expected ${expected}]`,
    };
  }
  return { ok: true };
}

/* ─────────────────────────── CORE EMITTER ────────────────────────────── */

/**
 * Emit one AuditEvent row.
 *
 * Recursion guard (§5):
 *   - entity_type === 'AuditEvent' → no-op (we never self-audit audit writes).
 *   - opts.audit_depth >= MAX_AUDIT_DEPTH → no-op.
 *
 * Identity gating (§6):
 *   - Gated event types are dropped (returns { ok: false, reason }).
 *   - identity_verified is FORCED false UNLESS the gateway has rebound
 *     the actor via live base44.auth.me() (DACO WAVE 2 ID-01).
 *
 * Financial invariant (§3.1):
 *   - For financial categories, financial_context must satisfy the invariant.
 *   - On violation: the original write should be rejected by the caller, and
 *     a SelfAuditAlert (severity 'critical') is emitted with audit_depth+1.
 *
 * Returns { ok, id?, reason? }.
 */
export async function emitAuditEvent(opts) {
  const depth = Number(opts?.audit_depth) || 0;

  // §5 — entity guard: never self-audit AuditEvent
  if (opts?.entity_type === 'AuditEvent') {
    return { ok: false, reason: 'recursion_guard_entity' };
  }
  // §5 — depth guard
  if (depth >= MAX_AUDIT_DEPTH + 1) {
    return { ok: false, reason: 'recursion_guard_depth' };
  }

  const event_type = opts.event_type;
  if (!event_type) return { ok: false, reason: 'event_type_required' };

  // §6 — drop gated identity types
  if (GATED_EVENT_TYPES.has(event_type)) {
    return { ok: false, reason: 'event_type_gated_by_id_01' };
  }

  const event_category =
    opts.event_category || EVENT_TYPE_CATEGORY[event_type] || 'system';

  // §3 — financial events must carry financial_context and satisfy §3.1.
  if (FINANCIAL_CATEGORIES.has(event_category)) {
    const check = validateFinancialContext(opts.financial_context);
    if (!check.ok) {
      // §3.1 — accounting corruption. Emit a SelfAuditAlert at higher depth
      // so the alert itself doesn't recurse, and surface the failure to the
      // caller so the originating write can be rejected.
      try {
        await base44.entities.AuditEvent.create({
          venue_id: opts.venue_id || 'unknown',
          timestamp: new Date().toISOString(),
          event_type: 'SelfAuditAlert',
          event_category: 'system',
          severity: 'critical',
          mode: normalizeMode(opts.mode),
          session_id: opts.session_id || newId('sa'),
          correlation_id: opts.correlation_id,
          source: 'system',
          entity_type: opts.entity_type || 'unknown',
          entity_id: opts.entity_id || 'unknown',
          reason: check.reason,
          notes: { invariant: '§3.1', fc: opts.financial_context || null },
          alert: true,
          identity_verified: false,
          retention_class: 'compliance',
          event_version: AUDIT_EVENT_VERSION,
        });
      } catch (_) { /* alert write failure is non-blocking */ }
      return { ok: false, reason: check.reason, severity: 'critical' };
    }
  }

  // Build the row. Identity is GATED (§6).
  const row = {
    venue_id: opts.venue_id || 'unknown',
    timestamp: new Date().toISOString(),
    event_type,
    event_category,
    severity: opts.severity || 'low',
    mode: normalizeMode(opts.mode),
    session_id: opts.session_id || newId('s'),
    correlation_id: opts.correlation_id,
    source: opts.source || 'system',
    device: opts.device,
    workstation: opts.workstation,
    entity_type: opts.entity_type || 'unknown',
    entity_id: opts.entity_id || 'unknown',
    previous_value: opts.previous_value || null,
    new_value: opts.new_value || null,
    reason: opts.reason,
    notes: opts.notes,
    financial_context: opts.financial_context,
    actor_ref: opts.actor_ref,            // RAW ref — see identity_verified
    identity_verified: opts.identity_verified === true,  // §6 + WAVE 2: true only when gateway rebound
    approval_user_ref: opts.approval_user_ref,
    alert: !!opts.alert,
    retention_class: opts.retention_class || defaultRetention(event_category),
    event_version: AUDIT_EVENT_VERSION,
  };

  // DACO WAVE 2 — Persist identity metadata in notes for forensic trace.
  // claimed_actor_id is persisted SEPARATELY from verified_actor_id.
  const _identityMeta = {
    claimed_actor_id: opts.claimed_actor_id || null,
    verified_actor_id: opts.verified_actor_id || null,
    live_authenticated_email: opts.live_authenticated_email || null,
    verification_timestamp: opts.verification_timestamp || null,
    sovereign_override: !!opts.sovereign_override,
  };
  row.notes = row.notes && typeof row.notes === 'object'
    ? { ...row.notes, identity: _identityMeta }
    : { message: row.notes, identity: _identityMeta };

  try {
    const created = await base44.entities.AuditEvent.create(row);
    return { ok: true, id: created?.id };
  } catch (e) {
    // §5 — audit failure is non-blocking for the originating write. But we
    // still surface a SystemError attempt so the failure is visible.
    try {
      await base44.entities.AuditEvent.create({
        venue_id: row.venue_id,
        timestamp: new Date().toISOString(),
        event_type: 'SystemError',
        event_category: 'system',
        severity: 'high',
        mode: row.mode,
        session_id: row.session_id,
        source: 'system',
        entity_type: 'AuditEvent',
        entity_id: 'emit_failure',
        reason: `audit_write_failed: ${e.message}`,
        identity_verified: false,
        retention_class: 'security',
        event_version: AUDIT_EVENT_VERSION,
      });
    } catch (_) { /* swallow — already trying our best */ }
    return { ok: false, reason: `audit_write_failed: ${e.message}` };
  }
}

function defaultRetention(category) {
  if (category === 'financial' || category === 'payout' || category === 'glyphbucks' || category === 'cash' || category === 'card' || category === 'sales' || category === 'driver') {
    return 'financial';
  }
  if (category === 'security' || category === 'identity') return 'security';
  return 'operational';
}

/* ───────── DEFAULT EMITTER USED BY writeEntity() COVERAGE ─────────── */

/**
 * Derive a default AuditEvent from a writeEntity() call. Used to give the
 * gateway automatic coverage — callers that want a specific event_type and
 * financial_context should call emitAuditEvent() directly instead.
 */
export async function emitFromGatewayWrite({
  entity,
  operation,
  data,
  id,
  mode,
  venue_id,
  session_id,
  audit_depth,
  actor_ref,
  identity_verified,
  sovereign_override,
  claimed_actor_id,
  verified_actor_id,
  live_authenticated_email,
  verification_timestamp,
}) {
  // Guard: never self-audit AuditEvent writes (§5).
  if (entity === 'AuditEvent') return { ok: false, reason: 'recursion_guard_entity' };

  const defaults = ENTITY_EVENT_DEFAULTS[entity];
  if (!defaults) {
    // Unknown entity → still emit a low-severity PerformanceSnapshot so
    // coverage is automatic but we don't pretend to know financial impact.
    return emitAuditEvent({
      venue_id, mode, audit_depth,
      session_id: session_id || newId('gw'),
      event_type: 'PerformanceSnapshot',
      event_category: 'system',
      severity: 'low',
      source: 'system',
      entity_type: entity,
      entity_id: id || (data && data.id) || 'pending',
      new_value: operation === 'delete' ? null : (Array.isArray(data) ? { bulk_count: data.length } : data),
      notes: { gateway_op: operation },
      actor_ref,
      identity_verified,
      sovereign_override,
      claimed_actor_id,
      verified_actor_id,
      live_authenticated_email,
      verification_timestamp,
      retention_class: 'operational',
    });
  }

  return emitAuditEvent({
    venue_id, mode, audit_depth,
    session_id: session_id || newId('gw'),
    event_type: defaults.event_type,
    event_category: defaults.category,
    severity: 'low',
    source: 'system',
    entity_type: entity,
    entity_id: id || (data && data.id) || 'pending',
    new_value: operation === 'delete' ? null : (Array.isArray(data) ? { bulk_count: data.length } : data),
    notes: { gateway_op: operation },
    actor_ref,
    identity_verified,
    sovereign_override,
    claimed_actor_id,
    verified_actor_id,
    live_authenticated_email,
    verification_timestamp,
    retention_class: defaultRetention(defaults.category),
    // NOTE: no financial_context derived automatically — the §3 spec
    // requires explicit fields. Authoritative call sites that know the
    // payment split must call emitAuditEvent() directly with a full
    // financial_context. The gateway emission is observational coverage.
  });
}