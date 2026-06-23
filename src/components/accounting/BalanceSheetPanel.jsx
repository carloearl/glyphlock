import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { balanceSheet } from "@/lib/accounting/financialReports";
import { formatCents } from "@/lib/accounting/money";

export default function BalanceSheetPanel({ venue_id, mode = "REAL", asOf }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venue_id) return;
    setLoading(true);
    balanceSheet({ venue_id, mode, asOf })
      .then(setData)
      .finally(() => setLoading(false));
  }, [venue_id, mode, asOf]);

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

  return (
    <Card className={data.balanced ? "bg-gray-950/50 border-gray-800" : "bg-red-950/30 border-red-500/40"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Scale className="w-4 h-4 text-cyan-400" />
          Balance Sheet
          {data.balanced ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Section title="Assets" rows={data.assets} color="text-cyan-400" />
        <div className="flex justify-between text-xs font-bold border-t border-gray-800 pt-1">
          <span className="text-gray-300">Total Assets</span>
          <span className="font-mono text-cyan-300">{formatCents(data.total_assets_cents)}</span>
        </div>

        <Section title="Liabilities" rows={data.liabilities} color="text-amber-400" />
        <div className="flex justify-between text-xs font-bold border-t border-gray-800 pt-1">
          <span className="text-gray-300">Total Liabilities</span>
          <span className="font-mono text-amber-300">{formatCents(data.total_liabilities_cents)}</span>
        </div>

        <Section title="Equity" rows={data.equity} color="text-purple-400" />
        <div className="flex justify-between text-xs py-0.5">
          <span className="text-gray-500 italic">Retained earnings (period)</span>
          <span className="font-mono text-purple-300">{formatCents(data.retained_earnings_cents)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold border-t border-gray-800 pt-1">
          <span className="text-gray-300">Total Equity</span>
          <span className="font-mono text-purple-300">{formatCents(data.total_equity_cents)}</span>
        </div>

        <div className={`flex justify-between items-baseline text-sm font-black border-t-2 ${data.balanced ? "border-green-500/50" : "border-red-500/50"} pt-2 mt-2`}>
          <span className="text-white">A = L + E</span>
          <span className={`font-mono ${data.balanced ? "text-green-300" : "text-red-300"}`}>
            {data.balanced ? "✓ BALANCED" : "✗ OUT OF BALANCE"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}