import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

/**
 * SECURE Register BATCH CLOSE
 * Authority: DACO — Architecture Lock ACTIVE
 * Role: PLATFORM_ADMIN | VENUE_OWNER | VENUE_MANAGER required.
 */

const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);
const ALLOWED_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const NUPS_ROLE_BY_GRANT: Record<string, string> = {
  OWNER: 'VENUE_OWNER', ADMINISTRATOR: 'PLATFORM_ADMIN', MANAGER: 'VENUE_MANAGER',
};

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const accountMode = (account: any) => account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');

async function resolveActiveVenue(E: any, venueRef: unknown) {
  const ref = String(venueRef || '').trim();
  if (!ref) return null;
  let venue = await E.Venue.get(ref).catch(() => null);
  if (!venue) venue = (await E.Venue.filter({ venue_id: ref }, '-created_date', 2).catch(() => []))?.[0] || null;
  if (venue?.status !== 'active') return null;
  return String(venue.venue_id || venue.id || '').trim();
}

async function resolveRealManager(E: any, email: string, venueId: string) {
  if (SOVEREIGN_EMAILS.has(email)) return { role: 'SOVEREIGN', venue_id: venueId };
  const grants = await E.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id: venueId, mode: 'REAL' }, '-created_date').catch(() => []);
  for (const grant of grants || []) {
    if (grant.venue_id !== venueId || grant.mode !== 'REAL' || !grant.nups_user_id) continue;
    const account = await E.NUPSUser.get(grant.nups_user_id).catch(() => null);
    const expectedRole = NUPS_ROLE_BY_GRANT[grant.granted_role];
    if (account?.status === 'active' && expectedRole && account.role === expectedRole && ALLOWED_ROLES.has(account.role) && account.venue_id === venueId && accountMode(account) === 'REAL') return account;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batch_id, closing_cash, notes } = await req.json();

    if (!batch_id) {
      return Response.json({ error: 'batch_id is required' }, { status: 400 });
    }

    // Fetch batch
    const E = base44.asServiceRole.entities;
    const allBatches = await E.POSBatch.list('-created_date', 50);
    const batch = allBatches.find(b => b.batch_id === batch_id || b.id === batch_id);

    if (!batch) {
      return Response.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch.status === 'closed') {
      return Response.json({ error: 'Batch already closed' }, { status: 409 });
    }

    const canonicalVenueId = await resolveActiveVenue(E, batch.venue_id);
    if (!canonicalVenueId) return Response.json({ error: 'Batch venue is not active' }, { status: 403 });
    const nupsUser = await resolveRealManager(E, normalizeEmail(user.email), canonicalVenueId);
    if (!nupsUser) return Response.json({ error: 'Approved REAL manager authorization is required for this batch venue' }, { status: 403 });
    const userRole = nupsUser.role;

    // Calculate batch totals from real transactions
    const allTxns = await E.POSTransaction.list('-created_date', 500);
    const batchTxns = allTxns.filter(t => t.batch_id === batch_id || t.batch_id === batch.id);
    // DACO-20260613-DOOR-RBAC — exclude funds-off validation records from booked totals.
    // `!== true` preserves legacy rows (undefined/null/false → included).
    const realTxns = batchTxns.filter(t => (!t.mode || t.mode === 'REAL') && t.validation_run !== true);

    const totalSales = realTxns.reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const closingCashNum = Number(closing_cash) || 0;
    const expectedCash = (batch.opening_cash || 0) + realTxns.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const discrepancy = closingCashNum - expectedCash;

    // Snapshot pre-close batch state for differential audit
    const beforeSnap = {
      status: batch.status,
      total_sales: batch.total_sales || 0,
      closing_cash: batch.closing_cash || 0,
      discrepancy: batch.discrepancy || 0,
      transaction_count: batch.transaction_count || 0,
    };
    const afterSnap = {
      status: 'closed',
      total_sales: totalSales,
      closing_cash: closingCashNum,
      discrepancy,
      transaction_count: realTxns.length,
    };

    await E.POSBatch.update(batch.id, {
      status: 'closed',
      closing_cash: closingCashNum,
      end_time: new Date().toISOString(),
      total_sales: totalSales,
      transaction_count: realTxns.length,
      discrepancy,
      notes: notes || batch.notes
    });

    // Audit log
    await E.SystemAuditLog.create({
      event_type: 'POS_BATCH_CLOSED',
      description: `POSBatch ${batch_id} closed by ${user.email}. Total Sales: $${totalSales.toFixed(2)}. Discrepancy: $${discrepancy.toFixed(2)}.`,
      actor_email: user.email,
      status: 'success',
      severity: Math.abs(discrepancy) > 0.01 ? 'medium' : 'low',
      resource_id: batch_id,
      metadata: { batch_id, total_sales: totalSales, closing_cash: closingCashNum, discrepancy, real_txns: realTxns.length }
    });

    // Append-only differential audit trail (ActivityLog) — feeds the Accounting Diff panel
    await E.ActivityLog.create({
      timestamp: new Date().toISOString(),
      user_email: user.email,
      user_role: userRole,
      action_type: 'UPDATE',
      entity_affected: `POSBatch:${batch.id}`,
      before_value: beforeSnap,
      after_value: afterSnap,
      venue_id: batch.venue_id || null,
      mode: 'REAL',
      notes: `DIFFERENTIAL [BATCH_CLOSE] batch=${batch_id} txns=${realTxns.length} variance=$${discrepancy.toFixed(2)}`
    });

    return Response.json({ batch_id, total_sales: totalSales, discrepancy, status: 'closed' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
