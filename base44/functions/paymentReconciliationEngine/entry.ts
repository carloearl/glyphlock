import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// W3-009 — Payment Reconciliation Engine
// Nightly service that checks every link in the payment chain:
//   PaymentRecord → GlyphBucksOrder → GlyphBucksBatch → GlyphBucksBill
//
// Checks performed:
//   1. Orphaned PaymentRecords (CONFIRMED but no linked order)
//   2. Orphaned GlyphBucksOrders (no PaymentRecord)
//   3. Amount mismatch: PaymentRecord → GlyphBucksOrder
//   4. Orphaned GlyphBucksBatch (no matching order)
//   5. Amount mismatch: GlyphBucksOrder → GlyphBucksBatch
//   6. Bill count mismatch (batch vs actual bills)
//   7. Bill face value mismatch (batch total vs bill sum)
//   8. Duplicate processor references
//   9. PaymentRecord stuck in PENDING > 1 hour
//  10. Unconfirmed PaymentRecord with issued bills
//  11. Issued bills without ledger posting (batch has bills, no JournalEntry)
//  12. Ledger posting without source payment record (JournalEntry, no PaymentRecord)
//
// Dual invocation: scheduled automation (service role) or admin HTTP (auth required).
// Idempotent: skips exceptions that already exist as 'open' for the same entity + type.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── AUTH / INVOCATION MODE ──
    let actorEmail = 'automation';
    let venueFilter = null;

    try {
      const user = await base44.auth.me();
      if (user) {
        if (user.role !== 'admin') {
          return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        actorEmail = user.email;
        try {
          const payload = await req.json();
          venueFilter = payload.venue_id || null;
        } catch (_) { /* no body — fine */ }
      }
    } catch (_) {
      // Automation call — service role
    }

    const runId = `REC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // ── GET VENUES ──
    let venues;
    if (venueFilter) {
      venues = await base44.asServiceRole.entities.Venue.filter({ venue_id: venueFilter }, null, 100);
    } else {
      venues = await base44.asServiceRole.entities.Venue.list(null, 100);
    }
    if (!venues || venues.length === 0) {
      return Response.json({ success: true, run_id: runId, message: 'No venues found' });
    }

    const summary = {
      run_id: runId,
      venues_checked: 0,
      records_checked: { payment_records: 0, glyphbucks_orders: 0, glyphbucks_batches: 0, glyphbucks_bills: 0 },
      exceptions_created: 0,
      exceptions_by_type: {},
      exceptions_by_severity: { critical: 0, warning: 0, info: 0 }
    };

    for (const venue of venues) {
      const venueId = venue.venue_id;
      summary.venues_checked++;

      // ── FETCH ALL RECORDS FOR THIS VENUE ──
      const paymentRecords = await base44.asServiceRole.entities.PaymentRecord.filter({ venue_id: venueId }, null, 500);
      const gbOrders = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ venue_id: venueId }, null, 500);
      const gbBatches = await base44.asServiceRole.entities.GlyphBucksBatch.filter({ venue_id: venueId }, null, 500);
      const gbBills = await base44.asServiceRole.entities.GlyphBucksBill.filter({ venue_id: venueId }, null, 500);
      const journalEntries = await base44.asServiceRole.entities.JournalEntry.filter({ venue_id: venueId, source_type: 'GLYPHBUCKS_SALE' }, null, 500);

      summary.records_checked.payment_records += paymentRecords.length;
      summary.records_checked.glyphbucks_orders += gbOrders.length;
      summary.records_checked.glyphbucks_batches += gbBatches.length;
      summary.records_checked.glyphbucks_bills += gbBills.length;
      summary.records_checked.journal_entries = (summary.records_checked.journal_entries || 0) + journalEntries.length;

      // ── BUILD LOOKUP MAPS ──
      const prByRef = new Map();
      for (const pr of paymentRecords) {
        if (!prByRef.has(pr.processor_reference)) prByRef.set(pr.processor_reference, []);
        prByRef.get(pr.processor_reference).push(pr);
      }
      const orderByToken = new Map();
      for (const o of gbOrders) {
        if (!orderByToken.has(o.card_token)) orderByToken.set(o.card_token, []);
        orderByToken.get(o.card_token).push(o);
      }
      const batchByRef = new Map();
      for (const b of gbBatches) batchByRef.set(b.processor_reference, b);
      const billsByBatch = new Map();
      for (const bill of gbBills) {
        if (!billsByBatch.has(bill.batch_id)) billsByBatch.set(bill.batch_id, []);
        billsByBatch.get(bill.batch_id).push(bill);
      }
      // JournalEntry lookup: source_id → entries (for GLYPHBUCKS_SALE, source_id = batch_id)
      const jeBySource = new Map();
      for (const je of journalEntries) {
        if (!jeBySource.has(je.source_id)) jeBySource.set(je.source_id, []);
        jeBySource.get(je.source_id).push(je);
      }

      // ── PREFETCH OPEN EXCEPTIONS FOR IDEMPOTENCY ──
      const openExcs = await base44.asServiceRole.entities.ReconciliationException.filter(
        { venue_id: venueId, status: 'NEW' }, null, 500
      );
      const openKeys = new Set(openExcs.map(e => `${e.entity_id}|${e.exception_type}`));

      // ── EXCEPTION QUEUE HELPER ──
      const toCreate = [];
      function queue(params) {
        const key = `${params.entity_id}|${params.exception_type}`;
        if (openKeys.has(key)) return;
        openKeys.add(key);
        toCreate.push({
          exception_id: `RE-${(venueId || 'VEN').slice(-4).toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          reconciliation_run_id: runId,
          venue_id: venueId,
          exception_type: params.exception_type,
          severity: params.severity,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          related_entity_type: params.related_entity_type || null,
          related_entity_id: params.related_entity_id || null,
          description: params.description,
          expected_value: params.expected_value != null ? String(params.expected_value) : null,
          actual_value: params.actual_value != null ? String(params.actual_value) : null,
          detected_at: new Date().toISOString(),
          detected_by: actorEmail,
          status: 'NEW',
          mode: params.mode || 'REAL'
        });
        summary.exceptions_created++;
        summary.exceptions_by_type[params.exception_type] = (summary.exceptions_by_type[params.exception_type] || 0) + 1;
        summary.exceptions_by_severity[params.severity]++;
      }

      // ── CHECK 1: Orphaned PaymentRecords ──
      for (const pr of paymentRecords) {
        if (['CONFIRMED', 'EXTERNAL_CONFIRMED', 'CAPTURED'].includes(pr.status) && !pr.linked_order_id) {
          const orders = orderByToken.get(pr.processor_reference) || [];
          if (orders.length === 0) {
            queue({
              exception_type: 'orphaned_payment_record', severity: 'warning',
              entity_type: 'PaymentRecord', entity_id: pr.record_id || pr.id,
              description: `PaymentRecord ${pr.record_id} is ${pr.status} but has no linked GlyphBucksOrder`,
              expected_value: 'linked_order_id set', actual_value: 'null', mode: pr.mode
            });
          }
        }
      }

      // ── CHECK 2: Orphaned GlyphBucksOrders ──
      for (const o of gbOrders) {
        if (o.status === 'archived') {
          const prs = prByRef.get(o.card_token) || [];
          if (prs.length === 0) {
            queue({
              exception_type: 'orphaned_glyphbucks_order', severity: 'info',
              entity_type: 'GlyphBucksOrder', entity_id: o.id,
              description: `GlyphBucksOrder ${o.order_number} has no PaymentRecord (may be legacy)`,
              mode: 'REAL'
            });
          }
        }
      }

      // ── CHECK 3: Amount mismatch PaymentRecord → GlyphBucksOrder ──
      for (const pr of paymentRecords) {
        if (!['CONFIRMED', 'EXTERNAL_CONFIRMED', 'CAPTURED'].includes(pr.status)) continue;
        const orders = orderByToken.get(pr.processor_reference) || [];
        for (const o of orders) {
          if (o.status === 'draft') continue;
          if (Math.abs((pr.amount || 0) - (o.grand_total || 0)) > 0.01) {
            queue({
              exception_type: 'amount_mismatch_payment_to_order', severity: 'critical',
              entity_type: 'PaymentRecord', entity_id: pr.record_id || pr.id,
              related_entity_type: 'GlyphBucksOrder', related_entity_id: o.id,
              description: `PaymentRecord ${pr.record_id} ($${pr.amount}) ≠ Order ${o.order_number} ($${o.grand_total})`,
              expected_value: pr.amount, actual_value: o.grand_total, mode: pr.mode
            });
          }
        }
      }

      // ── CHECK 4: Orphaned GlyphBucksBatch ──
      for (const b of gbBatches) {
        const orders = orderByToken.get(b.processor_reference) || [];
        if (orders.length === 0) {
          queue({
            exception_type: 'orphaned_glyphbucks_batch', severity: 'warning',
            entity_type: 'GlyphBucksBatch', entity_id: b.batch_id || b.id,
            description: `Batch ${b.batch_id} has no matching GlyphBucksOrder (ref: ${b.processor_reference})`,
            mode: b.mode
          });
        }
      }

      // ── CHECK 5: Amount mismatch GlyphBucksOrder → GlyphBucksBatch ──
      for (const o of gbOrders) {
        if (o.status === 'draft') continue;
        const b = batchByRef.get(o.card_token);
        if (b && Math.abs((o.grand_total || 0) - (b.total_charged || 0)) > 0.01) {
          queue({
            exception_type: 'amount_mismatch_order_to_batch', severity: 'critical',
            entity_type: 'GlyphBucksOrder', entity_id: o.id,
            related_entity_type: 'GlyphBucksBatch', related_entity_id: b.id,
            description: `Order ${o.order_number} ($${o.grand_total}) ≠ Batch ${b.batch_id} ($${b.total_charged})`,
            expected_value: o.grand_total, actual_value: b.total_charged, mode: b.mode
          });
        }
      }

      // ── CHECK 6 & 7: Bill count and face value mismatch ──
      for (const b of gbBatches) {
        const bills = billsByBatch.get(b.batch_id) || [];
        const expectedCount = (b.denominations || []).reduce((s, d) => s + (d.quantity || 0), 0);
        const expectedFace = b.total_face_value || 0;
        const actualCount = bills.length;
        const actualFace = bills.reduce((s, bill) => s + (bill.denomination || 0), 0);

        if (actualCount !== expectedCount) {
          queue({
            exception_type: 'bill_count_mismatch', severity: 'critical',
            entity_type: 'GlyphBucksBatch', entity_id: b.batch_id || b.id,
            description: `Batch ${b.batch_id}: expected ${expectedCount} bills, found ${actualCount}`,
            expected_value: expectedCount, actual_value: actualCount, mode: b.mode
          });
        }
        if (Math.abs(actualFace - expectedFace) > 0.01) {
          queue({
            exception_type: 'bill_face_value_mismatch', severity: 'critical',
            entity_type: 'GlyphBucksBatch', entity_id: b.batch_id || b.id,
            description: `Batch ${b.batch_id}: expected face value $${expectedFace}, bills sum to $${actualFace}`,
            expected_value: expectedFace, actual_value: actualFace, mode: b.mode
          });
        }
      }

      // ── CHECK 8: Duplicate processor references ──
      for (const [ref, prs] of prByRef) {
        if (prs.length > 1) {
          for (const pr of prs) {
            queue({
              exception_type: 'duplicate_processor_reference', severity: 'critical',
              entity_type: 'PaymentRecord', entity_id: pr.record_id || pr.id,
              description: `Duplicate processor_reference ${ref} in ${prs.length} PaymentRecords`,
              mode: pr.mode
            });
          }
        }
      }
      for (const [token, orders] of orderByToken) {
        if (orders.length > 1) {
          for (const o of orders) {
            queue({
              exception_type: 'duplicate_processor_reference', severity: 'critical',
              entity_type: 'GlyphBucksOrder', entity_id: o.id,
              description: `Duplicate card_token ${token} in ${orders.length} GlyphBucksOrders`,
              mode: 'REAL'
            });
          }
        }
      }

      // ── CHECK 9: PaymentRecord stuck in PENDING > 1 hour ──
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      for (const pr of paymentRecords) {
        if (pr.status === 'PENDING' && pr.created_date && pr.created_date < oneHourAgo) {
          queue({
            exception_type: 'payment_record_stuck_pending', severity: 'warning',
            entity_type: 'PaymentRecord', entity_id: pr.record_id || pr.id,
            description: `PaymentRecord ${pr.record_id} stuck in PENDING since ${pr.created_date}`,
            mode: pr.mode
          });
        }
      }

      // ── CHECK 10: Unconfirmed PaymentRecord with issued bills ──
      for (const pr of paymentRecords) {
        if (!['CONFIRMED', 'EXTERNAL_CONFIRMED', 'CAPTURED'].includes(pr.status)) {
          const batches = gbBatches.filter(b => b.processor_reference === pr.processor_reference);
          if (batches.length > 0) {
            queue({
              exception_type: 'unconfirmed_payment_record_with_bills', severity: 'critical',
              entity_type: 'PaymentRecord', entity_id: pr.record_id || pr.id,
              description: `PaymentRecord ${pr.record_id} is ${pr.status} but bills issued (batch ${batches[0].batch_id})`,
              mode: pr.mode
            });
          }
        }
      }

      // ── CHECK 11: Issued bills without ledger posting ──
      // A GlyphBucksBatch with issued/redeemed bills should have a JournalEntry
      // with source_type='GLYPHBUCKS_SALE' and source_id=batch_id.
      for (const b of gbBatches) {
        const bills = billsByBatch.get(b.batch_id) || [];
        const activeBills = bills.filter(bill => bill.status === 'issued' || bill.status === 'redeemed');
        if (activeBills.length > 0) {
          const jes = jeBySource.get(b.batch_id) || [];
          if (jes.length === 0) {
            queue({
              exception_type: 'issued_bills_without_ledger_posting', severity: 'critical',
              entity_type: 'GlyphBucksBatch', entity_id: b.batch_id || b.id,
              description: `Batch ${b.batch_id} has ${activeBills.length} active bills but no GLYPHBUCKS_SALE journal entry`,
              expected_value: 'JournalEntry (GLYPHBUCKS_SALE)', actual_value: 'none', mode: b.mode
            });
          }
        }
      }

      // ── CHECK 12: Ledger posting without source payment record ──
      // A JournalEntry with source_type='GLYPHBUCKS_SALE' should trace back to
      // a PaymentRecord via the batch's processor_reference.
      for (const je of journalEntries) {
        if (je.status !== 'POSTED') continue;
        const batch = gbBatches.find(b => b.batch_id === je.source_id || b.id === je.source_id);
        if (batch) {
          const prs = prByRef.get(batch.processor_reference) || [];
          if (prs.length === 0) {
            queue({
              exception_type: 'ledger_posting_without_payment_record', severity: 'critical',
              entity_type: 'JournalEntry', entity_id: je.id,
              related_entity_type: 'GlyphBucksBatch', related_entity_id: batch.batch_id || batch.id,
              description: `JournalEntry ${je.idempotency_key} (GLYPHBUCKS_SALE) has no matching PaymentRecord (batch ${batch.batch_id}, ref ${batch.processor_reference})`,
              expected_value: 'PaymentRecord exists', actual_value: 'none', mode: je.mode
            });
          }
        } else {
          // JournalEntry references a batch that doesn't exist
          queue({
            exception_type: 'ledger_posting_without_payment_record', severity: 'critical',
            entity_type: 'JournalEntry', entity_id: je.id,
            description: `JournalEntry ${je.idempotency_key} references batch ${je.source_id} which does not exist`,
            expected_value: 'GlyphBucksBatch exists', actual_value: 'not found', mode: je.mode
          });
        }
      }

      // ── BULK CREATE EXCEPTIONS ──
      if (toCreate.length > 0) {
        await base44.asServiceRole.entities.ReconciliationException.bulkCreate(toCreate);
      }
    }

    // ── AUDIT LOG ──
    try {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'RECONCILIATION_RUN',
        entity_type: 'ReconciliationException',
        entity_id: runId,
        actor_id: actorEmail,
        venue_id: venueFilter || 'all',
        severity: 'INFO',
        description: `Reconciliation ${runId}: ${summary.venues_checked} venues, ${summary.exceptions_created} exceptions`,
        timestamp: new Date().toISOString(),
        metadata: summary
      });
    } catch (_) { /* non-blocking */ }

    return Response.json({ success: true, ...summary });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Reconciliation engine error:`, error);
    return Response.json({
      success: false,
      error: 'Reconciliation engine failed',
      error_id: errorId
    }, { status: 500 });
  }
});