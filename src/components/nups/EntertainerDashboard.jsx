import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Music, DollarSign, Star, Clock, TrendingUp, Calendar,
  Award, ChevronDown, ChevronUp, FileText, Loader2
} from "lucide-react";

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

function StatCard({ icon: Icon, label, value, color = "text-cyan-400", sub }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function ContractRow({ order }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-all hover:bg-white/[0.02]"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-white">{order.order_number}</div>
            <div className="text-xs text-gray-500">{order.signed_at ? new Date(order.signed_at).toLocaleDateString() : new Date(order.created_date).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-black font-mono text-amber-400 text-sm">{fmt(order.dream_dollar_value)}</div>
            <div className="text-[10px] text-gray-600">face value</div>
          </div>
          <Badge className={
            order.status === "signed" ? "bg-green-500/15 text-green-400 border-green-500/30" :
            order.status === "archived" ? "bg-gray-500/15 text-gray-400 border-gray-500/30" :
            "bg-blue-500/15 text-blue-400 border-blue-500/30"
          }>{order.status}</Badge>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5">
          {[
            { label: "Guest", value: order.customer_name || "—" },
            { label: "Room/Hostess", value: order.hostess_name || "—" },
            { label: "Grand Total Charged", value: fmt(order.grand_total) },
            { label: "Contract Version", value: order.contract_version || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="pt-3">
              <div className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</div>
              <div className="text-xs text-gray-300 font-semibold mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntertainerDashboard({ user }) {
  const [dateRange, setDateRange] = useState("all");

  // Load ALL orders; we'll filter by hostess_name matching user stage name / email
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["entertainer-orders", user?.email],
    queryFn: () => base44.entities.DreamPalaceOrder.list("-created_date", 500),
    enabled: !!user,
  });

  // Load the entertainer record matching this user's email
  const { data: entertainers = [] } = useQuery({
    queryKey: ["entertainer-self", user?.email],
    queryFn: () => base44.entities.Entertainer.list(),
    enabled: !!user,
  });

  // Load this entertainer's shifts
  const { data: allShifts = [] } = useQuery({
    queryKey: ["entertainer-shifts", user?.email],
    queryFn: () => base44.entities.EntertainerShift.list("-created_date", 500),
    enabled: !!user,
  });

  // Load VIP rooms (for session data)
  const { data: vipRooms = [] } = useQuery({
    queryKey: ["vip-rooms-ent"],
    queryFn: () => base44.entities.VIPRoom.list("-created_date", 200),
    enabled: !!user,
  });

  const entertainer = entertainers.find(e =>
    e.email === user?.email ||
    e.stage_name?.toLowerCase() === user?.full_name?.toLowerCase()
  );

  const myOrders = useMemo(() => {
    if (!entertainer) return [];
    return allOrders.filter(o =>
      o.hostess_name?.toLowerCase() === entertainer.stage_name?.toLowerCase() ||
      o.created_by === user?.email
    );
  }, [allOrders, entertainer, user]);

  const myShifts = useMemo(() => {
    if (!entertainer) return [];
    return allShifts.filter(s =>
      s.entertainer_id === entertainer.id ||
      s.stage_name?.toLowerCase() === entertainer.stage_name?.toLowerCase()
    );
  }, [allShifts, entertainer]);

  const myVIPSessions = useMemo(() => {
    if (!entertainer) return [];
    return vipRooms.filter(r =>
      r.entertainer_id === entertainer.id ||
      r.entertainer_name?.toLowerCase() === entertainer.stage_name?.toLowerCase()
    );
  }, [vipRooms, entertainer]);

  // Date range filter
  const filterByDate = (items, dateField = "created_date") => {
    if (dateRange === "all") return items;
    const now = new Date();
    const cutoffs = { today: 1, week: 7, month: 30 };
    const days = cutoffs[dateRange] || 9999;
    return items.filter(i => {
      const d = new Date(i[dateField]);
      return (now - d) / (1000 * 60 * 60 * 24) <= days;
    });
  };

  const filteredOrders = filterByDate(myOrders, "created_date");
  const filteredShifts = filterByDate(myShifts, "check_in_time");
  const filteredSessions = filterByDate(myVIPSessions, "start_time");

  const totalEarnings = filteredOrders.reduce((s, o) => {
    // Entertainer earns based on commission_rate * dream_dollar_value
    const rate = entertainer?.commission_rate || 0.5;
    return s + (o.dream_dollar_value || 0) * rate;
  }, 0) + entertainer?.total_earnings || 0;

  const totalRoomFees = filteredSessions.reduce((s, r) => s + (r.total_charge || 0), 0);
  const completedSessions = filteredSessions.filter(r => r.status === "available" || r.end_time).length;

  const totalShiftHours = filteredShifts.reduce((s, shift) => {
    if (!shift.check_in_time) return s;
    const out = shift.check_out_time ? new Date(shift.check_out_time) : new Date();
    const hours = (out - new Date(shift.check_in_time)) / (1000 * 60 * 60);
    return s + Math.max(0, hours);
  }, 0);

  // Earnings by week for trend
  const weeklyData = useMemo(() => {
    const weeks = {};
    myOrders.forEach(o => {
      const d = new Date(o.created_date);
      const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      if (!weeks[weekKey]) weeks[weekKey] = 0;
      weeks[weekKey] += (o.dream_dollar_value || 0) * (entertainer?.commission_rate || 0.5);
    });
    return Object.entries(weeks).slice(-8).map(([week, earnings]) => ({ week, earnings }));
  }, [myOrders, entertainer]);

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (!entertainer) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <div className="text-sm">No entertainer profile linked to your account.</div>
        <div className="text-xs mt-1 text-gray-700">Contact management to link your profile.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Entertainer Header */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.08))", border: "1px solid rgba(236,72,153,0.25)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl font-black text-white">
            {entertainer.stage_name?.[0] || "E"}
          </div>
          <div>
            <div className="text-xl font-black text-white">{entertainer.stage_name}</div>
            <div className="text-xs text-gray-500">{entertainer.email || user?.email}</div>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 text-[10px]">
                <Star className="w-2.5 h-2.5 mr-1" /> Entertainer
              </Badge>
              <Badge className={`text-[10px] ${entertainer.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400"}`}>
                {entertainer.status}
              </Badge>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-600 mb-1">Commission Rate</div>
            <div className="text-2xl font-black text-amber-400">{((entertainer.commission_rate || 0.5) * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2">
        {[{ key: "today", label: "Today" }, { key: "week", label: "This Week" }, { key: "month", label: "This Month" }, { key: "all", label: "All Time" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateRange(key)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: dateRange === key ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${dateRange === key ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: dateRange === key ? "#f472b6" : "#6b7280"
            }}
          >{label}</button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={DollarSign} label="Est. Earnings" value={fmt(totalEarnings)} color="text-amber-400" sub="incl. commission" />
        <StatCard icon={Award} label="VIP Sessions" value={completedSessions} color="text-pink-400" />
        <StatCard icon={DollarSign} label="Room Fee Total" value={fmt(totalRoomFees)} color="text-purple-400" />
        <StatCard icon={FileText} label="Contracts Signed" value={filteredOrders.length} color="text-cyan-400" />
        <StatCard icon={Clock} label="Hours Worked" value={totalShiftHours.toFixed(1)} color="text-green-400" sub="shift hours" />
        <StatCard icon={Star} label="Total Career Earnings" value={fmt(entertainer.total_earnings || 0)} color="text-yellow-400" sub="lifetime" />
      </div>

      {/* Weekly Earnings Trend */}
      {weeklyData.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-bold text-white">Weekly Earnings Trend</span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {weeklyData.map(({ week, earnings }) => {
              const max = Math.max(...weeklyData.map(w => w.earnings), 1);
              const height = (earnings / max) * 100;
              return (
                <div key={week} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {fmt(earnings)}
                  </div>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${height}%`,
                      minHeight: 4,
                      background: "linear-gradient(to top, rgba(236,72,153,0.6), rgba(168,85,247,0.4))"
                    }}
                  />
                  <span className="text-[8px] text-gray-700 truncate w-full text-center">{week.split("-")[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIP Session History */}
      {filteredSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">VIP Session History</span>
            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">{filteredSessions.length}</Badge>
          </div>
          <div className="space-y-2">
            {filteredSessions.slice(0, 10).map(room => (
              <div key={room.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div>
                  <div className="text-sm font-bold text-white">Room {room.room_number || room.room_name}</div>
                  <div className="text-xs text-gray-500">
                    {room.guest_name || "Guest"} — {room.start_time ? new Date(room.start_time).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black font-mono text-purple-400 text-sm">{fmt(room.total_charge)}</div>
                  <div className="text-[10px] text-gray-600">{room.duration_minutes ? `${room.duration_minutes} min` : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">VIP Contract History</span>
          <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px]">{filteredOrders.length}</Badge>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            No contracts found for this period.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.slice(0, 20).map(order => (
              <ContractRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Shift History */}
      {filteredShifts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-white">Recent Shifts</span>
          </div>
          <div className="space-y-2">
            {filteredShifts.slice(0, 10).map(shift => {
              const hours = shift.check_out_time
                ? ((new Date(shift.check_out_time) - new Date(shift.check_in_time)) / 3600000).toFixed(1)
                : "Active";
              return (
                <div key={shift.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <div className="text-xs text-gray-300">{new Date(shift.check_in_time).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400">{shift.location || "Main Floor"}</div>
                  <div className="text-sm font-bold text-green-400">{hours}h</div>
                  <div className="text-xs font-mono text-amber-400">{fmt(shift.shift_earnings)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}