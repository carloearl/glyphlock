import { base44 } from '@/api/base44Client';

const VALID_MODES = new Set(['REAL', 'DEMO']);

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

async function audit(entry) {
  try {
    const created = await base44.entities.MigrationAuditLog.create(entry);
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

async function resolveMode(requestContextMode) {
  if (requestContextMode) {
    if (!VALID_MODES.has(requestContextMode)) {
      throw new Error(`writeEntity: invalid_mode: ${requestContextMode}`);
    }
    return requestContextMode;
  }
  const rows = await base44.entities.SystemConfig.filter({ config_key: 'global' });
  if (!rows || rows.length === 0) {
    throw new Error('writeEntity: SystemConfig_global_missing');
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
  const mode = await resolveMode(requestContext?.mode);
  const tier = 'TIER_1_OBSERVE';
  const isFinancial = FINANCIAL_ENTITIES.has(entity);
  const sovereign = isActorSovereign(actor);

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
      });
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

  let stamped;
  if (operation === 'bulkCreate') {
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
    });
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
  });

  return { ok: true, audit_id, mode, tier, result: 'allowed', value };
}

export async function toggleMode({ actor, newMode }) {
  validateActor(actor);
  if (!isActorSovereign(actor)) throw new Error('toggleMode: SOVEREIGN_REQUIRED');
  if (!VALID_MODES.has(newMode)) throw new Error(`toggleMode: invalid_mode: ${newMode}`);

  const existing = await base44.entities.SystemConfig.filter({ config_key: 'global' });
  if (existing && existing.length > 1) {
    throw new Error(`toggleMode: SystemConfig_global_duplicate: ${existing.length}_records_found`);
  }
  if (existing && existing.length === 1) {
    await base44.entities.SystemConfig.update(existing[0].id, { mode: newMode });
  } else {
    await base44.entities.SystemConfig.create({ config_key: 'global', mode: newMode });
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
    notes: `toggleMode -> ${newMode}`,
  });

  return { ok: true, mode: newMode };
}

export async function seedDemoEcosystem({ actor }) {
  validateActor(actor);
  if (!isActorSovereign(actor)) throw new Error('seedDemoEcosystem: SOVEREIGN_REQUIRED');

  for (const entityName of DEMO_PRESENCE_CHECK_ENTITIES) {
    if (!base44.entities[entityName]) continue;
    const rows = await base44.entities[entityName].filter({ mode: 'DEMO' });
    if (rows && rows.length > 0) {
      return { ok: false, reason: 'already_seeded', detected_in: entityName };
    }
  }

  const venue_id = 'DEMO_VENUE_001';
  const created = { staff: [], batches: [], transactions: [], tipPayouts: [] };

  const staffSeed = [
    { username: 'demo_mgr', full_name: 'Demo Manager', role: 'VENUE_MANAGER', pin: '1111', employee_id: 'MGR-DEMO-001' },
    { username: 'demo_bar', full_name: 'Demo Bartender', role: 'BARTENDER', pin: '2222', employee_id: 'BAR-DEMO-001' },
    { username: 'demo_door', full_name: 'Demo Door Girl', role: 'FLOOR_HOST', pin: '3333', employee_id: 'DOOR-DEMO-001' },
    { username: 'demo_host', full_name: 'Demo Hostess', role: 'FLOOR_HOST', pin: '4444', employee_id: 'HOST-DEMO-001' },
  ];
  for (const s of staffSeed) {
    const row = await base44.entities.NUPSUser.create({
      ...s,
      venue_id,
      is_demo: true,
      status: 'active',
      mode: 'DEMO',
    });
    created.staff.push(row.id);
  }

  const start = new Date();
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  const batch = await base44.entities.POSBatch.create({
    batch_id: `DEMO-BATCH-${Date.now()}`,
    venue_id,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    opening_cash: 300,
    closing_cash: 845,
    total_sales: 545,
    transaction_count: 2,
    cashier: 'demo_bar',
    status: 'closed',
    mode: 'DEMO',
  });
  created.batches.push(batch.id);

  const tx1 = await base44.entities.POSTransaction.create({
    transaction_id: `DEMO-TX-${Date.now()}-A`,
    venue_id,
    items: [{ product_name: 'Demo Beer', quantity: 2, price: 12, total: 24 }],
    subtotal: 24,
    tax: 1.92,
    tip: 5,
    total: 30.92,
    payment_method: 'Cash',
    cashier: 'demo_bar',
    status: 'completed',
    mode: 'DEMO',
  });
  created.transactions.push(tx1.id);

  const tx2 = await base44.entities.POSTransaction.create({
    transaction_id: `DEMO-TX-${Date.now()}-B`,
    venue_id,
    items: [{ product_name: 'Demo Cocktail', quantity: 1, price: 18, total: 18 }],
    subtotal: 18,
    tax: 1.44,
    tip: 4,
    total: 23.44,
    payment_method: 'Credit Card',
    cashier: 'demo_bar',
    status: 'completed',
    mode: 'DEMO',
  });
  created.transactions.push(tx2.id);

  const tipPayout = await base44.entities.TipPayout.create({
    payout_date: new Date().toISOString().slice(0, 10),
    venue_id,
    total_tips: 200,
    split_config: {
      bucket: 'BUCKET_1_STAFF_POOL',
      manager: 0.30,
      hostess: 0.20,
      asst_manager: 0.10,
      dj: 0.10,
      security_doorman_remainder: 0.30,
    },
    signatures: [],
    manager_email: actor.email || actor.id,
    status: 'pending',
    mode: 'DEMO',
  });
  created.tipPayouts.push(tipPayout.id);

  await audit({
    entity_name: 'multi',
    operation: 'create',
    actor_id: actor.id || actor.email,
    actor_role: actor.role,
    fields_changed: ['staff', 'batches', 'transactions', 'tipPayouts'],
    mode: 'DEMO',
    tier: 'TIER_1_OBSERVE',
    result: 'allowed',
    venue_id,
    notes: `seedDemoEcosystem: ${JSON.stringify(created)}`,
  });

  return { ok: true, mode: 'DEMO', venue_id, created };
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