import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { profitAndLoss } from "@/lib/accounting/financialReports";
import { formatCents } from "@/lib/accounting/money";

export default function PnLPanel({ venue_id, mode = "REAL", from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venue_id) return;
    setLoading(true);
    profitAndLoss({ venue_id, mode, from, to })
      .then(setData)
      .finally(() => setLoading(false));
  }, [venue_id, mode, from, to]);

  if (loading || !data) {
    return (
      <Card className="bg-gray-950/50 border-gray-800">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const Section = ({ title, rows, color }) => (
    <div className="space-y-1">
      <div className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{title}</div>
      {rows.length === 0 && <div className="text-xs text-gray-600 italic">— none —</div>}
      {rows.map((r) => (
        <div key={r.code} className="flex justify-between text-xs py-0.5">
          <span className="text-gray-400">
            <span className="font-mono text-gray-600 mr-2">{r.code}</span>
            {r.name}
          </span>
          <span className="font-mono text-white">{formatCents(r.balance_cents)}</span>
        </div>
      ))}
    </div>
  );

  const isProfit = data.net_income_cents >= 0;

  return (
    <Card className="bg-gray-950/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          {isProfit ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
          Profit & Loss
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Section title="Revenue" rows={data.revenue} color="text-green-400" />
        <div className="flex justify-between text-xs font-bold border-t border-gray-800 pt-1">
          <span className="text-gray-300">Total Revenue</span>
          <span className="font-mono text-green-300">{formatCents(data.total_revenue_cents)}</span>
        </div>

        {data.cogs.length > 0 && (
          <>
            <Section title="Cost of Goods Sold" rows={data.cogs} color="text-rose-400" />
            <div className="flex justify-between text-xs font-bold border-t border-gray-800 pt-1">
              <span className="text-gray-300">Gross Profit</span>
              <span className="font-mono text-white">{formatCents(data.gross_profit_cents)}</span>
            </div>
          </>
        )}

        <Section title="Operating Expenses" rows={data.expense} color="text-red-400" />
        <div className="flex justify-between text-xs font-bold border-t border-gray-800 pt-1">
          <span className="text-gray-300">Total Expenses</span>
          <span className="font-mono text-red-300">{formatCents(data.total_expense_cents)}</span>
        </div>

        <div className={`flex justify-between items-baseline text-sm font-black border-t-2 ${isProfit ? "border-green-500/50" : "border-red-500/50"} pt-2 mt-2`}>
          <span className="text-white">NET INCOME</span>
          <span className={`font-mono ${isProfit ? "text-green-300" : "text-red-300"}`}>
            {formatCents(data.net_income_cents)}
          </span>
        </div>

        <div className="text-[10px] text-gray-600 text-right">{data.entry_count} entries</div>
      </CardContent>
    </Card>
  );
}