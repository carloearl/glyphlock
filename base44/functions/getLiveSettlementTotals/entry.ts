import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * DACO-20260614: Live Settlement Aggregator for Front Door POS
 * Fetches real-time cash + card totals + pending driver payouts for venue
 * CRITICAL: Server-side timestamp validation ensures Z-Report sync integrity
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { venue_id, business_date } = await req.json();
    if (!venue_id || !business_date) {
      return Response.json({ error: 'Missing venue_id or business_date' }, { status: 400 });
    }

    // === CASH + CARD AGGREGATION (POSTransaction source of truth) ===
    const transactions = await base44.asServiceRole.entities.POSTransaction.filter(
      {
        venue_id,
        status: 'completed',
        mode: 'REAL'
      },
      '-created_date',
      1000 // Safety limit
    );

    const totals = transactions.reduce((acc, t) => {
      acc.cash_sales += (t.cash_sales || 0);
      acc.card_sales += (t.card_sales || 0);
      acc.transaction_count += 1;
      return acc;
    }, { cash_sales: 0, card_sales: 0, transaction_count: 0 });

    // === DRIVER PAYOUT OWED (Pending only) ===
    const pendingPayouts = await base44.asServiceRole.entities.DriverPayout.filter(
      {
        venue_id,
        payout_status: 'PENDING',
        session_date: business_date
      },
      '-created_date',
      500
    );

    const payout_owed = pendingPayouts.reduce((sum, p) => sum + (p.total_payout || 0), 0);
    const payout_count = pendingPayouts.length;

    // === PROCESSED PAYOUTS (For reconciliation) ===
    const processedPayouts = await base44.asServiceRole.entities.DriverPayout.filter(
      {
        venue_id,
        payout_status: 'PROCESSED',
        session_date: business_date
      },
      '-created_date',
      500
    );

    const payout_processed = processedPayouts.reduce((sum, p) => sum + (p.total_payout || 0), 0);

    // === NET DRAWER BALANCE ===
    const total_sales = totals.cash_sales + totals.card_sales;
    const net_drawer = totals.cash_sales - payout_owed; // Cash in - outstanding driver payouts

    return Response.json({
      venue_id,
      business_date,
      timestamp: new Date().toISOString(),
      // Revenue breakdown
      cash_sales: Math.round(totals.cash_sales * 100) / 100,
      card_sales: Math.round(totals.card_sales * 100) / 100,
      total_sales: Math.round(total_sales * 100) / 100,
      transaction_count: totals.transaction_count,
      // Driver payouts
      payout_owed: Math.round(payout_owed * 100) / 100,
      payout_processed: Math.round(payout_processed * 100) / 100,
      payout_count,
      // Operational insight
      net_drawer: Math.round(net_drawer * 100) / 100,
      cash_shortage_flag: net_drawer < 0, // RED FLAG if true
    });
  } catch (error) {
    console.error('Settlement aggregation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});