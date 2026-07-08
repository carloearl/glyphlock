import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// W3-010 — Reconciliation Exception Queue & Manager Review Workflow
// Read-only financial policy: NEVER deletes, merges, repairs, voids,
// issues, or posts financial records. Observation + documentation only.
//
// Actions:
//   assign        — assign exception to a manager/role
//   transition    — change status (NEW→UNDER_REVIEW→...→RESOLVED)
//   add_note      — append immutable note
//   escalate      — escalate to corporate/compliance
//   get_evidence  — fetch linked financial entities for timeline
//   get_metrics    — aggregate metrics for dashboard
//   auto_escalate  — auto-escalate critical/duplicate/repeated exceptions

const ALLOWED_STATUSES = ['NEW', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'ESCALATED', 'RESOLVED', 'FALSE_POSITIVE', 'ARCHIVED'];

const CRITICAL_TYPES = [
  'amount_mismatch_payment_to_order',
  'amount_mismatch_order_to_batch',
  'bill_count_mismatch',
  'bill_face_value_mismatch',
  'duplicate_processor_reference',
  'unconfirmed_payment_record_with_bills',
  'issued_bills_without_ledger_posting',
  'ledger_posting_without_payment_record'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager' || isAdmin;

    if (!isManager) {
      return Response.json({ error: 'Forbidden: Staff access denied to reconciliation queue' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // ── AUDIT HELPER ──
    async function auditLog(eventType, resourceId, description, metadata, severity) {
      try {
        await base44.asServiceRole.entities.SystemAuditLog.create({
          event_type: eventType,
          description,
          actor_email: user.email,
          resource_id: resourceId,
          metadata: metadata || {},
          severity: severity || 'low',
          status: 'success'
        });
      } catch (_) { /* non-blocking */ }
    }

    // ── NOTIFICATION HELPER ──
    async function notify(exceptionId, venueId, alertType, description) {
      try {
        await base44.asServiceRole.entities.SystemAuditLog.create({
          event_type: 'RECONCILIATION_ALERT',
          description: `[${alertType}] ${description}`,
          actor_email: user.email,
          resource_id: exceptionId,
          metadata: { venue_id: venueId, alert_type: alertType, destinations: ['manager_dashboard', 'owner_dashboard', 'compliance_dashboard'] },
          severity: 'high',
          status: 'alert'
        });
      } catch (_) { /* non-blocking */ }
    }

    // ════════════════════════════════════════════════════════════
    // ASSIGN
    // ════════════════════════════════════════════════════════════
    if (action === 'assign') {
      const { exception_id, assigned_to, assigned_to_role, reason } = body;
      if (!exception_id || !assigned_to) {
        return Response.json({ error: 'exception_id and assigned_to required' }, { status: 400 });
      }

      const exc = await base44.asServiceRole.entities.ReconciliationException.get(exception_id);
      if (!exc) return Response.json({ error: 'Exception not found' }, { status: 404 });

      const history = exc.assignment_history || [];
      history.push({
        assigned_to,
        assigned_to_role: assigned_to_role || 'manager',
        assigned_by: user.email,
        assigned_at: new Date().toISOString(),
        reason: reason || ''
      });

      const update = {
        assigned_to,
        assigned_to_role: assigned_to_role || 'manager',
        assignment_history: history
      };
      if (exc.status === 'NEW') update.status = 'UNDER_REVIEW';

      await base44.asServiceRole.entities.ReconciliationException.update(exception_id, update);

      await auditLog('RECONCILIATION_ASSIGN', exception_id,
        `Exception ${exc.exception_id} assigned to ${assigned_to} (${assigned_to_role || 'manager'})`,
        { venue_id: exc.venue_id, assigned_to, assigned_to_role }, 'low');

      return Response.json({ success: true, exception_id, assigned_to });
    }

    // ════════════════════════════════════════════════════════════
    // TRANSITION (status change)
    // ════════════════════════════════════════════════════════════
    if (action === 'transition') {
      const { exception_id, to_status, reason } = body;
      if (!exception_id || !ALLOWED_STATUSES.includes(to_status)) {
        return Response.json({ error: 'exception_id and valid to_status required' }, { status: 400 });
      }

      // Corporate-only actions: RESOLVED, ESCALATED
      if (['RESOLVED', 'ESCALATED'].includes(to_status) && !isAdmin) {
        return Response.json({ error: 'Forbidden: Corporate/Admin access required for resolve/escalate' }, { status: 403 });
      }

      const exc = await base44.asServiceRole.entities.ReconciliationException.get(exception_id);
      if (!exc) return Response.json({ error: 'Exception not found' }, { status: 404 });

      const fromStatus = exc.status || 'NEW';
      const transitions = exc.transition_history || [];
      transitions.push({
        from_status: fromStatus,
        to_status: to_status,
        changed_by: user.email,
        changed_at: new Date().toISOString(),
        reason: reason || ''
      });

      const update = {
        status: to_status,
        transition_history: transitions
      };
      if (to_status === 'RESOLVED' || to_status === 'FALSE_POSITIVE') {
        update.resolved_at = new Date().toISOString();
        update.resolved_by = user.email;
        if (reason) update.resolution_notes = reason;
      }

      await base44.asServiceRole.entities.ReconciliationException.update(exception_id, update);

      await auditLog('RECONCILIATION_TRANSITION', exception_id,
        `Exception ${exc.exception_id}: ${fromStatus} → ${to_status}`,
        { venue_id: exc.venue_id, from_status: fromStatus, to_status: to_status, reason }, 'medium');

      return Response.json({ success: true, exception_id, from_status: fromStatus, to_status: to_status });
    }

    // ════════════════════════════════════════════════════════════
    // ADD NOTE (immutable, append-only)
    // ════════════════════════════════════════════════════════════
    if (action === 'add_note') {
      const { exception_id, note } = body;
      if (!exception_id || !note) {
        return Response.json({ error: 'exception_id and note required' }, { status: 400 });
      }

      const exc = await base44.asServiceRole.entities.ReconciliationException.get(exception_id);
      if (!exc) return Response.json({ error: 'Exception not found' }, { status: 404 });

      const notes = exc.review_notes || [];
      notes.push({
        note,
        author_email: user.email,
        author_role: user.role,
        timestamp: new Date().toISOString(),
        version: notes.length + 1
      });

      await base44.asServiceRole.entities.ReconciliationException.update(exception_id, { review_notes: notes });

      await auditLog('RECONCILIATION_NOTE', exception_id,
        `Note added to exception ${exc.exception_id}`,
        { venue_id: exc.venue_id, note_preview: note.slice(0, 100) }, 'low');

      return Response.json({ success: true, exception_id, note_count: notes.length });
    }

    // ════════════════════════════════════════════════════════════
    // ESCALATE
    // ════════════════════════════════════════════════════════════
    if (action === 'escalate') {
      const { exception_id, reason } = body;
      if (!exception_id) {
        return Response.json({ error: 'exception_id required' }, { status: 400 });
      }

      if (!isAdmin) {
        return Response.json({ error: 'Forbidden: Corporate/Admin access required for escalation' }, { status: 403 });
      }

      const exc = await base44.asServiceRole.entities.ReconciliationException.get(exception_id);
      if (!exc) return Response.json({ error: 'Exception not found' }, { status: 404 });

      const transitions = exc.transition_history || [];
      const fromStatus = exc.status || 'NEW';
      transitions.push({
        from_status: fromStatus,
        to_status: 'ESCALATED',
        changed_by: user.email,
        changed_at: new Date().toISOString(),
        reason: reason || 'Manual escalation'
      });

      await base44.asServiceRole.entities.ReconciliationException.update(exception_id, {
        status: 'ESCALATED',
        escalated: true,
        escalated_at: new Date().toISOString(),
        escalated_by: user.email,
        escalation_reason: reason || 'Manual escalation',
        transition_history: transitions,
        notification_sent: true
      });

      await auditLog('RECONCILIATION_ESCALATE', exception_id,
        `Exception ${exc.exception_id} ESCALATED: ${reason || 'Manual escalation'}`,
        { venue_id: exc.venue_id, exception_type: exc.exception_type, reason }, 'critical');

      await notify(exception_id, exc.venue_id, 'ESCALATION',
        `Exception ${exc.exception_id} (${exc.exception_type}) escalated by ${user.email}`);

      return Response.json({ success: true, exception_id, escalated: true });
    }

    // ════════════════════════════════════════════════════════════
    // GET EVIDENCE (linked financial entities for timeline)
    // ════════════════════════════════════════════════════════════
    if (action === 'get_evidence') {
      const { exception_id } = body;
      if (!exception_id) return Response.json({ error: 'exception_id required' }, { status: 400 });

      const exc = await base44.asServiceRole.entities.ReconciliationException.get(exception_id);
      if (!exc) return Response.json({ error: 'Exception not found' }, { status: 404 });

      const evidence = { exception: exc, payment_record: null, glyphbucks_order: null, glyphbucks_batch: null, glyphbucks_bills: [], journal_entries: [], verification_logs: [], audit_logs: [] };

      // Fetch primary entity
      if (exc.entity_type === 'PaymentRecord') {
        const prs = await base44.asServiceRole.entities.PaymentRecord.filter({ record_id: exc.entity_id }, null, 5);
        if (prs.length > 0) {
          evidence.payment_record = prs[0];
          // Follow chain: PR → orders → batches → bills → JEs
          const orders = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ venue_id: exc.venue_id, card_token: prs[0].processor_reference }, null, 10);
          if (orders.length > 0) { evidence.glyphbucks_order = orders[0]; }
          const batches = await base44.asServiceRole.entities.GlyphBucksBatch.filter({ venue_id: exc.venue_id, processor_reference: prs[0].processor_reference }, null, 10);
          if (batches.length > 0) {
            evidence.glyphbucks_batch = batches[0];
            const bills = await base44.asServiceRole.entities.GlyphBucksBill.filter({ venue_id: exc.venue_id, batch_id: batches[0].batch_id }, null, 50);
            evidence.glyphbucks_bills = bills;
            const jes = await base44.asServiceRole.entities.JournalEntry.filter({ venue_id: exc.venue_id, source_id: batches[0].batch_id }, null, 10);
            evidence.journal_entries = jes;
          }
          // Verification logs
          const vlogs = await base44.asServiceRole.entities.PaymentVerificationLog.filter({ venue_id: exc.venue_id, payment_record_id: prs[0].record_id }, null, 20);
          evidence.verification_logs = vlogs;
        }
      } else if (exc.entity_type === 'GlyphBucksOrder') {
        const orders = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ id: exc.entity_id }, null, 5);
        if (orders.length === 0) {
          const byNum = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ venue_id: exc.venue_id, order_number: exc.entity_id }, null, 5);
          if (byNum.length > 0) evidence.glyphbucks_order = byNum[0];
        } else {
          evidence.glyphbucks_order = orders[0];
        }
        if (evidence.glyphbucks_order) {
          const prs = await base44.asServiceRole.entities.PaymentRecord.filter({ venue_id: exc.venue_id, processor_reference: evidence.glyphbucks_order.card_token }, null, 10);
          if (prs.length > 0) evidence.payment_record = prs[0];
          const batches = await base44.asServiceRole.entities.GlyphBucksBatch.filter({ venue_id: exc.venue_id, processor_reference: evidence.glyphbucks_order.card_token }, null, 10);
          if (batches.length > 0) {
            evidence.glyphbucks_batch = batches[0];
            const bills = await base44.asServiceRole.entities.GlyphBucksBill.filter({ venue_id: exc.venue_id, batch_id: batches[0].batch_id }, null, 50);
            evidence.glyphbucks_bills = bills;
            const jes = await base44.asServiceRole.entities.JournalEntry.filter({ venue_id: exc.venue_id, source_id: batches[0].batch_id }, null, 10);
            evidence.journal_entries = jes;
          }
        }
      } else if (exc.entity_type === 'GlyphBucksBatch') {
        const batches = await base44.asServiceRole.entities.GlyphBucksBatch.filter({ venue_id: exc.venue_id, batch_id: exc.entity_id }, null, 5);
        if (batches.length > 0) {
          evidence.glyphbucks_batch = batches[0];
          const bills = await base44.asServiceRole.entities.GlyphBucksBill.filter({ venue_id: exc.venue_id, batch_id: batches[0].batch_id }, null, 50);
          evidence.glyphbucks_bills = bills;
          const prs = await base44.asServiceRole.entities.PaymentRecord.filter({ venue_id: exc.venue_id, processor_reference: batches[0].processor_reference }, null, 10);
          if (prs.length > 0) evidence.payment_record = prs[0];
          const orders = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ venue_id: exc.venue_id, card_token: batches[0].processor_reference }, null, 10);
          if (orders.length > 0) evidence.glyphbucks_order = orders[0];
          const jes = await base44.asServiceRole.entities.JournalEntry.filter({ venue_id: exc.venue_id, source_id: batches[0].batch_id }, null, 10);
          evidence.journal_entries = jes;
        }
      } else if (exc.entity_type === 'JournalEntry') {
        const jes = await base44.asServiceRole.entities.JournalEntry.filter({ id: exc.entity_id }, null, 5);
        if (jes.length > 0) {
          evidence.journal_entries = jes;
          const je = jes[0];
          if (je.source_id) {
            const batches = await base44.asServiceRole.entities.GlyphBucksBatch.filter({ venue_id: exc.venue_id, batch_id: je.source_id }, null, 5);
            if (batches.length > 0) {
              evidence.glyphbucks_batch = batches[0];
              const bills = await base44.asServiceRole.entities.GlyphBucksBill.filter({ venue_id: exc.venue_id, batch_id: batches[0].batch_id }, null, 50);
              evidence.glyphbucks_bills = bills;
              const prs = await base44.asServiceRole.entities.PaymentRecord.filter({ venue_id: exc.venue_id, processor_reference: batches[0].processor_reference }, null, 10);
              if (prs.length > 0) evidence.payment_record = prs[0];
            }
          }
        }
      }

      // Fetch audit logs for this exception
      const alogs = await base44.asServiceRole.entities.SystemAuditLog.filter({ resource_id: exception_id }, '-created_date', 50);
      evidence.audit_logs = alogs;

      return Response.json({ success: true, evidence });
    }

    // ════════════════════════════════════════════════════════════
    // GET METRICS
    // ════════════════════════════════════════════════════════════
    if (action === 'get_metrics') {
      const { venue_id } = body;
      const query = venue_id ? { venue_id } : {};
      const all = await base44.asServiceRole.entities.ReconciliationException.filter(query, null, 500);

      const open = all.filter(e => !['RESOLVED', 'FALSE_POSITIVE', 'ARCHIVED'].includes(e.status)).length;
      const critical = all.filter(e => e.severity === 'critical' && !['RESOLVED', 'FALSE_POSITIVE', 'ARCHIVED'].includes(e.status)).length;
      const escalated = all.filter(e => e.escalated).length;

      // Avg resolution time
      const resolved = all.filter(e => e.status === 'RESOLVED' && e.resolved_at && e.detected_at);
      let avgResolutionMs = 0;
      if (resolved.length > 0) {
        const totalMs = resolved.reduce((sum, e) => sum + (new Date(e.resolved_at) - new Date(e.detected_at)), 0);
        avgResolutionMs = totalMs / resolved.length;
      }

      // By venue
      const byVenue = {};
      for (const e of all) { byVenue[e.venue_id] = (byVenue[e.venue_id] || 0) + 1; }

      // By type (recurring)
      const byType = {};
      for (const e of all) { byType[e.exception_type] = (byType[e.exception_type] || 0) + 1; }

      // By mode
      const byMode = { REAL: 0, DEMO: 0, SANDBOX: 0 };
      for (const e of all) { if (byMode[e.mode] !== undefined) byMode[e.mode]++; }

      // Daily detection rate (last 7 days)
      const now = Date.now();
      const dailyRate = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now - i * 86400000);
        const dayEnd = new Date(now - (i - 1) * 86400000);
        const count = all.filter(e => {
          const dt = new Date(e.detected_at);
          return dt >= dayStart && dt < dayEnd;
        }).length;
        dailyRate.push({ date: dayStart.toISOString().slice(0, 10), count });
      }

      // Monthly resolution rate
      const monthAgo = new Date(now - 30 * 86400000);
      const recentResolved = all.filter(e => e.status === 'RESOLVED' && e.resolved_at && new Date(e.resolved_at) > monthAgo).length;
      const recentTotal = all.filter(e => e.detected_at && new Date(e.detected_at) > monthAgo).length;
      const monthlyResolutionRate = recentTotal > 0 ? (recentResolved / recentTotal) * 100 : 0;

      return Response.json({
        success: true,
        metrics: {
          total: all.length,
          open,
          critical,
          escalated,
          avg_resolution_hours: avgResolutionMs / 3600000,
          by_venue: byVenue,
          by_type: byType,
          by_mode: byMode,
          daily_detection_rate: dailyRate,
          monthly_resolution_rate: monthlyResolutionRate
        }
      });
    }

    // ════════════════════════════════════════════════════════════
    // AUTO_ESCALATE (called after reconciliation runs or on schedule)
    // ════════════════════════════════════════════════════════════
    if (action === 'auto_escalate') {
      const { venue_id } = body;
      const query = venue_id ? { venue_id, status: 'NEW' } : { status: 'NEW' };
      const newExcs = await base44.asServiceRole.entities.ReconciliationException.filter(query, null, 500);

      let escalated = 0;
      let notified = 0;

      for (const exc of newExcs) {
        const shouldEscalate = CRITICAL_TYPES.includes(exc.exception_type) && exc.severity === 'critical';

        // Check for repeated exceptions (same type + entity_id appearing 3+ times)
        if (!shouldEscalate) {
          const repeats = await base44.asServiceRole.entities.ReconciliationException.filter(
            { entity_id: exc.entity_id, exception_type: exc.exception_type }, null, 10
          );
          if (repeats.length >= 3) shouldEscalate = true;
        }

        if (shouldEscalate) {
          const transitions = exc.transition_history || [];
          transitions.push({
            from_status: 'NEW',
            to_status: 'ESCALATED',
            changed_by: 'automation',
            changed_at: new Date().toISOString(),
            reason: 'Auto-escalated: critical type or repeated occurrence'
          });

          await base44.asServiceRole.entities.ReconciliationException.update(exc.id, {
            status: 'ESCALATED',
            escalated: true,
            escalated_at: new Date().toISOString(),
            escalated_by: 'automation',
            escalation_reason: 'Auto-escalated: critical type or repeated occurrence',
            transition_history: transitions,
            notification_sent: true
          });

          await notify(exc.id, exc.venue_id, 'AUTO_ESCALATION',
            `Critical exception ${exc.exception_id} (${exc.exception_type}) auto-escalated`);

          escalated++;
          notified++;
        } else {
          // Generate notification for non-critical new exceptions
          if (!exc.notification_sent) {
            await notify(exc.id, exc.venue_id, 'NEW_EXCEPTION',
              `New ${exc.severity} exception: ${exc.exception_type} detected`);
            await base44.asServiceRole.entities.ReconciliationException.update(exc.id, { notification_sent: true });
            notified++;
          }
        }
      }

      return Response.json({ success: true, escalated, notified, checked: newExcs.length });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Reconciliation workflow error:`, error);
    return Response.json({
      success: false,
      error: 'Reconciliation workflow failed',
      error_id: errorId
    }, { status: 500 });
  }
});