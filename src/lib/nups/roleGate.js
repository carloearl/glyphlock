/**
 * DACO-20260613-DOOR-RBAC — Server-side role scope enforcement.
 *
 * Wired into lib/nups/writeEntity.js — every write that passes through the
 * gateway is checked against the per-role policy matrix BEFORE the financial
 * rules check. Denials produce a MigrationAuditLog 'blocked' row and a clear
 * block_reason returned to the caller (the UI surfaces it as a rejection,
 * NOT a hidden button).
 *
 * Frozen rules:
 *   • DOOR_GIRL can only write POSTransaction at station='door' with
 *     validation_run=true and funds_settled=false. All other entity writes
 *     are denied at the gateway.
 *   • Settlement lock authority remains Manager / Settlement Lead ONLY.
 *   • Sovereign / admin / manager roles are NOT scoped here — they pass
 *     through to the existing financial-authorization check.
 */

// Roles that are gated by this module. Any role not listed here is passed
// through to the downstream financial check unchanged.
const SCOPED_ROLES = new Set(['DOOR_GIRL', 'DOORMAN']);

// Per-role policy. For each entity, list the allowed operations. An entity
// not present in the map means the role CANNOT write to it at all.
const POLICY = {
  DOOR_GIRL: {
    POSTransaction: {
      create: (data) =>
        data?.station === 'door' &&
        data?.validation_run === true &&
        data?.funds_settled === false
          ? null
          : 'door_girl_pos_requires_station_door_and_validation_run_true_and_funds_settled_false',
    },
    StaffShift: {
      create: (data, actor) =>
        data?.user_email && actor?.email &&
        String(data.user_email).toLowerCase() === String(actor.email).toLowerCase()
          ? null
          : 'door_girl_can_only_create_own_StaffShift',
      update: (data, actor) =>
        data?.user_email && actor?.email &&
        String(data.user_email).toLowerCase() === String(actor.email).toLowerCase()
          ? null
          : 'door_girl_can_only_update_own_StaffShift',
    },
    VIPGuest:    { create: () => null, update: () => null },
    ActivityLog: { create: () => null },
  },
  DOORMAN: {
    // Doorman handles onboarding — driver + guest. NO door POS writes.
    DriverPayout: { create: () => null, update: () => null },
    VIPGuest:     { create: () => null, update: () => null },
    StaffShift: {
      create: (data, actor) =>
        data?.user_email && actor?.email &&
        String(data.user_email).toLowerCase() === String(actor.email).toLowerCase()
          ? null
          : 'doorman_can_only_create_own_StaffShift',
      update: (data, actor) =>
        data?.user_email && actor?.email &&
        String(data.user_email).toLowerCase() === String(actor.email).toLowerCase()
          ? null
          : 'doorman_can_only_update_own_StaffShift',
    },
    ActivityLog: { create: () => null },
  },
};

/**
 * Returns null when the (role, entity, operation, data) tuple is permitted,
 * or a string reason when it is denied.
 */
export function enforceRoleScope({ role, entity, operation, data, actor }) {
  if (!role) return null;
  if (!SCOPED_ROLES.has(role)) return null; // not gated by this module

  const rolePolicy = POLICY[role];
  if (!rolePolicy) return `role_has_no_policy: ${role}`;

  const entityPolicy = rolePolicy[entity];
  if (!entityPolicy) return `entity_outside_${role}_scope: ${entity}`;

  const opCheck = entityPolicy[operation];
  if (!opCheck) return `operation_outside_${role}_scope: ${entity}.${operation}`;

  const reason = opCheck(data, actor);
  return reason || null;
}

export const __INTERNAL__ = { SCOPED_ROLES, POLICY };