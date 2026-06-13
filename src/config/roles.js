// NUPS RBAC Configuration — BPAAA v3.0
// GlyphLock LLC | §9.2 Role-Based Access Control

export const ROLES = {
  MANAGER: 'manager',
  BARTENDER: 'bartender',
  DOOR_GIRL: 'door_girl',
  HOSTESS: 'hostess',
  SECURITY: 'security',
  DJ: 'dj',
};

export const PERMISSIONS = {
  ACCESS_POS: ['manager', 'bartender', 'door_girl'],
  ACCESS_VIP_ROOMS: ['manager', 'hostess'],
  ACCESS_Z_REPORTS: ['manager'],
  ACCESS_BATCH_MANAGEMENT: ['manager'],
  ACCESS_FINANCIAL_OVERVIEW: ['manager'],
  MANAGE_ENTERTAINERS: ['manager'],
  MANAGE_STAFF: ['manager'],
  CLOCK_IN_OUT: ['manager', 'bartender', 'door_girl', 'hostess', 'security', 'dj'],
  ACCESS_DJ_APP: ['manager', 'dj'],
  APPLY_DISCOUNTS: ['manager', 'bartender', 'door_girl'],
  VOID_TRANSACTIONS: ['manager'],
  ACCESS_AUDIT_LOG: ['manager'],
  ACCESS_INVENTORY: ['manager'],
  ACCESS_MARKETING: ['manager'],
  ACCESS_PAYROLL: ['manager'],
  ACCESS_RBAC: ['manager'],
};

export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  // Accept both canonical RBAC roles (lowercase) and NUPS roles (uppercase) — auto-map uppercase
  const canonical = userRole === userRole.toLowerCase()
    ? userRole
    : mapNUPSRoleToRBAC(userRole);
  return PERMISSIONS[permission]?.includes(canonical) ?? false;
};

/**
 * Map NUPS internal role strings to the 6 canonical RBAC roles.
 * NUPSUser.role values: PLATFORM_ADMIN, VENUE_OWNER, VENUE_MANAGER,
 * FLOOR_HOST, PERFORMER, BARTENDER, SECURITY, DJ, KIOSK, DEMO
 * base44 role: admin
 */
export const mapNUPSRoleToRBAC = (nupsRole) => {
  const map = {
    PLATFORM_ADMIN: ROLES.MANAGER,
    VENUE_OWNER: ROLES.MANAGER,
    VENUE_MANAGER: ROLES.MANAGER,
    FLOOR_HOST: ROLES.DOOR_GIRL,
    BARTENDER: ROLES.BARTENDER,
    SECURITY: ROLES.SECURITY,
    DJ: ROLES.DJ,
    KIOSK: ROLES.HOSTESS,
    PERFORMER: null, // performers use their own dashboard
    DEMO: ROLES.MANAGER, // demo sees everything
    admin: ROLES.MANAGER, // base44 admin
  };
  return map[nupsRole] ?? ROLES.BARTENDER; // safe default: most restricted
};