import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Clock, Star,
  FileText, BarChart3, Printer, ArrowLeft, Shield, Coins,
  DoorOpen, CheckCircle2, AlertTriangle, Activity
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { format, startOfQuarter, endOfQuarter, subQuarters, isWithinInterval } from "date-fns";

const COLORS = ["#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

function StatCard({ icon: Icon, label, value, sub, color = "cyan" }) {
  const colorMap = {
    cyan: "border-cyan-500/30 text-cyan-400",
    purple: "border-purple-500/30 text-purple-400",
    green: "border-green-500/30 text-green-400",
    pink: "border-pink-500/30 text-pink-400",
    amber: "border-amber-500/30 text-amber-400",
    blue: "border-blue-500/30 text-blue-400",
  };
  return (
    <Card className={`bg-gray-900/60 ${colorMap[color]}`}>
      <CardContent className="p-4">
        <Icon className={`w-5 h-5 mb-1 ${colorMap[color].split(" ")[1]}`} />
        <div className={`text-2xl font-bold ${colorMap[color].split(" ")[1]}`}>{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, color = "text-cyan-400" }) {
  return (
    <div className={`flex items-center gap-2 border-b border-white/10 pb-2 mb-4`}>
      <h2 className={`text-lg font-bold ${color}`}>{title}</h2>
    </div>
  );
}

export default function NUPSMISReport() {
  const [quarter, setQuarter] = useState(0); // 0 = current, 1 = last, 2 = two ago

  const now = new Date();
  const qStart = startOfQuarter(subQuarters(now, quarter));
  const qEnd = endOfQuarter(subQuarters(now, quarter));
  const qLabel = `Q${Math.ceil((qStart.getMonth() + 1) / 3)} ${qStart.getFullYear()}`;

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    try {
      return isWithinInterval(new Date(dateStr), { start: qStart, end: qEnd });
    } catch { return false; }
  };

  const { data: transactions = [] } = useQuery({
    queryKey: ["mis-transactions"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 500),
  });

  const { data: dreamOrders = [] } = useQuery({
    queryKey: ["mis-dream-orders"],
    queryFn: () => base44.entities.DreamPalaceOrder.list("-created_date", 500),
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ["mis-entertainers"],
    queryFn: () => base44.entities.Entertainer.list(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["mis-shifts"],
    queryFn: () => base44.entities.EntertainerShift.list("-created_date", 500),
  });

  const { data: payroll = [] } = useQuery({
    queryKey: ["mis-payroll"],
    queryFn: () => base44.entities.PayrollRecord.list("-created_date", 200),
  });

  const { data: vipRooms = [] } = useQuery({
    queryKey: ["mis-vip-rooms"],
    queryFn: () => base44.entities.VIPRoom.list(),
  });

  const { data: dreamBills = [] } = useQuery({
    queryKey: ["mis-dream-bills"],
    queryFn: () => base44.entities.DreamDollarBill.list("-created_date", 500),
  });

  // --- Filter to quarter ---
  const qTransactions = transactions.filter(t => inRange(t.created_date));
  const qDreamOrders = dreamOrders.filter(o => inRange(o.created_date));
  const qShifts = shifts.filter(s => inRange(s.check_in_time));
  const qPayroll = payroll.filter(p => inRange(p.created_date));
  const qBills = dreamBills.filter(b => inRange(b.issued_at));

  // --- KPIs ---
  const totalRevenue = qTransactions.reduce((s, t) => s + (t.total || 0), 0);
  const totalDDRevenue = qDreamOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
  const combinedRevenue = totalRevenue + totalDDRevenue;
  const avgTransaction = qTransactions.length ? totalRevenue / qTransactions.length : 0;
  const activeEntertainers = entertainers.filter(e => e.status === "active").length;
  const totalShiftHours = qShifts.reduce((s, sh) => {
    if (sh.check_in_time && sh.check_out_time) {
      return s + (new Date(sh.check_out_time) - new Date(sh.check_in_time)) / 3600000;
    }
    return s;
  }, 0);
  const ddIssued = qBills.filter(b => b.status === "issued").length;
  const ddRedeemed = qBills.filter(b => b.status === "redeemed").length;
  const ddValue = qDreamOrders.reduce((s, o) => s + (o.dream_dollar_value || 0), 0);
  const ddSurcharge = qDreamOrders.reduce((s, o) => s + (o.processing_surcharge || 0), 0);

  // --- Revenue by Month (bar chart) ---
  const monthlyData = {};
  qTransactions.forEach(t => {
    const m = format(new Date(t.created_date), "MMM");
    monthlyData[m] = (monthlyData[m] || 0) + (t.total || 0);
  });
  qDreamOrders.forEach(o => {
    if (!o.created_date) return;
    const m = format(new Date(o.created_date), "MMM");
    monthlyData[m] = (monthlyData[m] || 0) + (o.grand_total || 0);
  });
  const revenueChartData = Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));

  // --- Payment Method Breakdown ---
  const payMethodData = qTransactions.reduce((acc, t) => {
    const pm = t.payment_method || "Other";
    acc[pm] = (acc[pm] || 0) + (t.total || 0);
    return acc;
  }, {});
  const payMethodChart = Object.entries(payMethodData).map(([name, value]) => ({ name, value }));

  // --- Entertainer Earnings ---
  const entertainerEarnings = {};
  qShifts.forEach(s => {
    if (s.stage_name && s.shift_earnings) {
      entertainerEarnings[s.stage_name] = (entertainerEarnings[s.stage_name] || 0) + s.shift_earnings;
    }
  });
  const topEarners = Object.entries(entertainerEarnings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, earnings]) => ({ name, earnings }));

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 p-4 bg-black/95 backdrop-blur sticky top-0 z-40 print:static print:border-b-2 print:border-black no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white no-print"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                N.U.P.S. Quarterly MIS Report
              </h1>
              <p className="text-xs text-gray-400">{qLabel} · Generated {format(now, "MMM d, yyyy h:mm a")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            {[0, 1, 2].map(q => (
              <Button
                key={q}
                size="sm"
                variant={quarter === q ? "default" : "outline"}
                onClick={() => setQuarter(q)}
                className={quarter === q ? "bg-purple-600 text-white" : "border-gray-700 text-gray-300"}
              >
                {q === 0 ? "Current Q" : q === 1 ? "Last Q" : "2Q Ago"}
              </Button>
            ))}
            <Button size="sm" onClick={handlePrint} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">

        {/* ── EXECUTIVE SUMMARY ── */}
        <section>
          <SectionHeader title="Executive Summary" color="text-cyan-400" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={DollarSign} label="Combined Revenue" value={`$${combinedRevenue.toFixed(0)}`} sub={qLabel} color="cyan" />
            <StatCard icon={ShoppingCart} label="POS Transactions" value={qTransactions.length} sub={`Avg $${avgTransaction.toFixed(0)}`} color="purple" />
            <StatCard icon={Coins} label="Dream Dollar Sales" value={`$${totalDDRevenue.toFixed(0)}`} sub={`${qDreamOrders.length} orders`} color="amber" />
            <StatCard icon={Users} label="Active Entertainers" value={activeEntertainers} sub={`${entertainers.length} total`} color="pink" />
            <StatCard icon={Clock} label="Staff Hours" value={totalShiftHours.toFixed(0)} sub={`${qShifts.length} shifts`} color="blue" />
            <StatCard icon={DoorOpen} label="VIP Rooms" value={vipRooms.length} sub="configured" color="green" />
          </div>
        </section>

        {/* ── REVENUE BREAKDOWN ── */}
        <section>
          <SectionHeader title="Revenue Overview" color="text-green-400" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/60 border-green-500/20">
              <CardHeader><CardTitle className="text-green-400 text-sm">Monthly Revenue ({qLabel})</CardTitle></CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueChartData}>
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={v => `$${v.toFixed(2)}`} contentStyle={{ background: '#111', border: '1px solid #333' }} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500 text-sm text-center py-12">No transaction data for this quarter.</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-purple-500/20">
              <CardHeader><CardTitle className="text-purple-400 text-sm">Payment Methods</CardTitle></CardHeader>
              <CardContent>
                {payMethodChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={payMethodChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {payMethodChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => `$${Number(v).toFixed(2)}`} contentStyle={{ background: '#111', border: '1px solid #333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500 text-sm text-center py-12">No payment data for this quarter.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Detail Table */}
          <Card className="bg-gray-900/60 border-gray-700/50 mt-4">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-gray-400">Revenue Stream</th>
                    <th className="text-right p-3 text-gray-400">Amount</th>
                    <th className="text-right p-3 text-gray-400">Count</th>
                    <th className="text-right p-3 text-gray-400">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stream: "POS Sales", amount: totalRevenue, count: qTransactions.length },
                    { stream: "Dream Dollar Orders", amount: totalDDRevenue, count: qDreamOrders.length },
                    { stream: "DD Processing Surcharges", amount: ddSurcharge, count: qDreamOrders.length },
                  ].map(row => (
                    <tr key={row.stream} className="border-b border-gray-800 hover:bg-white/5">
                      <td className="p-3 text-white">{row.stream}</td>
                      <td className="p-3 text-right text-green-400 font-mono">${row.amount.toFixed(2)}</td>
                      <td className="p-3 text-right text-gray-400">{row.count}</td>
                      <td className="p-3 text-right text-gray-400">
                        {combinedRevenue > 0 ? ((row.amount / combinedRevenue) * 100).toFixed(1) : "0"}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-800/50 font-bold">
                    <td className="p-3 text-white">TOTAL</td>
                    <td className="p-3 text-right text-cyan-400 font-mono">${combinedRevenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-gray-400">{qTransactions.length + qDreamOrders.length}</td>
                    <td className="p-3 text-right text-cyan-400">100%</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* ── DREAM DOLLAR OPERATIONS ── */}
        <section>
          <SectionHeader title="Dream Dollar Operations" color="text-amber-400" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard icon={Coins} label="DD Face Value Issued" value={`$${ddValue.toFixed(0)}`} color="amber" />
            <StatCard icon={DollarSign} label="Surcharges Collected" value={`$${ddSurcharge.toFixed(0)}`} color="green" />
            <StatCard icon={CheckCircle2} label="Bills Issued" value={ddIssued} color="cyan" />
            <StatCard icon={Activity} label="Bills Redeemed" value={ddRedeemed} color="purple" />
          </div>

          {qDreamOrders.length > 0 ? (
            <Card className="bg-gray-900/60 border-amber-500/20">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="text-left p-3 text-gray-400">Order #</th>
                      <th className="text-left p-3 text-gray-400">Customer</th>
                      <th className="text-right p-3 text-gray-400">DD Value</th>
                      <th className="text-right p-3 text-gray-400">Grand Total</th>
                      <th className="text-center p-3 text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qDreamOrders.slice(0, 20).map(o => (
                      <tr key={o.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="p-3 text-gray-300 font-mono text-xs">{o.order_number}</td>
                        <td className="p-3 text-white">{o.customer_name}</td>
                        <td className="p-3 text-right text-amber-400 font-mono">${(o.dream_dollar_value || 0).toFixed(2)}</td>
                        <td className="p-3 text-right text-green-400 font-mono">${(o.grand_total || 0).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <Badge className={
                            o.status === "archived" ? "bg-green-500/20 text-green-400" :
                            o.status === "signed" ? "bg-cyan-500/20 text-cyan-400" :
                            "bg-gray-500/20 text-gray-400"
                          }>{o.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {qDreamOrders.length > 20 && (
                  <p className="text-xs text-gray-500 p-3">Showing 20 of {qDreamOrders.length} orders.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8 border border-gray-800 rounded-lg">No Dream Dollar orders for this quarter.</div>
          )}
        </section>

        {/* ── STAFF & ENTERTAINER PERFORMANCE ── */}
        <section>
          <SectionHeader title="Staff & Entertainer Performance" color="text-pink-400" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/60 border-pink-500/20">
              <CardHeader><CardTitle className="text-pink-400 text-sm">Top Earners This Quarter</CardTitle></CardHeader>
              <CardContent>
                {topEarners.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topEarners} layout="vertical">
                      <XAxis type="number" stroke="#6b7280" tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" stroke="#6b7280" width={80} />
                      <Tooltip formatter={v => `$${Number(v).toFixed(2)}`} contentStyle={{ background: '#111', border: '1px solid #333' }} />
                      <Bar dataKey="earnings" fill="#ec4899" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500 text-sm text-center py-12">No shift earnings data for this quarter.</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-blue-500/20">
              <CardHeader><CardTitle className="text-blue-400 text-sm">Shift Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Total Shifts</span><span className="text-white font-bold">{qShifts.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Total Hours Worked</span><span className="text-white font-bold">{totalShiftHours.toFixed(1)} hrs</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Avg Hours/Shift</span><span className="text-white font-bold">{qShifts.length ? (totalShiftHours / qShifts.length).toFixed(1) : 0} hrs</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Active Entertainers</span><span className="text-white font-bold">{activeEntertainers}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Inactive/Suspended</span><span className="text-white font-bold">{entertainers.length - activeEntertainers}</span></div>
                <div className="flex justify-between text-sm border-t border-gray-700 pt-3"><span className="text-gray-400">Payroll Records</span><span className="text-cyan-400 font-bold">{qPayroll.length}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Net Payouts</span>
                  <span className="text-green-400 font-bold">${qPayroll.reduce((s, p) => s + (p.net_payout || 0), 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Entertainer Roster */}
          {entertainers.length > 0 && (
            <Card className="bg-gray-900/60 border-gray-700/50 mt-4">
              <CardHeader><CardTitle className="text-gray-300 text-sm">Entertainer Roster</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="text-left p-3 text-gray-400">Stage Name</th>
                      <th className="text-left p-3 text-gray-400">Legal Name</th>
                      <th className="text-center p-3 text-gray-400">Status</th>
                      <th className="text-right p-3 text-gray-400">Commission Rate</th>
                      <th className="text-right p-3 text-gray-400">Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entertainers.map(e => (
                      <tr key={e.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="p-3 text-white font-medium">{e.stage_name}</td>
                        <td className="p-3 text-gray-400">{e.legal_name}</td>
                        <td className="p-3 text-center">
                          <Badge className={
                            e.status === "active" ? "bg-green-500/20 text-green-400" :
                            e.status === "suspended" ? "bg-red-500/20 text-red-400" :
                            "bg-gray-500/20 text-gray-400"
                          }>{e.status}</Badge>
                        </td>
                        <td className="p-3 text-right text-gray-300">{((e.commission_rate || 0) * 100).toFixed(0)}%</td>
                        <td className="p-3 text-right text-green-400 font-mono">${(e.total_earnings || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── COMPLIANCE & SYSTEM STATUS ── */}
        <section>
          <SectionHeader title="Compliance & System Status" color="text-red-400" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-900/60 border-red-500/20">
              <CardHeader><CardTitle className="text-red-400 text-sm">Contract Compliance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Dream Palace Contracts Signed", value: qDreamOrders.filter(o => o.status === "signed" || o.status === "archived").length, total: qDreamOrders.length, color: "green" },
                  { label: "Contracts Archived", value: qDreamOrders.filter(o => o.status === "archived").length, total: qDreamOrders.length, color: "cyan" },
                  { label: "Contracts Pending", value: qDreamOrders.filter(o => o.status === "draft").length, total: qDreamOrders.length, color: "amber" },
                  { label: "Entertainers Contract-Signed", value: entertainers.filter(e => e.contract_signed).length, total: entertainers.length, color: "purple" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{item.label}</span>
                      <span>{item.value}/{item.total}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-${item.color}-400`}
                        style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-purple-500/20">
              <CardHeader><CardTitle className="text-purple-400 text-sm">Report Period Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Quarter</span><span className="text-white font-bold">{qLabel}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Start Date</span><span className="text-white">{format(qStart, "MMM d, yyyy")}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">End Date</span><span className="text-white">{format(qEnd, "MMM d, yyyy")}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Report Generated</span><span className="text-white">{format(now, "MMM d, yyyy h:mm a")}</span></div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between"><span className="text-gray-400">System</span><span className="text-cyan-400">N.U.P.S. v3</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Platform</span><span className="text-purple-400">GlyphLock</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Print footer */}
        <div className="hidden print:block text-center text-xs text-gray-500 border-t border-gray-700 pt-4 mt-8">
          CONFIDENTIAL — N.U.P.S. Quarterly MIS Report · {qLabel} · GlyphLock LLC · Generated {format(now, "MMM d, yyyy")}
        </div>
      </div>
    </div>
  );
}