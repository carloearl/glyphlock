import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { wipeDemoVenue, seedDemoVenue, DEMO_VENUE_ID } from "@/lib/nups/demoSeedRunner";

/**
 * OneClickSeedSwitch — a single ON/OFF toggle for the DEMO_VENUE_001 dataset.
 *
 *  • OFF → no demo data present (any existing demo rows are wiped on toggle ON->OFF)
 *  • ON  → wipes the demo venue and re-seeds every field with realistic dummy data
 *
 * Designed for testing the full flow immediately — flip once, hit your test scenarios,
 * flip back off to clear everything.
 */
export default function OneClickSeedSwitch() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const [counts, setCounts] = useState({ transactions: 0, batches: 0, total: 0 });

  // Detect whether demo data is currently loaded
  useEffect(() => {
    (async () => {
      try {
        const tx = await base44.entities.POSTransaction.filter({ venue_id: DEMO_VENUE_ID });
        const bt = await base44.entities.POSBatch.filter({ venue_id: DEMO_VENUE_ID });
        setOn(tx.length + bt.length > 0);
        setCounts({ transactions: tx.length, batches: bt.length, total: tx.length + bt.length });
      } catch (_) { /* noop */ }
    })();
  }, []);

  const appendLog = (entry) => setLog(prev => [{ ...entry, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 80));

  const refreshCounts = async () => {
    const tx = await base44.entities.POSTransaction.filter({ venue_id: DEMO_VENUE_ID });
    const bt = await base44.entities.POSBatch.filter({ venue_id: DEMO_VENUE_ID });
    setCounts({ transactions: tx.length, batches: bt.length, total: tx.length + bt.length });
  };

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    setLog([]);

    try {
      if (!on) {
        appendLog({ msg: "Switching ON — wiping any stale demo rows first…", type: "info" });
        await wipeDemoVenue(appendLog);
        appendLog({ msg: "Seeding fresh demo dataset…", type: "info" });
        await seedDemoVenue(appendLog);
        setOn(true);
      } else {
        appendLog({ msg: "Switching OFF — wiping demo dataset…", type: "info" });
        await wipeDemoVenue(appendLog);
        setOn(false);
      }
      await refreshCounts();
    } catch (e) {
      appendLog({ msg: `❌ ${e?.message || e}`, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,11,20,0.95))",
      border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: 16,
      padding: 24,
      color: "#fff",
      fontFamily: "monospace",
      boxShadow: "0 0 40px rgba(99,102,241,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "#a78bfa", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>One-Click Test Data</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Demo Venue Seed Switch</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Wipes + reseeds every field in DEMO_VENUE_001</div>
        </div>

        {/* The Switch */}
        <button
          onClick={handleToggle}
          disabled={busy}
          aria-pressed={on}
          style={{
            position: "relative",
            width: 96, height: 48,
            borderRadius: 999,
            border: "none",
            background: busy
              ? "#1e293b"
              : on
                ? "linear-gradient(90deg, #10b981, #22c55e)"
                : "#1e293b",
            cursor: busy ? "wait" : "pointer",
            transition: "background 0.3s",
            boxShadow: on ? "0 0 24px rgba(34,197,94,0.5)" : "inset 0 0 8px rgba(0,0,0,0.5)",
            outline: "none",
          }}
        >
          <span style={{
            position: "absolute",
            top: 4, left: on ? 52 : 4,
            width: 40, height: 40,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.3s",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800,
            color: on ? "#10b981" : "#475569",
          }}>
            {busy ? "…" : on ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Stat label="POS Transactions" value={counts.transactions} accent="#22c55e" />
        <Stat label="POS Batches" value={counts.batches} accent="#60a5fa" />
        <Stat label="Total Demo Rows" value={counts.total} accent="#a78bfa" />
      </div>

      {/* Log */}
      <div style={{ background: "#04060a", border: "1px solid #1e2535", borderRadius: 8, padding: 12, maxHeight: 240, overflowY: "auto" }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Activity</div>
        {log.length === 0 ? (
          <div style={{ color: "#1e2535", fontSize: 11 }}>Idle. Flip the switch to seed or wipe.</div>
        ) : (
          log.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, lineHeight: 1.5 }}>
              <span style={{ color: "#1e2535", flexShrink: 0 }}>{e.ts}</span>
              <span style={{
                color: e.type === "success" ? "#22c55e"
                  : e.type === "error" ? "#f87171"
                    : e.type === "warn" ? "#f59e0b"
                      : "#94a3b8",
                wordBreak: "break-word",
              }}>{e.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ background: "#0a0f1a", border: `1px solid ${accent}33`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, marginTop: 2 }}>{value}</div>
    </div>
  );
}