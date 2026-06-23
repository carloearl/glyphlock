import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { cashFlow } from "@/lib/accounting/financialReports";
import { formatCents } from "@/lib/accounting/money";

export default function CashFlowPanel({ venue_id, mode = "REAL", from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venue_id) return;
    setLoading(true);
    cashFlow({ venue_id, mode, from, to })
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
    <Card className="bg-gray-950/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Banknote className="w-4 h-4 text-emerald-400" />
          Cash Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {data.rows.map((r) => (
          <div key={r.code} className="space-y-1 border-b border-gray-900 pb-2 last:border-0">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-semibold">
                <span className="font-mono text-gray-600 mr-2">{r.code}</span>
                {r.name}
              </span>
              <span className={`font-mono font-bold ${r.net >= 0 ? "text-green-300" : "text-red-300"}`}>
                {formatCents(r.net, { withSign: r.net > 0 })}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><ArrowDownLeft className="w-2.5 h-2.5 text-green-500" /> In  {formatCents(r.in)}</span>
              <span className="flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5 text-red-500" /> Out {formatCents(r.out)}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-baseline text-sm font-black border-t-2 border-emerald-500/50 pt-2">
          <span className="text-white">Net Change</span>
          <span className={`font-mono ${data.net_change_cents >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {formatCents(data.net_change_cents, { withSign: data.net_change_cents !== 0 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}