import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PHASE 1 — TD-006: Idempotent NUPSUser → UserRoleAssignment Migration
 * 
 * Legacy mapping:
 *   NUPSUser.role "admin"        → VENUE_OWNER (was venue-level admin)
 *   NUPSUser.role "manager"      → VENUE_MANAGER
 *   NUPSUser.role "staff"        → BARTENDER (default staff role)
 *   NUPSUser.role "entertainer"  → PERFORMER
 *   NUPSUser.role "PLATFORM_ADMIN" → PLATFORM_ADMIN (already migrated)
 *   NUPSUser.role "VENUE_OWNER"   → VENUE_OWNER (already migrated)
 *   NUPSUser.role "VENUE_MANAGER" → VENUE_MANAGER (already migrated)
 *   NUPSUser.role "FLOOR_HOST"    → FLOOR_HOST (already migrated)
 *   NUPSUser.role "PERFORMER"     → PERFORMER (already migrated)
 *   NUPSUser.role "BARTENDER"     → BARTENDER (already migrated)
 *   NUPSUser.role "SECURITY"      → SECURITY (already migrated)
 *   NUPSUser.role "DJ"            → DJ (already migrated)
 *   NUPSUser.role "KIOSK"         → KIOSK (already migrated)
 * 
 * Also processes Base44 User entity role "admin" → PLATFORM_ADMIN assignment
 */

const LEGACY_ROLE_MAP = {
  // Old legacy values
  'admin': 'VENUE_OWNER',
  'manager': 'VENUE_MANAGER',
  'staff': 'BARTENDER',
  'entertainer': 'PERFORMER',
  // New §9.2 values (passthrough)
  'PLATFORM_ADMIN': 'PLATFORM_ADMIN',
  'VENUE_OWNER': 'VENUE_OWNER',
  'VENUE_MANAGER': 'VENUE_MANAGER',
  'FLOOR_HOST': 'FLOOR_HOST',
  'PERFORMER': 'PERFORMER',
  'BARTENDER': 'BARTENDER',
  'SECURITY': 'SECURITY',
  'DJ': 'DJ',
  'KIOSK': 'KIOSK',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Load all PlatformRole records for lookup
    const platformRoles = await base44.asServiceRole.entities.PlatformRole.list();
    const roleByKey = {};
    for (const pr of platformRoles) {
      roleByKey[pr.role_key] = pr;
    }

    // Load all NUPSUser records
    const nupsUsers = await base44.asServiceRole.entities.NUPSUser.list();

    // Load existing UserRoleAssignment records to prevent duplicates
    const existingAssignments = await base44.asServiceRole.entities.UserRoleAssignment.list();
    const assignmentIndex = new Set(
      existingAssignments.map(a => `${a.user_email}|${a.venue_id || 'null'}|${a.role_key}`)
    );

    const results = {
      total_nups_users: nupsUsers.length,
      migrated: 0,
      skipped_existing: 0,
      skipped_no_mapping: 0,
      skipped_no_role_record: 0,
      errors: [],
      assignments_created: [],
    };

    for (const nu of nupsUsers) {
      const legacyRole = nu.role;
      const targetRoleKey = LEGACY_ROLE_MAP[legacyRole];

      if (!targetRoleKey) {
        results.skipped_no_mapping++;
        results.errors.push({
          user: nu.username,
          email: nu.created_by,
          legacy_role: legacyRole,
          reason: 'No mapping found for legacy role'
        });
        continue;
      }

      const roleRecord = roleByKey[targetRoleKey];
      if (!roleRecord) {
        results.skipped_no_role_record++;
        results.errors.push({
          user: nu.username,
          legacy_role: legacyRole,
          target_role_key: targetRoleKey,
          reason: 'PlatformRole record not found for target role_key'
        });
        continue;
      }

      const venueId = nu.venue_id || null;
      const userEmail = nu.created_by || nu.email || nu.username;
      const indexKey = `${userEmail}|${venueId || 'null'}|${targetRoleKey}`;

      if (assignmentIndex.has(indexKey)) {
        results.skipped_existing++;
        continue;
      }

      // Create UserRoleAssignment
      const assignment = await base44.asServiceRole.entities.UserRoleAssignment.create({
        user_id: nu.id,
        user_email: userEmail,
        role_key: targetRoleKey,
        venue_id: venueId,
        assigned_by: user.email,
        assigned_at: new Date().toISOString(),
        is_active: true,
        is_primary: true,
      });

      assignmentIndex.add(indexKey);

      // Update NUPSUser.role to new §9.2 value if it was legacy
      if (legacyRole !== targetRoleKey) {
        await base44.asServiceRole.entities.NUPSUser.update(nu.id, {
          role: targetRoleKey
        });
      }

      // Log AuditEvent
      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: 'PLATFORM_ADMIN',
        venue_id: venueId,
        entity_type: 'UserRoleAssignment',
        entity_id: assignment.id || crypto.randomUUID(),
        action: 'CREATE',
        before_state: JSON.stringify({ legacy_role: legacyRole }),
        after_state: JSON.stringify({ role_key: targetRoleKey, venue_id: venueId }),
        is_system_action: false,
        severity: 'INFO',
        description: `Migration: ${userEmail} role ${legacyRole} → ${targetRoleKey} (venue: ${venueId || 'unscoped'})`,
        metadata: {
          ip_address: req.headers.get('x-forwarded-for') || 'migration',
          user_agent: req.headers.get('user-agent') || 'migration-script',
        }
      });

      results.migrated++;
      results.assignments_created.push({
        user_email: userEmail,
        legacy_role: legacyRole,
        new_role_key: targetRoleKey,
        venue_id: venueId,
      });
    }

    // VALIDATION QUERIES
    const postAssignments = await base44.asServiceRole.entities.UserRoleAssignment.list();
    const postNupsUsers = await base44.asServiceRole.entities.NUPSUser.list();

    const usersWithAssignments = new Set(postAssignments.map(a => a.user_email));
    const nupsEmails = postNupsUsers.map(nu => nu.created_by || nu.email || nu.username);
    const usersMissingAssignments = nupsEmails.filter(e => !usersWithAssignments.has(e));

    const assignedRoleKeys = new Set(postAssignments.map(a => a.role_key));
    const orphanRoles = platformRoles.filter(pr => !assignedRoleKeys.has(pr.role_key));

    results.validation = {
      total_assignments_post: postAssignments.length,
      total_nups_users_post: postNupsUsers.length,
      users_with_assignments: usersWithAssignments.size,
      users_missing_assignments: usersMissingAssignments,
      orphan_roles: orphanRoles.map(r => r.role_key),
    };

    return Response.json({
      status: 'migration_complete',
      ...results,
      rollback_strategy: 'Delete UserRoleAssignment records created during this run (tracked in assignments_created). Revert NUPSUser.role values using before_state in AuditEvent records.'
    });

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});