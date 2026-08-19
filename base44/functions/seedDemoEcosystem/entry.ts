// DACO OMEGA v6.0 — Phase 6: seedDemoEcosystem
// SOVEREIGN-gated. Creates minimal but realistic DEMO records:
//   1 Manager, 1 Bartender, 1 Door Girl (FLOOR_HOST), 1 Hostess (FLOOR_HOST tagged),
//   1 sample shift (POSBatch), 2 sample transactions, 1 tip-payout placeholder.
// Idempotent: re-running creates additional rows tagged is_demo (no destructive ops).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function isCallerSovereign(base44, email) {
  if (!email) return false;
  try {
    const matches = await base44.asServiceRole.entities.NUPSUser.filter({ created_by: email });
    return (matches || []).some((u) => u?.sovereign_flag === true || u?.role === 'SOVEREIGN');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'UNAUTHORIZED', code: 401 }, { status: 401 });

    const sovereign = await isCallerSovereign(base44, me.email);
    if (!sovereign) {
      return Response.json({ error: 'SOVEREIGN_REQUIRED', code: 403 }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const venue_id = body.venue_id || 'DEMO_VENUE_001';

    // LIVE-MODE LOCK — demo data may never be seeded into a live venue.
    // The venue's own VenueRateConfig.mode is the authority (never the client).
    const configs = await base44.asServiceRole.entities.VenueRateConfig.filter({ venue_id });
    const venueMode = configs[0]?.mode || null;
    if (venueMode === 'REAL') {
      await base44.asServiceRole.entities.MigrationAuditLog.create({
        entity_name: 'multi',
        operation: 'create',
        actor_id: me.email,
        actor_role: 'SOVEREIGN',
        mode: 'DEMO',
        tier: 'TIER_1_OBSERVE',
        result: 'blocked',
        venue_id,
        notes: 'seedDemoEcosystem blocked — venue is in LIVE (REAL) mode',
      });
      return Response.json({
        error: 'DEMO_SEED_BLOCKED_LIVE_MODE',
        message: `${venue_id} is operating in LIVE mode. Demo data cannot be seeded into a live venue.`,
      }, { status: 409 });
    }

    const created = { staff: [], batches: [], transactions: [], tipPayouts: [] };

    // --- Staff seats (one per role) ---
    const staffSeed = [
      { username: 'demo_mgr', full_name: 'Demo Manager', role: 'VENUE_MANAGER', pin: '1111', employee_id: 'MGR-DEMO-001', demo_label: 'Demo Manager Seat' },
      { username: 'demo_bar', full_name: 'Demo Bartender', role: 'BARTENDER', pin: '2222', employee_id: 'BAR-DEMO-001', demo_label: 'Demo Bartender Seat' },
      { username: 'demo_door', full_name: 'Demo Door Girl', role: 'FLOOR_HOST', pin: '3333', employee_id: 'DOOR-DEMO-001', demo_label: 'Demo Door Girl Seat' },
      { username: 'demo_host', full_name: 'Demo Hostess', role: 'FLOOR_HOST', pin: '4444', employee_id: 'HOST-DEMO-001', demo_label: 'Demo Hostess Seat' },
    ];
    for (const s of staffSeed) {
      const row = await base44.asServiceRole.entities.NUPSUser.create({
        ...s,
        venue_id,
        is_demo: true,
        status: 'active',
        created_note: 'seedDemoEcosystem',
      });
      created.staff.push(row.id);
    }

    // --- Sample shift (POSBatch) ---
    const start = new Date();
    const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
    const batch = await base44.asServiceRole.entities.POSBatch.create({
      batch_id: `DEMO-BATCH-${Date.now()}`,
      venue_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      opening_cash: 300,
      closing_cash: 845,
      total_sales: 545,
      transaction_count: 2,
      cashier: 'demo_bar',
      status: 'closed',
    });
    created.batches.push(batch.id);

    // --- Sample transactions (cash + card) ---
    const tx1 = await base44.asServiceRole.entities.POSTransaction.create({
      transaction_id: `DEMO-TX-${Date.now()}-A`,
      venue_id,
      items: [{ product_name: 'Demo Beer', quantity: 2, price: 12, total: 24 }],
      subtotal: 24,
      tax: 1.92,
      tip: 5,
      total: 30.92,
      payment_method: 'Cash',
      cashier: 'demo_bar',
      status: 'completed',
    });
    created.transactions.push(tx1.id);

    const tx2 = await base44.asServiceRole.entities.POSTransaction.create({
      transaction_id: `DEMO-TX-${Date.now()}-B`,
      venue_id,
      items: [{ product_name: 'Demo Cocktail', quantity: 1, price: 18, total: 18 }],
      subtotal: 18,
      tax: 1.44,
      tip: 4,
      total: 23.44,
      payment_method: 'Credit Card',
      cashier: 'demo_bar',
      status: 'completed',
    });
    created.transactions.push(tx2.id);

    // --- Tip payout placeholder using CORRECT bucket-1 hierarchy ---
    const tipPayout = await base44.asServiceRole.entities.TipPayout.create({
      payout_date: new Date().toISOString().slice(0, 10),
      venue_id,
      total_tips: 200,
      split_config: {
        bucket: 'BUCKET_1_STAFF_POOL',
        manager: 0.30,
        hostess: 0.20,
        asst_manager: 0.10,
        dj: 0.10,
        security_doorman_remainder: 0.30,
      },
      signatures: [],
      manager_email: me.email,
      status: 'pending',
    });
    created.tipPayouts.push(tipPayout.id);

    // --- Audit ---
    await base44.asServiceRole.entities.MigrationAuditLog.create({
      entity_name: 'multi',
      operation: 'create',
      actor_id: me.email,
      actor_role: 'SOVEREIGN',
      mode: 'DEMO',
      tier: 'TIER_1_OBSERVE',
      result: 'allowed',
      venue_id,
      notes: `seedDemoEcosystem: ${JSON.stringify(created)}`,
    });

    return Response.json({ ok: true, mode: 'DEMO', venue_id, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});