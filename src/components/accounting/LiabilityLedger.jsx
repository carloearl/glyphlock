import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ArrowUpRight, ArrowDownRight, Lock } from "lucide-react";
import { fmtUSD, fmtPct } from "@/lib/accounting/aggregateFinancials";

export default function LiabilityLedger({ data }) {
  const { issued_face_value, redeemed_face_value, outstanding_face_value, redemption_rate, issued_count, redeemed_count } = data.glyphbucks;

  return (
    <Card className="bg-gray-900/60 border-violet-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Coins className="w-4 h-4 text-violet-400" />
          GlyphBucks Liability Ledger
        </CardTitle>
        <p className="text-[10px] text-gray-500 mt-1">
          Face value — never counted as revenue. Tracked as venue liability per BPAAA §6.2.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <ArrowUpRight className="w-3 h-3" /> Issued
            </div>
            <div className="text-lg font-black text-white mt-1">{fmtUSD(issued_face_value)}</div>
            <div className="text-[10px] text-gray-500">{issued_count} orders</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-blue-400 font-bold">
              <ArrowDownRight className="w-3 h-3" /> Redeemed
            </div>
            <div className="text-lg font-black text-white mt-1">{fmtUSD(redeemed_face_value)}</div>
            <div className="text-[10px] text-gray-500">{redeemed_count} bills</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              <Lock className="w-3 h-3" /> Outstanding
            </div>
            <div className="text-lg font-black text-white mt-1">{fmtUSD(outstanding_face_value)}</div>
            <div className="text-[10px] text-gray-500">venue liability</div>
          </div>
        </div>

        {/* Redemption rate bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Redemption Rate</span>
            <span className="font-mono font-bold text-violet-300">{fmtPct(redemption_rate)}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-blue-500"
              style={{ width: `${Math.min(100, redemption_rate * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-600 mt-1">
            Higher rate → less open liability. Target: &gt;70% within 90 days of issue.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}