import React from "react";
import { TrendingUp, TrendingDown, Banknote, AlertCircle } from "lucide-react";
import { fmtUSD } from "@/lib/accounting/aggregateFinancials";

export default function AccountingSummaryCards({ data }) {
  const netPositive = data.net_position >= 0;
  const cards = [
    {
      label: "Gross Revenue",
      value: fmtUSD(data.revenue.gross_revenue),
      sub: `${fmtUSD(data.revenue.cash_sales)} cash · ${fmtUSD(data.revenue.card_sales)} card`,
      icon: TrendingUp,
      color: "emerald",
    },
    {
      label: "Total Disbursements",
      value: fmtUSD(data.disbursements.total),
      sub: `${fmtUSD(data.disbursements.driver)} driver · ${fmtUSD(data.disbursements.payroll)} payroll`,
      icon: TrendingDown,
      color: "amber",
    },
    {
      label: "Net Position",
      value: fmtUSD(data.net_position),
      sub: netPositive ? "Revenue exceeds disbursements" : "Net outflow this period",
      icon: Banknote,
      color: netPositive ? "blue" : "red",
    },
    {
      label: "GB Liability Outstanding",
      value: fmtUSD(data.glyphbucks.outstanding_face_value),
      sub: `${data.glyphbucks.issued_count} issued · ${data.glyphbucks.redeemed_count} redeemed`,
      icon: AlertCircle,
      color: "violet",
    },
  ];

  const colorMap = {
    emerald: "border-emerald-500/40 text-emerald-400",
    amber: "border-amber-500/40 text-amber-400",
    blue: "border-blue-500/40 text-blue-400",
    red: "border-red-500/40 text-red-400",
    violet: "border-violet-500/40 text-violet-400",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`bg-gray-900/70 border rounded-2xl p-5 ${colorMap[c.color]} backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                {c.label}
              </span>
              <Icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-3xl font-black text-white tracking-tight">{c.value}</div>
            <div className="text-[11px] text-gray-500 mt-2 leading-snug">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}