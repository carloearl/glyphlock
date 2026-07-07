import { base44 } from '@/api/base44Client';
import * as SEED from './demoSeedData';
import { logActivity } from './activityLog';
import { enforceRoleScope, isScopedRole } from './roleGate';
// BPAA-NUPS-AUDIT-001 §5 — automatic AuditEvent coverage on every gated write
import { emitFromGatewayWrite } from './audit/auditEventEmitter';
// DACO WAVE 2 — ID-01 identity rebind for every protected write
import { rebindIdentity, isIdentityCritical } from './identityRebind';

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
  // DACO WAVE 1 — Layer 1: per-venue SystemConfig (if venue_id provided)
  if (venue_id) {
    try {
      const venueRows = await base44.entities.SystemConfig.filter({ venue_id, config_key: 'venue' });
      if (venueRows && venueRows.length === 1 && VALID_MODES.has(venueRows[0].mode)) {
        return venueRows[0].mode;
      }
      if (venueRows && venueRows.length > 1) {
        throw new Error(`writeEntity: SystemConfig_venue_duplicate: ${venueRows.length}_records_found`);
      }
    } catch (e) {
      if (e.message && e.message.includes('SystemConfig_venue_duplicate')) throw e;
      // Fall through to global on any other error
    }
  }
  // DACO WAVE 1 — Layer 2: global SystemConfig (fallback)
  const rows = await base44.entities.SystemConfig.filter({ config_key: 'global' });
  // Auto-bootstrap on first use. Throwing here blocks every write in the app
  // (door POS, settlements, payouts) on a fresh tenant. Default = REAL.
  if (!rows || rows.length === 0) {
    try {
      await base44.entities.SystemConfig.create({ config_key: 'global', mode: 'REAL' });
    } catch (e) {
      // Race: someone else just created it. Re-read below.
    }
    const after = await base44.entities.SystemConfig.filter({ config_key: 'global' });
    if (after && after.length === 1 && VALID_MODES.has(after[0].mode)) return after[0].mode;
    return 'REAL';
  }
  if (rows.length > 1) {
    throw new Error(`writeEntity: SystemConfig_global_duplicate: ${rows.length}_records_found`);
  }
  const m = rows[0].mode;
  if (!VALID_MODES.has(m)) throw new Error(`writeEntity: mode_invalid: ${m || 'null'}`);
  return m;
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
      const total = Number(data.total);
      if (!approxEqual(total, sub + tax + tip)) {
        return `pos_total_must_equal_subtotal_plus_tax_plus_tip: expected ${sub + tax + tip}, got ${total}`;
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

function injectMode(record, mode) {
  if (!record || typeof record !== 'object') return record;
  return { ...record, mode };
}

export async function writeEntity({
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
    const scopeReason = enforceRoleScope({ role, entity, operation, data, actor });
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
    stamped = (data || []).map((r) => injectMode(r, mode));
  } else if (operation === 'create' || operation === 'update') {
    stamped = injectMode(data, mode);
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

  const audit_id = await audit({
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
  await logActivity({
    action_type,
    entity_affected: `${entity}${id ? ':' + id : ''}`,
    before_value: null,
    after_value: operation === 'delete' ? null : (Array.isArray(data) ? { bulk_count: data.length } : data),
    venue_id: venue_id || null,
    actor: { email: verifiedActorEmail, role },
    notes: intent || `gateway:${operation}`,
  });

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