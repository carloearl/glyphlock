import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US");
}

const KPI = ({ label, value, delta }) => (
  <Card className="bg-slate-900/60 border-slate-800 p-4">
    <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
    <div className="text-2xl font-black text-white mt-1">{value}</div>
    {delta != null && (
      <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> +{delta}%
      </div>
    )}
  </Card>
);

export default function TodaysSummary({ grossSales = 0, netRevenue = 0, transactions = 0, cashPct = 0 }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Today's Summary</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Gross Sales"  value={fmtMoney(grossSales)}  delta={18.7} />
        <KPI label="Net Revenue"  value={fmtMoney(netRevenue)}  delta={16.3} />
        <KPI label="Transactions" value={fmtNum(transactions)}  delta={14.4} />
        <KPI label="Cash %"       value={`${cashPct}%`}         delta={4.2} />
      </div>
    </div>
  );
}