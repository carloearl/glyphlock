import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, DollarSign, Award, TrendingDown } from "lucide-react";
import { fmtUSD } from "@/lib/accounting/aggregateFinancials";

export default function DisbursementsBreakdown({ data }) {
  const { driver, payroll, tips, contractor, total } = data.disbursements;
  const items = [
    { label: "Driver Payouts", amount: driver, icon: Car, color: "yellow" },
    { label: "Entertainer Payroll", amount: payroll, icon: Award, color: "pink" },
    { label: "Tip Pool", amount: tips, icon: Users, color: "blue" },
    { label: "Contractor / GB Redemption", amount: contractor, icon: DollarSign, color: "purple" },
  ];

  const colorMap = {
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };
  const iconMap = {
    yellow: "text-yellow-400",
    pink: "text-pink-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <TrendingDown className="w-4 h-4 text-amber-400" />
          Disbursements
          <span className="ml-auto text-amber-400 font-mono text-sm">{fmtUSD(total)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => {
          const Icon = it.icon;
          const pct = total > 0 ? (it.amount / total) * 100 : 0;
          return (
            <div key={it.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-300 flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${iconMap[it.color]}`} />
                  {it.label}
                </span>
                <span className="font-mono font-bold text-white">
                  {fmtUSD(it.amount)}
                  <span className="text-gray-500 font-normal ml-2">{pct.toFixed(1)}%</span>
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorMap[it.color]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Outstanding obligations */}
        <div className="border-t border-gray-800 pt-3 mt-3 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            Outstanding / Pending
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Driver pending</span>
            <span className="font-mono text-amber-300">{fmtUSD(data.outstanding.driver_pending)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Payroll pending</span>
            <span className="font-mono text-amber-300">{fmtUSD(data.outstanding.payroll_pending)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}