import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * DailyPerformanceReport
 *
 * One-page automated summary that pulls DailySettlement + POSBatch + POSZReport
 * + PayrollRecord + TipPayout, joined by date, into a clean daily performance log.
 *
 * Read-only. No mutations. Pure aggregation.
 */

const fmt$ = (n) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dayKey = (iso) => (iso ? String(iso).slice(0, 10) : "—");

async function loadAll() {
  const [settlements, batches, zReports, payroll, tips] = await Promise.all([
    base44.entities.DailySettlement.list("-settlement_date", 200).catch(() => []),
    base44.entities.POSBatch.list("-start_time", 500).catch(() => []),
    base44.entities.POSZReport.list("-report_date", 200).catch(() => []),
    base44.entities.PayrollRecord.list("-pay_period_end", 500).catch(() => []),
    base44.entities.TipPayout.list("-payout_date", 200).catch(() => []),
  ]);
  return { settlements, batches, zReports, payroll, tips };
}

function groupByDay({ settlements, batches, zReports, payroll, tips }) {
  const days = {};
  const ensure = (d) => {
    if (!days[d]) {
      days[d] = {
        date: d,
        settlement: null,
        batches: [],
        zReports: [],
        payroll: [],
        tips: [],
      };
    }
    return days[d];
  };

  for (const s of settlements) ensure(dayKey(s.settlement_date)).settlement = s;
  for (const b of batches) ensure(dayKey(b.start_time || b.created_date)).batches.push(b);
  for (const z of zReports) ensure(dayKey(z.report_date || z.created_date)).zReports.push(z);
  for (const p of payroll) ensure(dayKey(p.pay_period_end)).payroll.push(p);
  for (const t of tips) ensure(dayKey(t.payout_date)).tips.push(t);

  return Object.values(days)
    .filter((d) => d.date !== "—")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function rollupDay(day) {
  const batchSales = day.batches.reduce((s, b) => s + (Number(b.total_sales) || 0), 0);
  const batchTxnCount = day.batches.reduce((s, b) => s + (Number(b.transaction_count) || 0), 0);
  const batchOpening = day.batches.reduce((s, b) => s + (Number(b.opening_cash) || 0), 0);
  const batchClosing = day.batches.reduce((s, b) => s + (Number(b.closing_cash) || 0), 0);
  const batchDiscrepancy = day.batches.reduce((s, b) => s + (Number(b.discrepancy) || 0), 0);

  const zCash = day.zReports.reduce((s, z) => s + (Number(z.cash_sales) || 0), 0);
  const zCard = day.zReports.reduce((s, z) => s + (Number(z.card_sales) || 0), 0);
  const zTotal = day.zReports.reduce((s, z) => s + (Number(z.total_sales) || 0), 0);

  const payrollGross = day.payroll.reduce((s, p) => s + (Number(p.gross_total) || 0), 0);
  const payrollNet = day.payroll.reduce((s, p) => s + (Number(p.net_payout) || 0), 0);

  const tipTotal = day.tips.reduce((s, t) => s + (Number(t.total_tips) || 0), 0);

  const s = day.settlement || {};
  return {
    grossRevenue: Number(s.total_gross_revenue) || zTotal || batchSales,
    processingFees: Number(s.total_processing_fees) || 0,
    houseCommission: Number(s.total_house_commission) || 0,
    netPayouts: Number(s.total_net_payouts) || payrollNet,
    venueNetIncome: Number(s.venue_net_income) || 0,
    reconciliationStatus: s.reconciliation_status || (day.batches.length ? "pending" : "no_data"),
    batchSales,
    batchTxnCount,
    batchOpening,
    batchClosing,
    batchDiscrepancy,
    zCash,
    zCard,
    zTotal,
    payrollGross,
    payrollNet,
    tipTotal,
    entertainerCount: (s.entertainer_payouts || []).length || day.payroll.length,
  };
}

export default function DailyPerformanceReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ settlements: [], batches: [], zReports: [], payroll: [], tips: [] });
  const [openDay, setOpenDay] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await loadAll()); }
    catch (e) { setError(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const days = useMemo(() => groupByDay(data), [data]);

  // Totals across all loaded days
  const totals = useMemo(() => {
    let gross = 0, fees = 0, comm = 0, net = 0, venueNet = 0, txns = 0, tips = 0;
    for (const d of days) {
      const r = rollupDay(d);
      gross += r.grossRevenue;
      fees += r.processingFees;
      comm += r.houseCommission;
      net += r.netPayouts;
      venueNet += r.venueNetIncome;
      txns += r.batchTxnCount;
      tips += r.tipTotal;
    }
    return { gross, fees, comm, net, venueNet, txns, tips, dayCount: days.length };
  }, [days]);

  return (
    <div style={{ padding: "28px 20px", background: "#07090d", minHeight: "100vh", color: "#fff", fontFamily: "monospace" }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/NUPSOwner" style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none" }}>← Back to Owner Analytics</Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>
              Daily <span style={{ color: "#22c55e" }}>Performance Report</span>
            </h1>
            <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
              Automated rollup · DailySettlement · POSBatch · POSZReport · Payroll · Tips
            </p>
          </div>
          <button onClick={load} disabled={loading}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: 6, padding: "8px 14px", cursor: loading ? "wait" : "pointer", fontSize: 11, fontFamily: "monospace" }}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Period totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
        <Kpi label="Days Reported" value={totals.dayCount} accent="#a78bfa" raw />
        <Kpi label="Gross Revenue" value={fmt$(totals.gross)} accent="#22c55e" />
        <Kpi label="Processing Fees" value={fmt$(totals.fees)} accent="#f59e0b" />
        <Kpi label="House Commission" value={fmt$(totals.comm)} accent="#60a5fa" />
        <Kpi label="Net Payouts" value={fmt$(totals.net)} accent="#f87171" />
        <Kpi label="Venue Net Income" value={fmt$(totals.venueNet)} accent="#10b981" />
        <Kpi label="Transactions" value={totals.txns} accent="#94a3b8" raw />
        <Kpi label="Tips Distributed" value={fmt$(totals.tips)} accent="#ec4899" />
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: "#1f0707", border: "1px solid #7f1d1d", borderRadius: 6, color: "#f87171", fontSize: 12 }}>
          ❌ {error}
        </div>
      )}

      {loading && days.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 12, padding: 30, textAlign: "center" }}>Loading daily performance data…</div>
      ) : days.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 13, padding: 40, textAlign: "center", background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 8 }}>
          No settlement, batch, or Z-Report data found yet.
        </div>
      ) : (
        <div style={{ background: "#0d0f14", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr 110px 40px", gap: 8, padding: "10px 14px", background: "#04060a", borderBottom: "1px solid #1e2535", fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 2 }}>
            <div>Date</div>
            <div>Gross</div>
            <div>Cash / Card</div>
            <div>Txns</div>
            <div>Tips</div>
            <div>Net Payouts</div>
            <div>Status</div>
            <div></div>
          </div>

          {days.map((day) => {
            const r = rollupDay(day);
            const isOpen = openDay === day.date;
            return (
              <div key={day.date} style={{ borderBottom: "1px solid #0f1117" }}>
                <button
                  onClick={() => setOpenDay(isOpen ? null : day.date)}
                  style={{
                    width: "100%", background: isOpen ? "#0a1018" : "transparent",
                    border: "none", color: "#fff", padding: "12px 14px",
                    display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr 110px 40px", gap: 8,
                    alignItems: "center", cursor: "pointer", fontFamily: "monospace", fontSize: 12, textAlign: "left",
                  }}>
                  <span style={{ color: "#cbd5e1" }}>{day.date}</span>
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt$(r.grossRevenue)}</span>
                  <span style={{ color: "#94a3b8" }}>{fmt$(r.zCash)} / {fmt$(r.zCard)}</span>
                  <span style={{ color: "#94a3b8" }}>{r.batchTxnCount}</span>
                  <span style={{ color: "#ec4899" }}>{fmt$(r.tipTotal)}</span>
                  <span style={{ color: "#f87171" }}>{fmt$(r.netPayouts)}</span>
                  <StatusPill status={r.reconciliationStatus} />
                  <span style={{ color: "#475569", textAlign: "right" }}>{isOpen ? "▾" : "▸"}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: "0 14px 16px", background: "#04060a" }}>
                    <Section title="Settlement">
                      {day.settlement ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                          <Cell label="Gross Revenue" value={fmt$(day.settlement.total_gross_revenue)} />
                          <Cell label="Processing Fees" value={fmt$(day.settlement.total_processing_fees)} />
                          <Cell label="House Commission" value={fmt$(day.settlement.total_house_commission)} />
                          <Cell label="Net Payouts" value={fmt$(day.settlement.total_net_payouts)} />
                          <Cell label="Venue Net" value={fmt$(day.settlement.venue_net_income)} />
                          <Cell label="Approved By" value={day.settlement.approved_by || "—"} />
                        </div>
                      ) : <Empty>No DailySettlement record for this day.</Empty>}
                    </Section>

                    <Section title={`POS Batches (${day.batches.length})`}>
                      {day.batches.length ? (
                        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ color: "#475569", textAlign: "left" }}>
                              <th style={th}>Batch</th><th style={th}>Cashier</th><th style={th}>Status</th>
                              <th style={th}>Open</th><th style={th}>Close</th><th style={th}>Sales</th>
                              <th style={th}>Txns</th><th style={th}>Discrepancy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.batches.map((b) => (
                              <tr key={b.id} style={{ borderTop: "1px solid #0f1117" }}>
                                <td style={td}>{b.batch_id || b.id?.slice(0, 10)}</td>
                                <td style={td}>{b.cashier || "—"}</td>
                                <td style={td}><StatusPill status={b.status} small /></td>
                                <td style={td}>{fmt$(b.opening_cash)}</td>
                                <td style={td}>{fmt$(b.closing_cash)}</td>
                                <td style={{ ...td, color: "#22c55e" }}>{fmt$(b.total_sales)}</td>
                                <td style={td}>{b.transaction_count || 0}</td>
                                <td style={{ ...td, color: Math.abs(Number(b.discrepancy) || 0) > 0.01 ? "#f87171" : "#94a3b8" }}>
                                  {fmt$(b.discrepancy)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <Empty>No POSBatch records for this day.</Empty>}
                    </Section>

                    {day.zReports.length > 0 && (
                      <Section title={`Z-Reports (${day.zReports.length})`}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                          <Cell label="Cash Sales" value={fmt$(r.zCash)} />
                          <Cell label="Card Sales" value={fmt$(r.zCard)} />
                          <Cell label="Total Sales" value={fmt$(r.zTotal)} />
                        </div>
                      </Section>
                    )}

                    {day.payroll.length > 0 && (
                      <Section title={`Entertainer Payroll (${day.payroll.length})`}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                          {day.payroll.map((p) => (
                            <div key={p.id} style={{ background: "#0a0f1a", border: "1px solid #1e2535", borderRadius: 6, padding: 10 }}>
                              <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 700 }}>{p.stage_name || p.legal_name}</div>
                              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                                Gross {fmt$(p.gross_total)} → Net <span style={{ color: "#22c55e" }}>{fmt$(p.net_payout)}</span>
                              </div>
                              <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{p.vip_sessions || 0} VIP · {p.shift_hours || 0}h</div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {day.tips.length > 0 && (
                      <Section title="Tip Payouts">
                        {day.tips.map((t) => (
                          <div key={t.id} style={{ background: "#0a0f1a", border: "1px solid #1e2535", borderRadius: 6, padding: 10, marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: "#ec4899", fontWeight: 700 }}>{fmt$(t.total_tips)} total · {t.status}</div>
                            {(t.signatures || []).length > 0 && (
                              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                                {t.signatures.map((s, i) => (
                                  <span key={i} style={{ marginRight: 10 }}>
                                    {s.employee_name} ({s.pool}): {fmt$(s.amount)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </Section>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 9, color: "#1a1f2e" }}>
        BPAAA v3.0 · Daily Performance Report v1 · Read-only aggregation
      </div>
    </div>
  );
}

const th = { padding: "6px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 };
const td = { padding: "6px 8px", color: "#cbd5e1" };

function Kpi({ label, value, accent, raw }) {
  return (
    <div style={{ background: "#0d0f14", border: `1px solid ${accent}33`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
      <div style={{ fontSize: raw ? 22 : 16, fontWeight: 800, color: accent, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function Cell({ label, value }) {
  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e2535", borderRadius: 6, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: 11, color: "#475569", padding: "10px 12px", background: "#0a0f1a", border: "1px dashed #1e2535", borderRadius: 6 }}>{children}</div>;
}

function StatusPill({ status, small }) {
  const colors = {
    approved:  { bg: "#052e16", bd: "#14532d", fg: "#22c55e" },
    finalized: { bg: "#052e16", bd: "#14532d", fg: "#22c55e" },
    closed:    { bg: "#052e16", bd: "#14532d", fg: "#22c55e" },
    open:      { bg: "#172554", bd: "#1e3a8a", fg: "#60a5fa" },
    pending:   { bg: "#1c1500", bd: "#78350f", fg: "#f59e0b" },
    disputed:  { bg: "#1f0707", bd: "#7f1d1d", fg: "#f87171" },
    no_data:   { bg: "#0a0a0a", bd: "#1e2535", fg: "#475569" },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      fontSize: small ? 9 : 10, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`,
      borderRadius: 4, padding: small ? "1px 6px" : "2px 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
      display: "inline-block",
    }}>{status || "—"}</span>
  );
}