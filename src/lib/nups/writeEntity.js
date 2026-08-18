import { base44 } from '@/api/base44Client';
import * as SEED from './demoSeedData';
import { logActivity } from './activityLog';
import { enforceRoleScope, isScopedRole } from './roleGate';
// BPAA-NUPS-AUDIT-001 §5 — automatic AuditEvent coverage on every gated write
import { emitFromGatewayWrite } from './audit/auditEventEmitter';
// DACO WAVE 2 — ID-01 identity rebind for every protected write
import { rebindIdentity, isIdentityCritical } from './identityRebind';
import { getActiveMode } from './modeResolver';
import { stampOperationalRecord, getOperatingMode } from './operatingMode';

import { saveLastReceipt } from '@/lib/nups/receiptService';
const VALID_MODES = new Set(['REAL', 'DEMO', 'SANDBOX']);

const FINANCIAL_ENTITIES = new Set([
  'POSTransaction',
  'POSBatch',
  'POSZReport',
  'PayrollRecord',
  'TipPayout',
  'GlyphBucksTransaction',
  'GlyphBucksOrder',
  'VenueContract',
  'DriverPayout',
  'DailySettlement',
  // BPAA-NUPS-ACCT-001 — double-entry GL
  'JournalEntry',
]);

const FINANCIAL_AUTHORIZED_ROLES = new Set([
  'PLATFORM_ADMIN',
  'VENUE_OWNER',
  'VENUE_MANAGER',
  'SOVEREIGN',
  'admin',    // Base44 platform admin — operational ops / testing the door
  'manager',  // generic manager alias used by some legacy paths
]);

const PROTECTED_ENTITIES = new Set(['SystemConfig', 'MigrationAuditLog']);

// Entities whose schemas carry an explicit is_demo marker. Mode is stamped on
// every ordinary entity; this additional flag makes destructive demo cleanup
// and cross-mode filtering deterministic instead of relying on names/notes.
const DEMO_FLAGGED_ENTITIES = new Set([
  'NUPSUser', 'POSTransaction', 'POSBatch', 'POSProduct', 'POSCustomer',
  'Entertainer', 'VIPGuest', 'VIPRoom', 'DriverProfile', 'DriverPayout',
  'StaffShift', 'EntertainerShift', 'VenueContract', 'PayrollRecord',
  'GlyphBucksBill', 'GlyphBucksTransaction', 'DailySettlement',
]);

const TRAINING_SESSION_ENTITIES = new Set([
  'POSTransaction', 'POSBatch', 'POSProduct', 'POSCustomer',
  'DriverProfile', 'DriverPayout',
]);

const DEMO_PRESENCE_CHECK_ENTITIES = [
  'NUPSUser',
  'POSTransaction',
  'POSBatch',
  'POSZReport',
  'TipPayout',
  'PayrollRecord',
  'GlyphBucksTransaction',
  'VenueContract',
];

const GLYPHBUCKS_FIELD_PATTERN = /glyph[_-]?bucks?/i;
const GLYPHBUCKS_FORBIDDEN_TARGETS = ['total_sales', 'subtotal', 'total'];

const TWO_CENTS = 0.02;
const approxEqual = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) <= TWO_CENTS;

const DEPRECATED_TIP_SPLIT = { staff: 0.7, hostess: 0.15, manager: 0.1, entertainer: 0.05 };

async function audit(entry, identity) {
  try {
    let notes = entry.notes;
    if (identity) {
      const meta = JSON.stringify(identity);
      notes = notes ? `${notes} | identity:${meta}` : `identity:${meta}`;
    }
    const created = await base44.entities.MigrationAuditLog.create({ ...entry, notes });
    return created?.id || null;
  } catch (e) {
    throw new Error(`audit_write_failed: ${e.message}`);
  }
}

function fieldsOf(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.keys(data);
}

function validateActor(actor) {
  if (!actor || typeof actor !== 'object') throw new Error('writeEntity: actor_required');
  const id = actor.id || actor.email;
  if (!id) throw new Error('writeEntity: actor_id_or_email_required');
  if (!actor.role) throw new Error('writeEntity: actor_role_required');
  return { actorId: id, role: actor.role };
}

function isActorSovereign(actor) {
  if (!actor) return false;
  if (actor.sovereign_flag === true) return true;
  if (actor.role === 'SOVEREIGN') return true;
  return false;
}

async function resolveMode(requestContextMode, venue_id) {
  if (requestContextMode) {
    if (!VALID_MODES.has(requestContextMode)) {
      throw new Error(`writeEntity: invalid_mode: ${requestContextMode}`);
    }
    return requestContextMode;
  }
  // One source of truth for UI, audit logging, and writes. getActiveMode reads
  // VenueRateConfig first and keeps SystemConfig only as a legacy fallback.
  return getActiveMode(venue_id);
}

function checkGlyphBucksLeakage(data) {
  if (!data || typeof data !== 'object') return null;
  for (const key of Object.keys(data)) {
    if (!GLYPHBUCKS_FIELD_PATTERN.test(key)) continue;
    const v = data[key];
    if (v === undefined || v === null || v === false || v === 0 || v === '') continue;
    if (GLYPHBUCKS_FORBIDDEN_TARGETS.includes(key)) {
      return `glyphbucks_field_forbidden_in_protected_target: ${key}`;
    }
  }
  for (const target of GLYPHBUCKS_FORBIDDEN_TARGETS) {
    const v = data[target];
    if (typeof v === 'string' && GLYPHBUCKS_FIELD_PATTERN.test(v)) {
      return `glyphbucks_value_forbidden_in: ${target}`;
    }
  }
  return null;
}

function validateFinancialRules(entity, data) {
  if (!data || typeof data !== 'object') return null;

  const gbLeak = checkGlyphBucksLeakage(data);
  if (gbLeak) return gbLeak;

  if (entity === 'POSZReport') {
    const cash = Number(data.cash_sales) || 0;
    const card = Number(data.card_sales) || 0;
    if (data.total_sales !== undefined) {
      const total = Number(data.total_sales);
      if (!approxEqual(total, cash + card)) {
        return `total_sales_must_equal_cash_plus_card: expected ${cash + card}, got ${total}`;
      }
    }
    if (data.tips_in_total === true) return 'tips_forbidden_in_total_sales';
  }

  // DACO-20260610 WS-2 — Same frozen rule for DailySettlement
  if (entity === 'DailySettlement') {
    const cash = Number(data.cash_sales) || 0;
    const card = Number(data.card_sales) || 0;
    if (data.total_sales !== undefined && data.total_sales !== null) {
      const total = Number(data.total_sales);
      if (!approxEqual(total, cash + card)) {
        return `settlement_total_sales_must_equal_cash_plus_card: expected ${cash + card}, got ${total}`;
      }
    }
  }

  if (entity === 'POSTransaction') {
    if (data.total !== undefined) {
      const sub = Number(data.subtotal) || 0;
      const tax = Number(data.tax) || 0;
      const tip = Number(data.tip) || 0;
      // Fees and discounts are real receipt lines — the invariant must account
      // for them or every card / promo sale is rejected before the receipt.
      const procFee = Number(data.processing_fee) || 0;
      const svcFee = Number(data.service_fee) || 0;
      const disc = Number(data.discount) || 0;
      const expected = sub + tax + tip + procFee + svcFee - disc;
      const total = Number(data.total);
      if (!approxEqual(total, expected)) {
        return `pos_total_must_equal_subtotal_plus_tax_fees_tip_minus_discount: expected ${expected}, got ${total}`;
      }
    }
  }

  if (entity === 'GlyphBucksTransaction') {
    if (data.amount === undefined || Number(data.amount) === 0) {
      return 'glyphbucks_amount_required_nonzero';
    }
    if (data.transaction_type === 'Issue' && !data.expires_at) {
      return 'glyphbucks_issue_requires_expires_at';
    }
  }

  if (entity === 'TipPayout') {
    const c = data.split_config || {};
    if (
      Number(c.staff) === DEPRECATED_TIP_SPLIT.staff &&
      Number(c.hostess) === DEPRECATED_TIP_SPLIT.hostess &&
      Number(c.manager) === DEPRECATED_TIP_SPLIT.manager &&
      Number(c.entertainer) === DEPRECATED_TIP_SPLIT.entertainer
    ) {
      return 'deprecated_70_15_10_5_split_forbidden';
    }
    if (c.bucket === 'BUCKET_1_STAFF_POOL' && Number(c.entertainer) > 0) {
      return 'entertainers_excluded_from_staff_pool';
    }
  }

  return null;
}

function stampGatewayRecord(entity, record, mode, venue_id, requestContext = {}) {
  if (!record || typeof record !== 'object') return record;
  const explicitValidation = requestContext?.validation_run === true;
  const transactional = entity === 'POSTransaction';
  const stamped = stampOperationalRecord(record, {
    ledgerMode: mode,
    operatingMode: getOperatingMode(mode, venue_id),
    venueId: venue_id,
    supportsDemoFlag: DEMO_FLAGGED_ENTITIES.has(entity),
    supportsTrainingSession: TRAINING_SESSION_ENTITIES.has(entity),
    transactional,
  });

  if (transactional) {
    const fundsOff = mode !== 'REAL' || explicitValidation;
    const isComp = String(stamped.payment_method || '').toLowerCase() === 'comp'
      || Number(stamped.comp_amount || 0) > 0;
    stamped.validation_run = fundsOff;
    // A real comp is a live accounting gap, not a settled tender. Non-live
    // transactions are always funds-off regardless of payment method.
    stamped.funds_settled = fundsOff ? false : !isComp;
  }
  return stamped;
}

async function writeEntityInternal({
  entity,
  operation,
  data,
  id,
  actor,
  intent,
  venue_id,
  requestContext,
}) {
  if (!entity) throw new Error('writeEntity: entity_required');
  if (!operation) throw new Error('writeEntity: operation_required');
  if (!base44.entities[entity]) throw new Error(`writeEntity: unknown_entity: ${entity}`);

  const { actorId, role } = validateActor(actor);

  // DACO WAVE 2 — ID-01: Live identity rebind before any protected write.
  // The claimed actor must match the live base44.auth.me() session, unless
  // SOVEREIGN override is explicitly authorized. Contaminated writes are
  // blocked with an auditable rejection trail.
  const rebind = await rebindIdentity(actor);

  // DACO WAVE 2 — Persist identity metadata separately for every audit trail.
  // claimed_actor_id (from caller) is persisted SEPARATELY from verified_actor_id
  // (from live base44.auth.me()). live_authenticated_email and verification_timestamp
  // are captured at rebind time for forensic trace.
  const identityContext = {
    claimed_actor_id: rebind.claimed_actor_id || actorId,
    verified_actor_id: rebind.verified_actor_id || (rebind.live && (rebind.live.id || rebind.live.email)) || null,
    live_authenticated_email: rebind.live_authenticated_email || (rebind.live && rebind.live.email) || null,
    verification_timestamp: rebind.verification_timestamp || null,
    sovereign_override: !!rebind.sovereign_override,
  };

  if (!rebind.ok) {
    const audit_id = await audit({
      entity_name: entity,
      operation,
      actor_id: actorId,
      actor_role: role,
      fields_changed: fieldsOf(data),
      mode: requestContext?.mode || 'REAL',
      tier: 'TIER_1_OBSERVE',
      result: 'blocked',
      block_reason: `identity_contamination_blocked: ${rebind.reason}`,
      venue_id: venue_id || null,
      notes: intent || null,
    }, identityContext);
    return {
      ok: false,
      audit_id,
      mode: requestContext?.mode || 'REAL',
      tier: 'TIER_1_OBSERVE',
      result: 'blocked',
      block_reason: `identity_contamination_blocked: ${rebind.reason}`,
    };
  }
  // Rebind succeeded — identity IS verified. sovereign_override is tracked
  // separately (still a verified rebind, just via the override path).
  const identity_verified = true;
  const sovereign_override = !!rebind.sovereign_override;
  const claimed_actor_id = identityContext.claimed_actor_id;
  const verified_actor_id = identityContext.verified_actor_id;
  const live_authenticated_email = identityContext.live_authenticated_email;
  const verification_timestamp = identityContext.verification_timestamp;
  const verifiedActorEmail = rebind.live.email;

  const mode = await resolveMode(requestContext?.mode, venue_id);
  const tier = 'TIER_1_OBSERVE';
  const isFinancial = FINANCIAL_ENTITIES.has(entity);
  const sovereign = isActorSovereign(actor);

  // DACO-20260613-DOOR-RBAC — role scope gate (DOOR_GIRL / DOORMAN). Runs
  // BEFORE the financial authorization check so scoped roles get a precise
  // rejection reason instead of the generic "role_not_authorized_in_REAL".
  // Sovereign bypasses (consistent with existing precedent).
  if (!sovereign) {
    const scopeReason = enforceRoleScope({ role, entity, operation, data, actor, mode });
    if (scopeReason) {
      const audit_id = await audit({
        entity_name: entity,
        operation,
        actor_id: actorId,
        actor_role: role,
        fields_changed: fieldsOf(data),
        mode,
        tier,
        result: 'blocked',
        block_reason: `role_scope_violation: ${scopeReason}`,
        venue_id: venue_id || null,
        notes: intent || null,
      }, identityContext);
      return { ok: false, audit_id, mode, tier, result: 'blocked', block_reason: `role_scope_violation: ${scopeReason}` };
    }
  }

  // Scoped roles (DOOR_GIRL / DOORMAN) have already been gated by
  // enforceRoleScope above with a stricter per-entity policy. Re-blocking
  // them here would void their explicit grant — skip the generic financial
  // roles check for them.
  if (mode === 'REAL' && isFinancial && !sovereign && !isScopedRole(role) && !FINANCIAL_AUTHORIZED_ROLES.has(role)) {
    const audit_id = await audit({
      entity_name: entity,
      operation,
      actor_id: actorId,
      actor_role: role,
      fields_changed: fieldsOf(data),
      mode,
      tier,
      result: 'blocked',
      block_reason: `role_not_authorized_in_REAL: ${role}`,
      venue_id: venue_id || null,
      notes: intent || null,
    }, identityContext);
    return { ok: false, audit_id, mode, tier, result: 'blocked', block_reason: `role_not_authorized_in_REAL: ${role}` };
  }

  if (isFinancial) {
    const records = operation === 'bulkCreate' ? (Array.isArray(data) ? data : []) : [data];
    if (operation === 'bulkCreate' && records.length === 0) {
      const audit_id = await audit({
        entity_name: entity,
        operation,
        actor_id: actorId,
        actor_role: role,
        fields_changed: [],
        mode,
        tier,
        result: 'blocked',
        block_reason: 'bulkCreate_requires_nonempty_array',
        venue_id: venue_id || null,
        notes: intent || null,
        }, identityContext);
      return { ok: false, audit_id, mode, tier, result: 'blocked', block_reason: 'bulkCreate_requires_nonempty_array' };
    }
    for (let i = 0; i < records.length; i += 1) {
      const reason = validateFinancialRules(entity, records[i]);
      if (reason) {
        const audit_id = await audit({
          entity_name: entity,
          operation,
          actor_id: actorId,
          actor_role: role,
          fields_changed: fieldsOf(records[i]),
          mode,
          tier,
          result: 'blocked',
          block_reason: `financial_rule_violation[${i}]: ${reason}`,
          venue_id: venue_id || null,
          notes: intent || null,
          }, identityContext);
        return {
          ok: false,
          audit_id,
          mode,
          tier,
          result: 'blocked',
          block_reason: `financial_rule_violation[${i}]: ${reason}`,
        };
      }
    }
  }

  // DACO WAVE 1 — Stamp mode on all entities EXCEPT protected entities
  // (SystemConfig manages its own mode field; MigrationAuditLog is audit-only).
  let stamped;
  if (PROTECTED_ENTITIES.has(entity)) {
    stamped = data;
  } else if (operation === 'bulkCreate') {
    stamped = (data || []).map((r) => stampGatewayRecord(entity, r, mode, venue_id, requestContext));
  } else if (operation === 'create' || operation === 'update') {
    stamped = stampGatewayRecord(entity, data, mode, venue_id, requestContext);
  } else {
    stamped = data;
  }

  let value = null;
  let writeError = null;
  try {
    if (operation === 'create') {
      value = await base44.entities[entity].create(stamped);
    } else if (operation === 'update') {
      if (!id) throw new Error('writeEntity: id_required_for_update');
      value = await base44.entities[entity].update(id, stamped);
    } else if (operation === 'delete') {
      if (!id) throw new Error('writeEntity: id_required_for_delete');
      value = await base44.entities[entity].delete(id);
    } else if (operation === 'bulkCreate') {
      value = await base44.entities[entity].bulkCreate(stamped);
    } else {
      throw new Error(`writeEntity: unknown_operation: ${operation}`);
    }
  } catch (e) {
    writeError = e;
  }

  if (writeError) {
    const audit_id = await audit({
      entity_name: entity,
      operation,
      actor_id: actorId,
      actor_role: role,
      fields_changed: fieldsOf(data),
      mode,
      tier,
      result: 'blocked',
      block_reason: `write_failed: ${writeError.message}`,
      venue_id: venue_id || null,
      notes: intent || null,
    }, identityContext);
    return { ok: false, audit_id, mode, tier, result: 'blocked', block_reason: `write_failed: ${writeError.message}` };
  }

  // The business write already succeeded. Post-write audit/mirror failures must
  // NEVER throw here — that would abandon the caller (no receipt, no feedback)
  // even though the record exists. They are recorded best-effort instead.
  let audit_id = null;
  try {
    audit_id = await audit({
      entity_name: entity,
      operation,
      actor_id: actorId,
      actor_role: role,
      fields_changed: fieldsOf(data),
      mode,
      tier,
      result: 'allowed',
      venue_id: venue_id || null,
      notes: intent || null,
    }, identityContext);
  } catch (e) { console.warn('post-write audit failed:', e); }

  // BPAA-NUPS-AUDIT-001 §5 — emit observational AuditEvent. Recursion guard
  // is inside the emitter (skips entity===AuditEvent and audit_depth>=max).
  // §5.4 — audit failure is NON-BLOCKING for the originating write.
  if (entity !== 'AuditEvent') {
    try {
      await emitFromGatewayWrite({
        entity,
        operation,
        data,
        id: id || (value && value.id) || null,
        mode,
        venue_id: venue_id || null,
        session_id: requestContext?.session_id,
        audit_depth: (requestContext?.audit_depth || 0),
        actor_ref: actorId,
        identity_verified,
        sovereign_override,
        claimed_actor_id,
        verified_actor_id,
        live_authenticated_email,
        verification_timestamp,
      });
    } catch (_) { /* observational only — never block the business write */ }
  }

  // DACO-20260610 WS-1: Mirror to ActivityLog (user-facing audit trail)
  const actionMap = { create: 'CREATE', update: 'UPDATE', delete: 'DELETE', bulkCreate: 'CREATE' };
  const action_type = actionMap[operation] || 'UPDATE';
  try {
    await logActivity({
      action_type,
      entity_affected: `${entity}${id ? ':' + id : ''}`,
      before_value: null,
      after_value: operation === 'delete' ? null : (Array.isArray(data) ? { bulk_count: data.length } : data),
      venue_id: venue_id || null,
      actor: { email: verifiedActorEmail, role },
      notes: intent || `gateway:${operation}`,
    });
  } catch (e) { console.warn('ActivityLog mirror failed:', e); }

  return { ok: true, audit_id, mode, tier, result: 'allowed', value };
}

export async function toggleMode({ actor, newMode, venue_id }) {
  validateActor(actor);
  if (!isActorSovereign(actor)) throw new Error('toggleMode: SOVEREIGN_REQUIRED');
  if (!VALID_MODES.has(newMode)) throw new Error(`toggleMode: invalid_mode: ${newMode}`);

  // DACO WAVE 2 — ID-01: Rebind SOVEREIGN actor to live session.
  const rebind = await rebindIdentity(actor);
  const identityContext = {
    claimed_actor_id: rebind.claimed_actor_id || actor.id || actor.email,
    verified_actor_id: rebind.verified_actor_id || (rebind.live && (rebind.live.id || rebind.live.email)) || null,
    live_authenticated_email: rebind.live_authenticated_email || (rebind.live && rebind.live.email) || null,
    verification_timestamp: rebind.verification_timestamp || null,
    sovereign_override: !!rebind.sovereign_override,
  };
  if (!rebind.ok) {
    await audit({
      entity_name: 'SystemConfig',
      operation: 'update',
      actor_id: actor.id || actor.email,
      actor_role: actor.role,
      fields_changed: ['mode'],
      mode: newMode,
      tier: 'TIER_1_OBSERVE',
      result: 'blocked',
      block_reason: `identity_contamination_blocked: ${rebind.reason}`,
      venue_id: venue_id || null,
      notes: `toggleMode BLOCKED -> ${newMode}`,
    }, identityContext);
    throw new Error(`toggleMode: identity_contamination_blocked: ${rebind.reason}`);
  }

  // DACO WAVE 1 — Per-venue toggle (if venue_id provided)
  if (venue_id) {
    const existing = await base44.entities.SystemConfig.filter({ venue_id, config_key: 'venue' });
    if (existing && existing.length > 1) {
      throw new Error(`toggleMode: SystemConfig_venue_duplicate: ${existing.length}_records_found`);
    }
    if (existing && existing.length === 1) {
      await base44.entities.SystemConfig.update(existing[0].id, { mode: newMode });
    } else {
      await base44.entities.SystemConfig.create({ config_key: 'venue', venue_id, mode: newMode });
    }
  } else {
    // Global toggle (legacy / fallback)
    const existing = await base44.entities.SystemConfig.filter({ config_key: 'global' });
    if (existing && existing.length > 1) {
      throw new Error(`toggleMode: SystemConfig_global_duplicate: ${existing.length}_records_found`);
    }
    if (existing && existing.length === 1) {
      await base44.entities.SystemConfig.update(existing[0].id, { mode: newMode });
    } else {
      await base44.entities.SystemConfig.create({ config_key: 'global', mode: newMode });
    }
  }

  await audit({
    entity_name: 'SystemConfig',
    operation: 'update',
    actor_id: actor.id || actor.email,
    actor_role: actor.role,
    fields_changed: ['mode'],
    mode: newMode,
    tier: 'TIER_1_OBSERVE',
    result: 'allowed',
    venue_id: venue_id || null,
    notes: `toggleMode -> ${newMode}${venue_id ? ` (venue: ${venue_id})` : ' (global)'}`,
  }, identityContext);

  return { ok: true, mode: newMode, venue_id: venue_id || null };
}

async function createMany(entityName, records, idKey) {
  const ent = base44.entities[entityName];
  if (!ent) return [];
  const ids = [];
  for (const r of records) {
    const row = await ent.create({ ...r, mode: 'DEMO' });
    ids.push(row?.[idKey] || row?.id);
  }
  return ids;
}

async function createOne(entityName, record) {
  const ent = base44.entities[entityName];
  if (!ent || !record) return null;
  const row = await ent.create({ ...record, mode: 'DEMO' });
  return row?.id || null;
}

export async function seedDemoEcosystem({ actor }) {
  validateActor(actor);
  if (!isActorSovereign(actor)) throw new Error('seedDemoEcosystem: SOVEREIGN_REQUIRED');

  // Auto-wipe: clear any prior DEMO data first (idempotent reseed)
  const wipe = await clearDemoEcosystem({ actor });
  const wiped = wipe?.removed || {};

  const venue_id = SEED.DEMO_VENUE_ID;
  const created = {};

  created.staff             = await createMany('NUPSUser',         SEED.STAFF.map(s => ({ ...s, venue_id, is_demo: true })));
  created.entertainers      = await createMany('Entertainer',      SEED.ENTERTAINERS.map(e => ({ ...e, venue_id })));
  created.products          = await createMany('POSProduct',       SEED.PRODUCTS.map(p => ({ ...p, venue_id, location_id: SEED.DEMO_LOCATION_ID })));
  created.customers         = await createMany('POSCustomer',      SEED.CUSTOMERS.map(c => ({ ...c, venue_id })));
  created.location          = await createOne('POSLocation',       SEED.LOCATION);
  created.batch             = await createOne('POSBatch',          SEED.BATCH);
  created.transactions      = await createMany('POSTransaction',   SEED.TRANSACTIONS);
  created.zReport           = await createOne('POSZReport',        SEED.Z_REPORT);
  created.tipPayout         = await createOne('TipPayout',         SEED.TIP_PAYOUT);
  created.vipRooms          = await createMany('VIPRoom',          SEED.VIP_ROOMS);
  created.vipGuests         = await createMany('VIPGuest',         SEED.VIP_GUESTS);
  created.venueContracts    = await createMany('VenueContract',    SEED.VENUE_CONTRACTS);
  created.glyphBucksTx      = await createOne('GlyphBucksTransaction', SEED.GLYPHBUCKS_TRANSACTION);
  created.glyphBucksBatch   = await createOne('GlyphBucksBatch',   SEED.GLYPHBUCKS_BATCH);
  created.glyphBucksBills   = await createMany('GlyphBucksBill',   SEED.GLYPHBUCKS_BILLS);
  created.glyphBucksOrder   = await createOne('GlyphBucksOrder',   SEED.GLYPHBUCKS_ORDER);
  created.entertainerShifts = await createMany('EntertainerShift', SEED.ENTERTAINER_SHIFTS);
  created.vipSessionReports = await createMany('VIPSessionReport', SEED.VIP_SESSION_REPORTS);
  created.vipContractRecords= await createMany('VIPContractRecord',SEED.VIP_CONTRACT_RECORDS);
  created.verificationMedia = await createMany('VerificationMedia',SEED.VERIFICATION_MEDIA);
  created.qrThreatLog       = await createOne('QRThreatLog',       SEED.QR_THREAT_LOG);
  created.driverPayout      = await createOne('DriverPayout',      SEED.DRIVER_PAYOUT);
  created.payrollRecords    = await createMany('PayrollRecord',    SEED.PAYROLL_RECORDS);
  created.dailySettlement   = await createOne('DailySettlement',   SEED.DAILY_SETTLEMENT);
  created.contractorPayout  = await createOne('ContractorPayout',  SEED.CONTRACTOR_PAYOUT);
  created.posCampaign       = await createOne('POSCampaign',       SEED.POS_CAMPAIGN);
  created.posInventoryBatch = await createOne('POSInventoryBatch', SEED.POS_INVENTORY_BATCH);

  await audit({
    entity_name: 'multi',
    operation: 'create',
    actor_id: actor.id || actor.email,
    actor_role: actor.role,
    fields_changed: Object.keys(created),
    mode: 'DEMO',
    tier: 'TIER_1_OBSERVE',
    result: 'allowed',
    venue_id,
    notes: `seedDemoEcosystem(realistic_night): wiped=${JSON.stringify(wiped)} created=${JSON.stringify(created)}`,
  });

  return { ok: true, mode: 'DEMO', venue_id, wiped, created };
}

export async function clearDemoEcosystem({ actor }) {
  validateActor(actor);
  if (!isActorSovereign(actor)) throw new Error('clearDemoEcosystem: SOVEREIGN_REQUIRED');

  const removed = {};
  const skipped = [];
  const allEntityNames = Object.keys(base44.entities || {});

  for (const entityName of allEntityNames) {
    if (PROTECTED_ENTITIES.has(entityName)) {
      skipped.push(entityName);
      continue;
    }
    const ent = base44.entities[entityName];
    if (!ent || typeof ent.filter !== 'function') continue;

    let rows;
    try {
      rows = await ent.filter({ mode: 'DEMO' });
    } catch {
      continue;
    }
    if (!rows || rows.length === 0) continue;

    let count = 0;
    for (const r of rows) {
      await ent.delete(r.id);
      count += 1;
    }
    removed[entityName] = count;
  }

  await audit({
    entity_name: 'multi',
    operation: 'delete',
    actor_id: actor.id || actor.email,
    actor_role: actor.role,
    fields_changed: Object.keys(removed),
    mode: 'DEMO',
    tier: 'TIER_1_OBSERVE',
    result: 'allowed',
    notes: `clearDemoEcosystem: removed=${JSON.stringify(removed)} skipped=${JSON.stringify(skipped)}`,
  });

  return { ok: true, removed, skipped };
}

function describeWriteEntityCall(args) {
  const first = args?.[0];
  const second = args?.[1];
  const third = args?.[2];
  const objectCall = first && typeof first === 'object' && !Array.isArray(first) ? first : null;
  const entityName = typeof first === 'string'
    ? first
    : objectCall?.entityName || objectCall?.entity || objectCall?.entity_name || '';
  const operation = typeof second === 'string'
    ? second
    : objectCall?.operation || objectCall?.op || 'create';
  const payload = (third && typeof third === 'object')
    ? third
    : (second && typeof second === 'object')
      ? second
      : objectCall?.data || objectCall?.payload || {};
  return {
    entityName: String(entityName || ''),
    operation: String(operation || ''),
    payload: payload || {},
    venueId: objectCall?.venue_id || payload?.venue_id || null,
  };
}

function dollarsToCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function centsFromRecord(source, centsKeys, dollarKeys) {
  for (const key of centsKeys) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return Math.round(value);
  }
  for (const key of dollarKeys) {
    const value = Number(source?.[key]);
    if (Number.isFinite(value)) return dollarsToCents(value);
  }
  return 0;
}

function receiptFromWrite(entityName, payload, result, venueId) {
  const normalized = String(entityName || '').toLowerCase();
  if (!/(postransaction|paymentrecord|receipt|glyphbuckssale|glyphbuckstransaction)/.test(normalized)) return null;
  if (!result?.ok) return null;

  const record = result?.value || result?.record || result?.data || result?.entity || {};
  const source = record && typeof record === 'object' ? { ...payload, ...record } : payload;
  const totalCents = centsFromRecord(
    source,
    ['total_cents', 'amount_cents', 'total_amount_cents', 'total_sales_cents', 'grand_total_cents'],
    ['total', 'amount', 'total_amount', 'total_sales', 'grand_total'],
  );
  const subtotalCents = centsFromRecord(
    source,
    ['subtotal_cents', 'net_cents'],
    ['subtotal', 'net'],
  ) || totalCents;
  const taxCents = centsFromRecord(source, ['tax_cents'], ['tax']);
  const feesCents = centsFromRecord(source, ['fee_cents', 'fees_cents'], ['fee', 'fees', 'processing_fee', 'service_fee']);
  const label = source.item_name || source.description || source.transaction_type || source.category || 'NUPS transaction';
  const environment = getOperatingMode(result?.mode || source.mode || 'REAL', venueId || source.venue_id);

  return {
    id: source.id || source.transaction_id,
    transaction_id: source.id || source.transaction_id,
    receipt_number: source.receipt_number || source.receipt_id || source.transaction_number || source.order_number || `NUPS-${Date.now()}`,
    venue_name: source.venue_name || 'NUPS Venue',
    operator_name: source.operator_name || source.cashier_name || source.cashier || source.created_by || '',
    created_at: source.created_at || source.created_date || new Date().toISOString(),
    payment_method: source.payment_method || source.tender_type || '',
    subtotal_cents: subtotalCents,
    tax_cents: taxCents,
    fees_cents: feesCents,
    total_cents: totalCents,
    lines: Array.isArray(source.lines) && source.lines.length
      ? source.lines
      : [{
          label,
          quantity: Number(source.quantity || 1) || 1,
          unit_price_cents: centsFromRecord(source, ['unit_price_cents'], ['unit_price', 'price']) || totalCents,
          total_cents: totalCents,
        }],
    environment,
    metadata: { entity_name: entityName, ledger_mode: result?.mode || source.mode || null },
  };
}

/**
 * Public gateway wrapper. The existing mode resolver and stampOperationalRecord
 * remain the single source of truth for LIVE, TRAINING, DEMO and SANDBOX data.
 * The wrapper only captures a printable receipt after a successful write.
 */
export async function writeEntity(...args) {
  const call = describeWriteEntityCall(args);
  const result = await writeEntityInternal(...args);

  try {
    if (/create|post|complete/i.test(call.operation)) {
      const receipt = receiptFromWrite(call.entityName, call.payload, result, call.venueId);
      if (receipt) saveLastReceipt(receipt);
    }
  } catch (receiptError) {
    // Receipt caching is non-blocking: a successful ledger write stays successful.
    console.warn('[NUPS receipt capture]', receiptError);
  }

  return result;
}
