// DACO OMEGA v6.0 — Phase 4: writeEntity() gateway
//
// TIER_1_OBSERVE: warn-only on bypass; financial guard active in REAL mode.
//
// Usage:
//   const r = await writeEntity({
//     entity: 'POSTransaction',
//     operation: 'create',
//     data: {...},
//     actor: { id, role, sovereign_flag, email },
//     intent: 'shift_close',
//     venue_id: '...'
//   });
//
//   r => { ok, audit_id, mode, tier, result, value, block_reason? }

import { base44 } from '@/api/base44Client';
import { getMode } from '@/lib/nups/modeResolver';
import { isSovereign } from '@/lib/nups/sovereign';

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

async function audit(entry) {
  try {
    const created = await base44.entities.MigrationAuditLog.create(entry);
    return created?.id || null;
  } catch (e) {
    // Never swallow silently in dev console; audit failures must be visible.
    // eslint-disable-next-line no-console
    console.error('[writeEntity] MigrationAuditLog write failed', e);
    return null;
  }
}

function fieldsOf(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.keys(data);
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

  const mode = await getMode(requestContext);
  const tier = 'TIER_1_OBSERVE';
  const isFinancial = FINANCIAL_ENTITIES.has(entity);
  const sovereign = isSovereign(actor);
  const role = actor?.role || 'UNKNOWN';

  // Financial guard: REAL mode + financial entity + non-authorized role => block.
  if (
    mode === 'REAL' &&
    isFinancial &&
    !sovereign &&
    !FINANCIAL_AUTHORIZED_ROLES.has(role)
  ) {
    const audit_id = await audit({
      entity_name: entity,
      operation,
      actor_id: actor?.id || actor?.email || 'unknown',
      actor_role: role,
      fields_changed: fieldsOf(data),
      mode,
      tier,
      result: 'blocked',
      block_reason: `role_not_authorized_in_REAL: ${role}`,
      venue_id: venue_id || null,
      notes: intent || null,
    });
    return {
      ok: false,
      audit_id,
      mode,
      tier,
      result: 'blocked',
      block_reason: `role_not_authorized_in_REAL: ${role}`,
    };
  }

  // Perform the actual write through the standard SDK.
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

  const audit_id = await audit({
    entity_name: entity,
    operation,
    actor_id: actor?.id || actor?.email || 'unknown',
    actor_role: role,
    fields_changed: fieldsOf(data),
    mode,
    tier,
    result: error ? 'warned' : 'allowed',
    warning_reason: error ? `write_failed: ${error.message}` : null,
    venue_id: venue_id || null,
    notes: intent || null,
  });

  if (error) {
    return { ok: false, audit_id, mode, tier, result: 'warned', error: error.message };
  }
  return { ok: true, audit_id, mode, tier, result: 'allowed', value };
}

/**
 * Optional helper: log a direct-write bypass when legacy code chooses not
 * to migrate. Call this manually next to a legacy direct write.
 */
export async function logDirectWriteBypass({ entity, operation, actor, intent, venue_id }) {
  return audit({
    entity_name: entity,
    operation,
    actor_id: actor?.id || actor?.email || 'unknown',
    actor_role: actor?.role || 'UNKNOWN',
    fields_changed: [],
    mode: await getMode(),
    tier: 'TIER_1_OBSERVE',
    result: 'warned',
    warning_reason: 'direct_write_bypass',
    venue_id: venue_id || null,
    notes: intent || 'legacy_direct_write',
  });
}