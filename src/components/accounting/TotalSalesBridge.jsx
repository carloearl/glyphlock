import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { totalSalesBridge } from "@/lib/accounting/financialReports";
import { formatCents } from "@/lib/accounting/money";

/**
 * Proves invariant I-5:
 *   total_sales = cash_sales + card_sales (POSTransaction roll-up)
 *               = ledger revenue (4000-4500) EXCLUDING GB and tips
 */
export default function TotalSalesBridge({ venue_id, mode = "REAL", from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venue_id) return;
    setLoading(true);
    totalSalesBridge({ venue_id, mode, from, to })
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

  return (
    <Card className={data.matches ? "bg-green-950/20 border-green-500/30" : "bg-red-950/30 border-red-500/40"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          total_sales Bridge (I-5 proof)
          {data.matches ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">POS Transactions · cash_sales</span>
          <span className="font-mono text-white">{formatCents(data.pos_cash_cents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">POS Transactions · card_sales</span>
          <span className="font-mono text-white">{formatCents(data.pos_card_cents)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-800 pt-1">
          <span className="text-gray-300">total_sales (cash + card)</span>
          <span className="font-mono text-cyan-300">{formatCents(data.pos_total_sales_cents)}</span>
        </div>

        <div className="border-t border-gray-800 pt-3 space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ledger Revenue (4000–4500)</div>
          <div className="text-[10px] text-gray-600">Excludes GlyphBucks (liab) · Excludes tips (liab)</div>
          <div className="flex justify-between font-bold">
            <span className="text-gray-300">Ledger revenue total</span>
            <span className="font-mono text-emerald-300">{formatCents(data.ledger_revenue_cents)}</span>
          </div>
        </div>

        <div className={`flex justify-between items-baseline text-sm font-black border-t-2 ${data.matches ? "border-green-500/50" : "border-red-500/50"} pt-2 mt-2`}>
          <span className="text-white">Variance</span>
          <span className={`font-mono ${data.matches ? "text-green-300" : "text-red-300"}`}>
            {data.matches ? "$0.00 ✓" : formatCents(data.variance_cents, { withSign: true })}
          </span>
        </div>

        <div className="text-[10px] text-gray-600 text-right">
          {data.entry_count} entries · {data.transaction_count} transactions
        </div>
      </CardContent>
    </Card>
  );
}