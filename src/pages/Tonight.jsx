/**
 * Phase 6 / H2 — Tonight Command Dashboard
 *
 * Single-screen operational view: open shift status, live revenue,
 * pending payouts, audit findings, recent activity feed, quick actions.
 * Pure read view — no business logic changes.
 */

import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { analyzeAuditLogs } from "@/lib/audit/auditAnalytics";
import {
  DollarSign, Clock, ShieldAlert, Truck,
  DoorOpen, FileSearch, Calculator,
  Activity, Lock, CheckCircle2, RefreshCw,
} from "lucide-react";
import BigSpenderAlert from "@/components/nups/tonight/BigSpenderAlert";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLES = {
  OPEN: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  RECONCILED: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  LOCKED: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
};

function KpiCard({ icon: Icon, label, value, sub, accent = "violet", onClick }) {
  const tones = {
    violet: "border-violet-500/30 bg-violet-950/20 text-violet-300",
    emerald: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-950/20 text-amber-300",
    red: "border-red-500/30 bg-red-950/20 text-red-300",
  };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all ${tones[accent]} ${onClick ? "hover:scale-[1.02] cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] mt-1 opacity-70">{sub}</div>
    </button>
  );
}

function QuickAction({ to, icon: Icon, label, color }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-${color}-500/40 hover:bg-gray-900/90 transition-all`}
    >
      <Icon className={`w-6 h-6 text-${color}-400`} />
      <span className="text-xs text-white font-medium">{label}</span>
    </Link>
  );
}

function actionColor(t) {
  if (t === "PAYOUT_TOGGLE") return "text-pink-400";
  if (t === "SETTLEMENT_RUN") return "text-emerald-400";
  if (t === "DELETE") return "text-red-400";
  if (t === "CONFIG_CHANGE") return "text-violet-400";
  if (t === "EXPORT") return "text-cyan-400";
  return "text-gray-400";
}

export default function Tonight() {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const t = today();

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  // Today's settlement
  const { data: settlements = [], refetch: refetchSettle } = useQuery({
    queryKey: ["tonight-settlement", venueId, t],
    queryFn: async () => {
      const rows = await base44.entities.DailySettlement.list("-created_date", 30);
      return rows.filter(s => s.venue_id === venueId && (s.business_date === t || s.settlement_date === t));
    },
    enabled: !!venueId,
    staleTime: 20_000,
  });
  const todaySettle = settlements[0];
  const shiftStatus = todaySettle?.status || "IN_PROGRESS";

  // Today's driver payouts
  const { data: payouts = [], refetch: refetchPayouts } = useQuery({
    queryKey: ["tonight-payouts", venueId, t],
    queryFn: async () => {
      const rows = await base44.entities.DriverPayout.list("-session_date", 200);
      return rows.filter(p => p.venue_id === venueId && p.session_date === t);
    },
    enabled: !!venueId,
    staleTime: 20_000,
  });
  const pending = payouts.filter(p => (p.payout_status || "PENDING") === "PENDING");
  const pendingTotal = pending.reduce((s, p) => s + (Number(p.total_payout) || 0), 0);

  // Today's POS transactions (live revenue)
  const { data: txns = [], refetch: refetchTxns } = useQuery({
    queryKey: ["tonight-txns", venueId, t],
    queryFn: async () => {
      const rows = await base44.entities.POSTransaction.list("-created_date", 500);
      return rows.filter(tx => tx.venue_id === venueId && (tx.created_date || "").slice(0, 10) === t);
    },
    enabled: !!venueId,
    staleTime: 15_000,
  });
  const liveRevenue = useMemo(() => {
    let cash = 0, card = 0;
    for (const tx of txns) {
      const method = (tx.payment_method || "").toLowerCase();
      const amt = Number(tx.total) || 0;
      if (method === "cash") cash += Number(tx.cash_amount) || amt;
      else if (["card", "credit_card", "debit_card"].includes(method)) card += Number(tx.card_amount) || amt;
    }
    return { cash, card, total: cash + card };
  }, [txns]);

  // Recent activity (last 10 events, any time)
  const { data: recent = [], refetch: refetchRecent } = useQuery({
    queryKey: ["tonight-recent"],
    queryFn: () => base44.entities.ActivityLog.list("-timestamp", 10),
    staleTime: 15_000,
  });

  // Audit findings count
  const { data: allLogs = [] } = useQuery({
    queryKey: ["tonight-audit"],
    queryFn: () => base44.entities.ActivityLog.list("-timestamp", 500),
    staleTime: 60_000,
  });
  const criticalFindings = useMemo(() => {
    try {
      const result = analyzeAuditLogs(allLogs);
      const findings = result?.findings || [];
      return findings.filter(f => f.severity === "high" || f.severity === "critical").length;
    } catch { return 0; }
  }, [allLogs]);

  const refreshAll = () => {
    refetchSettle(); refetchPayouts(); refetchTxns(); refetchRecent();
  };

  const shiftStatusLabel = todaySettle
    ? shiftStatus
    : "IN PROGRESS";
  const shiftStatusStyle = todaySettle
    ? (STATUS_STYLES[shiftStatus] || STATUS_STYLES.OPEN)
    : "bg-violet-500/20 border-violet-500/40 text-violet-300";

  const actions = (
    <>
      <Badge className={`border text-[10px] px-2 py-1 ${shiftStatusStyle} hidden sm:inline-flex`}>{shiftStatusLabel}</Badge>
      <Button variant="outline" size="sm" onClick={refreshAll} className="border-blue-500/30 text-blue-300">
        <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Refresh</span>
      </Button>
    </>
  );

  return (
    <NUPSAppShell
      title="Tonight"
      subtitle={`${activeVenue?.venue_name || venueId || "All venues"} · ${t}`}
      actions={actions}
      role="MANAGER"
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Big Spender Protocol alert — only renders when a guest crosses $10k */}
        <BigSpenderAlert venueId={venueId} />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={Clock}
            label="Shift Status"
            value={shiftStatusLabel}
            sub={todaySettle ? `Settlement exists · ${shiftStatus}` : `${txns.length} txns logged`}
            accent={shiftStatus === "LOCKED" ? "emerald" : "violet"}
            onClick={() => navigate("/admin/settlement")}
          />
          <KpiCard
            icon={DollarSign}
            label="Live Revenue"
            value={`$${liveRevenue.total.toFixed(0)}`}
            sub={`$${liveRevenue.cash.toFixed(0)} cash · $${liveRevenue.card.toFixed(0)} card`}
            accent="emerald"
            onClick={() => navigate("/Accounting")}
          />
          <KpiCard
            icon={Truck}
            label="Pending Payouts"
            value={pending.length}
            sub={`$${pendingTotal.toFixed(2)} outstanding`}
            accent={pending.length > 0 ? "amber" : "emerald"}
            onClick={() => navigate("/admin/payout-history")}
          />
          <KpiCard
            icon={ShieldAlert}
            label="Audit Findings"
            value={criticalFindings}
            sub={criticalFindings === 0 ? "No critical issues" : "Critical / high severity"}
            accent={criticalFindings > 0 ? "red" : "emerald"}
            onClick={() => navigate("/admin/audit-integrity")}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            <QuickAction to="/FrontDoor" icon={DoorOpen} label="Front Door" color="violet" />
            <QuickAction to="/NUPSOwner" icon={Activity} label="Owner Hub" color="blue" />
            <QuickAction to="/admin/payout-history" icon={Truck} label="Payouts" color="pink" />
            <QuickAction to="/admin/settlement" icon={Lock} label="Settlement" color="emerald" />
            <QuickAction to="/Accounting" icon={Calculator} label="Accounting" color="emerald" />
            <QuickAction to="/admin/audit-integrity" icon={FileSearch} label="Audit" color="red" />
          </div>
        </div>

        {/* Vertical stack: payouts then recent activity */}
        <div className="space-y-4 pb-20">
          {/* Pending payouts list */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" /> Outstanding Payouts
              </h3>
              {pending.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => navigate("/admin/payout-history")} className="border-amber-500/30 text-amber-300 h-7 text-xs">
                  Process →
                </Button>
              )}
            </div>
            {pending.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                All driver payouts processed
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pending.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-amber-500/5 border border-amber-500/20 text-xs">
                    <div className="min-w-0">
                      <div className="text-white font-bold truncate">{p.driver_name || "—"}</div>
                      <div className="text-[10px] text-gray-500">{p.total_drops || 0} drops · {p.vip_count || 0} VIP</div>
                    </div>
                    <div className="font-bold text-amber-300">${Number(p.total_payout || 0).toFixed(2)}</div>
                  </div>
                ))}
                {pending.length > 8 && (
                  <div className="text-center text-[11px] text-gray-500 pt-2">+{pending.length - 8} more</div>
                )}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" /> Recent Activity
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/admin/activity-log")} className="border-violet-500/30 text-violet-300 h-7 text-xs">
                Full log →
              </Button>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No activity yet</div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {recent.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 p-2 rounded hover:bg-white/5 text-xs">
                    <span className={`font-mono font-bold text-[10px] mt-0.5 ${actionColor(ev.action_type)}`}>{ev.action_type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate text-[11px]">{ev.entity_affected || ev.notes || "—"}</div>
                      <div className="text-[10px] text-gray-500">
                        {ev.user_email} · {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Pinned bottom summary — live revenue always visible */}
      <div className="sticky bottom-0 z-30 border-t border-gray-800 bg-slate-950/95 backdrop-blur-md px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Cash</span>
              <p className="font-mono font-bold text-emerald-300">${liveRevenue.cash.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Card</span>
              <p className="font-mono font-bold text-blue-300">${liveRevenue.card.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pending Payouts</span>
              <p className="font-mono font-bold text-amber-300">${pendingTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Live Revenue</span>
            <p className="font-mono font-black text-lg text-emerald-400">${liveRevenue.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </NUPSAppShell>
  );
}