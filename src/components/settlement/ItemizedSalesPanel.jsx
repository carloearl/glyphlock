import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListOrdered } from "lucide-react";
import { usd } from "@/lib/accounting/settlementBreakdown";

/**
 * Itemized inventory sold — every drink / bottle / product line for the day.
 * The full catalogue is listed, so items with no movement show as n/a rather
 * than disappearing from the report.
 */
export default function ItemizedSalesPanel({ items = [] }) {
  const [showUnsold, setShowUnsold] = useState(false);

  const sold = items.filter((i) => i.quantity > 0);
  const unsold = items.filter((i) => i.quantity === 0);
  const visible = showUnsold ? [...sold, ...unsold] : sold;

  const unitsSold = sold.reduce((s, i) => s + i.quantity, 0);
  const grossSold = sold.reduce((s, i) => s + i.gross, 0);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-amber-300" /> Itemized Inventory Sold
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 border-slate-700 text-slate-300 text-[10px]">
            {unitsSold} units · {usd(grossSold)}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUnsold((v) => !v)}
            className="border-slate-700 text-slate-300 h-7 text-[11px]"
          >
            {showUnsold ? "Hide" : `Show`} unsold ({unsold.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No items rung up for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wide text-[10px]">
                  <th className="text-left py-2 pr-3">Item</th>
                  <th className="text-left py-2 pr-3">Station</th>
                  <th className="text-right py-2 pr-3">Qty</th>
                  <th className="text-right py-2 pr-3">Gross</th>
                  <th className="text-right py-2">Avg</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.key} className={`border-t border-slate-800 ${i.quantity === 0 ? "text-slate-600" : "text-slate-200"}`}>
                    <td className="py-2 pr-3">
                      {i.name}
                      {i.category && <span className="text-slate-500"> · {i.category}</span>}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">{i.stations.join(", ") || "—"}</td>
                    <td className="py-2 pr-3 text-right font-mono">{i.quantity || "n/a"}</td>
                    <td className="py-2 pr-3 text-right font-mono">{i.quantity ? usd(i.gross) : "n/a"}</td>
                    <td className="py-2 text-right font-mono text-slate-400">
                      {i.quantity ? usd(i.gross / i.quantity) : "n/a"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}