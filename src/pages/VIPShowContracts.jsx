import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import VIPShowReprint from "@/components/nups/vip/VIPShowReprint";
import { Crown, Search, Link2, FileCheck2, DollarSign, ShieldCheck, Printer, Loader2 } from "lucide-react";

import { printCurrentNupsView } from '@/lib/nups/receiptService';
/**
 * MANAGER DASHBOARD — VIP Show Contract search & reprint (GlyphLock styled).
 * Searchable by guest name, membership_id, verify_ref, contract_ref, with
 * date range and mode filter (REAL default — DEMO/SANDBOX never mix in).
 * Reprint renders the stored sealed record; hashes never regenerated.
 */

const GOLD = "#e8c86a";
const inp = "w-full rounded-xl bg-white/5 backdrop-blur border border-white/15 px-3 py-2.5 text-sm min-h-[44px] focus:border-indigo-400 focus:shadow-[0_0_20px_rgba(87,61,255,0.35)] outline-none transition-all";
const lbl = "block text-[11px] uppercase tracking-wider text-blue-300/70 mb-1 font-semibold";

const StatCard = ({ icon: Icon, label, value, tint }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(87,61,255,0.12)] to-[rgba(20,26,48,0.65)] backdrop-blur-xl px-4 py-3 shadow-[0_0_25px_rgba(87,61,255,0.18)] flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tint}22`, border: `1px solid ${tint}55` }}>
      <Icon className="w-5 h-5" style={{ color: tint }} />
    </div>
    <div className="min-w-0">
      <div className="text-lg font-extrabold text-white leading-tight truncate">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-blue-200/50 font-semibold">{label}</div>
    </div>
  </div>
);

export default function VIPShowContracts() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("REAL");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reprint, setReprint] = useState(null);

  const search = async () => {
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("vipShowContractSearch", { q, from: from || undefined, to: to || undefined, mode });
      setRows(res.data?.results || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { search(); /* initial load */ }, []);  

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
    const anchored = rows.filter((r) => r.anchor_status === "ANCHOR_SUBMITTED" || String(r.anchor_status || "").startsWith("BITCOIN")).length;
    return { count: rows.length, total, anchored };
  }, [rows]);

  if (reprint) {
    return (
      <div className="min-h-screen bg-neutral-200 p-6">
        <div className="mx-auto w-[800px] max-w-full flex gap-2 mb-4 print:hidden">
          <button onClick={() => printCurrentNupsView()} className="rounded-lg bg-[#152049] text-white font-bold px-5 py-2.5 flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
          <button onClick={() => setReprint(null)} className="rounded-lg border border-neutral-400 bg-white px-5 py-2.5 font-semibold text-neutral-800">Back to search</button>
        </div>
        <VIPShowReprint record={reprint.record} anchor={reprint.anchor} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1120] text-neutral-100 p-4 sm:p-6"
      style={{ background: "radial-gradient(ellipse at 20% -10%, rgba(87,61,255,0.18), transparent 55%), radial-gradient(ellipse at 90% 0%, rgba(232,200,106,0.08), transparent 50%), #0d1120" }}>
      <div className="mx-auto max-w-6xl space-y-4">

        {/* Hero header */}
        <div className="rounded-2xl border border-[#e8c86a]/25 bg-gradient-to-r from-[rgba(87,61,255,0.18)] via-[rgba(20,26,48,0.75)] to-[rgba(232,200,106,0.08)] backdrop-blur-xl px-5 py-4 shadow-[0_0_40px_rgba(87,61,255,0.25)]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(232,200,106,0.12)", border: "1px solid rgba(232,200,106,0.4)", boxShadow: "0 0 25px rgba(232,200,106,0.25)" }}>
              <Crown className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-xl font-extrabold tracking-wide text-white">VIP SHOW CONTRACTS</h1>
              <p className="text-xs text-blue-200/60">Sealed evidence vault · Ed25519 chain · Bitcoin anchored · reprints render the stored record — hashes never regenerated</p>
            </div>
            <span className={`text-[10px] font-extrabold tracking-widest rounded-full px-3 py-1 border ${mode === "REAL" ? "text-emerald-300 border-emerald-400/50 bg-emerald-500/10" : "text-amber-300 border-amber-400/50 bg-amber-500/10"}`}>
              {mode} LEDGER
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={FileCheck2} label="Sealed contracts" value={stats.count} tint="#7c8cff" />
          <StatCard icon={DollarSign} label="Total sealed value" value={`$${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} tint={GOLD} />
          <StatCard icon={ShieldCheck} label="Blockchain anchored" value={`${stats.anchored} / ${stats.count}`} tint="#34d399" />
        </div>

        {/* Search bar */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(87,61,255,0.10)] to-[rgba(20,26,48,0.65)] backdrop-blur-xl p-4 shadow-[0_0_30px_rgba(87,61,255,0.18)]">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex-1 min-w-[220px]">
              <span className={lbl}>Guest · Member ID · Ref</span>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/50" />
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="Search sealed records…" className={inp + " pl-9"} />
              </div>
            </label>
            <label><span className={lbl}>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inp} /></label>
            <label><span className={lbl}>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inp} /></label>
            <label><span className={lbl}>Mode</span>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={inp}>
                <option>REAL</option><option>DEMO</option><option>SANDBOX</option>
              </select>
            </label>
            <button onClick={search} disabled={busy}
              className="rounded-xl btn-glow-blue font-bold px-6 py-2.5 disabled:opacity-50 min-h-[44px] flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {busy ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-300 font-semibold">{error}</div>}

        {/* Results */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[rgba(20,26,48,0.55)] backdrop-blur-xl shadow-[0_0_30px_rgba(87,61,255,0.15)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-blue-200/60 uppercase tracking-widest" style={{ background: "linear-gradient(90deg, rgba(87,61,255,0.20), rgba(232,200,106,0.06))" }}>
                <th className="p-3 font-bold">Verify ref</th>
                <th className="p-3 font-bold">Guest</th>
                <th className="p-3 font-bold">Membership</th>
                <th className="p-3 font-bold">Suite</th>
                <th className="p-3 font-bold text-right">Total</th>
                <th className="p-3 font-bold">Executed</th>
                <th className="p-3 font-bold">Anchor</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-blue-200/40">
                  {busy ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                    <div className="space-y-1">
                      <Crown className="w-8 h-8 mx-auto opacity-30" />
                      <div className="font-semibold">No sealed contracts match</div>
                      <div className="text-xs">Adjust the search or date range</div>
                    </div>
                  )}
                </td></tr>
              )}
              {rows.map((r) => {
                const anchored = r.anchor_status === "ANCHOR_SUBMITTED" || String(r.anchor_status || "").startsWith("BITCOIN");
                return (
                  <tr key={r.verify_ref} className="border-t border-white/5 hover:bg-[rgba(87,61,255,0.10)] transition-colors">
                    <td className="p-3 font-mono text-xs">
                      <a href={r.reprint_url} className="text-indigo-300 hover:text-indigo-200 hover:underline flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 opacity-60" />{r.verify_ref}
                      </a>
                    </td>
                    <td className="p-3 font-semibold text-white">{r.guest}</td>
                    <td className="p-3 font-mono text-xs text-blue-200/70">{r.membership_id}</td>
                    <td className="p-3 text-blue-100/80">{r.suite}</td>
                    <td className="p-3 text-right font-extrabold" style={{ color: GOLD }}>${Number(r.total || 0).toFixed(2)}</td>
                    <td className="p-3 text-xs text-blue-200/60">{r.executed_at ? new Date(r.executed_at).toLocaleString() : "—"}</td>
                    <td className="p-3">
                      <span className={`text-[9px] font-extrabold tracking-wider rounded-full px-2 py-1 border ${anchored ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/10" : "text-amber-300 border-amber-400/40 bg-amber-500/10"}`}>
                        {anchored ? "⛓ ANCHORED" : r.anchor_status || "NONE"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => setReprint(r)}
                        className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 hover:border-[#e8c86a]/50 px-3 py-1.5 text-xs font-bold min-h-[36px] flex items-center gap-1.5 transition-all">
                        <Printer className="w-3 h-3" /> Reprint
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}