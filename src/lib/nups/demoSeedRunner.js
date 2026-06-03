// Shared, idempotent demo seed + wipe runner for the DEMO_VENUE_001 venue.
// Extracted from NUPSDemoManager so the OneClickSeedSwitch and the StateDiff
// view can both call it with no duplication.

import { base44 } from "@/api/base44Client";

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

const BATCH_SIZE = 10;

async function deleteInBatches(entityName, records) {
  let done = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const slice = records.slice(i, i + BATCH_SIZE);
    await Promise.all(slice.map(r =>
      base44.entities[entityName].delete(r.id).catch(() => null)
    ));
    done += slice.length;
  }
  return done;
}

export async function wipeDemoVenue(onLog) {
  const log = (msg, type = "info") => onLog?.({ msg, type });
  let totalDeleted = 0;
  const perEntity = {};

  for (const entityName of WIPE_ORDER) {
    try {
      const recs = await base44.entities[entityName].filter({ venue_id: DEMO_VENUE_ID });
      if (!recs.length) {
        perEntity[entityName] = 0;
        continue;
      }
      const deleted = await deleteInBatches(entityName, recs);
      perEntity[entityName] = deleted;
      totalDeleted += deleted;
      log(`🗑 ${entityName}: ${deleted} removed`, "success");
    } catch (e) {
      log(`❌ ${entityName}: ${e?.message || e}`, "error");
    }
  }
  return { totalDeleted, perEntity };
}

async function safeCreate(entityName, data, onLog, label) {
  try {
    const res = await base44.entities[entityName].create(data);
    onLog?.({ msg: `✅ ${label}`, type: "success" });
    return res;
  } catch (e) {
    onLog?.({ msg: `❌ ${label}: ${e?.message || e}`, type: "error" });
    return null;
  }
}

export async function seedDemoVenue(onLog) {
  const today = TODAY();
  const log = (msg, type = "info") => onLog?.({ msg, type });
  log("▶ Seeding DEMO_VENUE_001…", "info");

  // POSBatch (open shift)
  await safeCreate("POSBatch", {
    opening_cash: 500, cashier: "Demo Manager", status: "open",
    start_time: NOW(), total_sales: 0, transaction_count: 0,
    notes: "DEMO shift batch", venue_id: DEMO_VENUE_ID,
  }, onLog, "POSBatch (open)");

  // POS Transactions
  const txns = [
    { transaction_id: ID("TXN"), total: 120, amount: 120, cash_sales: 120, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "VIP Entrance", price: 30, quantity: 4 }], venue_id: DEMO_VENUE_ID },
    { transaction_id: ID("TXN"), total: 200, amount: 200, cash_sales: 0,   card_sales: 200, payment_method: "Credit Card", cashier: "Demo Bartender", status: "completed", items: [{ name: "Bottle Service", price: 200, quantity: 1 }], venue_id: DEMO_VENUE_ID },
    { transaction_id: ID("TXN"), total: 80,  amount: 80,  cash_sales: 80,  card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "Cover Charge",   price: 20,  quantity: 4 }], venue_id: DEMO_VENUE_ID },
    { transaction_id: ID("TXN"), total: 550, amount: 550, cash_sales: 550, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Hostess",   status: "completed", items: [{ name: "VIP Show",       price: 550, quantity: 1 }], venue_id: DEMO_VENUE_ID },
    { transaction_id: ID("TXN"), total: 250, amount: 250, cash_sales: 0,   card_sales: 250, payment_method: "Credit Card", cashier: "Demo Bartender", status: "completed", items: [{ name: "Champagne",      price: 250, quantity: 1 }], venue_id: DEMO_VENUE_ID },
  ];
  for (const t of txns) await safeCreate("POSTransaction", t, onLog, `POSTransaction ${t.items[0].name}`);

  // Entertainers
  const ents = [
    { stage_name: "Crystal", legal_name: "Crystal Demo", phone: "555-1001", email: "crystal@demo.test", contract_signed: true, contract_signature: "Crystal Demo", contract_signed_date: today, status: "active",   commission_rate: 60, total_earnings: 1200, vip_room_count: 4, venue_id: DEMO_VENUE_ID },
    { stage_name: "Nova",    legal_name: "Nova Demo",    phone: "555-1002", email: "nova@demo.test",    contract_signed: true, contract_signature: "Nova Demo",    contract_signed_date: today, status: "active",   commission_rate: 60, total_earnings: 750,  vip_room_count: 2, venue_id: DEMO_VENUE_ID },
    { stage_name: "Jade",    legal_name: "Jade Demo",    phone: "555-1003", email: "jade@demo.test",    contract_signed: true, contract_signature: "Jade Demo",    contract_signed_date: today, status: "active",   commission_rate: 60, total_earnings: 480,  vip_room_count: 1, venue_id: DEMO_VENUE_ID },
  ];
  for (const e of ents) await safeCreate("Entertainer", e, onLog, `Entertainer ${e.stage_name}`);

  // VIP Rooms
  const rooms = [
    { room_number: "101", room_name: "VIP Room 1",      status: "available", rate_per_hour: 200, surveillance_camera: "CAM-101", has_audio: false, venue_id: DEMO_VENUE_ID },
    { room_number: "201", room_name: "Champagne Suite", status: "occupied",  rate_per_hour: 500, surveillance_camera: "CAM-201", has_audio: true,  entertainer_name: "Crystal", guest_name: "Demo Alpha", start_time: NOW(), duration_minutes: 60, rate_per_hour: 500, total_charge: 500, venue_id: DEMO_VENUE_ID },
    { room_number: "301", room_name: "Skybox",          status: "cleaning",  rate_per_hour: 350, surveillance_camera: "CAM-301", has_audio: true,  venue_id: DEMO_VENUE_ID },
  ];
  for (const r of rooms) await safeCreate("VIPRoom", r, onLog, `VIPRoom ${r.room_name}`);

  // Products
  const products = [
    { name: "Grey Goose Bottle", sku: "SPI-GG-750",  category: "Spirits",     price: 450, cost: 180, stock_quantity: 12, taxable: true,  tax_rate: 0.08, is_active: true, venue_id: DEMO_VENUE_ID },
    { name: "Dom Pérignon",      sku: "CHM-DOM-750", category: "Beer & Wine", price: 850, cost: 400, stock_quantity: 6,  taxable: true,  tax_rate: 0.08, is_active: true, venue_id: DEMO_VENUE_ID },
    { name: "Cover Charge",      sku: "SVC-CVR-01",  category: "Services",    price: 20,  cost: 0,   stock_quantity: 999,taxable: false, tax_rate: 0,    is_active: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const p of products) await safeCreate("POSProduct", p, onLog, `POSProduct ${p.name}`);

  // Staff (one per role)
  const staff = [
    { username: "demo_owner",   full_name: "Demo Owner",     role: "VENUE_OWNER",   pin: "1111", employee_id: "OWN-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_manager", full_name: "Demo Manager",   role: "VENUE_MANAGER", pin: "2222", employee_id: "MGR-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_host",    full_name: "Demo Host",      role: "FLOOR_HOST",    pin: "3333", employee_id: "HST-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_bar",     full_name: "Demo Bartender", role: "BARTENDER",     pin: "4444", employee_id: "BAR-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_sec",     full_name: "Demo Security",  role: "SECURITY",      pin: "5555", employee_id: "SEC-001", status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
    { username: "demo_dj",      full_name: "Demo DJ",        role: "DJ",            pin: "6666", employee_id: "DJ-001",  status: "active", is_demo: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const s of staff) await safeCreate("NUPSUser", s, onLog, `NUPSUser ${s.role}`);

  // VIP guests
  const guests = [
    { guest_id: ID("VG"), full_name: "Demo Alpha", phone: "555-2001", email: "alpha@demo.test", status: "in_building",  last_visit: NOW(), date_of_birth: "1985-06-15", id_verified: true, venue_id: DEMO_VENUE_ID },
    { guest_id: ID("VG"), full_name: "Demo Beta",  phone: "555-2002", email: "beta@demo.test",  status: "left_building", last_visit: NOW(), date_of_birth: "1990-03-22", id_verified: true, venue_id: DEMO_VENUE_ID },
  ];
  for (const g of guests) await safeCreate("VIPGuest", g, onLog, `VIPGuest ${g.full_name}`);

  // Entertainer shifts
  const shifts = [
    { entertainer_id: "DEMO-ENT-Crystal", stage_name: "Crystal", check_in_time: NOW(), status: "checked_in",  shift_earnings: 300, vip_sessions: 1, venue_id: DEMO_VENUE_ID },
    { entertainer_id: "DEMO-ENT-Nova",    stage_name: "Nova",    check_in_time: NOW(), status: "checked_in",  shift_earnings: 150, vip_sessions: 0, venue_id: DEMO_VENUE_ID },
  ];
  for (const s of shifts) await safeCreate("EntertainerShift", s, onLog, `EntertainerShift ${s.stage_name}`);

  // Payroll
  const payStart = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const payroll = [
    { pay_period_start: payStart, pay_period_end: today, stage_name: "Crystal", legal_name: "Crystal Demo", gross_commissions: 1800, gross_tips: 600, gross_total: 2400, venue_fee: 360, venue_fee_rate: 0.15, tax_withholding: 600, tax_rate: 0.25, other_deductions: 0, net_payout: 1440, vip_sessions: 4, shift_hours: 32, status: "approved" },
    { pay_period_start: payStart, pay_period_end: today, stage_name: "Nova",    legal_name: "Nova Demo",    gross_commissions: 900,  gross_tips: 250, gross_total: 1150, venue_fee: 172, venue_fee_rate: 0.15, tax_withholding: 287, tax_rate: 0.25, other_deductions: 0, net_payout: 691,  vip_sessions: 2, shift_hours: 20, status: "approved" },
  ];
  for (const p of payroll) await safeCreate("PayrollRecord", p, onLog, `PayrollRecord ${p.stage_name}`);

  log("✅ Seed complete", "success");
  return { ok: true };
}