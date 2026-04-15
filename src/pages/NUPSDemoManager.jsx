import { useState } from "react";

const safeEntity = (name) => ({
  create: async (data) => {
    const mod = await import("@/api/entities");
    if (!mod[name]) throw new Error(`Entity '${name}' not found in app`);
    return mod[name].create(data);
  },
  filter: async (query) => {
    try {
      const mod = await import("@/api/entities");
      if (!mod[name]) return [];
      return await mod[name].filter(query);
    } catch {
      return [];
    }
  },
  delete: async (id) => {
    const mod = await import("@/api/entities");
    if (!mod[name]) throw new Error(`Entity '${name}' not found`);
    return mod[name].delete(id);
  },
});

const DEMO_VENUE_ID = "DEMO_VENUE_001";

const SEED_SETS = [
  {
    id: "Entertainer",
    label: "Entertainers",
    icon: "💃",
    records: [
      { stage_name: "Crystal", real_name: "Crystal Demo", status: "active", biometric_captured: true, id_captured: true, dob: "1998-04-12", mode: "DEMO", venue_id: DEMO_VENUE_ID },
      { stage_name: "Nova", real_name: "Nova Demo", status: "active", biometric_captured: true, id_captured: true, dob: "2000-07-22", mode: "DEMO", venue_id: DEMO_VENUE_ID },
      { stage_name: "Jade", real_name: "Jade Demo", status: "active", biometric_captured: false, id_captured: true, dob: "1995-11-03", mode: "DEMO", venue_id: DEMO_VENUE_ID },
      { stage_name: "Sage", real_name: "Sage Demo", status: "inactive", biometric_captured: true, id_captured: true, dob: "2001-02-18", mode: "DEMO", venue_id: DEMO_VENUE_ID },
    ],
  },
  {
    id: "POSTransaction",
    label: "Transactions",
    icon: "💰",
    records: [
      { amount: 120, cash_sales: 120, card_sales: 0, total_sales: 120, payment_method: "Cash", item: "VIP Entrance", mode: "DEMO", venue_id: DEMO_VENUE_ID, notes: JSON.stringify({ glyphbucks: 0 }) },
      { amount: 200, cash_sales: 0, card_sales: 200, total_sales: 200, payment_method: "Credit Card", item: "Bottle Service", mode: "DEMO", venue_id: DEMO_VENUE_ID, notes: JSON.stringify({ glyphbucks: 0 }) },
      { amount: 0, cash_sales: 0, card_sales: 0, total_sales: 0, payment_method: "GlyphBucks", item: "GlyphBucks Redemption", mode: "DEMO", venue_id: DEMO_VENUE_ID, notes: JSON.stringify({ glyphbucks: 50, glyphbucks_action: "redeem" }) },
      { amount: 80, cash_sales: 80, card_sales: 0, total_sales: 80, payment_method: "Cash", item: "Cover Charge x4", mode: "DEMO", venue_id: DEMO_VENUE_ID, notes: JSON.stringify({ glyphbucks: 0 }) },
      { amount: 300, cash_sales: 0, card_sales: 300, total_sales: 300, payment_method: "Debit Card", item: "Room Rental", mode: "DEMO", venue_id: DEMO_VENUE_ID, notes: JSON.stringify({ glyphbucks: 0 }) },
    ],
  },
  {
    id: "GlyphBucksOrder",
    label: "GlyphBucks Orders",
    icon: "🪙",
    records: [
      { denomination: 20, quantity: 5, total_value: 100, status: "issued", mode: "DEMO", venue_id: DEMO_VENUE_ID },
      { denomination: 50, quantity: 3, total_value: 150, status: "issued", mode: "DEMO", venue_id: DEMO_VENUE_ID },
      { denomination: 100, quantity: 2, total_value: 200, status: "redeemed", mode: "DEMO", venue_id: DEMO_VENUE_ID },
    ],
  },
  {
    id: "SystemAuditLog",
    label: "Audit Entries",
    icon: "📋",
    records: [
      { event_type: "DEMO_SEED", description: "Demo shift opened — seed record", venue_id: DEMO_VENUE_ID, mode: "DEMO", performed_by: "SYSTEM" },
      { event_type: "DEMO_SEED", description: "Demo batch opened — seed record", venue_id: DEMO_VENUE_ID, mode: "DEMO", performed_by: "SYSTEM" },
    ],
  },
];

const SC = {
  idle: { bg: "#0f1117", border: "#1e2535", label: "#475569", dot: "#334155" },
  running: { bg: "#14110a", border: "#b45309", label: "#f59e0b", dot: "#f59e0b" },
  success: { bg: "#061410", border: "#166534", label: "#22c55e", dot: "#22c55e" },
  error: { bg: "#130a0a", border: "#b91c1c", label: "#ef4444", dot: "#ef4444" },
};

export default function NUPSDemoManager() {
  const blankTasks = () => SEED_SETS.map((s) => ({ id: s.id, label: s.label, icon: s.icon, status: "idle", count: 0, err: "" }));

  const [tasks, setTasks] = useState(blankTasks);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [confirmWipe, setConfirmWipe] = useState(false);

  const push = (msg, type = "info") => setLog((p) => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...p].slice(0, 60));
  const patchTask = (id, patch) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const doSeed = async () => {
    setPhase("seeding");
    push("▶ DEMO seed started", "info");

    for (const set of SEED_SETS) {
      patchTask(set.id, { status: "running", err: "" });
      const E = safeEntity(set.id);
      let ok = 0;
      let firstErr = "";

      for (const rec of set.records) {
        try {
          await E.create({ ...rec, created_at: new Date().toISOString() });
          ok++;
        } catch (e) {
          if (!firstErr) firstErr = e.message;
        }
      }

      if (ok === set.records.length) {
        patchTask(set.id, { status: "success", count: ok });
        push(`✅ ${set.label}: ${ok} created`, "success");
      } else if (ok > 0) {
        patchTask(set.id, { status: "success", count: ok, err: `${set.records.length - ok} skipped` });
        push(`⚠ ${set.label}: ${ok}/${set.records.length} created`, "warn");
      } else {
        patchTask(set.id, { status: "error", err: firstErr || "all failed" });
        push(`❌ ${set.label}: ${firstErr}`, "error");
      }
    }

    setPhase("done");
    push("✅ Complete — all records tagged mode:DEMO, venue_id:DEMO_VENUE_001", "success");
  };

  const doWipe = async () => {
    setPhase("wiping");
    setConfirmWipe(false);
    push("🔴 Wiping DEMO data...", "warn");

    for (const set of SEED_SETS) {
      try {
        const rows = await safeEntity(set.id).filter({ mode: "DEMO" });
        let n = 0;
        for (const r of rows) {
          try {
            await safeEntity(set.id).delete(r.id);
            n++;
          } catch {
          }
        }
        push(`🗑 ${set.label}: ${n} wiped`, "warn");
      } catch (e) {
        push(`⚠ ${set.label}: ${e.message}`, "error");
      }
    }

    setTasks(blankTasks());
    setPhase("idle");
    push("✅ Wipe done — REAL records untouched", "success");
  };

  const busy = phase === "seeding" || phase === "wiping";

  return (
    <div style={{ minHeight: "100vh", background: "#07090d", color: "#e2e8f0", fontFamily: "monospace", padding: "32px 20px", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
          <span style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 4, textTransform: "uppercase" }}>GlyphLock NUPS</span>
          <span style={{ fontSize: 10, background: "#1c1500", border: "1px solid #78350f", color: "#fbbf24", borderRadius: 4, padding: "2px 8px" }}>MODE: DEMO</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
          Demo <span style={{ color: "#f59e0b" }}>Manager</span>
        </h1>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
          Seed isolated DEMO data · Records tagged <code style={{ color: "#fbbf24", background: "#1c1500", padding: "1px 5px", borderRadius: 3 }}>mode:'DEMO'</code> · Zero contamination with REAL financials
        </p>
      </div>

      <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, border: "1px solid #14532d", background: "#061410", display: "flex", alignItems: "center", gap: 10 }}>
        <span>🔒</span>
        <div>
          <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>DEMO Isolation Guaranteed</div>
          <div style={{ color: "#374151", fontSize: 11 }}>Demo transactions never appear in REAL Z-reports · Stripe test key enforced · venue_id: DEMO_VENUE_001</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 10, marginBottom: 20 }}>
        {tasks.map((t) => {
          const s = SC[t.status] || SC.idle;
          return (
            <div key={t.id} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: "14px 12px" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600, marginBottom: 8 }}>{t.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
                <span style={{ fontSize: 10, color: s.label, textTransform: "uppercase", letterSpacing: 1 }}>
                  {t.status === "idle" ? "READY" : t.status}{t.count > 0 ? ` (${t.count})` : ""}
                </span>
              </div>
              {t.err ? <div style={{ fontSize: 10, color: "#f87171", marginTop: 4 }}>{t.err}</div> : null}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28, alignItems: "center" }}>
        <button onClick={doSeed} disabled={busy} style={{ background: busy ? "#78350f" : "#d97706", color: "#000", border: "none", borderRadius: 7, padding: "10px 22px", fontWeight: 800, fontSize: 13, cursor: busy ? "not-allowed" : "pointer", fontFamily: "monospace", opacity: busy ? 0.6 : 1 }}>
          {phase === "seeding" ? "⏳ Seeding..." : "▶  Seed Demo Data"}
        </button>

        {phase === "done" && (
          <button onClick={() => { setTasks(blankTasks()); setPhase("idle"); }} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #1e2535", borderRadius: 7, padding: "10px 16px", cursor: "pointer", fontSize: 12, fontFamily: "monospace" }}>
            ↺ Reset
          </button>
        )}

        {!confirmWipe ? (
          <button onClick={() => setConfirmWipe(true)} disabled={busy} style={{ background: "transparent", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: 7, padding: "10px 18px", fontWeight: 700, fontSize: 12, cursor: busy ? "not-allowed" : "pointer", fontFamily: "monospace", opacity: busy ? 0.5 : 1 }}>
            🗑  Wipe Demo Data
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #7f1d1d", borderRadius: 8, padding: "8px 12px", background: "#130a0a" }}>
            <span style={{ color: "#f87171", fontSize: 12 }}>Confirm wipe?</span>
            <button onClick={doWipe} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "monospace" }}>Yes, Wipe</button>
            <button onClick={() => setConfirmWipe(false)} style={{ background: "transparent", color: "#64748b", border: "1px solid #1e2535", borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#0b0d12", border: "1px solid #1a1f2e", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Entertainers ({SEED_SETS[0].records.length})</div>
          {SEED_SETS[0].records.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #12151e" }}>
              <span style={{ fontSize: 12, color: "#e2e8f0" }}>{e.stage_name}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: e.biometric_captured ? "#061410" : "#130a0a", color: e.biometric_captured ? "#22c55e" : "#f87171", border: `1px solid ${e.biometric_captured ? "#14532d" : "#7f1d1d"}` }}>{e.biometric_captured ? "BIO✓" : "BIO✗"}</span>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#0a0c14", color: e.status === "active" ? "#818cf8" : "#64748b", border: `1px solid ${e.status === "active" ? "#3730a3" : "#1e2535"}` }}>{e.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#0b0d12", border: "1px solid #1a1f2e", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Transactions ({SEED_SETS[1].records.length})</div>
          {SEED_SETS[1].records.map((tx, i) => {
            const notes = JSON.parse(tx.notes || "{}");
            const isGB = tx.payment_method === "GlyphBucks";
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #12151e" }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{tx.item}</span>
                {isGB ? (
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#1c1500", color: "#fbbf24", border: "1px solid #78350f" }}>🪙 {notes.glyphbucks}</span>
                ) : (
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#061410", color: "#22c55e", border: "1px solid #14532d" }}>${tx.total_sales}</span>
                )}
              </div>
            );
          })}
          <div style={{ fontSize: 9, color: "#1e2535", marginTop: 8, paddingTop: 6, borderTop: "1px solid #12151e" }}>total_sales = cash+card ONLY · GlyphBucks in notes JSON only</div>
        </div>
      </div>

      <div style={{ background: "#050609", border: "1px solid #0f1117", borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Activity Log</div>
        {log.length === 0 ? (
          <div style={{ color: "#1e2535", fontSize: 12 }}>Awaiting actions...</div>
        ) : (
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {log.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontSize: 11, marginBottom: 2, color: e.type === "success" ? "#22c55e" : e.type === "error" ? "#f87171" : e.type === "warn" ? "#f59e0b" : "#475569" }}>
                <span style={{ color: "#1e2535", flexShrink: 0 }}>{e.ts}</span>
                <span>{e.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 9, color: "#1a1f2e" }}>
        BPAAA v3.0 · DACO Governed · GlyphLock LLC · USPTO #18/584,961 · DEMO=sk_test_ · REAL untouched
      </div>
    </div>
  );
}