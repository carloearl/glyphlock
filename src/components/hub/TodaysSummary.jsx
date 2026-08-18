import React from "react";
import { TrendingUp, DollarSign, CreditCard, Receipt, Banknote } from "lucide-react";

function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US");
}

// Premium KPI tile — gradient ring, icon plate, sparkline-style trend.
const KPI = ({ label, value, delta, Icon, tone = "emerald" }) => {
  const tones = {
    emerald: {
      ring: "from-emerald-500/40 via-emerald-500/10 to-transparent",
      iconBg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
      glow: "shadow-[0_0_40px_-12px_rgba(16,185,129,0.55)]",
    },
    violet: {
      ring: "from-violet-500/40 via-violet-500/10 to-transparent",
      iconBg: "bg-violet-500/15 border-violet-500/40 text-violet-300",
      glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.55)]",
    },
    cyan: {
      ring: "from-cyan-500/40 via-cyan-500/10 to-transparent",
      iconBg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
      glow: "shadow-[0_0_40px_-12px_rgba(6,182,212,0.55)]",
    },
    amber: {
      ring: "from-amber-500/40 via-amber-500/10 to-transparent",
      iconBg: "bg-amber-500/15 border-amber-500/40 text-amber-300",
      glow: "shadow-[0_0_40px_-12px_rgba(245,158,11,0.55)]",
    },
  };
  const t = tones[tone] || tones.emerald;
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-r from-slate-950 to-slate-900 ${t.glow}`}>
      <div className={`pointer-events-none absolute -right-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-gradient-to-br ${t.ring} blur-2xl opacity-60`} />
      <div className="relative flex min-h-[76px] items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${t.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
          {delta != null && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`inline-flex items-center gap-1 font-mono font-bold ${delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                <TrendingUp className={`h-3 w-3 ${delta < 0 ? "rotate-180" : ""}`} />
                {delta >= 0 ? "+" : ""}{delta}%
              </span>
              <span>vs yesterday</span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right font-mono text-2xl font-black tracking-tight text-white">{value}</div>
      </div>
    </div>
  );
};

// deltas: real computed vs-yesterday percentages, or null when there is no
// yesterday baseline. NEVER hardcode trend numbers — compliance requirement.
export default function TodaysSummary({ grossSales = 0, netRevenue = 0, transactions = 0, cashPct = 0, deltas = {} }) {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/80 font-mono font-bold">Today · Live</h3>
          <div className="text-2xl font-black text-white tracking-tight">Operational Summary</div>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="space-y-2">
        <KPI label="Gross Sales"  value={fmtMoney(grossSales)}  delta={deltas.gross ?? null} Icon={DollarSign} tone="emerald" />
        <KPI label="Net Revenue"  value={fmtMoney(netRevenue)}  delta={deltas.net ?? null}   Icon={Banknote}   tone="violet" />
        <KPI label="Transactions" value={fmtNum(transactions)}  delta={deltas.txns ?? null}  Icon={Receipt}    tone="cyan" />
        <KPI label="Cash %"       value={`${cashPct}%`}         delta={deltas.cash ?? null}  Icon={CreditCard} tone="amber" />
      </div>
    </div>
  );
}