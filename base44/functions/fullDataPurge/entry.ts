import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only gate — a full data purge must never be invokable by regular users.
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results = {};

  const KEEP_NUPS_USER_ID = '6a5ac8e9cd05dc26888f8eab';
  const KEEP_USER_EMAIL = 'carloearl@glyphlock.com';

  const fullWipeEntities = [
    'Entertainer', 'EntertainerShift', 'POSTransaction', 'StaffShift',
    'GlyphBucksBill', 'VenueContract', 'PayrollRecord', 'DailySettlement',
    'NUPSAccessRequest', 'MigrationAuditLog', 'SystemAuditLog', 'AuditEvent',
    'SealRecord', 'POSBatch', 'GlyphBucksTransaction', 'AIDJPersona', 'Playlist'
  ];

  for (const entityName of fullWipeEntities) {
    try {
      let deleted = 0;
      let failed = 0;
      let totalFound = 0;

      // Use filter({}) which is confirmed to work in asServiceRole
      let records = await base44.asServiceRole.entities[entityName].filter({});

      if (records && records.length > 0) {
        totalFound = records.length;

        for (const record of records) {
          try {
            await base44.asServiceRole.entities[entityName].delete(record.id);
            deleted++;
          } catch (e) {
            failed++;
          }
        }
      }

      // Try a second pass for any that returned more than expected
      if (totalFound >= 100) {
        let secondPass = await base44.asServiceRole.entities[entityName].filter({});
        if (secondPass && secondPass.length > 0) {
          for (const record of secondPass) {
            try {
              await base44.asServiceRole.entities[entityName].delete(record.id);
              deleted++;
            } catch (e) {
              failed++;
            }
          }
        }
      }

      results[entityName] = { found: totalFound, deleted, failed };
    } catch (e) {
      results[entityName] = { error: e.message };
    }
  }

  // PARTIAL WIPE: NUPSUser (keep Carlo only)
  try {
    let deleted = 0;
    let failed = 0;
    let found = 0;

    const records = await base44.asServiceRole.entities.NUPSUser.filter({});

    if (records && records.length > 0) {
      found = records.length;

      for (const record of records) {
        if (record.id === KEEP_NUPS_USER_ID) continue;
        try {
          await base44.asServiceRole.entities.NUPSUser.delete(record.id);
          deleted++;
        } catch (e) {
          failed++;
        }
      }
    }

    results['NUPSUser'] = { found, deleted, failed, kept: 'Carlo' };
  } catch (e) {
    results['NUPSUser'] = { error: e.message };
  }

  // PARTIAL WIPE: UserRoleAssignment (keep Carlo's)
  try {
    let deleted = 0;
    let failed = 0;
    let found = 0;

    const records = await base44.asServiceRole.entities.UserRoleAssignment.filter({});

    if (records && records.length > 0) {
      found = records.length;

      for (const record of records) {
        if (record.user_email === KEEP_USER_EMAIL) continue;
        try {
          await base44.asServiceRole.entities.UserRoleAssignment.delete(record.id);
          deleted++;
        } catch (e) {
          failed++;
        }
      }
    }

    results['UserRoleAssignment'] = { found, deleted, failed, kept: KEEP_USER_EMAIL };
  } catch (e) {
    results['UserRoleAssignment'] = { error: e.message };
  }

  results['_preserved'] = ['Venue', 'VenueRateConfig', 'VenuePaymentConfig', 'DailyChecklistConfig'];

  return Response.json({ success: true, purge: 'complete', results });
});