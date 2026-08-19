import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, Beer, Crown, Users } from "lucide-react";
import { usd } from "@/lib/accounting/settlementBreakdown";

const STATIONS = [
  { key: "door", label: "Front Door", icon: DoorOpen, tone: "text-cyan-300", border: "border-cyan-500/30" },
  { key: "bar", label: "Bar", icon: Beer, tone: "text-amber-300", border: "border-amber-500/30" },
  { key: "vip", label: "VIP", icon: Crown, tone: "text-fuchsia-300", border: "border-fuchsia-500/30" },
];

/** Per-station gross / cash / card / unit totals, plus door-vs-driver net. */
export default function StationTotalsPanel({ breakdown }) {
  const { stations, guests, payouts, totals } = breakdown;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-300" /> Door · Bar · VIP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
            <p className="text-[10px] uppercase tracking-wide text-cyan-400">Guests through door</p>
            <p className="text-2xl font-bold text-cyan-200">{guests}</p>
            <p className="text-[10px] text-slate-500">cover units rung at the door</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Door made</p>
            <p className="text-2xl font-bold text-emerald-300">{usd(stations.door.gross)}</p>
            <p className="text-[10px] text-slate-500">gross rung at the door</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Paid to drivers</p>
            <p className="text-2xl font-bold text-pink-300">{usd(payouts.driver)}</p>
            <p className="text-[10px] text-slate-500">{payouts.driver_count} processed · {usd(payouts.driver_pending)} pending</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Door net of drivers</p>
            <p className={`text-2xl font-bold ${totals.door_net_after_drivers < 0 ? "text-red-400" : "text-purple-300"}`}>
              {usd(totals.door_net_after_drivers)}
            </p>
            <p className="text-[10px] text-slate-500">door gross − driver payouts</p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {STATIONS.map(({ key, label, icon: Icon, tone, border }) => {
            const s = stations[key];
            return (
              <div key={key} className={`rounded-lg border ${border} bg-slate-800/30 p-3 space-y-1.5`}>
                <div className={`flex items-center gap-2 text-xs font-bold ${tone}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Gross</span><span className="font-mono text-white">{usd(s.gross)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Cash</span><span className="font-mono text-emerald-300">{usd(s.cash)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Card</span><span className="font-mono text-blue-300">{usd(s.card)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tickets · units</span><span className="font-mono text-slate-200">{s.count} · {s.units}</span>
                </div>
                {s.comp > 0 && (
                  <div className="flex justify-between text-xs text-amber-400/80">
                    <span>Comped</span><span className="font-mono">{usd(s.comp)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {stations.other.count > 0 && (
          <p className="text-[10px] text-slate-500">
            {stations.other.count} ticket(s) posted without a station tag — {usd(stations.other.gross)} included in gross.
          </p>
        )}
      </CardContent>
    </Card>
  );
}