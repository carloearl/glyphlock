import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// Parallel-batch helper: deletes records in chunks instead of one-at-a-time
const BATCH_SIZE = 10;
const deleteInBatches = async (entityName, records, onProgress) => {
  let done = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const slice = records.slice(i, i + BATCH_SIZE);
    await Promise.all(slice.map(r =>
      base44.entities[entityName].delete(r.id).catch(() => null)
    ));
    done += slice.length;
    onProgress?.(done, records.length);
  }
  return done;
};

const DEMO_VENUE_ID = "DEMO_VENUE_001";
const NOW = () => new Date().toISOString();
const TODAY = new Date().toISOString().split("T")[0];
const ID = (prefix) => prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);

const WIPE_ORDER = [
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
  "SystemAuditLog",
];

// Entities with an is_demo flag — we ONLY delete is_demo:true rows from
// these tables. Real records (no is_demo flag) are protected.
const IS_DEMO_FLAGGED = new Set([
  "Entertainer", "NUPSUser", "VIPGuest", "EntertainerShift",
  "POSTransaction", "VIPRoom", "DriverPayout", "VenueContract",
  "PayrollRecord", "GlyphBucksBill", "GlyphBucksTransaction",
  "POSProduct", "POSBatch", "DailySettlement",
]);

// Deterministic demo entertainer IDs so shifts, contracts, VIP rooms & payroll all link correctly
const ENT_ID = {
  Crystal: "DEMO-ENT-Crystal",
  Nova:    "DEMO-ENT-Nova",
  Jade:    "DEMO-ENT-Jade",
  Sage:    "DEMO-ENT-Sage",
};
const MOCK_SIG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";
const MOCK_BIOSCAN = "BIOSCAN-DEMO-" + Math.random().toString(36).slice(2, 10).toUpperCase();

export default function NUPSDemoManager() {
  const [log, setLog]               = useState([]);
  const [phase, setPhase]           = useState("idle");
  const [wipeInput, setWipeInput]   = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount]     = useState(0);
  const [progress, setProgress]         = useState({ current: 0, total: 0, entity: "" });
  const logRef = useRef([]);

  // Block tab close / nav during seed or wipe
  useEffect(() => {
    if (phase !== "seeding" && phase !== "wiping") return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "A demo operation is running. Leaving will cancel it.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const push = (msg, type) => {
    const entry = { msg, type, ts: new Date().toLocaleTimeString() };
    logRef.current = [entry, ...logRef.current];
    setLog([...logRef.current]);
  };

  const tryCreate = async (label, entityName, data) => {
    try {
      await base44.entities[entityName].create(data);
      push("✅ " + label, "success");
      setSuccessCount(p => p + 1);
      return true;
    } catch (e) {
      push("❌ " + label + ": " + (e?.message || JSON.stringify(e)), "error");
      setErrorCount(p => p + 1);
      return false;
    }
  };

  const tryCreateUnique = async (label, entityName, data, uniqueQuery) => {
    try {
      const existing = await base44.entities[entityName].filter(uniqueQuery, "-created_date", 1);
      if (existing?.length) {
        push("↷ " + label + " already exists — skipped", "info");
        return true;
      }
    } catch (e) {
      push("⚠ " + label + " uniqueness preflight failed — attempting create", "warn");
    }
    return tryCreate(label, entityName, data);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const doSeed = async () => {
    setPhase("seeding");
    setSuccessCount(0);
    setErrorCount(0);
    logRef.current = [];
    setLog([]);
    push("▶ Seed started — venue_id: DEMO_VENUE_001", "info");

    const entertainers = [
      { stage_name: "Crystal", legal_name: "Crystal Demo", phone: "555-1001", email: "crystal.demo@nups.dev", contract_signed: true, contract_signature: "Crystal Demo", contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "active",   commission_rate: 60, total_earnings: 1200, vip_room_count: 4, venue_id: DEMO_VENUE_ID },
      { stage_name: "Nova",    legal_name: "Nova Demo",    phone: "555-1002", email: "nova.demo@nups.dev",    contract_signed: true, contract_signature: "Nova Demo",    contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "active",   commission_rate: 60, total_earnings: 750,  vip_room_count: 2, venue_id: DEMO_VENUE_ID },
      { stage_name: "Jade",    legal_name: "Jade Demo",    phone: "555-1003", email: "jade.demo@nups.dev",    contract_signed: true, contract_signature: "Jade Demo",    contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "active",   commission_rate: 60, total_earnings: 480,  vip_room_count: 1, venue_id: DEMO_VENUE_ID },
      { stage_name: "Sage",    legal_name: "Sage Demo",    phone: "555-1004", email: "sage.demo@nups.dev",    contract_signed: true, contract_signature: "Sage Demo",    contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "inactive", commission_rate: 60, total_earnings: 0,    vip_room_count: 0, venue_id: DEMO_VENUE_ID },
    ];
    for (const e of entertainers) await tryCreate("Entertainer: " + e.stage_name, "Entertainer", e);

    const rooms = [
      { room_number: "101", room_name: "VIP Room 1",      status: "available", rate_per_hour: 200, surveillance_camera: "yes", has_audio: "no",  venue_id: DEMO_VENUE_ID },
      { room_number: "102", room_name: "VIP Room 2",      status: "available", rate_per_hour: 200, surveillance_camera: "yes", has_audio: "no",  venue_id: DEMO_VENUE_ID },
      { room_number: "201", room_name: "Champagne Suite", status: "available", rate_per_hour: 500, surveillance_camera: "yes", has_audio: "yes", venue_id: DEMO_VENUE_ID },
      { room_number: "301", room_name: "Skybox",          status: "available", rate_per_hour: 350, surveillance_camera: "yes", has_audio: "yes", venue_id: DEMO_VENUE_ID },
    ];
    for (const r of rooms) await tryCreate("VIPRoom: " + r.room_name, "VIPRoom", r);

    const guests = [
      { guest_id: ID("GUEST"), guest_name: "Demo Guest Alpha", full_name: "Demo Guest Alpha", membership_number: "DEMO-001", phone: "555-2001", status: "checked_in",  check_in_time: NOW(), total_spent_tonight: 850,  lifetime_spent: 4200, venue_id: DEMO_VENUE_ID },
      { guest_id: ID("GUEST"), guest_name: "Demo Guest Beta",  full_name: "Demo Guest Beta",  membership_number: "DEMO-002", phone: "555-2002", status: "checked_out", check_in_time: NOW(), total_spent_tonight: 200,  lifetime_spent: 900,  venue_id: DEMO_VENUE_ID },
      { guest_id: ID("GUEST"), guest_name: "Demo Guest Gamma", full_name: "Demo Guest Gamma", membership_number: "DEMO-003", phone: "555-2003", status: "checked_in",  check_in_time: NOW(), total_spent_tonight: 1100, lifetime_spent: 8700, venue_id: DEMO_VENUE_ID },
    ];
    for (const g of guests) await tryCreate("VIPGuest: " + g.guest_name, "VIPGuest", g);

    await tryCreate("POSBatch: Demo Shift", "POSBatch", {
      opening_cash: 500, cashier: "Demo Manager", status: "open",
      start_time: NOW(), total_sales: 0, transaction_count: 0,
      notes: "DEMO shift batch", venue_id: DEMO_VENUE_ID,
    });

    const txns = [
      { transaction_id: ID("TXN"), total: 120, amount: 120, cash_sales: 120, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "VIP Entrance",         price: 30,  quantity: 4 }], notes: JSON.stringify({ glyphbucks: 0 }),                                        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 200, amount: 200, cash_sales: 0,   card_sales: 200, payment_method: "Credit Card", cashier: "Demo Bartender", status: "completed", items: [{ name: "Bottle Service",        price: 200, quantity: 1 }], notes: JSON.stringify({ glyphbucks: 0 }),                                        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 0,   amount: 0,   cash_sales: 0,   card_sales: 0,   payment_method: "GlyphBucks",  cashier: "Demo Hostess",   status: "completed", items: [{ name: "GlyphBucks Redemption", price: 0,   quantity: 1 }], notes: JSON.stringify({ glyphbucks: 50, glyphbucks_action: "redeem" }),          venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 80,  amount: 80,  cash_sales: 80,  card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "Cover Charge",          price: 20,  quantity: 4 }], notes: JSON.stringify({ glyphbucks: 0 }),                                        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 550, amount: 550, cash_sales: 550, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Hostess",   status: "completed", items: [{ name: "VIP Show — Crystal",    price: 550, quantity: 1 }], notes: JSON.stringify({ glyphbucks: 0, vip_show: true, entertainer: "Crystal" }), venue_id: DEMO_VENUE_ID },
    ];
    for (const t of txns) await tryCreate("POSTransaction: " + t.items[0].name, "POSTransaction", t);

    const gbtxns = [
      { transaction_id: ID("GB"), transaction_type: "purchase", amount: 100, cashier_id: "demo-hostess", denomination: 20, status: "completed", notes: "Demo 5x$20",        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("GB"), transaction_type: "purchase", amount: 150, cashier_id: "demo-hostess", denomination: 50, status: "completed", notes: "Demo 3x$50",        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("GB"), transaction_type: "redeem",   amount: 50,  cashier_id: "demo-hostess", denomination: 50, status: "completed", notes: "Demo 1x$50 redeem", venue_id: DEMO_VENUE_ID },
    ];
    for (const g of gbtxns) await tryCreate("GlyphBucksTransaction: " + g.notes, "GlyphBucksTransaction", g);

    const bills = [
      { serial_number: "DEMO-GB-001", denomination: 20,  status: "active",   batch_id: "DEMO-BATCH-001", issued_at: NOW(), venue_id: DEMO_VENUE_ID },
      { serial_number: "DEMO-GB-002", denomination: 20,  status: "active",   batch_id: "DEMO-BATCH-001", issued_at: NOW(), venue_id: DEMO_VENUE_ID },
      { serial_number: "DEMO-GB-003", denomination: 50,  status: "redeemed", batch_id: "DEMO-BATCH-001", issued_at: NOW(), venue_id: DEMO_VENUE_ID },
      { serial_number: "DEMO-GB-004", denomination: 100, status: "active",   batch_id: "DEMO-BATCH-001", issued_at: NOW(), venue_id: DEMO_VENUE_ID },
    ];
    for (const b of bills) await tryCreate("GlyphBucksBill: " + b.serial_number, "GlyphBucksBill", b);

    const shifts = [
      { entertainer_id: "DEMO-ENT-Crystal", stage_name: "Crystal", check_in_time: NOW(), status: "checked_in",  shift_earnings: 300, vip_sessions: 1, location: "Dream Palace Demo", venue_id: DEMO_VENUE_ID },
      { entertainer_id: "DEMO-ENT-Nova",    stage_name: "Nova",    check_in_time: NOW(), status: "checked_in",  shift_earnings: 150, vip_sessions: 0, location: "Dream Palace Demo", venue_id: DEMO_VENUE_ID },
      { entertainer_id: "DEMO-ENT-Jade",    stage_name: "Jade",    check_in_time: NOW(), status: "checked_out", shift_earnings: 480, vip_sessions: 2, location: "Dream Palace Demo", check_out_time: NOW(), venue_id: DEMO_VENUE_ID },
    ];
    for (const s of shifts) await tryCreate("EntertainerShift: " + s.stage_name, "EntertainerShift", s);

    // ───────── NUPS STAFF (every role per §9.2) ─────────
    const staff = [
      { username: "demo_owner",    full_name: "Demo Owner",        role: "VENUE_OWNER",    pin: "1111", employee_id: "OWN-001", phone: "555-3001", status: "active", emergency_contact: { name: "Spouse",  phone: "555-3901" }, is_demo: true, demo_label: "Demo Owner Seat",   venue_id: DEMO_VENUE_ID },
      { username: "demo_manager",  full_name: "Demo Manager",      role: "VENUE_MANAGER",  pin: "2222", employee_id: "MGR-001", phone: "555-3002", status: "active", emergency_contact: { name: "Parent",  phone: "555-3902" }, is_demo: true, demo_label: "Demo Manager Seat", venue_id: DEMO_VENUE_ID },
      { username: "demo_host",     full_name: "Demo Floor Host",   role: "FLOOR_HOST",     pin: "3333", employee_id: "HST-001", phone: "555-3003", status: "active", emergency_contact: { name: "Sibling", phone: "555-3903" }, is_demo: true, demo_label: "Demo Host Seat",    venue_id: DEMO_VENUE_ID },
      { username: "demo_bar",      full_name: "Demo Bartender",    role: "BARTENDER",      pin: "4444", employee_id: "BAR-001", phone: "555-3004", status: "active", emergency_contact: { name: "Friend",  phone: "555-3904" }, is_demo: true, demo_label: "Demo Bar Seat",     venue_id: DEMO_VENUE_ID },
      { username: "demo_sec",      full_name: "Demo Security",     role: "SECURITY",       pin: "5555", employee_id: "SEC-001", phone: "555-3005", status: "active", emergency_contact: { name: "Spouse",  phone: "555-3905" }, is_demo: true, demo_label: "Demo Security Seat",venue_id: DEMO_VENUE_ID },
      { username: "demo_dj",       full_name: "Demo DJ",           role: "DJ",             pin: "6666", employee_id: "DJ-001",  phone: "555-3006", status: "active", emergency_contact: { name: "Parent",  phone: "555-3906" }, is_demo: true, demo_label: "Demo DJ Seat",      venue_id: DEMO_VENUE_ID },
      { username: "demo_perf",     full_name: "Demo Performer",    role: "PERFORMER",      pin: "7777", employee_id: "PRF-001", phone: "555-3007", status: "active", emergency_contact: { name: "Sibling", phone: "555-3907" }, is_demo: true, demo_label: "Demo Performer Seat",venue_id: DEMO_VENUE_ID },
    ];
    for (const s of staff) await tryCreate("NUPSUser: " + s.full_name + " (" + s.role + ")", "NUPSUser", s);

    // ───────── POS PRODUCT CATALOG ─────────
    const products = [
      { name: "Grey Goose Bottle",      sku: "SPI-GG-750",  category: "Spirits",         price: 450, cost: 180, stock_quantity: 12, low_stock_threshold: 4, taxable: true,  tax_rate: 0.08, is_active: true, supplier: "Demo Liquor Co",   venue_id: DEMO_VENUE_ID },
      { name: "Dom Pérignon",           sku: "CHM-DOM-750", category: "Beer & Wine",     price: 850, cost: 400, stock_quantity: 6,  low_stock_threshold: 2, taxable: true,  tax_rate: 0.08, is_active: true, supplier: "Demo Liquor Co",   venue_id: DEMO_VENUE_ID },
      { name: "House Vodka Shot",       sku: "SPI-HV-SHT",  category: "Spirits",         price: 12,  cost: 3,   stock_quantity: 200,low_stock_threshold: 50,taxable: true,  tax_rate: 0.08, is_active: true, supplier: "Demo Liquor Co",   venue_id: DEMO_VENUE_ID },
      { name: "Red Bull",               sku: "MIX-RB-250",  category: "Mixers",          price: 8,   cost: 2,   stock_quantity: 48, low_stock_threshold: 12,taxable: true,  tax_rate: 0.08, is_active: true, supplier: "Demo Beverage",    venue_id: DEMO_VENUE_ID },
      { name: "VIP Bottle Service",     sku: "VIP-BTL-01",  category: "VIP Service",     price: 650, cost: 250, stock_quantity: 999,low_stock_threshold: 0, taxable: true,  tax_rate: 0.08, is_active: true, supplier: "House",            venue_id: DEMO_VENUE_ID },
      { name: "Champagne Room (1hr)",   sku: "VIP-CHR-60",  category: "VIP Service",     price: 500, cost: 0,   stock_quantity: 999,low_stock_threshold: 0, taxable: false, tax_rate: 0,    is_active: true, supplier: "House",            venue_id: DEMO_VENUE_ID },
      { name: "Cover Charge",           sku: "SVC-CVR-01",  category: "Services",        price: 20,  cost: 0,   stock_quantity: 999,low_stock_threshold: 0, taxable: false, tax_rate: 0,    is_active: true, supplier: "House",            venue_id: DEMO_VENUE_ID },
      { name: "Branded T-Shirt",        sku: "MRC-TEE-BK",  category: "Merchandise",     price: 35,  cost: 10,  stock_quantity: 40, low_stock_threshold: 10,taxable: true,  tax_rate: 0.08, is_active: true, supplier: "Demo Print Co",    venue_id: DEMO_VENUE_ID },
      { name: "Wings Basket",           sku: "FNB-WNG-12",  category: "Food & Beverage", price: 18,  cost: 6,   stock_quantity: 30, low_stock_threshold: 8, taxable: true,  tax_rate: 0.08, is_active: true, supplier: "Demo Kitchen",     venue_id: DEMO_VENUE_ID },
    ];
    for (const p of products) await tryCreate("POSProduct: " + p.name, "POSProduct", p);

    // ───────── VENUE CONTRACTS (full fields — signatures, IDs, cards, bioscan) ─────────
    const contracts = [
      {
        contract_id: ID("CON"), contract_type: "VIP Package",
        customer_name: "Demo Guest Alpha", customer_id_number: "DL-AZ-84719203", customer_address: "123 Demo St", customer_state: "AZ", customer_zip: "85001",
        contract_amount: 1200, glyphbucks_issued: 200, processing_surcharge: 30, waitress_tip: 100, grand_total: 1330,
        payment_method: "Credit Card", purchaser_card_name: "DEMO ALPHA", card_last_four: "4242", card_exp: "12/28", approval_code: "APV-1001",
        ip_address: "192.168.0.10",
        is_printed: true, is_signed: true, customer_signature: MOCK_SIG, signed_at: NOW(),
        entertainer_id: ENT_ID.Crystal, entertainer_name: "Crystal",
        manager_id: "demo_manager", status: "active",
        scan_status: "SCANNED", scanned_at: NOW(), scanned_by: "demo_manager",
        notes: "DEMO · bioscan_ref=" + MOCK_BIOSCAN,
        is_demo: true, demo_label: "Demo VIP Package", venue_id: DEMO_VENUE_ID,
      },
      {
        contract_id: ID("CON"), contract_type: "GlyphBucks Purchase",
        customer_name: "Demo Guest Gamma", customer_id_number: "DL-AZ-91023847", customer_address: "789 Demo Blvd", customer_state: "AZ", customer_zip: "85003",
        contract_amount: 500, glyphbucks_issued: 500, processing_surcharge: 15, waitress_tip: 0, grand_total: 515,
        payment_method: "Credit Card", purchaser_card_name: "DEMO GAMMA", card_last_four: "5555", card_exp: "06/27", approval_code: "APV-1002",
        ip_address: "192.168.0.11",
        is_printed: true, is_signed: true, customer_signature: MOCK_SIG, signed_at: NOW(),
        manager_id: "demo_manager", status: "fulfilled",
        scan_status: "VERIFIED", scanned_at: NOW(), scanned_by: "demo_manager",
        notes: "DEMO · bioscan_ref=" + MOCK_BIOSCAN,
        is_demo: true, demo_label: "Demo GB Purchase", venue_id: DEMO_VENUE_ID,
      },
      {
        contract_id: ID("CON"), contract_type: "Entertainer Agreement",
        customer_name: "Crystal Demo", customer_id_number: "DL-AZ-55544433", customer_address: "N/A — Performer", customer_state: "AZ", customer_zip: "85001",
        contract_amount: 0, glyphbucks_issued: 0, processing_surcharge: 0, waitress_tip: 0, grand_total: 0,
        payment_method: "Cash",
        is_printed: true, is_signed: true, customer_signature: MOCK_SIG, signed_at: NOW(),
        entertainer_id: ENT_ID.Crystal, entertainer_name: "Crystal",
        manager_id: "demo_owner", status: "active",
        scan_status: "VERIFIED",
        notes: "DEMO · W9 on file · bioscan_ref=" + MOCK_BIOSCAN,
        is_demo: true, demo_label: "Demo Performer Agreement", venue_id: DEMO_VENUE_ID,
      },
    ];
    for (const c of contracts) await tryCreate("VenueContract: " + c.contract_type + " — " + c.customer_name, "VenueContract", c);

    // ───────── ACTIVE VIP ROOM SESSION (shows live occupancy) ─────────
    await tryCreate("VIPRoom: Active Session — Champagne Suite", "VIPRoom", {
      room_number: "202", room_name: "Champagne Suite (Live)", status: "occupied",
      entertainer_id: ENT_ID.Crystal, entertainer_name: "Crystal",
      guest_name: "Demo Guest Alpha",
      start_time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      duration_minutes: 60, rate_per_hour: 500, total_charge: 500,
      surveillance_camera: "CAM-202", has_audio: true,
      notes: "DEMO live session", venue_id: DEMO_VENUE_ID,
    });

    // ───────── PAYROLL RECORDS ─────────
    const payStart = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const payEnd   = TODAY;
    const payroll = [
      { pay_period_start: payStart, pay_period_end: payEnd, entertainer_id: ENT_ID.Crystal, stage_name: "Crystal", legal_name: "Crystal Demo", gross_commissions: 1800, gross_tips: 600, gross_total: 2400, venue_fee: 360, venue_fee_rate: 0.15, tax_withholding: 600, tax_rate: 0.25, other_deductions: 0, net_payout: 1440, vip_sessions: 4, shift_hours: 32, status: "approved", approved_by: "demo_owner" },
      { pay_period_start: payStart, pay_period_end: payEnd, entertainer_id: ENT_ID.Nova,    stage_name: "Nova",    legal_name: "Nova Demo",    gross_commissions: 900,  gross_tips: 250, gross_total: 1150, venue_fee: 172, venue_fee_rate: 0.15, tax_withholding: 287, tax_rate: 0.25, other_deductions: 0, net_payout: 691,  vip_sessions: 2, shift_hours: 20, status: "approved", approved_by: "demo_owner" },
      { pay_period_start: payStart, pay_period_end: payEnd, entertainer_id: ENT_ID.Jade,    stage_name: "Jade",    legal_name: "Jade Demo",    gross_commissions: 480,  gross_tips: 180, gross_total: 660,  venue_fee: 99,  venue_fee_rate: 0.15, tax_withholding: 165, tax_rate: 0.25, other_deductions: 25, other_deductions_notes: "Locker fee", net_payout: 371, vip_sessions: 1, shift_hours: 12, status: "draft" },
    ];
    for (const p of payroll) await tryCreate("PayrollRecord: " + p.stage_name, "PayrollRecord", p);

    // ───────── DAILY SETTLEMENT ─────────
    await tryCreate("DailySettlement: " + TODAY, "DailySettlement", {
      settlement_id: ID("SET"), venue_id: DEMO_VENUE_ID, settlement_date: TODAY,
      entertainer_payouts: [
        { entertainer_id: ENT_ID.Crystal, stage_name: "Crystal", gross_revenue: 2400, processing_fees: 72, house_commission: 360, voided_bills_deduction: 0, net_payout: 1968 },
        { entertainer_id: ENT_ID.Nova,    stage_name: "Nova",    gross_revenue: 1150, processing_fees: 35, house_commission: 172, voided_bills_deduction: 0, net_payout: 943 },
        { entertainer_id: ENT_ID.Jade,    stage_name: "Jade",    gross_revenue: 660,  processing_fees: 20, house_commission: 99,  voided_bills_deduction: 25, net_payout: 516 },
      ],
      total_gross_revenue: 4210, total_processing_fees: 127, total_house_commission: 631, total_net_payouts: 3427, venue_net_income: 758,
      reconciliation_status: "approved", approved_by: "demo_owner", approved_at: NOW(), discrepancies: [],
    });

    // ───────── DRIVER PAYOUTS ─────────
    const drivers = [
      { driver_name: "Demo Driver Mike",  driver_number: "555-4001", driver_code: "DRV-001", session_date: TODAY, total_drops: 4, vip_count: 2, pass_count: 1, base_payout: 40, incentive_bonus: 20, vip_kickback: 40, total_payout: 100, status: "paid", paid_at: NOW(), paid_by: "demo_manager",
        drop_offs: [
          { guest_name: "Demo Guest Alpha", drop_time: NOW(), has_pass: true,  pass_type: "VIP",  went_vip: true,  notes: "Repeat guest" },
          { guest_name: "Demo Guest Beta",  drop_time: NOW(), has_pass: false, pass_type: "",     went_vip: false, notes: "" },
          { guest_name: "Walk-in #3",       drop_time: NOW(), has_pass: false, pass_type: "",     went_vip: true,  notes: "Bottle buyer" },
          { guest_name: "Walk-in #4",       drop_time: NOW(), has_pass: false, pass_type: "",     went_vip: false, notes: "" },
        ],
        venue_id: DEMO_VENUE_ID,
      },
      { driver_name: "Demo Driver Sara",  driver_number: "555-4002", driver_code: "DRV-002", session_date: TODAY, total_drops: 2, vip_count: 1, pass_count: 0, base_payout: 20, incentive_bonus: 0, vip_kickback: 20, total_payout: 40, status: "open",
        drop_offs: [
          { guest_name: "Demo Guest Gamma", drop_time: NOW(), has_pass: false, pass_type: "",     went_vip: true,  notes: "" },
          { guest_name: "Walk-in #2",       drop_time: NOW(), has_pass: false, pass_type: "",     went_vip: false, notes: "" },
        ],
        venue_id: DEMO_VENUE_ID,
      },
    ];
    for (const d of drivers) await tryCreate("DriverPayout: " + d.driver_name, "DriverPayout", d);

    // ───────── AI DJ PERSONAS & TRACKS ─────────
    const djs = [
      { name: "Aurora",  entertainer_id: ENT_ID.Crystal, risk_tolerance: "balanced",     weighting_model: { crowd_weight: 0.4, entertainer_weight: 0.4, revenue_weight: 0.2 }, transition_style_rules: { bpm_range: 10, mood_compatibility: ["sensual","chill"],      energy_ramp: "linear" },      genre_bias_logic: { primary_genres: ["R&B","Hip-Hop"], secondary_genres: ["Pop"],    excluded_genres: ["Country"] } },
      { name: "Pulse",   entertainer_id: ENT_ID.Nova,    risk_tolerance: "experimental", weighting_model: { crowd_weight: 0.5, entertainer_weight: 0.3, revenue_weight: 0.2 }, transition_style_rules: { bpm_range: 15, mood_compatibility: ["high-energy","aggressive"],energy_ramp: "exponential" }, genre_bias_logic: { primary_genres: ["EDM","House"], secondary_genres: ["Trap"],   excluded_genres: ["Classical"] } },
      { name: "Velvet",  entertainer_id: ENT_ID.Jade,    risk_tolerance: "conservative", weighting_model: { crowd_weight: 0.3, entertainer_weight: 0.5, revenue_weight: 0.2 }, transition_style_rules: { bpm_range: 8,  mood_compatibility: ["sensual","neutral"],     energy_ramp: "linear" },      genre_bias_logic: { primary_genres: ["R&B","Soul"],  secondary_genres: ["Jazz"],   excluded_genres: ["Metal"] } },
    ];
    for (const d of djs) {
      await tryCreateUnique(
        "AIDJPersona: " + d.name,
        "AIDJPersona",
        d,
        { name: d.name, entertainer_id: d.entertainer_id }
      );
    }

    const tracks = [
      { title: "Demo Midnight Groove",  artist: "DJ Demo",     genre: "R&B",      bpm: 92,  mood: "sensual",     duration: 215, source: "manual", active: true },
      { title: "Demo High Voltage",     artist: "Pulse Demo",  genre: "EDM",      bpm: 128, mood: "high-energy", duration: 240, source: "manual", active: true },
      { title: "Demo Slow Burn",        artist: "Velvet Demo", genre: "Soul",     bpm: 78,  mood: "chill",       duration: 198, source: "manual", active: true },
      { title: "Demo Trap Anthem",      artist: "Trap Demo",   genre: "Trap",     bpm: 140, mood: "aggressive",  duration: 186, source: "manual", active: true },
      { title: "Demo House Classic",    artist: "House Demo",  genre: "House",    bpm: 124, mood: "high-energy", duration: 312, source: "manual", active: true },
      { title: "Demo Lounge Vibes",     artist: "Lounge Demo", genre: "Jazz",     bpm: 85,  mood: "neutral",     duration: 265, source: "manual", active: true },
    ];
    for (const t of tracks) {
      await tryCreateUnique(
        "Track: " + t.title,
        "Track",
        t,
        { title: t.title, artist: t.artist }
      );
    }

    await tryCreate("SystemAuditLog: DEMO_SEED", "SystemAuditLog", {
      event_type: "DEMO_SEED",
      description: "Full DEMO dataset seeded via NUPSDemoManager",
      venue_id: DEMO_VENUE_ID,
      user_id: "SYSTEM",
      metadata: { seed_time: NOW(), mode: "DEMO", venue_id: DEMO_VENUE_ID },
    });

    const sc = logRef.current.filter(l => l.type === "success").length;
    const ec = logRef.current.filter(l => l.type === "error").length;
    push(`✅ Complete — ${sc} records written${ec > 0 ? ` · ⚠ ${ec} errors` : " · All clean"}`, ec > 0 ? "warn" : "success");
    setPhase("done");
  };

  const doWipe = async () => {
    if (wipeInput.trim() !== "WIPE") return;

    setPhase("wiping");
    setSuccessCount(0);
    setErrorCount(0);
    setProgress({ current: 0, total: 0, entity: "" });
    logRef.current = [];
    setLog([]);
    push("DEMO SAFE RESET initiated — venue_id: DEMO_VENUE_001", "info");
    push("⚠ Do NOT close this tab until the wipe completes.", "warn");

    // Pass 1: collect counts so we can show overall progress.
    // For is_demo-flagged entities, ONLY include rows with is_demo:true so
    // real performers (Sativa), real staff, and real guests are protected.
    const recordsByEntity = {};
    let grandTotal = 0;
    let totalProtected = 0;
    for (const entityName of WIPE_ORDER) {
      try {
        const all = await base44.entities[entityName].filter({ venue_id: DEMO_VENUE_ID });
        let recs = all;
        if (IS_DEMO_FLAGGED.has(entityName)) {
          recs = all.filter(r => r.is_demo === true);
          const protectedCount = all.length - recs.length;
          if (protectedCount > 0) {
            totalProtected += protectedCount;
            push("🛡 " + entityName + ": " + protectedCount + " real record(s) protected", "info");
          }
        }
        recordsByEntity[entityName] = recs;
        grandTotal += recs.length;
      } catch (e) {
        recordsByEntity[entityName] = [];
        push(entityName + " (scan): " + (e?.message || JSON.stringify(e)), "error");
        setErrorCount(p => p + 1);
      }
    }
    push("Found " + grandTotal + " demo records to wipe (" + totalProtected + " real records protected)", "info");

    // Pass 2: batched parallel deletes
    const entityCounts = {};
    let totalDeleted = 0;

    for (const entityName of WIPE_ORDER) {
      const records = recordsByEntity[entityName] || [];
      if (!records.length) {
        entityCounts[entityName] = 0;
        push(entityName + ": 0 found", "info");
        continue;
      }

      try {
        const deleted = await deleteInBatches(entityName, records, (done) => {
          setProgress({
            current: totalDeleted + done,
            total: grandTotal,
            entity: entityName,
          });
        });
        entityCounts[entityName] = deleted;
        totalDeleted += deleted;
        push(entityName + ": " + deleted + " deleted", "success");
      } catch (e) {
        entityCounts[entityName] = entityCounts[entityName] ?? 0;
        push(entityName + ": " + (e?.message || JSON.stringify(e)), "error");
        setErrorCount(p => p + 1);
      }
    }
    setProgress({ current: grandTotal, total: grandTotal, entity: "complete" });

    try {
      await base44.entities.SystemAuditLog.create({
        event_type: "DEMO_WIPE",
        description: "DEMO SAFE RESET executed via NUPSDemoManager",
        venue_id: DEMO_VENUE_ID,
        user_id: "SYSTEM",
        metadata: {
          wipe_time: NOW(),
          mode: "DEMO_ONLY",
          executed_by: "NUPSDemoManager",
          entity_counts: entityCounts
        }
      });
      push("SystemAuditLog: DEMO_WIPE recorded", "success");
    } catch (e) {
      push("SystemAuditLog: " + (e?.message || JSON.stringify(e)), "error");
      setErrorCount(p => p + 1);
    }

    push("DEMO SAFE RESET COMPLETE — " + totalDeleted + " records removed", "success");
    setWipeInput("");
    setPhase("done");
  };

  const busy = phase === "seeding" || phase === "wiping";
  const sc = log.filter(l => l.type === "success").length;
  const ec = log.filter(l => l.type === "error").length;

  return (
    <div style={{ padding: "28px 20px", background: "#07090d", minHeight: "100vh", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }}>

      <div style={{ marginBottom: 20 }}>
        <Link
          to="/NUPSOwner"
          style={{ display: "inline-block", marginBottom: 10, fontSize: 12, color: "#60a5fa", textDecoration: "none" }}
        >
          ← Back to Owner Analytics
        </Link>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 4, textTransform: "uppercase" }}>GlyphLock NUPS</span>
          <span style={{ fontSize: 10, background: "#1c1500", border: "1px solid #78350f", color: "#fbbf24", borderRadius: 4, padding: "1px 7px" }}>DEMO MODE</span>
          <span style={{ fontSize: 10, background: "#04090f", border: "1px solid #1e3a5f", color: "#60a5fa", borderRadius: 4, padding: "1px 7px" }}>DEMO SAFE RESET v1</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>Demo <span style={{ color: "#f59e0b" }}>Manager</span></h1>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Seeds full DEMO dataset · Ordered safe wipe · Audit logged · venue_id: DEMO_VENUE_001</p>
      </div>

      {sc > 0 && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: ec > 0 ? "#14110a" : "#061410", border: `1px solid ${ec > 0 ? "#b45309" : "#14532d"}`, fontSize: 12, color: ec > 0 ? "#f59e0b" : "#22c55e" }}>
          {ec > 0 ? `⚠ ${sc} written · ${ec} errors — check log` : `✅ ${sc} records written · All clean`}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, alignItems: "flex-start" }}>
        <button onClick={doSeed} disabled={busy}
          style={{ background: busy ? "#78350f" : "#d97706", color: "#000", border: "none", borderRadius: 7, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: busy ? "not-allowed" : "pointer", fontFamily: "monospace", opacity: busy ? 0.7 : 1 }}>
          {phase === "seeding" ? "⏳ Seeding..." : "▶  Seed All Demo Data"}
        </button>

        {phase !== "confirming" ? (
          <button onClick={() => { setPhase("confirming"); setWipeInput(""); }} disabled={busy}
            style={{ background: "transparent", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 7, padding: "12px 20px", fontWeight: 700, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", fontFamily: "monospace", opacity: busy ? 0.4 : 1 }}>
            🗑  Reset Demo Data
          </button>
        ) : (
          <div style={{ border: "1px solid #dc2626", borderRadius: 8, padding: "12px 16px", background: "#130a0a", display: "flex", flexDirection: "column", gap: 8, minWidth: 280 }}>
            <div style={{ color: "#f87171", fontSize: 12, fontWeight: 700 }}>⚠ CONFIRM DEMO WIPE</div>
            <div style={{ color: "#64748b", fontSize: 11 }}>Deletes ALL demo data in DEMO_VENUE_001.<br />Type <strong style={{ color: "#f87171" }}>WIPE</strong> to proceed.</div>
            <input
              value={wipeInput}
              onChange={e => setWipeInput(e.target.value)}
              placeholder="Type WIPE to confirm"
              style={{ background: "#0a0a0a", border: "1px solid #7f1d1d", borderRadius: 5, padding: "7px 10px", color: "#fff", fontFamily: "monospace", fontSize: 13, outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={doWipe} disabled={wipeInput.trim() !== "WIPE"}
                style={{ background: wipeInput.trim() === "WIPE" ? "#dc2626" : "#3f0f0f", color: "#fff", border: "none", borderRadius: 5, padding: "7px 16px", cursor: wipeInput.trim() === "WIPE" ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>
                Execute Wipe
              </button>
              <button onClick={() => { setPhase("idle"); setWipeInput(""); }}
                style={{ background: "transparent", color: "#64748b", border: "1px solid #1e2535", borderRadius: 5, padding: "7px 12px", cursor: "pointer", fontSize: 12, fontFamily: "monospace" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "#040609", border: "1px solid #0f1117" }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Wipe Order — Alfred Directive</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {WIPE_ORDER.map((e, i) => (
            <span key={e} style={{ fontSize: 10, color: "#475569", background: "#0a0c10", border: "1px solid #1e2535", borderRadius: 4, padding: "2px 8px" }}>
              {i + 1}. {e}
            </span>
          ))}
        </div>
      </div>

      {busy && progress.total > 0 && (
        <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 8, background: "#0a0f1a", border: "1px solid #1e3a5f" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
            <span style={{ color: "#60a5fa" }}>
              {phase === "wiping" ? "🗑 Wiping" : "▶ Seeding"} {progress.entity && `· ${progress.entity}`}
            </span>
            <span style={{ color: "#94a3b8" }}>{progress.current} / {progress.total}</span>
          </div>
          <div style={{ height: 6, background: "#0a0a0a", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, (progress.current / progress.total) * 100)}%`,
              background: "linear-gradient(90deg, #2563eb, #60a5fa)",
              transition: "width 0.2s ease"
            }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "#f59e0b" }}>
            ⚠ Do not close this tab — operation in progress
          </div>
        </div>
      )}

      <div style={{ background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase" }}>
            Activity Log {log.length > 0 ? `· ${log.length} entries` : ""}
          </span>
          {log.length > 0 && (
            <button onClick={() => { logRef.current = []; setLog([]); }}
              style={{ background: "transparent", color: "#334155", border: "none", cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>
              clear
            </button>
          )}
        </div>
        {log.length === 0
          ? <div style={{ color: "#1e2535", fontSize: 12 }}>Ready. Seed or Reset. All actions logged here.</div>
          : <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
              {log.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 11 }}>
                  <span style={{ color: "#1e2535", flexShrink: 0 }}>{e.ts}</span>
                  <span style={{ color: e.type === "success" ? "#22c55e" : e.type === "error" ? "#f87171" : e.type === "warn" ? "#f59e0b" : "#64748b", wordBreak: "break-word" }}>
                    {e.msg}
                  </span>
                </div>
              ))}
            </div>
        }
      </div>

      <div style={{ marginTop: 16, textAlign: "center", fontSize: 9, color: "#1a1f2e" }}>
        BPAAA v3.0 · DACO Governed · GlyphLock LLC · USPTO #18/584,961 · DEMO SAFE RESET v1 · Alfred-Compliant
      </div>
    </div>
  );
}