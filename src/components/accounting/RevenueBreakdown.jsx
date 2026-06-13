import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CreditCard } from "lucide-react";
import { fmtUSD } from "@/lib/accounting/aggregateFinancials";

export default function RevenueBreakdown({ data, settlements = [] }) {
  const { cash_sales, card_sales, gross_revenue } = data.revenue;
  const cashPct = gross_revenue > 0 ? (cash_sales / gross_revenue) * 100 : 0;
  const cardPct = gross_revenue > 0 ? (card_sales / gross_revenue) * 100 : 0;

  return (
    <Card className="bg-gray-900/60 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Banknote className="w-4 h-4 text-emerald-400" />
          Revenue Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual split bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Cash
            </span>
            <span className="text-emerald-400 font-mono font-bold">
              {fmtUSD(cash_sales)} · {cashPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              style={{ width: `${cashPct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs mt-3">
            <span className="text-gray-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Card
            </span>
            <span className="text-blue-400 font-mono font-bold">
              {fmtUSD(card_sales)} · {cardPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              style={{ width: `${cardPct}%` }}
            />
          </div>
        </div>

        {/* Per-settlement ledger */}
        <div className="border-t border-gray-800 pt-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-bold">
            Daily Settlements ({settlements.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {settlements.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-3">No settlements in period</p>
            )}
            {settlements.map((s) => {
              const total = (Number(s.cash_sales) || 0) + (Number(s.card_sales) || 0);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-black/40 rounded px-3 py-2 text-xs"
                >
                  <div>
                    <div className="text-gray-300 font-mono">
                      {s.business_date || s.settlement_date}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {s.status} {s.locked_at ? "· locked" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">{fmtUSD(total)}</div>
                    <div className="text-[10px] text-gray-500">
                      {fmtUSD(s.cash_sales)} / {fmtUSD(s.card_sales)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}