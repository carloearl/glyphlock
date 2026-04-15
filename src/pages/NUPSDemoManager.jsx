import { useState } from "react";
import { base44 } from "@/api/base44Client";

const DEMO_VENUE_ID = "DEMO_VENUE_001";
const NOW = () => new Date().toISOString();
const TODAY = new Date().toISOString().split("T")[0];

export default function NUPSDemoManager() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const push = (msg, type) => setLog(p => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...p]);

  const doSeed = async () => {
    setRunning(true);
    push("Starting seed...", "info");
    try {
      await base44.entities.Entertainer.create({
        stage_name: "Crystal Demo",
        legal_name: "Crystal Demo",
        contract_signed: true,
        contract_signature: "Crystal Demo",
        contract_signed_date: TODAY,
        status: "active",
        commission_rate: 60,
        venue_id: DEMO_VENUE_ID,
      });
      push("Entertainer created", "success");
    } catch(e) { push("Entertainer error: " + (e?.message || JSON.stringify(e)), "error"); }
    try {
      await base44.entities.POSTransaction.create({
        transaction_id: "DEMO-TXN-" + Date.now(),
        total: 120,
        amount: 120,
        cash_sales: 120,
        card_sales: 0,
        payment_method: "Cash",
        cashier: "Demo Door Girl",
        status: "completed",
        items: [{ name: "Cover Charge", price: 30, quantity: 4 }],
        venue_id: DEMO_VENUE_ID,
      });
      push("Transaction created", "success");
    } catch(e) { push("Transaction error: " + (e?.message || JSON.stringify(e)), "error"); }
    try {
      await base44.entities.GlyphBucksTransaction.create({
        transaction_id: "DEMO-GB-" + Date.now(),
        transaction_type: "purchase",
        amount: 100,
        cashier_id: "demo-hostess",
        venue_id: DEMO_VENUE_ID,
      });
      push("GlyphBucks created", "success");
    } catch(e) { push("GlyphBucks error: " + (e?.message || JSON.stringify(e)), "error"); }
    push("Done. Check errors above.", "info");
    setRunning(false);
  };

  return (
    <div style={{ padding: 32, background: "#07090d", minHeight: "100vh", color: "#fff", fontFamily: "monospace" }}>
      <h1 style={{ color: "#f59e0b", marginBottom: 8 }}>NUPS Demo Manager</h1>
      <p style={{ color: "#475569", marginBottom: 24, fontSize: 13 }}>Seed test data · venue_id: DEMO_VENUE_001</p>
      <button
        onClick={doSeed}
        disabled={running}
        style={{ background: "#d97706", color: "#000", border: "none", borderRadius: 7, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: running ? "not-allowed" : "pointer", marginBottom: 24, fontFamily: "monospace" }}
      >
        {running ? "Seeding..." : "▶ Seed Demo Data"}
      </button>
      <div style={{ background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Log</div>
        {log.length === 0
          ? <div style={{ color: "#334155", fontSize: 12 }}>Press the button to begin.</div>
          : log.map((e, i) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 4, color: e.type === "success" ? "#22c55e" : e.type === "error" ? "#f87171" : "#64748b" }}>
                <span style={{ color: "#334155" }}>{e.ts} </span>{e.msg}
              </div>
            ))
        }
      </div>
    </div>
  );
}