import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

// Dance Dollars — modular GlyphBucks instrument for credit-card clients.
// Editable denomination + editable face value, real 12-digit serials with a
// real verification token embedded in the QR. Dancer-redeemable ONLY —
// NOT redeemable for cash (redemption credits the dancer, never the guest).
//
// Each note gets: serial_number (12 digits), barcode_number (12 digits, so the
// client Code-128 renderer uses Code-C), and qr_code_url = the /v/ verify URL.
//
// Auth: staff/manager/admin only. All writes are service-role (server side).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    if (!['admin', 'manager', 'staff'].includes(user.role)) {
      return Response.json({ error: 'Staff access required.' }, { status: 403 });
    }

    const E = base44.asServiceRole.entities;
    const body = await req.json();

    const denomination = Number(body.denomination);          // printed face value on the note
    const face_value = body.face_value != null ? Number(body.face_value) : denomination; // dancer-redeem value
    const quantity = Number(body.quantity);
    const venue_id = body.venue_id;
    if (!venue_id) return Response.json({ error: 'Active venue is required.' }, { status: 400 });
    const purchaser_name = String(body.purchaser_name || '').slice(0, 120);
    const redemption_rate = body.redemption_rate != null ? Number(body.redemption_rate) : 1; // dancer gets 100% of face by default

    if (!denomination || denomination <= 0) return Response.json({ error: 'A positive denomination is required.' }, { status: 400 });
    if (!face_value || face_value <= 0) return Response.json({ error: 'A positive face value is required.' }, { status: 400 });
    if (!quantity || quantity < 1 || quantity > 500) return Response.json({ error: 'Quantity must be 1–500.' }, { status: 400 });

    const baseUrl = Deno.env.get('BASE_URL') || '';
    const now = new Date().toISOString();
    const stamp = Date.now();

    // 12-digit numeric serials: 6-digit time slice + 6-digit sequence.
    const timeSlice = String(stamp).slice(-6);
    const bills = [];
    for (let i = 0; i < quantity; i++) {
      const seq = String(i + 1).padStart(6, '0');
      const serial = `${timeSlice}${seq}`;                    // 12 digits
      const verify_ref = `${serial}${crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()}`;
      const qr_url = `${baseUrl}/v/${verify_ref}`;
      bills.push({ serial, verify_ref, qr_url });
    }

    // Collision guard within venue.
    const existing = (await E.GlyphBucksBill.filter({ venue_id, denomination })) || [];
    const existingSerials = new Set(existing.map((b: any) => b.serial_number));
    const clash = bills.find((b) => existingSerials.has(b.serial));
    if (clash) return Response.json({ error: 'Serial collision — retry.' }, { status: 409 });

    const total_face = face_value * quantity;

    const batch = await E.GlyphBucksBatch.create({
      batch_id: `DD-${stamp}`,
      venue_id,
      transaction_id: `DANCE-DOLLARS-${stamp}`,
      denominations: [{ denomination, quantity, total_value: denomination * quantity }],
      total_face_value: total_face,
      total_charged: denomination * quantity,
      surcharge_rate: 0,
      surcharge_amount: 0,
      batch_barcode: `DD-${denomination}-${timeSlice}`,
      status: 'issued',
      issued_at: now,
      issued_by: user.email,
    });

    const records = bills.map((b) => ({
      serial_number: b.serial,
      batch_id: batch.id,
      transaction_id: batch.transaction_id,
      venue_id,
      denomination,
      barcode_number: b.serial,          // 12 digits → Code-128 Code-C
      qr_code_url: b.qr_url,
      status: 'issued',
      issued_to_customer: purchaser_name,
      issued_at: now,
      redemption_percentage: redemption_rate,
      redemption_amount: face_value * redemption_rate,
    }));
    await E.GlyphBucksBill.bulkCreate(records);

    // Stored-value LIABILITY ledger posting (never revenue) — mirrors the
    // GlyphBucks invariant. Non-blocking.
    try {
      await E.GlyphBucksLedger.create({
        entry_id: `DDL-${stamp}`,
        venue_id,
        verify_ref: batch.batch_id,
        sale_id: batch.transaction_id,
        entry_type: 'ISSUANCE',
        liability_delta_cents: Math.round(total_face * 100),
        currency: 'USD',
        posted_at: now,
        mode: 'REAL',
        notes: `Dance Dollars issuance — ${quantity} × $${denomination} (face $${face_value}), dancer-redeemable only`,
      });
    } catch (_) { /* observational */ }

    return Response.json({
      success: true,
      batch_id: batch.id,
      instrument: 'dance_dollars',
      count: quantity,
      denomination,
      face_value,
      redemption_rate,
      cash_redeemable: false,
      total_face,
      bills: bills.map((b, i) => ({
        serial: b.serial,
        barcode: b.serial,
        qr_url: b.qr_url,
        verify_ref: b.verify_ref,
        denomination,
        face_value,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});