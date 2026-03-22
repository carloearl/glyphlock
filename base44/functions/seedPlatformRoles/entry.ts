import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * seedPlatformRoles — Admin-only function to upsert canonical NUPS role definitions.
 * 
 * Run once (or re-run to reset) to ensure PlatformRole records are correct.
 * RBAC action keys follow: domain.operation notation.
 * 
 * Roles:
 *   PLATFORM_ADMIN  — Full unrestricted access (cross-venue)
 *   VENUE_OWNER     — Full venue access + settings + staff management
 *   VENUE_MANAGER   — Manage POS, batches, reports, staff (no system settings)
 *   FLOOR_HOST      — POS + VIP + guest tracking + time clock
 *   BARTENDER       — POS register + time clock only
 *   SECURITY        — Guest tracking + time clock only
 *   DJ              — Time clock only
 *   PERFORMER       — Entertainer check-in + time clock
 *   KIOSK           — POS register only (no time clock, no history)
 */

const CANONICAL_ROLES = [
  {
    role_key: 'PLATFORM_ADMIN',
    display_name: 'Platform Administrator',
    description: 'Full cross-venue system access. GlyphLock internal use only.',
    is_cross_venue: true,
    session_timeout_minutes: 30,
    can_escalate_to: [],
    allowed_actions: ['*'],
    is_active: true,
  },
  {
    role_key: 'VENUE_OWNER',
    display_name: 'Venue Owner',
    description: 'Full control over the venue. Access to all features including settings and staff management.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      // POS
      'pos.transact', 'pos.void', 'pos.refund', 'pos.discount',
      // Batch
      'batch.open', 'batch.close', 'batch.view',
      // Reports
      'reports.view', 'reports.zreport', 'reports.export', 'reports.daily', 'reports.analytics',
      // Staff
      'staff.view', 'staff.create', 'staff.edit', 'staff.deactivate', 'staff.assign_roles',
      // Inventory
      'inventory.view', 'inventory.edit',
      // Products
      'products.view', 'products.create', 'products.edit', 'products.delete',
      // VIP
      'vip.rooms.view', 'vip.rooms.manage', 'vip.guests.view', 'vip.guests.manage', 'vip.contracts',
      // Entertainers
      'entertainers.view', 'entertainers.checkin', 'entertainers.contracts',
      // Timeclock
      'timeclock.punch', 'timeclock.view_all', 'timeclock.edit',
      // Marketing / CRM
      'crm.view', 'crm.edit', 'marketing.view', 'marketing.send', 'loyalty.view', 'loyalty.edit',
      // Finance
      'finance.tips', 'finance.drawer', 'finance.cash_log',
      // Club Currency
      'press.view', 'press.print',
      // AI
      'ai.insights',
      // Settings
      'settings.view', 'settings.edit',
    ],
    is_active: true,
  },
  {
    role_key: 'VENUE_MANAGER',
    display_name: 'Venue Manager',
    description: 'Operational control: POS, batches, reports, staff oversight. No system settings.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      'pos.transact', 'pos.void', 'pos.refund', 'pos.discount',
      'batch.open', 'batch.close', 'batch.view',
      'reports.view', 'reports.zreport', 'reports.export', 'reports.daily', 'reports.analytics',
      'staff.view', 'staff.edit',
      'inventory.view', 'inventory.edit',
      'products.view', 'products.create', 'products.edit',
      'vip.rooms.view', 'vip.rooms.manage', 'vip.guests.view', 'vip.guests.manage', 'vip.contracts',
      'entertainers.view', 'entertainers.checkin', 'entertainers.contracts',
      'timeclock.punch', 'timeclock.view_all', 'timeclock.edit',
      'crm.view', 'crm.edit', 'marketing.view', 'loyalty.view',
      'finance.tips', 'finance.drawer', 'finance.cash_log',
      'press.view', 'press.print',
      'ai.insights',
    ],
    is_active: true,
  },
  {
    role_key: 'FLOOR_HOST',
    display_name: 'Floor Host',
    description: 'POS register, VIP room management, guest tracking, and time clock.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      'pos.transact', 'pos.discount',
      'batch.view',
      'vip.rooms.view', 'vip.rooms.manage', 'vip.guests.view', 'vip.guests.manage',
      'entertainers.view', 'entertainers.checkin',
      'timeclock.punch',
      'crm.view',
    ],
    is_active: true,
  },
  {
    role_key: 'BARTENDER',
    display_name: 'Bartender / Cashier',
    description: 'POS register and time clock. No batch management or reporting.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      'pos.transact',
      'timeclock.punch',
    ],
    is_active: true,
  },
  {
    role_key: 'SECURITY',
    display_name: 'Security',
    description: 'Guest tracking check-in/out and time clock.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      'vip.guests.view',
      'timeclock.punch',
    ],
    is_active: true,
  },
  {
    role_key: 'DJ',
    display_name: 'DJ',
    description: 'Time clock only.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      'timeclock.punch',
    ],
    is_active: true,
  },
  {
    role_key: 'PERFORMER',
    display_name: 'Performer / Entertainer',
    description: 'Entertainer check-in and time clock.',
    is_cross_venue: false,
    session_timeout_minutes: 480,
    can_escalate_to: [],
    allowed_actions: [
      'entertainers.checkin',
      'timeclock.punch',
    ],
    is_active: true,
  },
  {
    role_key: 'KIOSK',
    display_name: 'Kiosk',
    description: 'POS register only. No time clock, no history.',
    is_cross_venue: false,
    session_timeout_minutes: 5,
    can_escalate_to: [],
    allowed_actions: [
      'pos.transact',
    ],
    is_active: true,
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const existingRoles = await base44.asServiceRole.entities.PlatformRole.list();
    const existingByKey = {};
    for (const r of existingRoles) {
      existingByKey[r.role_key] = r;
    }

    const results = [];
    for (const roleDef of CANONICAL_ROLES) {
      const existing = existingByKey[roleDef.role_key];
      if (existing) {
        await base44.asServiceRole.entities.PlatformRole.update(existing.id, roleDef);
        results.push({ role_key: roleDef.role_key, action: 'updated' });
      } else {
        await base44.asServiceRole.entities.PlatformRole.create(roleDef);
        results.push({ role_key: roleDef.role_key, action: 'created' });
      }
    }

    return Response.json({ success: true, seeded: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});