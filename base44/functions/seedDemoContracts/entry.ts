import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_VENUE_ID = '69ce5aa38db1dbb6df081a4b';

const buildContracts = (venueId) => {
  const now = Date.now();
  return [
    {
      contract_id: `DP-DEMO-${now}-001`,
      venue_id: venueId,
      contract_type: 'GlyphBucks Purchase',
      customer_name: 'James R. Holloway',
      customer_id_number: 'AZ-DL-4821933',
      customer_address: '4210 E Camelback Rd',
      customer_state: 'AZ',
      customer_zip: '85018',
      purchaser_card_name: 'James R Holloway',
      card_last_four: '4821',
      card_exp: '09/27',
      approval_code: 'H7X2',
      glyphbucks_issued: 300,
      processing_surcharge: 90,
      waitress_tip: 20,
      grand_total: 410,
      payment_method: 'Credit Card',
      is_signed: true,
      is_printed: true,
      customer_signature: 'James Holloway',
      signed_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      ip_address: '192.168.1.45',
      status: 'fulfilled',
      scan_status: 'SCANNED',
      scanned_at: new Date(now - 90 * 60 * 1000).toISOString(),
      scanned_by: 'manager@dreampalace.demo',
      contract_amount: 410,
      is_demo: true,
      demo_label: 'DEMO — Fulfilled workflow example',
      notes: 'DEMO DATA — Shows complete contract lifecycle: signed → printed → scanned'
    },
    {
      contract_id: `DP-DEMO-${now}-002`,
      venue_id: venueId,
      contract_type: 'GlyphBucks Purchase',
      customer_name: 'Michael T. Vasquez',
      customer_id_number: 'TX-DL-9934812',
      customer_address: '721 W University Dr',
      customer_state: 'TX',
      customer_zip: '75201',
      purchaser_card_name: 'Michael T Vasquez',
      card_last_four: '7703',
      card_exp: '03/26',
      approval_code: 'V3K9',
      glyphbucks_issued: 500,
      processing_surcharge: 150,
      waitress_tip: 50,
      grand_total: 700,
      payment_method: 'Credit Card',
      is_signed: true,
      is_printed: true,
      customer_signature: 'M. Vasquez',
      signed_at: new Date(now - 45 * 60 * 1000).toISOString(),
      ip_address: '192.168.1.62',
      status: 'active',
      scan_status: 'PENDING',
      contract_amount: 700,
      is_demo: true,
      demo_label: 'DEMO — Printed, awaiting scan-back',
      notes: 'DEMO DATA — Shows printed but not yet scanned. Use ContractScanBack to complete.'
    },
    {
      contract_id: `DP-DEMO-${now}-003`,
      venue_id: venueId,
      contract_type: 'GlyphBucks Purchase',
      customer_name: 'Brandon K. Steele',
      customer_id_number: 'NV-DL-2201847',
      customer_address: '3888 S Las Vegas Blvd',
      customer_state: 'NV',
      customer_zip: '89109',
      purchaser_card_name: 'Brandon Steele',
      card_last_four: '0012',
      card_exp: '11/25',
      approval_code: 'S5M1',
      glyphbucks_issued: 200,
      processing_surcharge: 60,
      waitress_tip: 0,
      grand_total: 260,
      payment_method: 'Credit Card',
      is_signed: true,
      is_printed: false,
      customer_signature: 'B. K. Steele',
      signed_at: new Date(now - 10 * 60 * 1000).toISOString(),
      ip_address: '192.168.1.88',
      status: 'active',
      scan_status: 'PENDING',
      contract_amount: 260,
      is_demo: true,
      demo_label: 'DEMO — Signed, needs print',
      notes: 'DEMO DATA — Shows signed contract awaiting print. Use VenuePrintLayout to print.'
    },
    {
      contract_id: `DP-DEMO-${now}-004`,
      venue_id: venueId,
      contract_type: 'VIP Package',
      customer_name: 'Derek A. Monroe',
      customer_id_number: 'CA-DL-6671204',
      customer_address: '1100 S Hope St',
      customer_state: 'CA',
      customer_zip: '90015',
      purchaser_card_name: 'Derek Monroe',
      card_last_four: '',
      card_exp: '',
      approval_code: '',
      glyphbucks_issued: 0,
      processing_surcharge: 0,
      waitress_tip: 0,
      grand_total: 0,
      payment_method: 'Cash',
      is_signed: false,
      is_printed: false,
      customer_signature: '',
      status: 'draft',
      scan_status: 'PENDING',
      contract_amount: 0,
      is_demo: true,
      demo_label: 'DEMO — Draft, not yet signed',
      notes: 'DEMO DATA — Fresh draft. Shows starting state before customer signs.'
    }
  ];
};

const buildVIPRooms = (venueId) => {
  const now = Date.now();
  return [
    {
      room_number: 'VIP-1',
      venue_id: venueId,
      room_name: 'Skyline Suite',
      status: 'occupied',
      rate_per_hour: 300,
      suite_class: 'premium',
      current_entertainer_id: 'DEMO-ENT-Crystal',
      current_guest_id: 'DEMO-VG-001',
      session_start: new Date(now - 35 * 60 * 1000).toISOString(),
      session_notes: 'DEMO — Active VIP session',
      is_demo: true,
    },
    {
      room_number: 'VIP-2',
      venue_id: venueId,
      room_name: 'Velvet Room',
      status: 'available',
      rate_per_hour: 300,
      suite_class: 'premium',
      is_demo: true,
    },
    {
      room_number: 'VIP-3',
      venue_id: venueId,
      room_name: 'Diamond Lounge',
      status: 'cleaning',
      rate_per_hour: 400,
      suite_class: 'ultra',
      last_session_end: new Date(now - 15 * 60 * 1000).toISOString(),
      is_demo: true,
    },
  ];
};

const buildVIPGuests = (venueId) => {
  const now = Date.now();
  return [
    {
      guest_id: 'DEMO-VG-001',
      venue_id: venueId,
      full_name: 'Robert Spender',
      phone: '555-2001',
      email: 'robert@demo.test',
      date_of_birth: '1985-06-15T00:00:00.000Z',
      id_type: 'Drivers License',
      id_number: 'AZ-DL-1234567',
      id_state: 'AZ',
      id_verified: true,
      id_verified_by: 'Demo Manager',
      id_verified_at: new Date(now - 60 * 60 * 1000).toISOString(),
      status: 'in_building',
      tier: 'high_roller',
      visit_count: 12,
      last_visit: new Date(now - 60 * 60 * 1000).toISOString(),
      first_visit: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
      total_spend_lifetime: 4200,
      vip_sessions_count: 8,
      is_demo: true,
      notes: 'DEMO — VIP high-roller guest',
    },
    {
      guest_id: 'DEMO-VG-002',
      venue_id: venueId,
      full_name: 'Anthony Platinum',
      phone: '555-2004',
      email: 'anthony@demo.test',
      date_of_birth: '1980-09-30T00:00:00.000Z',
      id_type: 'Drivers License',
      id_number: 'AZ-DL-7654321',
      id_state: 'AZ',
      id_verified: true,
      id_verified_by: 'Demo Manager',
      id_verified_at: new Date(now - 30 * 60 * 1000).toISOString(),
      status: 'in_building',
      tier: 'whale',
      visit_count: 42,
      last_visit: new Date(now - 30 * 60 * 1000).toISOString(),
      first_visit: new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString(),
      total_spend_lifetime: 18500,
      vip_sessions_count: 35,
      is_demo: true,
      notes: 'DEMO — Whale-tier VIP guest',
    },
    {
      guest_id: 'DEMO-VG-003',
      venue_id: venueId,
      full_name: 'Derek Monroe',
      phone: '555-2005',
      email: 'derek@demo.test',
      date_of_birth: '1990-03-12T00:00:00.000Z',
      id_type: 'Drivers License',
      id_number: 'CA-DL-6671204',
      id_state: 'CA',
      id_verified: true,
      id_verified_by: 'Demo Manager',
      id_verified_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      status: 'left_building',
      tier: 'standard',
      visit_count: 3,
      last_visit: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      first_visit: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      total_spend_lifetime: 850,
      vip_sessions_count: 1,
      is_demo: true,
      notes: 'DEMO — Standard guest, draft VIP contract pending',
    },
  ];
};

const buildContractorPayouts = (venueId) => {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      payout_id: `DEMO-CP-${now}-001`,
      contractor_id: 'DEMO-ENT-Crystal',
      contractor_name: 'Crystal',
      venue_id: venueId,
      payout_date: today,
      payout_type: 'vip_commission',
      total_face_value: 600,
      redemption_rate: 0.85,
      total_payout: 510,
      payment_method: 'cash',
      approved_by: 'manager@demo.nups',
      paid_by: 'Demo Manager',
      contractor_signature: 'Crystal',
      signature_timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      status: 'signed',
      tax_year: new Date().getFullYear(),
      is_demo: true,
      notes: 'DEMO — VIP commission, signed awaiting payout',
    },
    {
      payout_id: `DEMO-CP-${now}-002`,
      contractor_id: 'DEMO-ENT-Nova',
      contractor_name: 'Nova',
      venue_id: venueId,
      payout_date: today,
      payout_type: 'shift_earnings',
      total_face_value: 300,
      redemption_rate: 0.85,
      total_payout: 255,
      payment_method: 'cash',
      approved_by: 'manager@demo.nups',
      status: 'issued',
      tax_year: new Date().getFullYear(),
      is_demo: true,
      notes: 'DEMO — Shift earnings, issued to entertainer',
    },
    {
      payout_id: `DEMO-CP-${now}-003`,
      contractor_id: 'DEMO-ENT-Jade',
      contractor_name: 'Jade',
      venue_id: venueId,
      payout_date: today,
      payout_type: 'tip_share',
      total_face_value: 150,
      redemption_rate: 0.85,
      total_payout: 127.50,
      payment_method: 'paycard',
      status: 'draft',
      tax_year: new Date().getFullYear(),
      is_demo: true,
      notes: 'DEMO — Tip share, fresh draft',
    },
    {
      payout_id: `DEMO-CP-${now}-004`,
      contractor_id: 'DEMO-ENT-Crystal',
      contractor_name: 'Crystal',
      venue_id: venueId,
      payout_date: today,
      payout_type: 'glyphbucks_redemption',
      total_face_value: 1000,
      redemption_rate: 0.85,
      total_payout: 850,
      payment_method: 'cash',
      approved_by: 'manager@demo.nups',
      paid_by: 'Demo Manager',
      contractor_signature: 'Crystal',
      signature_timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      status: 'archived',
      tax_year: new Date().getFullYear(),
      is_demo: true,
      notes: 'DEMO — Archived GlyphBucks redemption from earlier shift',
    },
  ];
};

const MOCK_LINE_ITEMS_MAP = {
  0: [
    { line_number: 1, room: 'VIP-1', entertainer: 'Amber', duration: '30 min', ent_id: 'ENT-1042', amount: 150 },
    { line_number: 2, room: 'VIP-1', entertainer: 'Amber', duration: '30 min', ent_id: 'ENT-1042', amount: 150 },
  ],
  1: [
    { line_number: 1, room: 'VIP-2', entertainer: 'Crystal', duration: '60 min', ent_id: 'ENT-2017', amount: 300 },
    { line_number: 2, room: 'VIP-3', entertainer: 'Destiny', duration: '30 min', ent_id: 'ENT-3304', amount: 150 },
    { line_number: 3, room: 'BAR', entertainer: '', duration: '', ent_id: '', amount: 50 },
  ],
  2: [
    { line_number: 1, room: 'MAIN', entertainer: 'Jade', duration: '20 min', ent_id: 'ENT-0881', amount: 100 },
    { line_number: 2, room: 'MAIN', entertainer: 'Jade', duration: '20 min', ent_id: 'ENT-0881', amount: 100 },
  ],
  3: [],
};

Deno.serve(async (req) => {
  try {
    // ================================================================
    // DACO CONTAINMENT-01 (2026-07-06) — EMERGENCY FREEZE
    // All execution prohibited. Function returns 423 immediately.
    // No auth, no parsing, no entity access, no logging, no writes.
    // Original code preserved below as forensic evidence.
    // ================================================================
    return Response.json(
      { error: 'Function frozen by DACO CONTAINMENT-01' },
      { status: 423 }
    );

    // --- ORIGINAL CODE BELOW (PRESERVED AS FORENSIC EVIDENCE) ---
    const base44 = createClientFromRequest(req);

    let actorEmail = 'sandbox@demo.nups';
    let isSandboxDemo = false;

    try {
      const user = await base44.auth.me();
      if (user) {
        if (user.role !== 'admin') {
          return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }
        actorEmail = user.email;
      }
    } catch {
      // DACO CONTAINMENT-01: Sandbox header escalation path permanently disabled.
      // The x-nups-sandbox-demo header can no longer obtain service-role privileges.
      return Response.json(
        { error: 'Forbidden: Sandbox escalation path disabled by DACO CONTAINMENT-01' },
        { status: 403 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const { clear_existing = false, venue_id } = payload;

    // Use the venue_id from the request, falling back to the default.
    const targetVenueId = venue_id || DEFAULT_VENUE_ID;

    // Use service role for sandbox demo invocations since they lack user auth
    const entityClient = isSandboxDemo ? base44.asServiceRole : base44;

    if (clear_existing) {
      // Clear demo contracts
      const existingContracts = await entityClient.entities.VenueContract.filter({
        venue_id: targetVenueId,
        is_demo: true
      });
      await Promise.all(existingContracts.map(c => entityClient.entities.VenueContract.delete(c.id)));

      // Clear demo VIP rooms
      const existingRooms = await entityClient.entities.VIPRoom.filter({
        venue_id: targetVenueId,
        is_demo: true
      });
      await Promise.all(existingRooms.map(r => entityClient.entities.VIPRoom.delete(r.id)));

      // Clear demo VIP guests
      const existingGuests = await entityClient.entities.VIPGuest.filter({
        venue_id: targetVenueId,
        is_demo: true
      });
      await Promise.all(existingGuests.map(g => entityClient.entities.VIPGuest.delete(g.id)));

      // Clear demo contractor payouts
      const existingPayouts = await entityClient.entities.ContractorPayout.filter({
        venue_id: targetVenueId,
        is_demo: true
      });
      await Promise.all(existingPayouts.map(p => entityClient.entities.ContractorPayout.delete(p.id)));
    }

    const MOCK_CONTRACTS = buildContracts(targetVenueId);
    const VIP_ROOMS = buildVIPRooms(targetVenueId);
    const VIP_GUESTS = buildVIPGuests(targetVenueId);
    const CONTRACTOR_PAYOUTS = buildContractorPayouts(targetVenueId);

    const created = { contracts: [], vipRooms: [], vipGuests: [], contractorPayouts: [] };

    // --- Venue Contracts ---
    for (let i = 0; i < MOCK_CONTRACTS.length; i++) {
      const contract = await entityClient.entities.VenueContract.create(MOCK_CONTRACTS[i]);
      created.contracts.push({ contract, lineItems: MOCK_LINE_ITEMS_MAP[i] });
    }

    // --- VIP Rooms (displayed by VIPRoomBoard) ---
    for (const room of VIP_ROOMS) {
      try {
        const r = await entityClient.entities.VIPRoom.create(room);
        created.vipRooms.push(r.id);
      } catch (e) { /* skip if entity missing */ }
    }

    // --- VIP Guests (displayed by VIPRoomBoard guest picker) ---
    for (const guest of VIP_GUESTS) {
      try {
        const g = await entityClient.entities.VIPGuest.create(guest);
        created.vipGuests.push(g.id);
      } catch (e) { /* skip if entity missing */ }
    }

    // --- Contractor Payouts (displayed by VIPContractLifecycle) ---
    for (const payout of CONTRACTOR_PAYOUTS) {
      try {
        const p = await entityClient.entities.ContractorPayout.create(payout);
        created.contractorPayouts.push(p.id);
      } catch (e) { /* skip if entity missing */ }
    }

    try {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'DEMO_DATA_SEEDED',
        actor_email: actorEmail,
        description: `Demo contract + VIP data seeded for venue ${targetVenueId} — ${MOCK_CONTRACTS.length} contracts, ${VIP_ROOMS.length} rooms, ${VIP_GUESTS.length} guests, ${CONTRACTOR_PAYOUTS.length} payouts${isSandboxDemo ? ' (sandbox)' : ''}`,
        severity: 'low',
        status: 'success',
        metadata: { venue_id: targetVenueId, clear_existing, sandbox: isSandboxDemo, counts: { contracts: MOCK_CONTRACTS.length, vipRooms: VIP_ROOMS.length, vipGuests: VIP_GUESTS.length, contractorPayouts: CONTRACTOR_PAYOUTS.length } }
      });
    } catch { /* audit log failure is non-fatal */ }

    return Response.json({
      success: true,
      venue_id: targetVenueId,
      seeded: {
        contracts: MOCK_CONTRACTS.length,
        vipRooms: created.vipRooms.length,
        vipGuests: created.vipGuests.length,
        contractorPayouts: created.contractorPayouts.length,
      },
      contracts: created.contracts.map(c => ({
        id: c.contract.id,
        contract_id: c.contract.contract_id,
        customer_name: c.contract.customer_name,
        status: c.contract.status,
        scan_status: c.contract.scan_status,
        demo_label: c.contract.demo_label,
        lineItems: c.lineItems
      }))
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});