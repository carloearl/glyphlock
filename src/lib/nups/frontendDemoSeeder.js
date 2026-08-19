// Frontend-only demo contract data seeder.
//
// Uses base44.entities.X.bulkCreate() directly — NO backend function calls.
// This bypasses the 402 "Payment Required" error that blocks the
// vipWorkflow / seedDemoEcosystem backend functions on non-Builder+ plans.
//
// GATED: only Carlo's owner emails (carloearl@glyphlock.com /
// carloearl@gmail.com) can execute this. Verified via isOwnerEmail().
//
// All seeded records are stamped mode='DEMO' so they are isolated from
// REAL-mode settlement and reporting.

import { base44 } from '@/api/base44Client';
import { isOwnerEmail } from '@/lib/nups/ownerEmails';

import {
  DEMO_VENUE_ID, ENTERTAINERS, VIP_ROOMS, VIP_GUESTS,
  VENUE_CONTRACTS, VIP_CONTRACT_RECORDS, VERIFICATION_MEDIA,
  GLYPHBUCKS_BILLS, GLYPHBUCKS_BATCH, GLYPHBUCKS_ORDER,
} from '@/lib/nups/demoSeedData';

const T = (h, m = 0) => {
  const d = new Date('2026-05-15T00:00:00.000Z');
  d.setUTCHours(d.getUTCHours() + h);
  d.setUTCMinutes(d.getUTCMinutes() + m);
  return d.toISOString();
};

const stamp = (rec) => ({ ...rec, mode: 'DEMO', is_demo: true });

// ---------------------------------------------------------------------------
// VIPConfig — one per venue. Only creates if none exists yet.
// ---------------------------------------------------------------------------
const DEMO_VIP_CONFIG = {
  venue_id: DEMO_VENUE_ID,
  active: true,
  live_enabled: false,
  services: [
    {
      code: 'VIP_HR',
      name: 'VIP Room — 1 Hour',
      rates: [{ minutes: 60, amount: 300 }],
      extension_block_minutes: 15,
      extension_block_amount: 75,
      minimum_charge: 300,
    },
    {
      code: 'VIP_HALF',
      name: 'VIP Room — Half Hour',
      rates: [{ minutes: 30, amount: 175 }],
      extension_block_minutes: 15,
      extension_block_amount: 75,
      minimum_charge: 175,
    },
  ],
  payment_methods: ['Cash', 'Credit Card', 'Comp'],
  card_fee_pct: 5,
  tax_pct: 0,
  approval_rules: {
    discount: true,
    comp: true,
    manual_price: true,
    free_extension: true,
    room_transfer: true,
    post_signature_correction: true,
    cancel_after_signing: true,
    outstanding_balance_closeout: true,
  },
  max_discount_pct_without_owner: 25,
  signature_requirements: ['guest', 'entertainer', 'staff'],
  session_warning_minutes: 5,
  contract_terms: 'Demo VIP contract terms — for demonstration purposes only.',
  receipt_footer: 'DEMO — Not a real transaction. GlyphLock NUPS Demo Mode.',
  mode: 'DEMO',
};

// ---------------------------------------------------------------------------
// VIPContract — derived from VENUE_CONTRACTS demo data.
// ---------------------------------------------------------------------------
function buildVIPContracts() {
  return VENUE_CONTRACTS.map((vc, i) => ({
    contract_id: vc.contract_id.replace('DEMO-VC', 'VIP-DEMO'),
    venue_id: DEMO_VENUE_ID,
    mode: 'DEMO',
    guest_id: vc.customer_id === 'DEMO-CUST-001' ? 'DEMO-VG-001' : 'DEMO-VG-002',
    guest_name: vc.customer_name,
    entertainer_id: vc.entertainer_id || 'DEMO-ENT-Crystal',
    entertainer_stage_name: vc.entertainer_name || 'Crystal',
    room_id: vc.contract_type === 'VIP Package' ? 'VIP-1' : null,
    room_number: vc.contract_type === 'VIP Package' ? 'VIP-1' : null,
    staff_id: 'demo_mgr',
    staff_email: 'demo_mgr@demo.test',
    service_code: vc.contract_type === 'VIP Package' ? 'VIP_HR' : 'VIP_HR',
    service_name: vc.contract_type || 'VIP Package',
    duration_minutes: 60,
    planned_start: T(21),
    planned_end: T(22),
    base_amount: vc.contract_amount,
    extensions_amount: 0,
    discount_amount: 0,
    fees_amount: vc.processing_surcharge || 0,
    tax_amount: 0,
    final_amount: vc.grand_total,
    amount_collected: vc.grand_total,
    outstanding_balance: 0,
    payment_method: vc.payment_method,
    payment_status: 'PAID',
    status: 'COMPLETED',
    signed_at: vc.signed_at,
    paid_at: vc.signed_at,
    activated_at: vc.signed_at,
    completed_at: T(23),
    terms_locked: true,
    signatures: {
      guest: { name: vc.customer_name, signed_at: vc.signed_at, ref: 'sig_demo_guest' },
      entertainer: { name: vc.entertainer_name || 'Crystal', signed_at: vc.signed_at, ref: 'sig_demo_ent' },
      staff: { name: 'Diana Demo', signed_at: vc.signed_at, ref: 'sig_demo_staff' },
    },
    audit_events: [
      { action: 'CONTRACT_CREATED', actor: 'demo_mgr@demo.test', detail: 'Demo contract seeded', timestamp: vc.signed_at },
      { action: 'CONTRACT_SIGNED', actor: 'demo_mgr@demo.test', detail: 'All signatures captured', timestamp: vc.signed_at },
      { action: 'CONTRACT_PAID', actor: 'demo_mgr@demo.test', detail: `Paid via ${vc.payment_method}`, timestamp: vc.signed_at },
      { action: 'CONTRACT_COMPLETED', actor: 'demo_mgr@demo.test', detail: 'Session completed', timestamp: T(23) },
    ],
  }));
}

// ---------------------------------------------------------------------------
// VIPSession — one per VIP contract.
// ---------------------------------------------------------------------------
function buildVIPSessions() {
  return [
    {
      session_ref: 'DEMO-SES-001',
      contract_id: 'VIP-DEMO-001',
      venue_id: DEMO_VENUE_ID,
      mode: 'DEMO',
      guest_id: 'DEMO-VG-001',
      entertainer_id: 'DEMO-ENT-Crystal',
      room_id: 'VIP-1',
      actual_start: T(21),
      planned_end: T(22),
      actual_end: T(22),
      status: 'COMPLETED',
      extensions_count: 0,
      closed_by: 'demo_mgr@demo.test',
      close_note: 'Demo session — clean close',
    },
  ];
}

// ---------------------------------------------------------------------------
// Main seeder — returns a summary of what was created.
// Throws if caller is not an owner email.
// ---------------------------------------------------------------------------
export async function seedDemoContracts(actorEmail, { ledgerMode } = {}) {
  if (!isOwnerEmail(actorEmail)) {
    throw new Error('Access denied — demo seeding is restricted to the venue owner.');
  }

  // LIVE-MODE LOCK — never seed demo data while operating live.
  if (ledgerMode && ledgerMode !== 'DEMO' && ledgerMode !== 'SANDBOX') {
    throw new Error('Demo seeding is blocked in LIVE mode. Switch to DEMO mode first.');
  }
  const demoVenueConfig = await base44.entities.VenueRateConfig
    .filter({ venue_id: DEMO_VENUE_ID })
    .catch(() => []);
  if (demoVenueConfig?.[0]?.mode === 'REAL') {
    throw new Error(`${DEMO_VENUE_ID} is configured as a LIVE venue — demo data cannot be seeded into it.`);
  }

  const results = {};

  // 1. VIPConfig — check if one already exists for this venue.
  try {
    const existing = await base44.entities.VIPConfig.filter({ venue_id: DEMO_VENUE_ID });
    if (!existing || existing.length === 0) {
      await base44.entities.VIPConfig.create({ ...DEMO_VIP_CONFIG, mode: 'DEMO' });
      results.VIPConfig = 1;
    } else {
      results.VIPConfig = 'already exists (skipped)';
    }
  } catch (e) { results.VIPConfig = `error: ${e.message}`; }

  // 2. Entertainers
  try {
    await base44.entities.Entertainer.bulkCreate(
      ENTERTAINERS.map((e) => stamp({ ...e, venue_id: DEMO_VENUE_ID, is_demo: true }))
    );
    results.Entertainer = ENTERTAINERS.length;
  } catch (e) { results.Entertainer = `error: ${e.message}`; }

  // 3. VIP Rooms
  try {
    await base44.entities.VIPRoom.bulkCreate(
      VIP_ROOMS.map((r) => stamp(r))
    );
    results.VIPRoom = VIP_ROOMS.length;
  } catch (e) { results.VIPRoom = `error: ${e.message}`; }

  // 4. VIP Guests
  try {
    await base44.entities.VIPGuest.bulkCreate(
      VIP_GUESTS.map((g) => ({
        ...g,
        id_type: 'Drivers License',
        id_number: g.guest_id === 'DEMO-VG-001' ? 'AZ-DL-1234567' : 'AZ-DL-7654321',
        id_state: 'AZ',
        id_verified: true,
        id_verified_by: 'demo_host@demo.test',
        id_verified_at: T(21),
        tier: g.guest_id === 'DEMO-VG-001' ? 'high_roller' : 'whale',
        card_last4: g.guest_id === 'DEMO-VG-001' ? '4242' : '1881',
        card_type: 'Visa',
        card_name: g.full_name.toUpperCase(),
        card_exp: g.guest_id === 'DEMO-VG-001' ? '12/28' : '08/29',
        approval_code: g.guest_id === 'DEMO-VG-001' ? 'AUTH-DEMO-001' : 'AUTH-DEMO-002',
        total_spend_lifetime: g.guest_id === 'DEMO-VG-001' ? 1250 : 1400,
        vip_sessions_count: 2,
        is_demo: true,
      }))
    );
    results.VIPGuest = VIP_GUESTS.length;
  } catch (e) { results.VIPGuest = `error: ${e.message}`; }

  // 5. VIP Contracts
  try {
    const contracts = buildVIPContracts();
    await base44.entities.VIPContract.bulkCreate(contracts);
    results.VIPContract = contracts.length;
  } catch (e) { results.VIPContract = `error: ${e.message}`; }

  // 6. VIP Sessions
  try {
    const sessions = buildVIPSessions();
    await base44.entities.VIPSession.bulkCreate(sessions);
    results.VIPSession = sessions.length;
  } catch (e) { results.VIPSession = `error: ${e.message}`; }

  // 7. Venue Contracts (legacy)
  try {
    await base44.entities.VenueContract.bulkCreate(
      VENUE_CONTRACTS.map((vc) => stamp(vc))
    );
    results.VenueContract = VENUE_CONTRACTS.length;
  } catch (e) { results.VenueContract = `error: ${e.message}`; }

  // 8. VIP Contract Records (signed hardcopy logs)
  try {
    await base44.entities.VIPContractRecord.bulkCreate(
      VIP_CONTRACT_RECORDS.map((r) => stamp(r))
    );
    results.VIPContractRecord = VIP_CONTRACT_RECORDS.length;
  } catch (e) { results.VIPContractRecord = `error: ${e.message}`; }

  // 9. GlyphBucks Bills
  try {
    await base44.entities.GlyphBucksBill.bulkCreate(
      GLYPHBUCKS_BILLS.map((b) => stamp(b))
    );
    results.GlyphBucksBill = GLYPHBUCKS_BILLS.length;
  } catch (e) { results.GlyphBucksBill = `error: ${e.message}`; }

  // 10. GlyphBucks Batch
  try {
    await base44.entities.GlyphBucksBatch.create(stamp(GLYPHBUCKS_BATCH));
    results.GlyphBucksBatch = 1;
  } catch (e) { results.GlyphBucksBatch = `error: ${e.message}`; }

  // 11. GlyphBucks Order
  try {
    await base44.entities.GlyphBucksOrder.create(stamp(GLYPHBUCKS_ORDER));
    results.GlyphBucksOrder = 1;
  } catch (e) { results.GlyphBucksOrder = `error: ${e.message}`; }

  return results;
}

// ---------------------------------------------------------------------------
// Frontend-only getState — reads entities directly when the backend
// vipWorkflow is unavailable (402 on non-Builder+ plans).
// Returns the same shape the VIPCommandCenter expects.
// ---------------------------------------------------------------------------
export async function frontendGetState() {
  const venueId = DEMO_VENUE_ID;
  const [configs, entertainers, guests, rooms, contracts, sessions] = await Promise.all([
    base44.entities.VIPConfig.filter({ venue_id: venueId }).catch(() => []),
    base44.entities.Entertainer.filter({ venue_id: venueId }).catch(() => []),
    base44.entities.VIPGuest.filter({ venue_id: venueId }).catch(() => []),
    base44.entities.VIPRoom.filter({ venue_id: venueId }).catch(() => []),
    base44.entities.VIPContract.filter({ venue_id: venueId }).catch(() => []),
    base44.entities.VIPSession.filter({ venue_id: venueId }).catch(() => []),
  ]);

  return {
    config: configs?.[0] || null,
    entertainers: entertainers || [],
    guests: guests || [],
    rooms: rooms || [],
    contracts: contracts || [],
    sessions: sessions || [],
  };
}