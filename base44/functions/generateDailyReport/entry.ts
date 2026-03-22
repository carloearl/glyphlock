import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * DAILY REVENUE REPORT GENERATOR
 * Automated financial summary for venue managers
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { venue_id, date } = await req.json();
    const target_date = date || new Date().toISOString().split('T')[0];

    // Fetch all transactions for the day
    const orders = await base44.asServiceRole.entities.DreamPalaceOrder.filter({
      venue_id,
      signed_at: { $gte: `${target_date}T00:00:00`, $lte: `${target_date}T23:59:59` }
    });

    const batches = await base44.asServiceRole.entities.DreamDollarBatch.filter({
      venue_id,
      issued_at: { $gte: `${target_date}T00:00:00`, $lte: `${target_date}T23:59:59` }
    });

    const payouts = await base44.asServiceRole.entities.ContractorPayout.filter({
      venue_id,
      payout_date: target_date
    });

    // Calculate totals
    const total_revenue = batches.reduce((sum, b) => sum + (b.total_charged || 0), 0);
    const total_face_value = batches.reduce((sum, b) => sum + (b.total_face_value || 0), 0);
    const total_surcharge = batches.reduce((sum, b) => sum + (b.surcharge_amount || 0), 0);
    const total_payouts = payouts.reduce((sum, p) => sum + (p.total_payout || 0), 0);

    const report = {
      venue_id,
      date: target_date,
      transactions: {
        total_orders: orders.length,
        total_batches: batches.length,
        total_revenue,
        total_face_value,
        total_surcharge
      },
      payouts: {
        total_payouts,
        payout_count: payouts.length
      },
      net_revenue: total_revenue - total_payouts
    };

    return Response.json(report);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});