import React from "react";
import { Card } from "@/components/ui/card";

function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export default function VenuePerformance({ venues = [] }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800 p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Venue Performance</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <th className="text-left py-2 font-semibold">Venue</th>
            <th className="text-right py-2 font-semibold">Sales</th>
          </tr>
        </thead>
        <tbody>
          {venues.length === 0 ? (
            <tr><td colSpan={2} className="text-slate-500 text-center py-6 text-xs">No venue data yet</td></tr>
          ) : (
            venues.map((v, i) => (
              <tr key={i} className="border-b border-slate-800/50 last:border-0">
                <td className="py-2 text-white">{v.name}</td>
                <td className="py-2 text-right text-cyan-300 font-semibold">{fmtMoney(v.sales)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}