import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, AlertCircle, DollarSign, Wallet, Banknote } from "lucide-react";

/**
 * DACO-20260614: Live Settlement Ticker for Front Door POS
 * Real-time cash + card totals + pending driver payout visibility.
 * Polling interval: 30 seconds.
 */

// Single source of truth for each metric tile. Keeps the JSX uniform so the
// row reads as a clean dashboard strip instead of five bespoke cards.
const TONES = {
  emerald: { ring: "border-emerald-500/25", glow: "from-emerald-500/10", label: "text-emerald-400/80", value: "text-emerald-200", sub: "text-emerald-500/70", icon: "text-emerald-400/60" },
  sky:     { ring: "border-sky-500/25",     glow: "from-sky-500/10",     label: "text-sky-400/80",     value: "text-sky-200",     sub: "text-sky-500/70",     icon: "text-sky-400/60" },
  violet:  { ring: "border-violet-500/25",  glow: "from-violet-500/10",  label: "text-violet-400/80",  value: "text-violet-200",  sub: "text-violet-500/70",  icon: "text-violet-400/60" },
  amber:   { ring: "border-amber-500/25",   glow: "from-amber-500/10",   label: "text-amber-400/80",   value: "text-amber-200",   sub: "text-amber-500/70",   icon: "text-amber-400/60" },
  rose:    { ring: "border-rose-500/30",    glow: "from-rose-500/10",    label: "text-rose-400/80",    value: "text-rose-200",    sub: "text-rose-500/80",    icon: "text-rose-400/60" },
  slate:   { ring: "border-slate-600/30",   glow: "from-slate-500/5",    label: "text-slate-400/80",   value: "text-slate-100",   sub: "text-slate-500",      icon: "text-slate-400/60" },
};

function MetricCard({ tone, label, value, sub, icon: Icon }) {
  const t = TONES[tone];
  return (
    <div className={`relative overflow-hidden rounded-xl border ${t.ring} bg-gradient-to-br ${t.glow} via-transparent to-transparent bg-black/40 backdrop-blur px-4 py-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${t.label}`}>
            {label}
          </div>
          <div className={`mt-1.5 text-2xl lg:text-[26px] font-black tabular-nums tracking-tight ${t.value} truncate`}>
            {value}
          </div>
          <div className={`mt-0.5 text-[11px] ${t.sub} truncate`}>
            {sub}
          </div>
        </div>
        <Icon className={`w-4 h-4 shrink-0 ${t.icon}`} />
      </div>
    </div>
  );
}

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function SettlementTicker({ venueId, businessDate }) {
  const today = businessDate || new Date().toISOString().split("T")[0];

  const { data: settlement, isLoading, isError } = useQuery({
    queryKey: ["settlement-live", venueId, today],
    queryFn: async () => {
      const response = await base44.functions.invoke("getLiveSettlementTotals", {
        venue_id: venueId,
        business_date: today,
      });
      return response.data;
    },
    refetchInterval: 30000,
    enabled: !!venueId,
  });

  // Drawer status drives both the tile tone and the label.
  const drawer = useMemo(() => {
    if (!settlement) return null;
    if (settlement.cash_shortage_flag) return { tone: "rose",    label: "Drawer Short" };
    if (settlement.net_drawer < 100)   return { tone: "amber",   label: "Low Cash" };
    return                                    { tone: "emerald", label: "Healthy" };
  }, [settlement]);

  if (isError) {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="text-sm text-rose-200">Settlement data unavailable</span>
      </div>
    );
  }

  if (isLoading || !settlement) {
    return (
      <div className="mb-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-xl border border-white/5 bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
      <MetricCard
        tone="emerald"
        label="Cash Sales"
        value={money(settlement.cash_sales)}
        sub={`${settlement.transaction_count || 0} transactions`}
        icon={Banknote}
      />
      <MetricCard
        tone="sky"
        label="Card Sales"
        value={money(settlement.card_sales)}
        sub="Processor batch"
        icon={TrendingUp}
      />
      <MetricCard
        tone="violet"
        label="Total Sales"
        value={money(settlement.total_sales)}
        sub="Cash + Card"
        icon={DollarSign}
      />
      <MetricCard
        tone="amber"
        label="Payout Owed"
        value={money(settlement.payout_owed)}
        sub={`${settlement.payout_count || 0} drivers pending`}
        icon={AlertCircle}
      />
      <MetricCard
        tone={drawer?.tone || "slate"}
        label="Drawer Balance"
        value={money(settlement.net_drawer)}
        sub={drawer?.label || "—"}
        icon={Wallet}
      />
    </div>
  );
}