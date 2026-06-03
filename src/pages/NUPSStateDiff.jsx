import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OneClickSeedSwitch from "@/components/nups/OneClickSeedSwitch";
import { DEMO_VENUE_ID } from "@/lib/nups/demoSeedRunner";

/**
 * NUPSStateDiff — captures a "before" snapshot, lets the operator run their tests,
 * then captures an "after" snapshot and shows exactly which POSTransactions and
 * POSBatches were added, removed, or modified.
 *
 * Top of the page hosts the OneClickSeedSwitch so a tester can prep clean data,
 * snapshot, run flows, then snapshot again — all in one place.
 */

const FIELDS_TO_DIFF = {
  POSTransaction: ["transaction_id", "total", "amount", "cash_sales", "card_sales", "payment_method", "cashier", "status", "items"],
  POSBatch: ["batch_id", "status", "opening_cash", "closing_cash", "total_sales", "transaction_count", "cashier", "start_time", "end_time", "discrepancy"],
};

async function snapshotEntity(entityName) {
  const rows = await base44.entities[entityName].filter({ venue_id: DEMO_VENUE_ID });
  const map = {};
  for (const r of rows) map[r.id] = r;
  return map;
}

async function captureSnapshot() {
  const [POSTransaction, POSBatch] = await Promise.all([
    snapshotEntity("POSTransaction"),
    snapshotEntity("POSBatch"),
  ]);
  return { POSTransaction, POSBatch, capturedAt: new Date().toISOString() };
}

function diffEntity(before, after, fields) {
  const beforeIds = new Set(Object.keys(before));
  const afterIds = new Set(Object.keys(after));

  const added = [...afterIds].filter(id => !beforeIds.has(id)).map(id => after[id]);
  const removed = [...beforeIds].filter(id => !afterIds.has(id)).map(id => before[id]);

  const modified = [];
  for (const id of afterIds) {
    if (!beforeIds.has(id)) continue;
    const b = before[id]; const a = after[id];
    const changes = [];
    for (const f of fields) {
      const bv = JSON.stringify(b?.[f] ?? null);
      const av = JSON.stringify(a?.[f] ?? null);
      if (bv !== av) changes.push({ field: f, before: b?.[f], after: a?.[f] });
    }
    if (changes.length) modified.push({ id, before: b, after: a, changes });
  }

  return { added, removed, modified, beforeCount: beforeIds.size, afterCount: afterIds.size };
}

export default function NUPSStateDiff() {
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const grabBefore = async () => {
    setBusy(true); setError(null);
    try { setBefore(await captureSnapshot()); setAfter(null); }
    catch (e) { setError(e?.message || String(e)); }
    finally { setBusy(false); }
  };
  const grabAfter = async () => {
    setBusy(true); setError(null);
    try { setAfter(await captureSnapshot()); }
    catch (e) { setError(e?.message || String(e)); }
    finally { setBusy(false); }
  };
  const reset = () => { setBefore(null); setAfter(null); setError(null); };

  const txDiff = before && after ? diffEntity(before.POSTransaction, after.POSTransaction, FIELDS_TO_DIFF.POSTransaction) : null;
  const btDiff = before && after ? diffEntity(before.POSBatch, after.POSBatch, FIELDS_TO_DIFF.POSBatch) : null;

  return (
    <div style={{ padding: "28px 20px", background: "#07090d", minHeight: "100vh", color: "#fff", fontFamily: "monospace" }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/NUPSOwner" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>← Back to Owner Analytics</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 4px" }}>
          NUPS <span style={{ color: "#60a5fa" }}>State Diff</span>
        </h1>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
          Snapshot before → run your tests → snapshot after. See exactly which transactions and batches changed.
        </p>
      </div>

      {/* One-Click Seed Switch */}
      <div style={{ marginBottom: 24 }}>
        <OneClickSeedSwitch />
      </div>

      {/* Snapshot controls */}
      <div style={{ background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Workflow</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <SnapshotButton step={1} label="Capture BEFORE" filled={!!before} onClick={grabBefore} disabled={busy} color="#60a5fa" />
          <Arrow />
          <SnapshotButton step={2} label="Run Your Tests" filled={!!before && !after} pulse={!!before && !after} disabled />
          <Arrow />
          <SnapshotButton step={3} label="Capture AFTER" filled={!!after} onClick={grabAfter} disabled={busy || !before} color="#22c55e" />
          {(before || after) && (
            <button onClick={reset} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #1e2535", color: "#64748b", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}>Reset</button>
          )}
        </div>
        {before && (
          <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8" }}>
            BEFORE captured at {new Date(before.capturedAt).toLocaleTimeString()} — {Object.keys(before.POSTransaction).length} transactions, {Object.keys(before.POSBatch).length} batches.
          </div>
        )}
        {after && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            AFTER captured at {new Date(after.capturedAt).toLocaleTimeString()} — {Object.keys(after.POSTransaction).length} transactions, {Object.keys(after.POSBatch).length} batches.
          </div>
        )}
        {error && <div style={{ marginTop: 10, color: "#f87171", fontSize: 11 }}>❌ {error}</div>}
      </div>

      {/* Diff Results */}
      {txDiff && btDiff && (
        <>
          <DiffSection title="POSTransaction" diff={txDiff} fields={FIELDS_TO_DIFF.POSTransaction} />
          <div style={{ height: 16 }} />
          <DiffSection title="POSBatch" diff={btDiff} fields={FIELDS_TO_DIFF.POSBatch} />
        </>
      )}

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 9, color: "#1a1f2e" }}>
        BPAAA v3.0 · DEMO_VENUE_001 · State Diff v1
      </div>
    </div>
  );
}

function SnapshotButton({ step, label, filled, onClick, disabled, color = "#60a5fa", pulse }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: filled ? color : "transparent",
        color: filled ? "#000" : disabled ? "#334155" : color,
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: "12px 18px",
        fontWeight: 700,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "monospace",
        opacity: disabled && !filled ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: 8,
        animation: pulse ? "pulseGlow 1.5s ease-in-out infinite" : "none",
      }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: filled ? "#000" : "transparent", border: `1px solid ${filled ? "#000" : color}`, color: filled ? color : "inherit", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{step}</span>
      {label}
      <style>{`@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 rgba(96,165,250,0); } 50% { box-shadow: 0 0 20px rgba(96,165,250,0.4); } }`}</style>
    </button>
  );
}

function Arrow() {
  return <span style={{ color: "#1e2535", fontSize: 18 }}>→</span>;
}

function DiffSection({ title, diff, fields }) {
  const netDelta = diff.afterCount - diff.beforeCount;
  return (
    <div style={{ background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: 3, textTransform: "uppercase" }}>Entity</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill label={`+${diff.added.length} added`}    color="#22c55e" />
          <Pill label={`-${diff.removed.length} removed`} color="#f87171" />
          <Pill label={`~${diff.modified.length} modified`} color="#f59e0b" />
          <Pill label={`Net ${netDelta >= 0 ? "+" : ""}${netDelta}`} color="#a78bfa" />
        </div>
      </div>

      {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 12, padding: 12, textAlign: "center", background: "#04060a", borderRadius: 6 }}>
          No changes detected for {title}.
        </div>
      ) : (
        <>
          {diff.added.length > 0 && <RecordGroup label="ADDED" color="#22c55e" records={diff.added} fields={fields} />}
          {diff.removed.length > 0 && <RecordGroup label="REMOVED" color="#f87171" records={diff.removed} fields={fields} />}
          {diff.modified.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Modified ({diff.modified.length})</div>
              {diff.modified.map((m) => (
                <div key={m.id} style={{ background: "#04060a", border: "1px solid #422006", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 6 }}>ID: <span style={{ color: "#94a3b8" }}>{m.id}</span></div>
                  {m.changes.map((c, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 10, fontSize: 11, padding: "4px 0", borderTop: i > 0 ? "1px solid #1e2535" : "none" }}>
                      <span style={{ color: "#94a3b8", fontWeight: 700 }}>{c.field}</span>
                      <span style={{ color: "#f87171", wordBreak: "break-all" }}>{JSON.stringify(c.before)}</span>
                      <span style={{ color: "#22c55e", wordBreak: "break-all" }}>{JSON.stringify(c.after)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecordGroup({ label, color, records, fields }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{label} ({records.length})</div>
      {records.map((r) => (
        <div key={r.id} style={{ background: "#04060a", border: `1px solid ${color}33`, borderRadius: 6, padding: 10, marginBottom: 6, fontSize: 11 }}>
          <div style={{ color, marginBottom: 4 }}>ID: <span style={{ color: "#94a3b8" }}>{r.id}</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>
            {fields.map(f => (
              <div key={f}>
                <span style={{ color: "#475569" }}>{f}: </span>
                <span style={{ color: "#cbd5e1" }}>
                  {typeof r[f] === "object" ? JSON.stringify(r[f]) : String(r[f] ?? "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{ fontSize: 10, color, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 999, padding: "4px 10px", fontWeight: 700 }}>
      {label}
    </span>
  );
}