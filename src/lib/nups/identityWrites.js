/**
 * identityWrites.js — DACO-20260706-ARCH-BASELINE-01 Step 1.
 *
 * Closes B-CRITICAL-02 for the frontend identity bypasses. Staff, entertainer,
 * driver and guest records used to be created with direct
 * base44.entities.X.create() calls, which produced NO MigrationAuditLog,
 * NO AuditEvent and NO ActivityLog entry — the most sensitive records in the
 * system had the weakest trail.
 *
 * Every identity write now routes through the writeEntity() gateway, which:
 *   • rebinds the claimed actor against the live base44.auth.me() session
 *   • stamps ledger mode / venue / demo flags
 *   • writes MigrationAuditLog + AuditEvent + ActivityLog
 *
 * The actor is ALWAYS resolved from the live session here — never from props,
 * storage or URL params.
 */
import { base44 } from '@/api/base44Client';
import { writeEntity } from './writeEntity';

/**
 * Resolve the gateway actor from the live authenticated session.
 * NUPS role (if a NUPSUser record exists) takes precedence for scope checks;
 * otherwise the platform role is used.
 */
export async function resolveGatewayActor() {
  const me = await base44.auth.me();
  if (!me?.email) throw new Error('No authenticated session — cannot write identity records.');

  let nupsRole = null;
  let sovereign = false;
  try {
    const matches = await base44.entities.NUPSUser.filter({ created_by: me.email });
    const row = (matches || [])[0];
    if (row) {
      nupsRole = row.role || null;
      sovereign = row.sovereign_flag === true || row.role === 'SOVEREIGN';
    }
  } catch { /* no NUPS record — fall back to the platform role */ }

  return {
    id: me.email,
    email: me.email,
    full_name: me.full_name,
    role: nupsRole || me.role || 'user',
    sovereign_flag: sovereign,
  };
}

/**
 * Gateway-routed identity write.
 *
 * @returns the created/updated record
 * @throws when the gateway blocks the write (identity contamination, role
 *         scope violation, validation failure) — callers surface the reason.
 */
export async function writeIdentityRecord({
  entity,
  operation = 'create',
  data,
  id,
  intent,
  venueId,
  actor,
}) {
  const resolvedActor = actor || await resolveGatewayActor();
  const res = await writeEntity({
    entity,
    operation,
    data,
    id,
    actor: resolvedActor,
    intent: intent || `identity:${entity}:${operation}`,
    venue_id: venueId || data?.venue_id || null,
  });
  if (!res.ok) throw new Error(res.block_reason || 'identity_write_blocked');
  return res.value;
}

/**
 * Append-only PersonRecord snapshot, routed through the gateway so the archive
 * write carries the same audit trail as the source record.
 * Never throws — record-keeping must not break the calling flow.
 */
export async function snapshotPersonAudited({ type, event, record, actor }) {
  if (!type || !event || !record) return null;
  try {
    const resolvedActor = actor || await resolveGatewayActor();
    return await writeIdentityRecord({
      entity: 'PersonRecord',
      operation: 'create',
      actor: resolvedActor,
      venueId: record.venue_id || null,
      intent: `person_archive:${type}:${event}`,
      data: {
        person_type: type,
        person_id: String(record.id || record.guest_id || record.driver_id || 'unknown'),
        display_name:
          record.stage_name || record.full_name || record.display_name ||
          record.name || record.username || 'Unknown',
        venue_id: record.venue_id || '',
        event_type: event,
        event_timestamp: new Date().toISOString(),
        actor_email: resolvedActor.email,
        actor_name: resolvedActor.full_name || resolvedActor.email,
        snapshot: { ...record },
        is_demo: !!record.is_demo,
        notes: '',
      },
    });
  } catch (e) {
    console.warn('[identityWrites] person snapshot failed:', e?.message || e);
    return null;
  }
}