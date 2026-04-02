import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DREAM_PALACE_VENUE_ID = '69ce5aa38db1dbb6df081a4b';

const MOCK_CONTRACTS = [
  {
    contract_id: `DP-DEMO-${Date.now()}-001`,
    venue_id: DREAM_PALACE_VENUE_ID,
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
    signed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.45',
    status: 'fulfilled',
    scan_status: 'SCANNED',
    scanned_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    scanned_by: 'manager@dreampalace.demo',
    contract_amount: 410,
    is_demo: true,
    demo_label: 'DEMO — Fulfilled workflow example',
    notes: 'DEMO DATA — Shows complete contract lifecycle: signed → printed → scanned'
  },
  {
    contract_id: `DP-DEMO-${Date.now()}-002`,
    venue_id: DREAM_PALACE_VENUE_ID,
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
    signed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.62',
    status: 'active',
    scan_status: 'PENDING',
    contract_amount: 700,
    is_demo: true,
    demo_label: 'DEMO — Printed, awaiting scan-back',
    notes: 'DEMO DATA — Shows printed but not yet scanned. Use ContractScanBack to complete.'
  },
  {
    contract_id: `DP-DEMO-${Date.now()}-003`,
    venue_id: DREAM_PALACE_VENUE_ID,
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
    signed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    ip_address: '192.168.1.88',
    status: 'active',
    scan_status: 'PENDING',
    contract_amount: 260,
    is_demo: true,
    demo_label: 'DEMO — Signed, needs print',
    notes: 'DEMO DATA — Shows signed contract awaiting print. Use VenuePrintLayout to print.'
  },
  {
    contract_id: `DP-DEMO-${Date.now()}-004`,
    venue_id: DREAM_PALACE_VENUE_ID,
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
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { clear_existing = false } = payload;

    if (clear_existing) {
      const existing = await base44.asServiceRole.entities.VenueContract.filter({
        venue_id: DREAM_PALACE_VENUE_ID,
        is_demo: true
      });
      await Promise.all(existing.map(c => base44.asServiceRole.entities.VenueContract.delete(c.id)));
    }

    const created = [];
    for (let i = 0; i < MOCK_CONTRACTS.length; i++) {
      const contract = await base44.asServiceRole.entities.VenueContract.create(MOCK_CONTRACTS[i]);
      created.push({ contract, lineItems: MOCK_LINE_ITEMS_MAP[i] });
    }

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'DEMO_DATA_SEEDED',
      entity_type: 'VenueContract',
      actor_id: user.email,
      venue_id: DREAM_PALACE_VENUE_ID,
      description: `Demo contract workflow data seeded by ${user.email} — ${MOCK_CONTRACTS.length} contracts created`,
      severity: 'low',
      status: 'success',
      metadata: { count: MOCK_CONTRACTS.length, clear_existing },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      seeded: MOCK_CONTRACTS.length,
      contracts: created.map(c => ({
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