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

  // === FULL WIPE ENTITIES (delete ALL records) ===
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
      let hasMore = true;
      let skip = 0;

      while (hasMore && skip < 5000) {
        const records = await base44.asServiceRole.entities[entityName].list({
          limit: 500,
          skip: skip
        });

        if (!records || records.length === 0) break;

        for (const record of records) {
          try {
            await base44.asServiceRole.entities[entityName].delete(record.id);
            deleted++;
          } catch (e) {
            failed++;
          }
        }

        if (records.length < 500) {
          hasMore = false;
        } else {
          skip += 500;
        }
      }

      results[entityName] = { deleted, failed };
    } catch (e) {
      results[entityName] = { error: e.message };
    }
  }

  // === PARTIAL WIPE: NUPSUser (keep Carlo only) ===
  try {
    let deleted = 0;
    let failed = 0;
    let hasMore = true;
    let skip = 0;

    while (hasMore && skip < 5000) {
      const records = await base44.asServiceRole.entities.NUPSUser.list({
        limit: 500,
        skip: skip
      });

      if (!records || records.length === 0) break;

      for (const record of records) {
        if (record.id === KEEP_NUPS_USER_ID) continue;
        try {
          await base44.asServiceRole.entities.NUPSUser.delete(record.id);
          deleted++;
        } catch (e) {
          failed++;
        }
      }

      if (records.length < 500) {
        hasMore = false;
      } else {
        skip += 500;
      }
    }

    results['NUPSUser'] = { deleted, failed, kept: 'Carlo' };
  } catch (e) {
    results['NUPSUser'] = { error: e.message };
  }

  // === PARTIAL WIPE: UserRoleAssignment (keep Carlo's) ===
  try {
    let deleted = 0;
    let failed = 0;

    const records = await base44.asServiceRole.entities.UserRoleAssignment.list({
      limit: 500
    });

    if (records && records.length > 0) {
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

    results['UserRoleAssignment'] = { deleted, failed, kept: KEEP_USER_EMAIL };
  } catch (e) {
    results['UserRoleAssignment'] = { error: e.message };
  }

  // === DO NOT TOUCH: Venue, VenueRateConfig, VenuePaymentConfig, DailyChecklistConfig ===
  results['_preserved'] = ['Venue', 'VenueRateConfig', 'VenuePaymentConfig', 'DailyChecklistConfig'];

  return Response.json({ success: true, purge: 'complete', results });
});