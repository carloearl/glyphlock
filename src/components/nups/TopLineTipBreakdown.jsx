import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Banknote, Receipt, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fmt = (n) => "$" + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function TopLineTipBreakdown({ transactions = [] }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const data = useMemo(() => {
    let todayRev = 0, todayTips = 0, todayTax = 0, todayDiscount = 0, todayCount = 0;
    let yesterdayRev = 0, yesterdayTips = 0;
    let weekRev = 0, weekTips = 0, weekCount = 0;
    let monthRev = 0, monthTips = 0, monthCount = 0;
    let allRev = 0, allTips = 0;
    const hourlyMap = {};
    const tipByMethod = {};

    transactions.forEach((t) => {
      const date = new Date(t.created_date);
      const rev = t.total || 0;
      const tip = t.tip || 0;
      const tax = t.tax || 0;
      const disc = t.discount || 0;
      const method = t.payment_method || "Cash";

      allRev += rev;
      allTips += tip;

      if (date >= todayStart) {
        todayRev += rev;
        todayTips += tip;
        todayTax += tax;
        todayDiscount += disc;
        todayCount++;
        const hour = date.getHours();
        const label = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
        if (!hourlyMap[hour]) hourlyMap[hour] = { hour: label, revenue: 0, tips: 0, sortKey: hour };
        hourlyMap[hour].revenue += rev;
        hourlyMap[hour].tips += tip;
      }

      if (date >= yesterdayStart && date < todayStart) {
        yesterdayRev += rev;
        yesterdayTips += tip;
      }

      if (date >= weekStart) { weekRev += rev; weekTips += tip; weekCount++; }
      if (date >= monthStart) { monthRev += rev; monthTips += tip; monthCount++; }

      tipByMethod[method] = (tipByMethod[method] || 0) + tip;
    });

    const hourlyData = Object.values(hourlyMap).sort((a, b) => a.sortKey - b.sortKey);

    const avgTipPercent = todayRev > 0 ? ((todayTips / (todayRev - todayTips)) * 100) : 0;
    const avgTicket = todayCount > 0 ? todayRev / todayCount : 0;
    const revChange = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0;
    const tipChange = yesterdayTips > 0 ? ((todayTips - yesterdayTips) / yesterdayTips) * 100 : 0;

    const tipMethodData = Object.entries(tipByMethod)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

    return {
      todayRev, todayTips, todayTax, todayDiscount, todayCount,
      weekRev, weekTips, weekCount,
      monthRev, monthTips, monthCount,
      allRev, allTips,
      hourlyData, avgTipPercent, avgTicket, revChange, tipChange, tipMethodData,
    };
  }, [transactions]);

  const ChangeIndicator = ({ value }) => {
    if (value === 0) return null;
    const up = value > 0;
    return (
      <span className={`inline-flex items-center text-[10px] font-bold ${up ? "text-green-400" : "text-red-400"}`}>
        {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Line + Tip Summary */}
      <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gray-900/60 border-cyan-500/40" style={{ boxShadow: "0 0 20px rgba(6,182,212,0.15)" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              <ChangeIndicator value={data.revChange} />
            </div>
            <div className="text-2xl font-bold text-cyan-400">{fmt(data.todayRev)}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Today Top Line</div>
            <div className="text-xs text-gray-500 mt-1">{data.todayCount} transactions</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-green-500/40" style={{ boxShadow: "0 0 20px rgba(16,185,129,0.15)" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <Banknote className="w-5 h-5 text-green-400" />
              <ChangeIndicator value={data.tipChange} />
            </div>
            <div className="text-2xl font-bold text-green-400">{fmt(data.todayTips)}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Today Tips</div>
            <div className="text-xs text-gray-500 mt-1">Avg {data.avgTipPercent.toFixed(1)}% tip rate</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-purple-500/40" style={{ boxShadow: "0 0 20px rgba(139,92,246,0.15)" }}>
          <CardContent className="p-4">
            <Receipt className="w-5 h-5 text-purple-400 mb-1" />
            <div className="text-2xl font-bold text-purple-400">{fmt(data.avgTicket)}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Avg Ticket</div>
            <div className="text-xs text-gray-500 mt-1">Tax: {fmt(data.todayTax)} · Disc: {fmt(data.todayDiscount)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-amber-500/40" style={{ boxShadow: "0 0 20px rgba(245,158,11,0.15)" }}>
          <CardContent className="p-4">
            <Percent className="w-5 h-5 text-amber-400 mb-1" />
            <div className="text-2xl font-bold text-amber-400">{fmt(data.todayRev - data.todayTips - data.todayTax - data.todayDiscount)}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Net Revenue</div>
            <div className="text-xs text-gray-500 mt-1">After tips, tax & discounts</div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison Row */}
      <div className="stats-grid grid grid-cols-3 gap-3">
        <Card className="bg-gray-900/40 border-gray-700/40">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400 mb-1">This Week</div>
            <div className="text-lg font-bold text-white">{fmt(data.weekRev)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-green-400">Tips: {fmt(data.weekTips)}</span>
              <span className="text-[10px] text-gray-500">· {data.weekCount} txns</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/40 border-gray-700/40">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400 mb-1">This Month</div>
            <div className="text-lg font-bold text-white">{fmt(data.monthRev)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-green-400">Tips: {fmt(data.monthTips)}</span>
              <span className="text-[10px] text-gray-500">· {data.monthCount} txns</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/40 border-gray-700/40">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400 mb-1">All Time</div>
            <div className="text-lg font-bold text-white">{fmt(data.allRev)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-green-400">Tips: {fmt(data.allTips)}</span>
              <span className="text-[10px] text-gray-500">· {transactions.length} txns</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Revenue + Tips Chart */}
      {data.hourlyData.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Today's Hourly Breakdown</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyData}>
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontSize: 12 }}
                    formatter={(v, name) => [`$${v.toFixed(2)}`, name === "revenue" ? "Revenue" : "Tips"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="tips" name="Tips" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips by Payment Method */}
      {data.tipMethodData.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Tips by Payment Method</h3>
            <div className="space-y-2">
              {data.tipMethodData.map((m) => {
                const maxVal = Math.max(...data.tipMethodData.map(d => d.value), 1);
                const pct = (m.value / maxVal) * 100;
                return (
                  <div key={m.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{m.name}</span>
                    <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-400 w-16 text-right">{fmt(m.value)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}