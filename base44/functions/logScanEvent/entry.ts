import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// writeEntity gateway is called via Base44 SDK; no direct import in backend functions.
// For server-side RBAC, we use base44.asServiceRole.entities directly.

/**
 * DACO-20260613-MOBILE-SCANNER — Log a scan participation event.
 * 
 * Called after successful QR or ID verification. Writes a ScanEvent entity via writeEntity()
 * with validation_run + funds_settled flags for quarantine during funds-off runs.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { subject_id, subject_type, venue_id, validation_run = false, scan_type, details = {} } = await req.json();
    if (!subject_id || !subject_type || !venue_id || !scan_type) {
      return new Response(JSON.stringify({ 
        error: 'subject_id, subject_type, venue_id, scan_type required' 
      }), { status: 400 });
    }

    // Create ScanEvent with validation_run + funds_settled flags for quarantine.
    const scanEvent = await base44.asServiceRole.entities.ScanEvent.create({
      scan_id: `SCN-${Date.now()}`,
      subject_id,
      subject_type, // 'driver', 'guest', 'id'
      venue_id,
      scan_type, // 'qr', 'id_barcode', 'camera'
      scanned_by: user.email,
      scanned_by_role: user.role,
      timestamp: new Date().toISOString(),
      validation_run,
      funds_settled: !validation_run,
      mode: 'REAL',
      details: JSON.stringify(details),
      notes: `Mobile scanner ${scan_type} event — ${subject_type} ${subject_id}`,
    });

    // Audit log.
    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user.email,
        user_role: user.role,
        action_type: 'CREATE',
        entity_affected: `ScanEvent:${result.value.id}`,
        after_value: {
          subject_id,
          subject_type,
          scan_type,
          validation_run,
          timestamp: new Date().toISOString(),
        },
        venue_id,
        mode: 'REAL',
        notes: `Scan event logged via mobile scanner.`,
      });
    } catch (auditErr) {
      console.warn('Audit log failed:', auditErr);
    }

    return new Response(JSON.stringify({
      ok: true,
      scan_id: scanEvent.id,
      subject_id,
      venue_id,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});