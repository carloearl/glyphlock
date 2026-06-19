import React from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function HourlySalesChart({ data = [] }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Hourly Sales</h3>
        <span className="text-[11px] text-slate-500">Today</span>
      </div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }}
              formatter={(v) => [`$${Number(v).toLocaleString()}`, "Sales"]}
            />
            <Area type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={2} fill="url(#hourlyFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}