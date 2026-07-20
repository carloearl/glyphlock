import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * SECURE Z-REPORT GENERATOR
 * Authority: DACO — Architecture Lock ACTIVE
 * Canonical formula: total_sales = cashSales + cardSales (tips excluded, REAL mode only)
 * Per BPAAA v3.0
 * Role: PLATFORM_ADMIN | VENUE_OWNER | VENUE_MANAGER required.
 */

const ALLOWED_ROLES = ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];
const CARD_WHITELIST = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Automation scheduler runs with no user session — auth.me() may throw.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) { /* automation path — no user */ }
    const isAutomation = !user;

    // Allow automation scheduler (no user) or admin users only
    if (user && user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Scheduler may send an empty/non-JSON body
    const body = await req.json().catch(() => ({}));
    const { opening_cash, closing_cash, reconciliation_notes, venue_id } = body;

    // Role check (interactive calls only — automation runs as PLATFORM_ADMIN)
    if (!isAutomation) {
      const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({ email: user.email });
      const nupsUser = nupsUsers[0];
      const userRole = nupsUser?.role || (user?.role === 'admin' ? 'PLATFORM_ADMIN' : null);

      if (!ALLOWED_ROLES.includes(userRole)) {
        return Response.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
      }
    }

    const actorEmail = user?.email || 'automation@system';

    // Fetch today's transactions
    const allTxns = await base44.asServiceRole.entities.POSTransaction.list('-created_date', 500);
    const today = new Date().toDateString();
    const todayTxns = allTxns.filter(t => new Date(t.created_date).toDateString() === today);

    // DACO-20260613-DOOR-RBAC — exclude funds-off validation records from booked totals.
    // `!== true` preserves legacy rows (undefined/null/false → included). Applies to
    // cashSales, cardSales, totalSales, doorTxns, barTxns, products_sold — all derive from realTxns.
    const realTxns = todayTxns.filter(t => (!t.mode || t.mode === 'REAL') && t.validation_run !== true);
    const demoTxns = todayTxns.filter(t => t.mode === 'DEMO' || t.mode === 'TEST');

    if (realTxns.length === 0) {
      // Automation: a quiet day is not a failure — skip cleanly.
      if (isAutomation) {
        return Response.json({ ok: true, skipped: 'no_real_transactions_today' });
      }
      return Response.json({ error: 'No REAL transactions found for today. Cannot generate an empty Z-Report.' }, { status: 422 });
    }

    // CANONICAL FORMULA — BPAAA v3.0 — LOCKED
    // total_sales = cashSales + cardSales only. Tips excluded. GlyphBucks excluded. REAL only.
    const cashSales = realTxns
      .filter(t => t.payment_method === 'Cash')
      .reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);

    const cardSales = realTxns
      .filter(t => CARD_WHITELIST.includes(t.payment_method))
      .reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);

    const totalSales = cashSales + cardSales;

    // Section 4 reconciliation
    const openingCashNum = Number(opening_cash) || 0;
    const closingCashNum = Number(closing_cash) || 0;
    const expectedCash = openingCashNum + cashSales;
    const cashOverShort = closingCashNum - expectedCash;
    const requiresReview = Math.abs(cashOverShort) > 0.01;

    if (requiresReview && !reconciliation_notes?.trim()) {
      return Response.json({ error: `Cash discrepancy of $${cashOverShort.toFixed(2)} detected. Reconciliation notes required.` }, { status: 422 });
    }

    // VIP revenue (operational — not in total_sales)
    const allVIP = await base44.asServiceRole.entities.VIPRoom.list('-created_date', 200);
    const todayVIP = allVIP.filter(r => r.start_time && new Date(r.start_time).toDateString() === today);
    const vipRevenue = todayVIP.reduce((s, r) => s + (r.total_charge || 0), 0);

    // Station breakdown
    const doorTxns = realTxns.filter(t => !t.station || t.station === 'door');
    const barTxns = realTxns.filter(t => t.station === 'bar');
    const doorSales = doorTxns.reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const barSales = barTxns.reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);

    // Product breakdown
    const productMap = {};
    realTxns.forEach(t => {
      t.items?.forEach(item => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { quantity: 0, total: 0 };
        productMap[item.product_name].quantity += item.quantity;
        productMap[item.product_name].total += item.total;
      });
    });
    const products_sold = Object.entries(productMap).map(([name, d]) => ({ product_name: name, quantity: d.quantity, total: d.total }));

    // Batch lookup
    const allBatches = await base44.asServiceRole.entities.POSBatch.list('-created_date', 20);
    const todayBatch = allBatches.find(b =>
      new Date(b.start_time).toDateString() === today && (b.status === 'closed' || b.status === 'REQUIRES_REVIEW')
    );

    // GlyphBucks ledger
    const allGBTxns = await base44.asServiceRole.entities.GlyphBucksTransaction.list('-created_date', 500);
    const todayGB = allGBTxns.filter(t => new Date(t.created_date).toDateString() === today && t.status === 'active');
    const gbIssued = todayGB.filter(t => t.transaction_type === 'Issue').reduce((s, t) => s + (t.amount || 0), 0);
    const gbRedeemed = todayGB.filter(t => t.transaction_type === 'Redeem').reduce((s, t) => s + Math.abs(t.amount || 0), 0);

    const cashierDisplay = user?.full_name || user?.email || 'Automated Settlement';
    const barRevenue = realTxns
      .filter(t => t.items?.some(item => item.product_name?.includes('Drink')))
      .reduce((s, t) => s + (t.total || 0), 0);
    const merchandiseRevenue = totalSales - barRevenue - vipRevenue;

    const report = await base44.asServiceRole.entities.POSZReport.create({
      report_id: `Z-${Date.now()}`,
      report_date: new Date().toISOString().split('T')[0],
      start_time: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      end_time: new Date().toISOString(),
      cashier_name: cashierDisplay,
      opening_cash: openingCashNum,
      closing_cash: closingCashNum,
      cash_sales: cashSales,
      card_sales: cardSales,
      total_sales: totalSales,
      transaction_count: realTxns.length,
      real_transaction_count: realTxns.length,
      demo_transaction_count: demoTxns.length,
      batch_id: todayBatch?.batch_id || null,
      vip_room_revenue: vipRevenue,
      bar_revenue: barRevenue,
      merchandise_revenue: merchandiseRevenue,
      expected_cash: expectedCash,
      actual_cash: closingCashNum,
      cash_over_short: cashOverShort,
      corrected_total_sales: totalSales,
      batch_discrepancy_total: cashOverShort,
      requires_review: requiresReview,
      reconciliation_notes: reconciliation_notes?.trim() || null,
      reconciled_by: actorEmail,
      reconciled_at: new Date().toISOString(),
      discrepancy: cashOverShort,
      products_sold,
      notes: JSON.stringify({
        door_register_sales: doorSales,
        door_register_count: doorTxns.length,
        bar_register_sales: barSales,
        bar_register_count: barTxns.length,
        gb_ledger_issued: gbIssued,
        gb_ledger_redeemed: gbRedeemed,
        gb_ledger_net: gbIssued - gbRedeemed,
        demo_transaction_count: demoTxns.length,
        demo_total: demoTxns.reduce((s, t) => s + (t.total || 0), 0)
      })
    });

    // Audit log — OMEGA-A
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'Z_REPORT_GENERATED',
      description: `Z-Report ${report.report_id} closed by ${actorEmail}. Total Sales: $${totalSales.toFixed(2)}. Cash Over/Short: $${cashOverShort.toFixed(2)}.`,
      actor_email: actorEmail,
      status: requiresReview ? 'alert' : 'success',
      severity: requiresReview ? 'high' : 'low',
      resource_id: report.report_id,
      metadata: {
        report_id: report.report_id,
        batch_id: report.batch_id,
        total_sales: totalSales,
        cash_sales: cashSales,
        card_sales: cardSales,
        cash_over_short: cashOverShort,
        requires_review: requiresReview,
        real_transactions: realTxns.length,
        demo_transactions: demoTxns.length,
        section: 'OMEGA-A-Z-REPORT'
      }
    });

    return Response.json({ report });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});