/**
 * ManagerConsole — Floor manager's command center.
 * ────────────────────────────────────────────────
 * A focused tablet-first surface with EXACTLY the tools a venue manager
 * needs during a shift:
 *
 *   1. Tonight at a glance — staff on the clock, entertainers on the
 *      floor, gross sales so far, contracts signed today
 *   2. Onboard staff + assign PINs  (StaffOnboardingPanel)
 *   3. Onboard entertainers          (OnboardingPacket)
 *   4. Live floor — who's checked in (staff + entertainers in one view)
 *   5. Contracts overview — link into ContractsHub for full management
 *
 * This is NOT the owner/admin Hub — it deliberately omits Accounting,
 * GlyphBucks Hub, Audit Integrity, Demo Manager, etc. Managers don't
 * need (or want) those during a busy night.
 */
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import StaffOnboardingPanel from "@/components/nups/StaffOnboardingPanel";
import OnboardingPacket from "@/components/nups/OnboardingPacket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Music, Clock, DollarSign, FileText, Activity, UserPlus, ChevronRight, ShieldCheck,
} from "lucide-react";

const TABS = [
  { key: "tonight",      label: "Tonight",      icon: Activity },
  { key: "staff",        label: "Staff & PINs", icon: UserPlus },
  { key: "entertainers", label: "Entertainers", icon: Music },
  { key: "floor",        label: "Live Floor",   icon: Users },
  { key: "contracts",    label: "Contracts",    icon: FileText },
];

function fmtMoney(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function StatTile({ label, value, sub, Icon, tone }) {
  const tones = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    violet:  "from-violet-500/20  to-violet-500/5  border-violet-500/30  text-violet-300",
    cyan:    "from-cyan-500/20    to-cyan-500/5    border-cyan-500/30    text-cyan-300",
    amber:   "from-amber-500/20   to-amber-500/5   border-amber-500/30   text-amber-300",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${tones[tone] || tones.cyan} p-4`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
        <Icon className="w-4 h-4 opacity-80" />
      </div>
      <div className="text-3xl font-black text-white tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function ManagerConsole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("tonight");

  // ── Live data feeds (manager-relevant only) ────────────────────────
  const { data: staffShifts = [] } = useQuery({
    queryKey: ["mgr-staff-shifts"],
    queryFn: () => base44.entities.StaffShift.list("-check_in_time", 100),
    refetchInterval: 30000,
  });
  const { data: entShifts = [] } = useQuery({
    queryKey: ["mgr-ent-shifts"],
    queryFn: () => base44.entities.EntertainerShift.list("-check_in_time", 100),
    refetchInterval: 30000,
  });
  const { data: txns = [] } = useQuery({
    queryKey: ["mgr-pos-today"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 500),
    refetchInterval: 30000,
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ["mgr-contracts-today"],
    queryFn: () => base44.entities.VenueContract.list("-created_date", 200),
  });

  const today = todayISO();

  const activeStaff = useMemo(
    () => staffShifts.filter(s => s.status === "checked_in"),
    [staffShifts]
  );
  const activeEntertainers = useMemo(
    () => entShifts.filter(s => !s.check_out_time),
    [entShifts]
  );
  const todaysTxns = useMemo(
    () => txns.filter(t => !t.validation_run && t.status === "completed" && (t.created_date || "").slice(0, 10) === today),
    [txns, today]
  );
  const tonightGross = todaysTxns.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const todaysContracts = useMemo(
    () => contracts.filter(c => (c.created_date || "").slice(0, 10) === today),
    [contracts, today]
  );
  const signedToday = todaysContracts.filter(c => c.is_signed).length;

  // ── Tab bodies ─────────────────────────────────────────────────────
  const renderTonight = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Staff on Clock"        value={activeStaff.length}        Icon={Clock}      tone="cyan" />
        <StatTile label="Entertainers on Floor" value={activeEntertainers.length} Icon={Music}      tone="violet" />
        <StatTile label="Gross Sales Tonight"   value={fmtMoney(tonightGross)}    Icon={DollarSign} tone="emerald" sub={`${todaysTxns.length} transactions`} />
        <StatTile label="Contracts Signed"      value={signedToday}               Icon={FileText}   tone="amber"   sub={`${todaysContracts.length} created today`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Staff on the Clock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStaff.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">Nobody clocked in yet.</p>
            ) : activeStaff.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-white text-sm font-bold">{s.user_full_name || s.user_email}</div>
                  <div className="text-[10px] text-slate-500">{s.role} · {s.station}</div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">ON CLOCK</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Music className="w-4 h-4 text-pink-400" /> Entertainers on Floor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeEntertainers.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">Nobody checked in yet.</p>
            ) : activeEntertainers.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-white text-sm font-bold">{s.stage_name || s.entertainer_id}</div>
                  <div className="text-[10px] text-slate-500">{s.location || "Main Floor"} · {s.status}</div>
                </div>
                <Badge className="bg-pink-500/15 text-pink-300 border-pink-500/30 text-[10px]">CHECKED IN</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> Recent Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysContracts.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">No contracts created today.</p>
          ) : (
            <div className="space-y-2">
              {todaysContracts.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-white text-sm font-bold">{c.customer_name || "Unknown"}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.contract_id || c.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 text-xs font-bold">{fmtMoney(c.grand_total || c.contract_amount)}</span>
                    <Badge className={c.is_signed ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]" : "bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]"}>
                      {c.is_signed ? "SIGNED" : c.status?.toUpperCase() || "DRAFT"}
                    </Badge>
                  </div>
                </div>
              ))}
              {todaysContracts.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full text-cyan-400 hover:text-cyan-300 text-xs"
                  onClick={() => navigate("/ContractsHub")}
                >
                  View all {todaysContracts.length} contracts <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderFloor = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> All Staff On Clock ({activeStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStaff.length === 0
              ? <p className="text-slate-500 text-xs">Nobody clocked in.</p>
              : activeStaff.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-white text-sm font-bold">{s.user_full_name || s.user_email}</div>
                    <div className="text-[10px] text-slate-500">
                      {s.role} · in at {new Date(s.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              ))}
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Music className="w-4 h-4 text-pink-400" /> All Entertainers Checked In ({activeEntertainers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeEntertainers.length === 0
              ? <p className="text-slate-500 text-xs">Nobody on the floor.</p>
              : activeEntertainers.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-white text-sm font-bold">{s.stage_name || s.entertainer_id}</div>
                    <div className="text-[10px] text-slate-500">
                      {s.location} · in at {new Date(s.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <Badge className="bg-pink-500/15 text-pink-300 border-pink-500/30 text-[10px]">{s.status}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContracts = () => (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Contracts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-400">
          {todaysContracts.length} created today · {signedToday} signed · {contracts.length} all-time.
        </p>
        <Button onClick={() => navigate("/ContractsHub")} className="bg-cyan-600 hover:bg-cyan-500 text-white">
          Open Contracts Hub <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderBody = () => {
    switch (tab) {
      case "tonight":      return renderTonight();
      case "staff":        return <StaffOnboardingPanel />;
      case "entertainers": return <OnboardingPacket />;
      case "floor":        return renderFloor();
      case "contracts":    return renderContracts();
      default:             return renderTonight();
    }
  };

  return (
    <NUPSAppShell
      title="Manager Console"
      subtitle="Floor ops · Onboarding · Live oversight"
      role="VENUE_MANAGER"
    >
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Tab strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  active
                    ? "bg-blue-600/30 border border-blue-500/50 text-white"
                    : "bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {renderBody()}
      </div>
    </NUPSAppShell>
  );
}