import { useState, useRef } from "react";
// import { base44 } from "@/api/base44Client";

const DEMO_VENUE_ID = "DEMO_VENUE_001";
const NOW = () => new Date().toISOString();
const TODAY = new Date().toISOString().split("T")[0];
const ID = (prefix) => prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);

const WIPE_ORDER = [
  "GlyphBucksTransaction",
  "POSTransaction",
  "EntertainerShift",
  "VIPGuest",
  "GlyphBucksBill",
  "VIPRoom",
  "Entertainer",
  "POSBatch",
  "SystemAuditLog",
];

export default function NUPSDemoManager() {
  const base44 = { entities: {} };
  const [log, setLog]               = useState([]);
  const [phase, setPhase]           = useState("idle");
  const [wipeInput, setWipeInput]   = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount]     = useState(0);
  const logRef = useRef([]);

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
    push("WIPE DISABLED FOR DEBUG", "warn");
  };

  const busy = phase === "seeding" || phase === "wiping";
  const sc = log.filter(l => l.type === "success").length;
  const ec = log.filter(l => l.type === "error").length;

  return (
    <div style={{ padding: "28px 20px", background: "#07090d", minHeight: "100vh", color: "#fff", fontFamily: "monospace", boxSizing: "border-box" }}>

      <div style={{ marginBottom: 20 }}>
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