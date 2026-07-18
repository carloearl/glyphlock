// Shared, idempotent demo seed + wipe runner for the DEMO_VENUE_001 venue.
// Extracted from NUPSDemoManager so the OneClickSeedSwitch and the StateDiff
// view can both call it with no duplication.
//
// W3-002 REMEDIATION (CORRECTED): ALL mutations — create and delete — are
// routed through writeEntity(). No direct base44.entities.create/delete
// calls remain. This ensures identity rebind, role-scope enforcement,
// financial validation, AuditEvent emission, and ActivityLog mirroring
// on every demo seed/wipe operation.

import { base44 } from "@/api/base44Client";
import { getCurrentSovereign } from "./sovereign";
import { writeEntity } from "./writeEntity";

export const DEMO_VENUE_ID = "DEMO_VENUE_001";

const NOW = () => new Date().toISOString();
const TODAY = () => new Date().toISOString().split("T")[0];
const ID = (prefix) => prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);

export const WIPE_ORDER = [
  "GlyphBucksTransaction",
  "POSTransaction",
  "VenueContract",
  "PayrollRecord",
  "DailySettlement",
  "DriverPayout",
  "StaffShift",
  "GuestProfile",
  "DriverProfile",
  "EntertainerShift",
  "VIPGuest",
  "GlyphBucksBill",
  "VIPRoom",
  "Entertainer",
  "POSProduct",
  "POSBatch",
  "Track",
  "AIDJPersona",
  "NUPSUser",
];

// Entities that carry an `is_demo` boolean flag. For these we ONLY delete
// rows explicitly marked as demo, so real records (Sativa, real staff,
// real guests) can never be lost to a demo wipe.
const IS_DEMO_FLAGGED = new Set([
  "Entertainer", "NUPSUser", "VIPGuest", "EntertainerShift",
  "POSTransaction", "VIPRoom", "DriverPayout", "VenueContract",
  "PayrollRecord", "GlyphBucksBill", "GlyphBucksTransaction",
  "POSProduct", "POSBatch", "DailySettlement",
]);

/**
 * Constructs a writeEntity-compatible actor from a sovereign NUPSUser record.
 * NUPSUser stores the user's email in created_by (via RLS), so we map it
 * to the actor.email field for identity rebind matching.
 */
function buildActor(sovereign) {
  return {
    id: sovereign.id,
    email: sovereign.created_by || sovereign.username,
    role: sovereign.role,
    sovereign_flag: sovereign.sovereign_flag,
  };
}

/**
 * W3-002: Routes a single delete through writeEntity() — guarantees
 * identity rebind, audit trail, and mode-aware deletion.
 */
async function gatewayDelete(entityName, recordId, actor, venue_id, onLog, label) {
  try {
    const result = await writeEntity({
      entity: entityName,
      operation: "delete",
      id: recordId,
      actor,
      intent: `demo_wipe:${label}`,
      venue_id,
      requestContext: { mode: "DEMO" },
    });
    if (!result.ok) {
      onLog?.({ msg: `❌ ${label} delete blocked: ${result.block_reason}`, type: "error" });
    }
    return result.ok;
  } catch (e) {
    onLog?.({ msg: `❌ ${label} delete error: ${e?.message || e}`, type: "error" });
    return false;
  }
}

/**
 * W3-002: Routes a single create through writeEntity() — guarantees
 * identity rebind, financial validation, mode stamping, AuditEvent
 * emission, and ActivityLog mirroring.
 */
async function gatewayCreate(entityName, data, actor, venue_id, onLog, label) {
  try {
    const result = await writeEntity({
      entity: entityName,
      operation: "create",
      data,
      actor,
      intent: `demo_seed:${label}`,
      venue_id,
      requestContext: { mode: "DEMO" },
    });
    if (result.ok) {
      onLog?.({ msg: `✅ ${label}`, type: "success" });
      return result.value;
    }
    onLog?.({ msg: `❌ ${label} blocked: ${result.block_reason}`, type: "error" });
    return null;
  } catch (e) {
    onLog?.({ msg: `❌ ${label}: ${e?.message || e}`, type: "error" });
    return null;
  }
}

export async function wipeDemoVenue(onLog) {
  const log = (msg, type = "info") => onLog?.({ msg, type });

  // ── W3-002 REMEDIATION: Sovereign identity verification ──
  // No wipe may proceed without a live SOVEREIGN session. Resolved from
  // base44.auth.me() → NUPSUser lookup, never client-supplied.
  const sovereign = await getCurrentSovereign();
  if (!sovereign) {
    log("❌ SOVEREIGN_REQUIRED: demo wipe blocked", "error");
    return { totalDeleted: 0, totalProtected: 0, perEntity: {}, blocked: true, reason: "SOVEREIGN_REQUIRED" };
  }

  const actor = buildActor(sovereign);

  let totalDeleted = 0;
  let totalProtected = 0;
  const perEntity = {};

  for (const entityName of WIPE_ORDER) {
    try {
      const all = await base44.entities[entityName].filter({ venue_id: DEMO_VENUE_ID });
      // Protect real records: only wipe is_demo === true. Records without
      // the flag are treated as REAL and survive.
      let recs = all;
      if (IS_DEMO_FLAGGED.has(entityName)) {
        recs = all.filter(r => r.is_demo === true);
        const protectedCount = all.length - recs.length;
        if (protectedCount > 0) {
          totalProtected += protectedCount;
          log(`🛡 ${entityName}: ${protectedCount} real record(s) protected`, "info");
        }
      }
      if (!recs.length) {
        perEntity[entityName] = 0;
        continue;
      }

      // W3-002: Route each delete through writeEntity() — no direct
      // base44.entities.delete() calls remain.
      let deleted = 0;
      for (const r of recs) {
        const ok = await gatewayDelete(entityName, r.id, actor, DEMO_VENUE_ID, onLog, entityName);
        if (ok) deleted += 1;
      }
      perEntity[entityName] = deleted;
      totalDeleted += deleted;
      log(`🗑 ${entityName}: ${deleted} demo removed`, "success");
    } catch (e) {
      log(`❌ ${entityName}: ${e?.message || e}`, "error");
    }
  }
  return { totalDeleted, totalProtected, perEntity };
}

export async function seedDemoVenue(onLog) {
  const today = TODAY();
  const log = (msg, type = "info") => onLog?.({ msg, type });

  // ── W3-002 REMEDIATION: Sovereign identity verification ──
  // No seed may proceed without a live SOVEREIGN session. Resolved from
  // base44.auth.me() → NUPSUser lookup, never client-supplied.
  const sovereign = await getCurrentSovereign();
  if (!sovereign) {
    log("❌ SOVEREIGN_REQUIRED: demo seed blocked", "error");
    return { ok: false, blocked: true, reason: "SOVEREIGN_REQUIRED" };
  }

  const actor = buildActor(sovereign);
  // Helper bound to the resolved actor + venue
  const create = (entityName, data, label) =>
    gatewayCreate(entityName, data, actor, DEMO_VENUE_ID, onLog, label);

  log("▶ Seeding DEMO_VENUE_001…", "info");

  // POSBatch (open shift) — opened by manager AND door-confirmed so the
  // demo register can ring transactions immediately (two-step batch flow).
  await create("POSBatch", {
    opening_cash: 500, cashier: "Demo Manager", opened_by: "Demo Manager",
    door_confirmed: true, door_confirmed_by: "Demo Door Girl", door_confirmed_at: NOW(),
    status: "open", start_time: NOW(), total_sales: 0, transaction_count: 0,
    notes: "DEMO shift batch", venue_id: DEMO_VENUE_ID,
    is_demo: true,
  }, "POSBatch (open + door-confirmed)");

  // POS Transactions — subtotal added so writeEntity financial validation
  // (total === subtotal + tax + tip) passes.
  const txns = [
    { transaction_id: ID("TXN"), subtotal: 120, total: 120, amount: 120, cash_sales: 120, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "VIP Entrance", price: 30, quantity: 4 }], venue_id: DEMO_VENUE_ID, is_demo: true },
    { transaction_id: ID("TXN"), subtotal: 200, total: 200, amount: 200, cash_sales: 0,   card_sales: 200, payment_method: "Credit Card", cashier: "Demo Bartender", status: "completed", items: [{ name: "Bottle Service", price: 200, quantity: 1 }], venue_id: DEMO_VENUE_ID, is_demo: true },
    { transaction_id: ID("TXN"), subtotal: 80,  total: 80,  amount: 80,  cash_sales: 80,  card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "Cover Charge",   price: 20,  quantity: 4 }], venue_id: DEMO_VENUE_ID, is_demo: true },
    { transaction_id: ID("TXN"), subtotal: 550, total: 550, amount: 550, cash_sales: 550, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Hostess",   status: "completed", items: [{ name: "VIP Show",       price: 550, quantity: 1 }], venue_id: DEMO_VENUE_ID, is_demo: true },
    { transaction_id: ID("TXN"), subtotal: 250, total: 250, amount: 250, cash_sales: 0,   card_sales: 250, payment_method: "Credit Card", cashier: "Demo Bartender", status: "completed", items: [{ name: "Champagne",      price: 250, quantity: 1 }], venue_id: DEMO_VENUE_ID, is_demo: true },
  ];
  for (const t of txns) await create("POSTransaction", t, `POSTransaction ${t.items[0].name}`);

  // Entertainers — all tagged is_demo:true so they can be wiped without
  // touching real performers (e.g. Sativa).
  const ents = [
    { stage_name: "Crystal", legal_name: "Crystal Demo", phone: "555-1001", email: "crystal@demo.test", contract_signed: true, contract_signature: "Crystal Demo", contract_signed_date: today, status: "active",   commission_rate: 60, total_earnings: 1200, vip_room_count: 4, is_demo: true, venue_id: DEMO_VENUE_ID },
    { stage_name: "Nova",    legal_name: "Nova Demo",    phone: "555-1002", email: "nova@demo.test",    contract_signed: true, contract_signature: "Nova Demo",    contract_signed_date: today, status: "active",   commission_rate: 60, total_earnings: 750,  vip_room_count: 2, is_demo: true, venue_id: DEMO_VENUE_ID },
    { stage_name: "Jade",    legal_name: "Jade Demo",    phone: "555-1003", email: "jade@demo.test",    contract_signed: true, contract_signature: "Jade Demo",    contract_signed_date: today, status: "active",   commission_rate: 60, total_earnings: 480,  vip_room_count: 1, is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const e of ents) await create("Entertainer", e, `Entertainer ${e.stage_name}`);

  // VIP Rooms
  const rooms = [
    { room_number: "101", room_name: "VIP Room 1",      status: "available", rate_per_hour: 200, surveillance_camera: "CAM-101", has_audio: false, venue_id: DEMO_VENUE_ID, is_demo: true },
    { room_number: "201", room_name: "Champagne Suite", status: "occupied",  rate_per_hour: 500, surveillance_camera: "CAM-201", has_audio: true,  entertainer_name: "Crystal", guest_name: "Demo Alpha", start_time: NOW(), duration_minutes: 60, total_charge: 500, venue_id: DEMO_VENUE_ID, is_demo: true },
    { room_number: "301", room_name: "Skybox",          status: "cleaning",  rate_per_hour: 350, surveillance_camera: "CAM-301", has_audio: true,  venue_id: DEMO_VENUE_ID, is_demo: true },
  ];
  for (const r of rooms) await create("VIPRoom", r, `VIPRoom ${r.room_name}`);

  // Products
  const products = [
    { name: "Grey Goose Bottle", sku: "SPI-GG-750",  category: "Spirits",     price: 450, cost: 180, stock_quantity: 12, taxable: true,  tax_rate: 0.08, is_active: true, venue_id: DEMO_VENUE_ID, is_demo: true },
    { name: "Dom Pérignon",      sku: "CHM-DOM-750", category: "Beer & Wine", price: 850, cost: 400, stock_quantity: 6,  taxable: true,  tax_rate: 0.08, is_active: true, venue_id: DEMO_VENUE_ID, is_demo: true },
    { name: "Cover Charge",      sku: "SVC-CVR-01",  category: "Services",    price: 20,  cost: 0,   stock_quantity: 999,taxable: false, tax_rate: 0,    is_active: true, venue_id: DEMO_VENUE_ID, is_demo: true },
  ];
  for (const p of products) await create("POSProduct", p, `POSProduct ${p.name}`);

  // Staff (one per role)
  const staff = [
    { username: "demo_owner",   full_name: "Demo Owner",     role: "VENUE_OWNER",   pin: "1111", employee_id: "OWN-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_manager", full_name: "Demo Manager",   role: "VENUE_MANAGER", pin: "2222", employee_id: "MGR-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_host",    full_name: "Demo Host",      role: "FLOOR_HOST",    pin: "3333", employee_id: "HST-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_bar",     full_name: "Demo Bartender", role: "BARTENDER",     pin: "4444", employee_id: "BAR-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_sec",     full_name: "Demo Security",  role: "SECURITY",      pin: "5555", employee_id: "SEC-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_dj",      full_name: "Demo DJ",        role: "DJ",            pin: "6666", employee_id: "DJ-001",  status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const s of staff) await create("NUPSUser", s, `NUPSUser ${s.role}`);

  // VIP guests — tagged is_demo
  const guests = [
    { guest_id: ID("VG"), full_name: "Demo Alpha", phone: "555-2001", email: "alpha@demo.test", status: "in_building",  last_visit: NOW(), date_of_birth: "1985-06-15", id_verified: true, is_demo: true, venue_id: DEMO_VENUE_ID },
    { guest_id: ID("VG"), full_name: "Demo Beta",  phone: "555-2002", email: "beta@demo.test",  status: "left_building", last_visit: NOW(), date_of_birth: "1990-03-22", id_verified: true, is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const g of guests) await create("VIPGuest", g, `VIPGuest ${g.full_name}`);

  // Entertainer shifts — tagged is_demo
  const shifts = [
    { entertainer_id: "DEMO-ENT-Crystal", stage_name: "Crystal", check_in_time: NOW(), status: "checked_in",  shift_earnings: 300, vip_sessions: 1, is_demo: true, venue_id: DEMO_VENUE_ID },
    { entertainer_id: "DEMO-ENT-Nova",    stage_name: "Nova",    check_in_time: NOW(), status: "checked_in",  shift_earnings: 150, vip_sessions: 0, is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const s of shifts) await create("EntertainerShift", s, `EntertainerShift ${s.stage_name}`);

  // Payroll
  const payStart = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const payroll = [
    { pay_period_start: payStart, pay_period_end: today, stage_name: "Crystal", legal_name: "Crystal Demo", gross_commissions: 1800, gross_tips: 600, gross_total: 2400, venue_fee: 360, venue_fee_rate: 0.15, tax_withholding: 600, tax_rate: 0.25, other_deductions: 0, net_payout: 1440, vip_sessions: 4, shift_hours: 32, status: "approved", is_demo: true, venue_id: DEMO_VENUE_ID },
    { pay_period_start: payStart, pay_period_end: today, stage_name: "Nova",    legal_name: "Nova Demo",    gross_commissions: 900,  gross_tips: 250, gross_total: 1150, venue_fee: 172, venue_fee_rate: 0.15, tax_withholding: 287, tax_rate: 0.25, other_deductions: 0, net_payout: 691,  vip_sessions: 2, shift_hours: 20, status: "approved", is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const p of payroll) await create("PayrollRecord", p, `PayrollRecord ${p.stage_name}`);

  // Staff shifts — populate Staff Check-In / Time Clock surfaces.
  // StaffShift has no is_demo flag; scoped by venue_id + mode DEMO.
  const staffShifts = [
    { shift_id: ID("SHIFT"), user_email: "door@demo.test", user_full_name: "Demo Door Girl",  role: "DOOR_GIRL", station: "door",     check_in_time: NOW(), status: "checked_in", identity_verified: true, mode: "DEMO", venue_id: DEMO_VENUE_ID },
    { shift_id: ID("SHIFT"), user_email: "bar@demo.test",  user_full_name: "Demo Bartender",  role: "BARTENDER", station: "bar",      check_in_time: NOW(), status: "checked_in", identity_verified: true, mode: "DEMO", venue_id: DEMO_VENUE_ID },
    { shift_id: ID("SHIFT"), user_email: "sec@demo.test",  user_full_name: "Demo Security",   role: "SECURITY",  station: "security", check_in_time: NOW(), status: "checked_in", identity_verified: true, mode: "DEMO", venue_id: DEMO_VENUE_ID },
  ];
  for (const s of staffShifts) await create("StaffShift", s, `StaffShift ${s.user_full_name}`);

  // Guest profiles — populate door guest check-in / guest tracking.
  const guestProfiles = [
    { guest_id: ID("GST"), first_name: "Alex",   last_name: "Demo", dob: "1988-04-12", license_state: "AZ", age_verified: true, visit_count: 3, first_visit_at: NOW(), last_visit_at: NOW(), status: "active", mode: "DEMO", venue_id: DEMO_VENUE_ID },
    { guest_id: ID("GST"), first_name: "Jordan", last_name: "Demo", dob: "1992-09-30", license_state: "CA", age_verified: true, visit_count: 1, first_visit_at: NOW(), last_visit_at: NOW(), status: "vip",    mode: "DEMO", venue_id: DEMO_VENUE_ID },
  ];
  for (const g of guestProfiles) await create("GuestProfile", g, `GuestProfile ${g.first_name}`);

  // Driver profiles — populate driver onboarding / drop-off surfaces.
  const drivers = [
    { driver_id: ID("DRV"), name: "Demo Driver Mike",  phone: "555-3001", affiliated: true,  status: "active", lifetime_drops: 12, lifetime_guests: 34, ytd_payout_total: 480, ytd_year: new Date().getFullYear(), last_active_at: NOW(), mode: "DEMO", venue_id: DEMO_VENUE_ID },
    { driver_id: ID("DRV"), name: "Demo Driver Tina",  phone: "555-3002", affiliated: false, status: "active", lifetime_drops: 5,  lifetime_guests: 11, ytd_payout_total: 150, ytd_year: new Date().getFullYear(), last_active_at: NOW(), mode: "DEMO", venue_id: DEMO_VENUE_ID },
    { driver_id: ID("DRV"), name: "Demo Driver Rosa",  phone: "555-3003", affiliated: true,  status: "active", lifetime_drops: 21, lifetime_guests: 58, ytd_payout_total: 720, ytd_year: new Date().getFullYear(), last_active_at: NOW(), mode: "DEMO", venue_id: DEMO_VENUE_ID },
  ];
  const createdDrivers = [];
  for (const d of drivers) {
    const rec = await create("DriverProfile", d, `DriverProfile ${d.name}`);
    createdDrivers.push(rec || d);
  }

  // Driver drop-off / payout sessions — the full register-flow demo:
  // Mike has a PENDING session (drop-off logged, headcount confirmed, waiting
  // to be paid from the drawer on the Register's Driver Payouts tab), Rosa
  // was already PAID tonight. Matches exactly what DriverQuickAdd writes.
  const payoutMeta = (guests, promo, waived) => JSON.stringify({
    source: "driver_quick_add", affiliated: true,
    guests, promo_guests: promo, waived_guests: waived,
    headcount_confirmed: true,
    confirmed_by: "door@demo.test", confirmed_at: NOW(),
  });
  const [mike, , rosa] = createdDrivers;
  const payouts = [
    { payout_id: ID("DPO"), contractor_id: mike?.driver_id, contractor_name: mike?.name || "Demo Driver Mike", payout_date: today, payout_type: "shift_earnings", bills_redeemed: [], total_face_value: 0, redemption_rate: 0, total_payout: 60, payment_method: "cash", status: "pending", tax_year: new Date().getFullYear(), notes: payoutMeta(6, 1, 0), is_demo: true, venue_id: DEMO_VENUE_ID },
    { payout_id: ID("DPO"), contractor_id: rosa?.driver_id, contractor_name: rosa?.name || "Demo Driver Rosa", payout_date: today, payout_type: "shift_earnings", bills_redeemed: [], total_face_value: 0, redemption_rate: 0, total_payout: 40, payment_method: "cash", status: "paid",    tax_year: new Date().getFullYear(), notes: payoutMeta(4, 0, 1), is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const p of payouts) await create("DriverPayout", p, `DriverPayout ${p.contractor_name} (${p.status})`);

  log("✅ Seed complete", "success");
  return { ok: true };
}