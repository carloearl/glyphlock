import React from "react";
import { TrendingUp, TrendingDown, Banknote, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fmtUSD } from "@/lib/accounting/aggregateFinancials";

/**
 * AccountingSummaryCards — premium KPI tiles.
 * Oracle/Opera-grade: serif-tinged numerals, segmented sub-metrics, accent
 * gradient bars, micro-trend indicators. No flat boxes.
 */

const ACCENTS = {
  emerald: {
    ring:  "from-emerald-500/40 via-emerald-500/0 to-emerald-500/0",
    bar:   "from-emerald-400 via-emerald-500 to-teal-500",
    icon:  "text-emerald-300",
    chip:  "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    glow:  "shadow-[0_0_40px_-12px_rgba(16,185,129,0.6)]",
  },
  amber: {
    ring:  "from-amber-500/40 via-amber-500/0 to-amber-500/0",
    bar:   "from-amber-400 via-orange-500 to-rose-500",
    icon:  "text-amber-300",
    chip:  "bg-amber-500/10 text-amber-300 border-amber-500/30",
    glow:  "shadow-[0_0_40px_-12px_rgba(245,158,11,0.5)]",
  },
  blue: {
    ring:  "from-blue-500/40 via-blue-500/0 to-blue-500/0",
    bar:   "from-blue-400 via-indigo-500 to-violet-500",
    icon:  "text-blue-300",
    chip:  "bg-blue-500/10 text-blue-300 border-blue-500/30",
    glow:  "shadow-[0_0_40px_-12px_rgba(59,130,246,0.55)]",
  },
  red: {
    ring:  "from-red-500/40 via-red-500/0 to-red-500/0",
    bar:   "from-red-400 via-rose-500 to-pink-500",
    icon:  "text-red-300",
    chip:  "bg-red-500/10 text-red-300 border-red-500/30",
    glow:  "shadow-[0_0_40px_-12px_rgba(239,68,68,0.55)]",
  },
  violet: {
    ring:  "from-violet-500/40 via-violet-500/0 to-violet-500/0",
    bar:   "from-violet-400 via-purple-500 to-fuchsia-500",
    icon:  "text-violet-300",
    chip:  "bg-violet-500/10 text-violet-300 border-violet-500/30",
    glow:  "shadow-[0_0_40px_-12px_rgba(139,92,246,0.55)]",
  },
};

function KpiTile({ tile }) {
  const Icon = tile.icon;
  const a = ACCENTS[tile.color] || ACCENTS.blue;
  const Direction = tile.direction === "down" ? ArrowDownRight : ArrowUpRight;
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl ${a.glow} group transition-all hover:border-white/[0.12]`}>
      {/* corner ring */}
      <div className={`pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-radial ${a.ring} blur-2xl opacity-70`} />

      {/* left accent bar */}
      <div className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b ${a.bar}`} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
              {tile.label}
            </div>
            {tile.tag && (
              <div className={`mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-mono uppercase tracking-wider ${a.chip}`}>
                {tile.tag}
              </div>
            )}
          </div>
          <div className={`w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center ${a.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="font-black text-white tracking-tight tabular-nums" style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)", lineHeight: 1.05 }}>
          {tile.value}
        </div>

        {/* Segmented sub-metrics */}
        {tile.segments && tile.segments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.05]">
            {tile.segments.map((seg) => (
              <div key={seg.label}>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{seg.label}</div>
                <div className="text-sm font-bold text-slate-200 tabular-nums mt-0.5">{seg.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Direction indicator */}
        {tile.note && (
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
            <Direction className={`w-3 h-3 ${tile.direction === "down" ? "text-red-400" : "text-emerald-400"}`} />
            <span>{tile.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountingSummaryCards({ data }) {
  const netPositive = data.net_position >= 0;

  const tiles = [
    {
      label: "Gross Revenue",
      value: fmtUSD(data.revenue.gross_revenue),
      icon: TrendingUp,
      color: "emerald",
      tag: "Cash + Card",
      segments: [
        { label: "Cash",  value: fmtUSD(data.revenue.cash_sales) },
        { label: "Card",  value: fmtUSD(data.revenue.card_sales) },
      ],
      direction: "up",
      note: "Sum of settled cash + card",
    },
    {
      label: "Total Disbursements",
      value: fmtUSD(data.disbursements.total),
      icon: TrendingDown,
      color: "amber",
      tag: "Money Out",
      segments: [
        { label: "Drivers", value: fmtUSD(data.disbursements.driver) },
        { label: "Payroll", value: fmtUSD(data.disbursements.payroll) },
        { label: "Tips",    value: fmtUSD(data.disbursements.tips) },
        { label: "1099s",   value: fmtUSD(data.disbursements.contractor) },
      ],
      direction: "down",
      note: "Drawer + bank outflows",
    },
    {
      label: "Net Position",
      value: fmtUSD(data.net_position),
      icon: Banknote,
      color: netPositive ? "blue" : "red",
      tag: netPositive ? "Surplus" : "Deficit",
      segments: [
        { label: "Revenue",    value: fmtUSD(data.revenue.gross_revenue) },
        { label: "− Outflows", value: fmtUSD(data.disbursements.total) },
      ],
      direction: netPositive ? "up" : "down",
      note: netPositive ? "Revenue exceeds disbursements" : "Net outflow this period",
    },
    {
      label: "GB Liability",
      value: fmtUSD(data.glyphbucks.outstanding_face_value),
      icon: AlertCircle,
      color: "violet",
      tag: "Stored Value",
      segments: [
        { label: "Issued",   value: `${data.glyphbucks.issued_count}` },
        { label: "Redeemed", value: `${data.glyphbucks.redeemed_count}` },
      ],
      direction: "up",
      note: "Outstanding face value owed",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {tiles.map((tile) => (
        <KpiTile key={tile.label} tile={tile} />
      ))}
    </div>
  );
}