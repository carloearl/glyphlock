import { useState } from "react";
import { base44 } from "@/api/base44Client";

const DEMO_VENUE_ID = "DEMO_VENUE_001";
const NOW = () => new Date().toISOString();
const TODAY = new Date().toISOString().split("T")[0];
const ID = (prefix) => prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);

export default function NUPSDemoManager() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [counts, setCounts] = useState({});

  const push = (msg, type) => setLog(p => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...p]);
  const inc = (key) => setCounts(p => ({ ...p, [key]: (p[key] || 0) + 1 }));

  const tryCreate = async (label, entityName, data) => {
    try {
      await base44.entities[entityName].create(data);
      push("✅ " + label, "success");
      inc(entityName);
    } catch(e) {
      push("❌ " + label + ": " + (e?.message || JSON.stringify(e)), "error");
    }
  };

  const doSeed = async () => {
    setRunning(true);
    setCounts({});
    setLog([]);
    push("▶ Seed started — venue_id: DEMO_VENUE_001", "info");

    // ENTERTAINERS
    const entertainers = [
      { stage_name: "Crystal", legal_name: "Crystal Demo", phone: "555-1001", email: "crystal.demo@nups.dev", contract_signed: true, contract_signature: "Crystal Demo", contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "active", commission_rate: 60, total_earnings: 1200, vip_room_count: 4, venue_id: DEMO_VENUE_ID },
      { stage_name: "Nova",    legal_name: "Nova Demo",    phone: "555-1002", email: "nova.demo@nups.dev",    contract_signed: true, contract_signature: "Nova Demo",    contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "active", commission_rate: 60, total_earnings: 750,  vip_room_count: 2, venue_id: DEMO_VENUE_ID },
      { stage_name: "Jade",    legal_name: "Jade Demo",    phone: "555-1003", email: "jade.demo@nups.dev",    contract_signed: true, contract_signature: "Jade Demo",    contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "active", commission_rate: 60, total_earnings: 480,  vip_room_count: 1, venue_id: DEMO_VENUE_ID },
      { stage_name: "Sage",    legal_name: "Sage Demo",    phone: "555-1004", email: "sage.demo@nups.dev",    contract_signed: true, contract_signature: "Sage Demo",    contract_signed_date: TODAY, contract_ip_address: "192.168.0.1", status: "inactive", commission_rate: 60, total_earnings: 0, vip_room_count: 0, venue_id: DEMO_VENUE_ID },
    ];
    for (const e of entertainers) await tryCreate("Entertainer: " + e.stage_name, "Entertainer", e);

    // VIP ROOMS
    const rooms = [
      { room_number: "101", room_name: "VIP Room 1",      status: "available", rate_per_hour: 200, surveillance_camera: "yes", has_audio: "no", venue_id: DEMO_VENUE_ID },
      { room_number: "102", room_name: "VIP Room 2",      status: "available", rate_per_hour: 200, surveillance_camera: "yes", has_audio: "no", venue_id: DEMO_VENUE_ID },
      { room_number: "201", room_name: "Champagne Suite", status: "available", rate_per_hour: 500, surveillance_camera: "yes", has_audio: "yes",  venue_id: DEMO_VENUE_ID },
      { room_number: "301", room_name: "Skybox",          status: "available", rate_per_hour: 350, surveillance_camera: "yes", has_audio: "yes",  venue_id: DEMO_VENUE_ID },
    ];
    for (const r of rooms) await tryCreate("VIPRoom: " + r.room_name, "VIPRoom", r);

    // VIP GUESTS
    const guests = [
      { guest_name: "Demo Guest Alpha", full_name: "Demo Guest Alpha", guest_id: ID("GUEST"), membership_number: "DEMO-001", phone: "555-2001", status: "checked_in",  check_in_time: NOW(), total_spent_tonight: 850,  lifetime_spent: 4200, venue_id: DEMO_VENUE_ID },
      { guest_name: "Demo Guest Beta",  full_name: "Demo Guest Beta", guest_id: ID("GUEST"), membership_number: "DEMO-002", phone: "555-2002", status: "checked_out", check_in_time: NOW(), total_spent_tonight: 200,  lifetime_spent: 900,  venue_id: DEMO_VENUE_ID },
      { guest_name: "Demo Guest Gamma", full_name: "Demo Guest Gamma", guest_id: ID("GUEST"), membership_number: "DEMO-003", phone: "555-2003", status: "checked_in",  check_in_time: NOW(), total_spent_tonight: 1100, lifetime_spent: 8700, venue_id: DEMO_VENUE_ID },
    ];
    for (const g of guests) await tryCreate("VIPGuest: " + g.guest_name, "VIPGuest", g);

    // POS BATCH
    await tryCreate("POSBatch: Demo Shift", "POSBatch", {
      opening_cash: 500, cashier: "Demo Manager", status: "open",
      start_time: NOW(), total_sales: 0, transaction_count: 0,
      notes: "DEMO shift batch", venue_id: DEMO_VENUE_ID,
    });

    // TRANSACTIONS
    const txns = [
      { transaction_id: ID("TXN"), total: 120, amount: 120, cash_sales: 120, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "VIP Entrance",         price: 30,  quantity: 4 }], notes: JSON.stringify({ glyphbucks: 0 }),                                        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 200, amount: 200, cash_sales: 0,   card_sales: 200, payment_method: "Credit Card", cashier: "Demo Bartender", status: "completed", items: [{ name: "Bottle Service",        price: 200, quantity: 1 }], notes: JSON.stringify({ glyphbucks: 0 }),                                        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 0,   amount: 0,   cash_sales: 0,   card_sales: 0,   payment_method: "GlyphBucks",  cashier: "Demo Hostess",   status: "completed", items: [{ name: "GlyphBucks Redemption", price: 0,   quantity: 1 }], notes: JSON.stringify({ glyphbucks: 50, glyphbucks_action: "redeem" }),          venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 80,  amount: 80,  cash_sales: 80,  card_sales: 0,   payment_method: "Cash",        cashier: "Demo Door Girl", status: "completed", items: [{ name: "Cover Charge",          price: 20,  quantity: 4 }], notes: JSON.stringify({ glyphbucks: 0 }),                                        venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("TXN"), total: 550, amount: 550, cash_sales: 550, card_sales: 0,   payment_method: "Cash",        cashier: "Demo Hostess",   status: "completed", items: [{ name: "VIP Show — Crystal",    price: 550, quantity: 1 }], notes: JSON.stringify({ glyphbucks: 0, vip_show: true, entertainer: "Crystal" }), venue_id: DEMO_VENUE_ID },
    ];
    for (const t of txns) await tryCreate("POSTransaction: " + t.items[0].name, "POSTransaction", t);

    // GLYPHBUCKS TRANSACTIONS
    const gbtxns = [
      { transaction_id: ID("GB"), transaction_type: "purchase", amount: 100, cashier_id: "demo-hostess", denomination: 20, status: "completed", notes: "Demo 5x$20",       venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("GB"), transaction_type: "purchase", amount: 150, cashier_id: "demo-hostess", denomination: 50, status: "completed", notes: "Demo 3x$50",       venue_id: DEMO_VENUE_ID },
      { transaction_id: ID("GB"), transaction_type: "redeem",   amount: 50,  cashier_id: "demo-hostess", denomination: 50, status: "completed", notes: "Demo 1x$50 redeem", venue_id: DEMO_VENUE_ID },
    ];
    for (const g of gbtxns) await tryCreate("GlyphBucksTransaction: " + g.notes, "GlyphBucksTransaction", g);

    // GLYPHBUCKS BILLS
    const bills = [
      { serial_number: "DEMO-GB-001", denomination: 20,  status: "active",   issued_at: NOW(), batch_id: "DEMO-BATCH-001", venue_id: DEMO_VENUE_ID },
      { serial_number: "DEMO-GB-002", denomination: 20,  status: "active",   issued_at: NOW(), batch_id: "DEMO-BATCH-001", venue_id: DEMO_VENUE_ID },
      { serial_number: "DEMO-GB-003", denomination: 50,  status: "redeemed", issued_at: NOW(), batch_id: "DEMO-BATCH-001", venue_id: DEMO_VENUE_ID },
      { serial_number: "DEMO-GB-004", denomination: 100, status: "active",   issued_at: NOW(), batch_id: "DEMO-BATCH-001", venue_id: DEMO_VENUE_ID },
    ];
    for (const b of bills) await tryCreate("GlyphBucksBill: " + b.serial_number, "GlyphBucksBill", b);

    // ENTERTAINER SHIFTS
    const shifts = [
      { stage_name: "Crystal", entertainer_id: "DEMO-ENT-Crystal", check_in_time: NOW(), status: "checked_in",  shift_earnings: 300, vip_sessions: 1, location: "Dream Palace Demo", venue_id: DEMO_VENUE_ID },
      { stage_name: "Nova",    entertainer_id: "DEMO-ENT-Nova", check_in_time: NOW(), status: "checked_in",  shift_earnings: 150, vip_sessions: 0, location: "Dream Palace Demo", venue_id: DEMO_VENUE_ID },
      { stage_name: "Jade",    entertainer_id: "DEMO-ENT-Jade", check_in_time: NOW(), status: "checked_out", shift_earnings: 480, vip_sessions: 2, location: "Dream Palace Demo", check_out_time: NOW(), venue_id: DEMO_VENUE_ID },
    ];
    for (const s of shifts) await tryCreate("EntertainerShift: " + s.stage_name, "EntertainerShift", s);

    // AUDIT LOG
    await tryCreate("SystemAuditLog: DEMO_SEED", "SystemAuditLog", {
      event_type: "DEMO_SEED",
      description: "Full DEMO dataset seeded via NUPSDemoManager",
      venue_id: DEMO_VENUE_ID,
      user_id: "SYSTEM",
      metadata: { seed_time: NOW(), mode: "DEMO" },
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    push("✅ Complete — " + log.filter(l => l.type === "success").length + " records written", "success");
    setRunning(false);
  };

  const errorCount = log.filter(l => l.type === "error").length;
  const successCount = log.filter(l => l.type === "success").length;

  return (
    <div style={{ padding: "28px 20px", background: "#07090d", minHeight: "100vh", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 4 }}>GLYPHLOCK NUPS</span>
          <span style={{ fontSize: 10, background: "#1c1500", border: "1px solid #78350f", color: "#fbbf24", borderRadius: 4, padding: "1px 7px" }}>DEMO MODE</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Demo <span style={{ color: "#f59e0b" }}>Manager</span></h1>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Seeds full DEMO dataset · venue_id: DEMO_VENUE_001 · Errors surface in log</p>
      </div>

      {successCount > 0 && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#061410", border: "1px solid #14532d", fontSize: 12, color: "#22c55e" }}>
          ✅ {successCount} records written {errorCount > 0 ? `· ⚠ ${errorCount} errors — see log` : "· All clean"}
        </div>
      )}

      <button onClick={doSeed} disabled={running}
        style={{ background: running ? "#78350f" : "#d97706", color: "#000", border: "none", borderRadius: 7, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: running ? "not-allowed" : "pointer", marginBottom: 24, fontFamily: "monospace", opacity: running ? 0.7 : 1 }}>
        {running ? "⏳ Seeding..." : "▶  Seed All Demo Data"}
      </button>

      <div style={{ background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
          Activity Log {log.length > 0 ? "· " + log.length + " entries" : ""}
        </div>
        {log.length === 0
          ? <div style={{ color: "#334155", fontSize: 12 }}>Press the button to begin. All errors surface here.</div>
          : <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {log.map((e, i) => (
                <div key={i} style={{ fontSize: 11, marginBottom: 3, display: "flex", gap: 10 }}>
                  <span style={{ color: "#1e2535", flexShrink: 0 }}>{e.ts}</span>
                  <span style={{ color: e.type === "success" ? "#22c55e" : e.type === "error" ? "#f87171" : "#64748b", wordBreak: "break-word" }}>{e.msg}</span>
                </div>
              ))}
            </div>
        }
      </div>

      <div style={{ marginTop: 16, textAlign: "center", fontSize: 9, color: "#1a1f2e" }}>
        BPAAA v3.0 · DACO Governed · GlyphLock LLC · USPTO #18/584,961
      </div>
    </div>
  );
}