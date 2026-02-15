import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

export default function OwnerAnalytics({ transactions = [] }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => {
    let today = 0, week = 0, month = 0, total = 0;
    let todayCount = 0, weekCount = 0, monthCount = 0;
    const byMethod = {};
    const dailyMap = {};

    transactions.forEach((t) => {
      const amt = t.total || 0;
      const date = new Date(t.created_date);
      total += amt;

      if (date >= todayStart) { today += amt; todayCount++; }
      if (date >= weekStart) { week += amt; weekCount++; }
      if (date >= monthStart) { month += amt; monthCount++; }

      const method = t.payment_method || "Cash";
      byMethod[method] = (byMethod[method] || 0) + amt;

      const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + amt;
    });

    const paymentData = Object.entries(byMethod).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
    const dailyData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
      day,
      revenue: Math.round((dailyMap[day] || 0) * 100) / 100,
    }));

    return { today, week, month, total, todayCount, weekCount, monthCount, paymentData, dailyData };
  }, [transactions]);

  const fmt = (n) => "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const cards = [
    { label: "Today", value: fmt(stats.today), count: stats.todayCount, icon: DollarSign, color: "text-cyan-400", border: "border-cyan-500/30" },
    { label: "This Week", value: fmt(stats.week), count: stats.weekCount, icon: Calendar, color: "text-blue-400", border: "border-blue-500/30" },
    { label: "This Month", value: fmt(stats.month), count: stats.monthCount, icon: TrendingUp, color: "text-purple-400", border: "border-purple-500/30" },
    { label: "All Time", value: fmt(stats.total), count: transactions.length, icon: BarChart3, color: "text-green-400", border: "border-green-500/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className={`bg-gray-900/50 ${c.border}`}>
            <CardContent className="p-4">
              <c.icon className={`w-5 h-5 ${c.color} mb-1`} />
              <div className={`text-xl md:text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-400">{c.label} · {c.count} txns</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Weekly Revenue</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyData}>
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontSize: 12 }}
                    formatter={(v) => [`$${v}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Payment Methods</h3>
            <div className="h-48">
              {stats.paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                      {stats.paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontSize: 12 }} formatter={(v) => [`$${v}`]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">No transactions yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}