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
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 border border-white/[0.08] ${t.glow}`}>
      {/* gradient halo */}
      <div className={`pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${t.ring} blur-2xl opacity-70`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">{label}</div>
            <div className="text-3xl font-black text-white mt-2 tracking-tight font-mono">{value}</div>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${t.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {delta != null && (
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-1.5 py-0.5">
              <TrendingUp className="w-3 h-3" /> +{delta}%
            </span>
            <span className="text-[10px] text-slate-500">vs yesterday</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TodaysSummary({ grossSales = 0, netRevenue = 0, transactions = 0, cashPct = 0 }) {
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Gross Sales"  value={fmtMoney(grossSales)}  delta={18.7} Icon={DollarSign} tone="emerald" />
        <KPI label="Net Revenue"  value={fmtMoney(netRevenue)}  delta={16.3} Icon={Banknote}   tone="violet" />
        <KPI label="Transactions" value={fmtNum(transactions)}  delta={14.4} Icon={Receipt}    tone="cyan" />
        <KPI label="Cash %"       value={`${cashPct}%`}         delta={4.2}  Icon={CreditCard} tone="amber" />
      </div>
    </div>
  );
}