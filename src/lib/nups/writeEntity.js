// DACO OMEGA v6.0 — Phase 4: writeEntity() gateway (hardened)

import { base44 } from '@/api/base44Client';
import { getMode } from '@/lib/nups/modeResolver';
import { isSovereign } from '@/lib/nups/sovereign';

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
]);

const FINANCIAL_AUTHORIZED_ROLES = new Set([
  'PLATFORM_ADMIN',
  'VENUE_OWNER',
  'VENUE_MANAGER',
  'SOVEREIGN',
]);

const TWO_CENTS = 0.02;
const approxEqual = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) <= TWO_CENTS;

const DEPRECATED_TIP_SPLIT = { staff: 0.7, hostess: 0.15, manager: 0.1, entertainer: 0.05 };

async function audit(entry) {
  try {
    const created = await base44.entities.MigrationAuditLog.create(entry);
    return created?.id || null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[writeEntity] MigrationAuditLog write failed', e);
    return null;
  }
}

function fieldsOf(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.keys(data);
}

function validateActor(actor) {
  if (!actor || typeof actor !== 'object') return 'actor_required';
  const id = actor.id || actor.email;
  if (!id) return 'actor_id_or_email_required';
  if (!actor.role) return 'actor_role_required';
  return null;
}

/**
 * Frozen financial invariants. Returns null if valid, or a string reason if invalid.
 * Applies per-record. Bulk validation calls this for every record.
 */
function validateFinancialRules(entity, data) {
  if (!data || typeof data !== 'object') return null;

  // POSZReport: total_sales = cash_sales + card_sales (REAL transactions only).
  if (entity === 'POSZReport') {
    const cash = Number(data.cash_sales) || 0;
    const card = Number(data.card_sales) || 0;
    const total = Number(data.total_sales);
    if (data.total_sales !== undefined && !approxEqual(total, cash + card)) {
      return `total_sales_mismatch: expected ${cash + card}, got ${total}`;
    }
    // GlyphBucks must never appear in total_sales
    if (data.glyphbucks_in_total === true) {
      return 'glyphbucks_must_not_be_in_total_sales';
    }
  }

  // GlyphBucksTransaction: amount required, non-zero, must carry expires_at on Issue.
  if (entity === 'GlyphBucksTransaction') {
    if (data.amount === undefined || Number(data.amount) === 0) {
      return 'glyphbucks_amount_required_nonzero';
    }
    if (data.transaction_type === 'Issue' && !data.expires_at) {
      return 'glyphbucks_issue_requires_expires_at';
    }
  }

  // TipPayout: deprecated 70/15/10/5 split is forbidden; entertainers excluded from staff pool.
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

  // POSTransaction: total >= subtotal + tax (tip optional, additive).
  if (entity === 'POSTransaction') {
    const sub = Number(data.subtotal) || 0;
    const tax = Number(data.tax) || 0;
    const tip = Number(data.tip) || 0;
    const total = Number(data.total);
    if (data.total !== undefined && total + TWO_CENTS < sub + tax + tip - TWO_CENTS) {
      return `pos_total_mismatch: expected >= ${sub + tax + tip}, got ${total}`;
    }
  }

  return null;
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
  if (!entity) throw new Error('writeEntity: entity required');
  if (!operation) throw new Error('writeEntity: operation required');

  // 3. Actor identity required
  const actorErr = validateActor(actor);
  if (actorErr) throw new Error(`writeEntity: ${actorErr}`);

  // 2. Mandatory mode validation
  let mode;
  if (requestContext?.mode) {
    if (!VALID_MODES.has(requestContext.mode)) {
      throw new Error(`writeEntity: invalid mode in requestContext: ${requestContext.mode}`);
    }
    mode = requestContext.mode;
  } else {
    mode = await getMode();
    if (!VALID_MODES.has(mode)) throw new Error(`writeEntity: resolver returned invalid mode: ${mode}`);
  }

  const tier = 'TIER_1_OBSERVE';
  const isFinancial = FINANCIAL_ENTITIES.has(entity);
  const sovereign = isSovereign(actor);
  const role = actor.role;
  const actorId = actor.id || actor.email;

  // REAL-mode role guard
  if (mode === 'REAL' && isFinancial && !sovereign && !FINANCIAL_AUTHORIZED_ROLES.has(role)) {
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
    });
    return { ok: false, audit_id, mode, tier, result: 'blocked', block_reason: `role_not_authorized_in_REAL: ${role}` };
  }

  // 1 & 4. Financial rules — per record (incl. bulkCreate).
  if (isFinancial) {
    const records = operation === 'bulkCreate' ? (Array.isArray(data) ? data : []) : [data];
    if (operation === 'bulkCreate' && records.length === 0) {
      throw new Error('writeEntity: bulkCreate requires non-empty array');
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
        });
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

  // Perform write
  let value = null;
  let error = null;
  try {
    if (operation === 'create') {
      value = await base44.entities[entity].create(data);
    } else if (operation === 'update') {
      if (!id) throw new Error('writeEntity: id required for update');
      value = await base44.entities[entity].update(id, data);
    } else if (operation === 'delete') {
      if (!id) throw new Error('writeEntity: id required for delete');
      value = await base44.entities[entity].delete(id);
    } else if (operation === 'bulkCreate') {
      value = await base44.entities[entity].bulkCreate(data);
    } else {
      throw new Error(`writeEntity: unknown operation ${operation}`);
    }
  } catch (e) {
    error = e;
  }

  // 5. No "warned" success — failures are blocked.
  if (error) {
    const audit_id = await audit({
      entity_name: entity,
      operation,
      actor_id: actorId,
      actor_role: role,
      fields_changed: fieldsOf(data),
      mode,
      tier,
      result: 'blocked',
      block_reason: `write_failed: ${error.message}`,
      venue_id: venue_id || null,
      notes: intent || null,
    });
    return { ok: false, audit_id, mode, tier, result: 'blocked', block_reason: `write_failed: ${error.message}` };
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
  });

  return { ok: true, audit_id, mode, tier, result: 'allowed', value };
}

/**
 * Direct-write bypass logger (legacy migration aid). Records as 'blocked'
 * since "warned" is no longer a success state — this is informational only.
 */
export async function logDirectWriteBypass({ entity, operation, actor, intent, venue_id }) {
  const actorErr = validateActor(actor);
  if (actorErr) throw new Error(`logDirectWriteBypass: ${actorErr}`);
  return audit({
    entity_name: entity,
    operation,
    actor_id: actor.id || actor.email,
    actor_role: actor.role,
    fields_changed: [],
    mode: await getMode(),
    tier: 'TIER_1_OBSERVE',
    result: 'blocked',
    block_reason: 'direct_write_bypass',
    venue_id: venue_id || null,
    notes: intent || 'legacy_direct_write',
  });
}