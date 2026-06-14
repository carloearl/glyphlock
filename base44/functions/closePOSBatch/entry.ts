import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * SECURE POS BATCH CLOSE
 * Authority: DACO — Architecture Lock ACTIVE
 * Role: PLATFORM_ADMIN | VENUE_OWNER | VENUE_MANAGER required.
 */

const ALLOWED_ROLES = ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batch_id, closing_cash, notes } = await req.json();

    if (!batch_id) {
      return Response.json({ error: 'batch_id is required' }, { status: 400 });
    }

    // Role check
    const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({ email: user.email });
    const nupsUser = nupsUsers[0];
    const userRole = nupsUser?.role || (user.role === 'admin' ? 'PLATFORM_ADMIN' : null);

    if (!ALLOWED_ROLES.includes(userRole)) {
      return Response.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    // Fetch batch
    const allBatches = await base44.asServiceRole.entities.POSBatch.list('-created_date', 50);
    const batch = allBatches.find(b => b.batch_id === batch_id || b.id === batch_id);

    if (!batch) {
      return Response.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch.status === 'closed') {
      return Response.json({ error: 'Batch already closed' }, { status: 409 });
    }

    // Venue scope check
    if (userRole !== 'PLATFORM_ADMIN' && nupsUser?.venue_id && batch.venue_id && nupsUser.venue_id !== batch.venue_id) {
      return Response.json({ error: 'Forbidden: venue mismatch' }, { status: 403 });
    }

    // Calculate batch totals from real transactions
    const allTxns = await base44.asServiceRole.entities.POSTransaction.list('-created_date', 500);
    const batchTxns = allTxns.filter(t => t.batch_id === batch_id || t.batch_id === batch.id);
    // DACO-20260613-DOOR-RBAC — exclude funds-off validation records from booked totals.
    // `!== true` preserves legacy rows (undefined/null/false → included).
    const realTxns = batchTxns.filter(t => (!t.mode || t.mode === 'REAL') && t.validation_run !== true);

    const totalSales = realTxns.reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const closingCashNum = Number(closing_cash) || 0;
    const expectedCash = (batch.opening_cash || 0) + realTxns.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const discrepancy = closingCashNum - expectedCash;

    await base44.asServiceRole.entities.POSBatch.update(batch.id, {
      status: 'closed',
      closing_cash: closingCashNum,
      end_time: new Date().toISOString(),
      total_sales: totalSales,
      transaction_count: realTxns.length,
      discrepancy,
      notes: notes || batch.notes
    });

    // Audit log
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'POS_BATCH_CLOSED',
      description: `POSBatch ${batch_id} closed by ${user.email}. Total Sales: $${totalSales.toFixed(2)}. Discrepancy: $${discrepancy.toFixed(2)}.`,
      actor_email: user.email,
      status: 'success',
      severity: Math.abs(discrepancy) > 0.01 ? 'medium' : 'low',
      resource_id: batch_id,
      metadata: { batch_id, total_sales: totalSales, closing_cash: closingCashNum, discrepancy, real_txns: realTxns.length }
    });

    return Response.json({ batch_id, total_sales: totalSales, discrepancy, status: 'closed' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});