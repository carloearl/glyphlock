import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

// Dream Palace VIP GlyphBucks — register a printed run of physical bills.
// Creates one GlyphBucksBatch + one GlyphBucksBill per note (unique 12-digit
// serial + Code-128 barcode number), all status "issued". Serial-collision
// safe: rejects if any serial in the requested range already exists.
//
// Auth: staff/manager/admin only. All writes are service-role (server side).

async function resolveAuthorizedVenue(base44, user, requestedVenueId) {
  const E = base44.asServiceRole.entities;
  const email = String(user?.email || '').toLowerCase();
  const nups = (await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
  if (!nups) throw new Error('Active NUPS identity required.');
  const global = ['PLATFORM_ADMIN','SOVEREIGN'].includes(nups.role);
  const venueId = global && requestedVenueId ? String(requestedVenueId) : String(nups.venue_id || '');
  if (!venueId) throw new Error('Authorized venue could not be resolved.');
  if (!global && requestedVenueId && String(requestedVenueId) !== venueId) throw new Error('Cross-venue bill registration denied.');
  const venue = (await E.Venue.filter({ venue_id: venueId, status: 'active' }, null, 1).catch(() => []))?.[0]
    || await E.Venue.get(venueId).catch(() => null);
  if (!venue || venue.status === 'inactive') throw new Error('Authorized venue is not active.');
  return { venueId: venue.venue_id || venue.id, venue, nups };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const E = base44.asServiceRole.entities;
    const body = await req.json();
    const denomination = Number(body.denomination);
    const quantity = Number(body.quantity);
    const serialPrefix = String(body.serial_prefix || 'GB').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const startSerial = Number(body.start_serial || 1);
    const { venueId: venue_id } = await resolveAuthorizedVenue(base44, user, body.venue_id);

    if (!denomination || denomination <= 0) return Response.json({ error: 'A positive denomination is required.' }, { status: 400 });
    if (!quantity || quantity < 1 || quantity > 500) return Response.json({ error: 'Quantity must be between 1 and 500.' }, { status: 400 });
    if (startSerial < 1) return Response.json({ error: 'Start serial must be ≥ 1.' }, { status: 400 });

    const now = new Date().toISOString();
    const pad = (n: number) => String(n).padStart(7, '0');

    // Build serial + barcode strings. Serial = <PREFIX>-$<denom>-<7digit>.
    // barcode_number = numeric-only (venue-scoped) so Code-128 uses Code-C.
    const bills = [];
    for (let i = 0; i < quantity; i++) {
      const seq = startSerial + i;
      const serial = `${serialPrefix}-${denomination}-${pad(seq)}`;
      // 12-digit numeric barcode: denom(3) + sequence(9)
      const barcode_number = `${String(denomination).padStart(3, '0')}${String(seq).padStart(9, '0')}`;
      bills.push({ serial, barcode_number, seq });
    }

    // Collision guard — reject if any serial already registered for this venue.
    const first = bills[0].serial, last = bills[bills.length - 1].serial;
    const existing = (await E.GlyphBucksBill.filter({ venue_id, denomination })) || [];
    const existingSerials = new Set(existing.map((b: any) => b.serial_number));
    const clash = bills.find((b) => existingSerials.has(b.serial));
    if (clash) {
      return Response.json({
        error: `Serial ${clash.serial} already exists. Choose a higher start serial.`,
      }, { status: 409 });
    }

    // Create batch.
    const batch = await E.GlyphBucksBatch.create({
      batch_id: `DPB-${Date.now()}`,
      venue_id,
      transaction_id: `VIP-PRINT-${Date.now()}`,
      denominations: [{ denomination, quantity, total_value: denomination * quantity }],
      total_face_value: denomination * quantity,
      total_charged: 0,
      surcharge_rate: 0,
      surcharge_amount: 0,
      batch_barcode: `${serialPrefix}-${denomination}-BATCH`,
      status: 'issued',
      issued_at: now,
      issued_by: user.email,
    });

    // Create bills (bulk).
    const records = bills.map((b) => ({
      serial_number: b.serial,
      batch_id: batch.id,
      venue_id,
      denomination,
      barcode_number: b.barcode_number,
      status: 'issued',
      issued_at: now,
    }));
    await E.GlyphBucksBill.bulkCreate(records);

    return Response.json({
      success: true,
      batch_id: batch.id,
      count: quantity,
      denomination,
      total_face_value: denomination * quantity,
      serial_range: { first, last },
      bills: bills.map((b) => ({ serial: b.serial, barcode: b.barcode_number, denomination })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});