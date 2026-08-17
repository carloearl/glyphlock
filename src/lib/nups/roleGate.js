/**
 * DACO-20260613-DOOR-RBAC — Server-side role scope enforcement.
 *
 * Wired into lib/nups/writeEntity.js — every write that passes through the
 * gateway is checked against the per-role policy matrix BEFORE the financial
 * rules check. Denials produce a MigrationAuditLog 'blocked' row and a clear
 * block_reason returned to the caller (the UI surfaces it as a rejection,
 * NOT a hidden button).
 *
 * Operational rules:
 *   • DOOR_GIRL can only create POSTransaction rows at station='door'.
 *   • In REAL mode the row must be booked (validation_run=false,
 *     funds_settled=true). In DEMO/SANDBOX it must be funds-off
 *     (validation_run=true, funds_settled=false).
 *   • All other entity writes remain denied unless explicitly listed.
 *   • Settlement lock authority remains Manager / Settlement Lead ONLY.
 *   • Sovereign / admin / manager roles are NOT scoped here — they pass
 *     through to the existing financial-authorization check.
 */

// Roles that are gated by this module. Any role not listed here is passed
// through to the downstream financial check unchanged.
const SCOPED_ROLES = new Set([
  'DOOR_GIRL', 'DOORMAN', 'BARTENDER', 'FLOOR_HOST', 'HOSTESS', 'VIP_HOSTESS',
]);

const transactionRuleForStation = (station) => (data, _actor, mode) => {
  if (data?.station !== station) return `${station}_operator_pos_requires_station_${station}`;
  if (mode === 'REAL') {
    return data?.validation_run === false && data?.funds_settled === true
      ? null
      : `live_${station}_sale_requires_validation_run_false_and_funds_settled_true`;
  }
  return data?.validation_run === true && data?.funds_settled === false
    ? null
    : `nonlive_${station}_sale_requires_validation_run_true_and_funds_settled_false`;
};

const ownShiftCreate = (data, actor, roleName) =>
  data?.user_email && actor?.email &&
  String(data.user_email).toLowerCase() === String(actor.email).toLowerCase()
    ? null
    : `${roleName}_can_only_create_own_StaffShift`;

const ownShiftUpdate = (data, actor, roleName) =>
  data?.user_email && actor?.email &&
  String(data.user_email).toLowerCase() === String(actor.email).toLowerCase()
    ? null
    : `${roleName}_can_only_update_own_StaffShift`;

// Per-role policy. For each entity, list the allowed operations. An entity
// not present in the map means the role CANNOT write to it at all.
const POLICY = {
  DOOR_GIRL: {
    POSTransaction: { create: transactionRuleForStation('door') },
    StaffShift: {
      create: (data, actor) => ownShiftCreate(data, actor, 'door_girl'),
      update: (data, actor) => ownShiftUpdate(data, actor, 'door_girl'),
    },
    VIPGuest:    { create: () => null, update: () => null },
    ActivityLog: { create: () => null },
  },
  DOORMAN: {
    // Doorman handles onboarding — driver + guest. NO door POS writes.
    DriverPayout: { create: () => null, update: () => null },
    VIPGuest:     { create: () => null, update: () => null },
    StaffShift: {
      create: (data, actor) => ownShiftCreate(data, actor, 'doorman'),
      update: (data, actor) => ownShiftUpdate(data, actor, 'doorman'),
    },
    ActivityLog: { create: () => null },
  },
  BARTENDER: {
    POSTransaction: { create: transactionRuleForStation('bar') },
    StaffShift: {
      create: (data, actor) => ownShiftCreate(data, actor, 'bartender'),
      update: (data, actor) => ownShiftUpdate(data, actor, 'bartender'),
    },
    ActivityLog: { create: () => null },
  },
  FLOOR_HOST: {
    POSTransaction: { create: transactionRuleForStation('vip') },
    StaffShift: {
      create: (data, actor) => ownShiftCreate(data, actor, 'floor_host'),
      update: (data, actor) => ownShiftUpdate(data, actor, 'floor_host'),
    },
    VIPGuest: { create: () => null, update: () => null },
    ActivityLog: { create: () => null },
  },
  HOSTESS: {
    POSTransaction: { create: transactionRuleForStation('vip') },
    StaffShift: {
      create: (data, actor) => ownShiftCreate(data, actor, 'hostess'),
      update: (data, actor) => ownShiftUpdate(data, actor, 'hostess'),
    },
    VIPGuest: { create: () => null, update: () => null },
    ActivityLog: { create: () => null },
  },
  VIP_HOSTESS: {
    POSTransaction: { create: transactionRuleForStation('vip') },
    StaffShift: {
      create: (data, actor) => ownShiftCreate(data, actor, 'vip_hostess'),
      update: (data, actor) => ownShiftUpdate(data, actor, 'vip_hostess'),
    },
    VIPGuest: { create: () => null, update: () => null },
    ActivityLog: { create: () => null },
  },
};

/**
 * Returns null when the (role, entity, operation, data) tuple is permitted,
 * or a string reason when it is denied.
 */
export function enforceRoleScope({ role, entity, operation, data, actor, mode }) {
  if (!role) return null;
  if (!SCOPED_ROLES.has(role)) return null; // not gated by this module

  const rolePolicy = POLICY[role];
  if (!rolePolicy) return `role_has_no_policy: ${role}`;

  const entityPolicy = rolePolicy[entity];
  if (!entityPolicy) return `entity_outside_${role}_scope: ${entity}`;

  const opCheck = entityPolicy[operation];
  if (!opCheck) return `operation_outside_${role}_scope: ${entity}.${operation}`;

  const reason = opCheck(data, actor, mode);
  return reason || null;
}

/**
 * Returns true if `role` is gated by this module (has a specific per-entity
 * policy). Used by the writeEntity gateway to skip the generic
 * FINANCIAL_AUTHORIZED_ROLES check once enforceRoleScope has approved the
 * write — otherwise a DOOR_GIRL would pass scope ("yes, door girls may write
 * a validation-run cover at the door") and then immediately get re-blocked by
 * the financial-roles check ("DOOR_GIRL not in [PLATFORM_ADMIN, ...]").
 */
export function isScopedRole(role) {
  return SCOPED_ROLES.has(role);
}

export const __INTERNAL__ = { SCOPED_ROLES, POLICY };