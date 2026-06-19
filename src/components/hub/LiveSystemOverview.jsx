import React from "react";
import { Card } from "@/components/ui/card";

function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const Stat = ({ label, value, delta, color = "emerald" }) => (
  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
    <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-lg font-black text-white mt-1">{value}</div>
    {delta != null && (
      <div className={`text-[10px] mt-1 ${color === "emerald" ? "text-emerald-400" : "text-rose-400"}`}>
        {delta > 0 ? "+" : ""}{delta}% vs last hour
      </div>
    )}
  </div>
);

export default function LiveSystemOverview({
  guests = 0,
  totalSales = 0,
  vipOccupancy = 0,
  activeTables = "0 / 0",
  avgCheck = 0,
  complianceScore = 0,
  alerts = {},
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live System Overview
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">All Venues · Live</div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Guests in Venues" value={guests.toLocaleString()} delta={12.4} />
          <Stat label="Total Sales" value={fmtMoney(totalSales)} delta={18.7} />
          <Stat label="VIP Occupancy" value={`${vipOccupancy}%`} delta={6.3} />
          <Stat label="Active Tables" value={activeTables} />
          <Stat label="Avg Check" value={fmtMoney(avgCheck)} delta={8.1} />
          <Stat label="Compliance Score" value={complianceScore.toFixed(1)} />
        </div>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Alerts & Approvals</div>
        </div>
        <div className="space-y-2 text-sm">
          {[
            { label: "Manager Approvals", count: alerts.managerApprovals || 0, color: "violet" },
            { label: "Discounts Pending", count: alerts.discountsPending || 0, color: "amber" },
            { label: "Comps Pending",     count: alerts.compsPending     || 0, color: "cyan" },
            { label: "Security Alerts",   count: alerts.security         || 0, color: "rose" },
            { label: "Compliance Alerts", count: alerts.compliance       || 0, color: "emerald" },
          ].map((a) => (
            <div key={a.label} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
              <span className="text-slate-300">{a.label}</span>
              <span className={`text-${a.color}-300 font-bold text-sm`}>{a.count}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
          VIEW ALL →
        </button>
      </Card>
    </div>
  );
}