import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HandCoins, Scale } from "lucide-react";
import { usd } from "@/lib/accounting/settlementBreakdown";

/** Disbursement legs (driver / dancer / staff / tips) and the gross→net bridge. */
export default function PayoutsAndNetPanel({ breakdown }) {
  const { payouts, totals, fees, glyphbucks } = breakdown;

  const legs = [
    { label: "Driver payouts", value: payouts.driver, sub: `${payouts.driver_count} processed`, tone: "text-pink-300" },
    { label: "Dancer / entertainer payouts", value: payouts.dancer, sub: `${payouts.dancer_count} paid`, tone: "text-fuchsia-300" },
    { label: "Staff payroll", value: payouts.staff, sub: `${payouts.staff_count} paid`, tone: "text-blue-300" },
    { label: "Tip payouts", value: payouts.tips, sub: `${payouts.tips_count} completed`, tone: "text-cyan-300" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-pink-300" /> Payouts (money out of drawer)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {legs.map((l) => (
            <div key={l.label} className="flex items-center justify-between rounded border border-slate-800 bg-slate-800/40 px-3 py-2">
              <span className="text-xs text-slate-400">
                {l.label}
                <span className="block text-[10px] text-slate-600">{l.sub}</span>
              </span>
              <span className={`font-mono font-bold text-sm ${l.tone}`}>{usd(l.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded border border-pink-500/40 bg-pink-500/10 px-3 py-2">
            <span className="text-xs font-bold text-pink-200">Total disbursed</span>
            <span className="font-mono font-bold text-pink-200">{usd(payouts.total)}</span>
          </div>
          {payouts.driver_pending > 0 && (
            <p className="text-[10px] text-amber-400">
              {usd(payouts.driver_pending)} of driver credit still pending — not counted above.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-300" /> Gross → Net
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {[
            ["Gross rung (all stations)", usd(totals.gross_sales), "text-white"],
            ["Cash collected", usd(totals.cash_sales), "text-emerald-300"],
            ["Card collected", usd(totals.card_sales), "text-blue-300"],
            ["Total sales (cash + card)", usd(totals.total_sales), "text-purple-300"],
            ["Less total payouts", `− ${usd(payouts.total)}`, "text-pink-300"],
          ].map(([label, value, tone]) => (
            <div key={label} className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">{label}</span>
              <span className={`font-mono ${tone}`}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <span className="font-bold text-slate-200">Net after payouts</span>
            <span className={`font-mono font-black ${totals.net_after_payouts < 0 ? "text-red-400" : "text-emerald-300"}`}>
              {usd(totals.net_after_payouts)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="rounded bg-slate-800/40 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-500">Tax collected</div>
              <div className="font-mono text-slate-200">{usd(fees.tax)}</div>
            </div>
            <div className="rounded bg-slate-800/40 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-500">Processing + service fees</div>
              <div className="font-mono text-slate-200">{usd(fees.processing_fee + fees.service_fee)}</div>
            </div>
            <div className="rounded bg-slate-800/40 border border-slate-800 p-2">
              <div className="text-[10px] text-slate-500">Tips on tickets</div>
              <div className="font-mono text-slate-200">{usd(fees.tips)}</div>
            </div>
            <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2">
              <div className="text-[10px] text-amber-400">GlyphBucks issued (liability)</div>
              <div className="font-mono text-amber-200">
                {glyphbucks.issued_count} · {usd(glyphbucks.issued_face_value)}
              </div>
            </div>
          </div>
          {totals.comps > 0 && (
            <p className="text-[10px] text-amber-400/80 pt-1">Comped value {usd(totals.comps)} — accounting gap, never revenue.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}