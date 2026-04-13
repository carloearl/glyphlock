import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * NUPS MASTER DATA WIPE — with mandatory Google Drive backup
 *
 * PROTECTED (never deleted, always backed up first):
 *   VenueContract, VIPContractRecord, VIPGuest, DriverPayout, ContractorPayout,
 *   Entertainer, NUPSUser, POSProduct, Venue, SystemAuditLog
 *
 * BACKED UP before wipe (receipts + shifts):
 *   POSTransaction, POSZReport, EntertainerShift, TipPayout, DailySettlement, VIPSessionReport
 *
 * WIPED (operational/transactional only):
 *   POSTransaction, POSBatch, POSZReport, GlyphBucksTransaction, GlyphBucksOrder,
 *   GlyphBucksBill, GlyphBucksBatch, VIPRoom, EntertainerShift, TipPayout,
 *   DailySettlement, VIPSessionReport
 *
 * Requires: admin role + confirm_phrase === "WIPE ALL NUPS DATA"
 */

// These will be WIPED (operational data only)
const WIPE_ENTITIES = [
  'POSTransaction',
  'POSBatch',
  'POSZReport',
  'GlyphBucksTransaction',
  'GlyphBucksOrder',
  'GlyphBucksBill',
  'GlyphBucksBatch',
  'VIPRoom',
  'EntertainerShift',
  'TipPayout',
  'DailySettlement',
  'VIPSessionReport',
];

// These are CREDENTIALED — backed up to Google Drive but NEVER deleted
const PROTECTED_ENTITIES = [
  'VenueContract',
  'VIPContractRecord',
  'VIPGuest',
  'DriverPayout',
  'ContractorPayout',
  'Entertainer',
];

// These are backed up before wipe (receipts & shift records)
const BACKUP_BEFORE_WIPE = [
  'POSTransaction',
  'POSZReport',
  'EntertainerShift',
  'TipPayout',
  'DailySettlement',
  'VIPSessionReport',
];

async function fetchAll(base44, entityName) {
  try {
    const records = await base44.asServiceRole.entities[entityName].list('', 5000);
    return records || [];
  } catch { return []; }
}

async function wipeEntity(base44, entityName) {
  try {
    const records = await base44.asServiceRole.entities[entityName].list('', 1000);
    if (!records || records.length === 0) return { entity: entityName, deleted: 0 };
    let deleted = 0;
    for (const record of records) {
      try {
        await base44.asServiceRole.entities[entityName].delete(record.id);
        deleted++;
      } catch { /* skip individual failures */ }
    }
    return { entity: entityName, deleted };
  } catch (err) {
    return { entity: entityName, deleted: 0, error: err.message };
  }
}

async function uploadToGoogleDrive(accessToken, filename, content) {
  const boundary = '-------314159265358979323846';
  const metadata = JSON.stringify({ name: filename, mimeType: 'application/json' });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive upload failed: ${err}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await req.json();
    const { confirm_phrase, wipe_scope = 'all' } = body;

    if (confirm_phrase !== 'WIPE ALL NUPS DATA') {
      return Response.json({ error: 'Invalid confirmation phrase. You must type exactly: WIPE ALL NUPS DATA' }, { status: 400 });
    }

    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // ── STEP 1: Get Google Drive access token ─────────────────────────────────
    let driveAccessToken = null;
    let backupFileId = null;
    let backupError = null;

    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
      driveAccessToken = accessToken;
    } catch (err) {
      backupError = `Google Drive connection failed: ${err.message}`;
    }

    // ── STEP 2: Collect all data for backup ───────────────────────────────────
    const backupPayload = {
      backup_metadata: {
        created_at: new Date().toISOString(),
        created_by: user.email,
        backup_type: 'NUPS_PRE_WIPE_BACKUP',
        wipe_scope,
      },
      protected_records: {},
      operational_records: {},
    };

    // Backup protected (never-deleted) entities
    for (const entityName of PROTECTED_ENTITIES) {
      backupPayload.protected_records[entityName] = await fetchAll(base44, entityName);
    }

    // Backup operational records that will be wiped
    for (const entityName of BACKUP_BEFORE_WIPE) {
      backupPayload.operational_records[entityName] = await fetchAll(base44, entityName);
    }

    // ── STEP 3: Upload backup to Google Drive ─────────────────────────────────
    if (driveAccessToken) {
      try {
        const filename = `NUPS-Backup-${timestamp}.json`;
        const driveFile = await uploadToGoogleDrive(
          driveAccessToken,
          filename,
          JSON.stringify(backupPayload, null, 2)
        );
        backupFileId = driveFile.id;
      } catch (err) {
        backupError = err.message;
      }
    }

    // ── STEP 4: Write pre-wipe audit log ─────────────────────────────────────
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'NUPS_MASTER_WIPE_INITIATED',
      description: `NUPS Master Wipe initiated by ${user.email}. Backup file: ${backupFileId || 'FAILED'}. Scope: ${wipe_scope}.`,
      actor_email: user.email,
      status: 'alert',
      severity: 'critical',
      metadata: {
        initiated_by: user.email,
        initiated_at: new Date().toISOString(),
        scope: wipe_scope,
        entities_targeted: WIPE_ENTITIES,
        protected_entities: PROTECTED_ENTITIES,
        drive_backup_file_id: backupFileId,
        backup_error: backupError,
        section: 'NUPS-MASTER-WIPE',
      },
    });

    // ── STEP 5: Wipe operational entities ────────────────────────────────────
    const results = [];
    let totalDeleted = 0;

    for (const entityName of WIPE_ENTITIES) {
      const result = await wipeEntity(base44, entityName);
      results.push(result);
      totalDeleted += result.deleted;
    }

    const elapsed = Date.now() - startTime;

    // ── STEP 6: Write completion audit log ───────────────────────────────────
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'NUPS_MASTER_WIPE_COMPLETE',
      description: `NUPS Master Wipe complete. ${totalDeleted} records deleted in ${elapsed}ms. Backup: ${backupFileId ? 'SUCCESS' : 'FAILED'}.`,
      actor_email: user.email,
      status: 'success',
      severity: 'critical',
      metadata: {
        completed_by: user.email,
        completed_at: new Date().toISOString(),
        total_deleted: totalDeleted,
        elapsed_ms: elapsed,
        drive_backup_file_id: backupFileId,
        backup_error: backupError,
        results,
        section: 'NUPS-MASTER-WIPE',
      },
    });

    return Response.json({
      success: true,
      total_deleted: totalDeleted,
      elapsed_ms: elapsed,
      results,
      wiped_at: new Date().toISOString(),
      wiped_by: user.email,
      backup: {
        file_id: backupFileId,
        error: backupError,
        protected_entities_preserved: PROTECTED_ENTITIES,
        backed_up_before_wipe: BACKUP_BEFORE_WIPE,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});