import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mic2, UserPlus, Clock, Users, CheckCircle2 } from "lucide-react";
import EntertainerCheckInComponent from "@/components/nups/EntertainerCheckIn";
import OnboardingPacket from "@/components/nups/OnboardingPacket";

/**
 * Entertainers Hub — single home for the contractor flow:
 *   • Checked In — live shifts on the floor right now
 *   • Roster    — every onboarded entertainer
 *   • Onboard   — new-hire packet (signing IS check-in for contractors)
 */
function StatPill({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
    violet:  "bg-violet-500/10 text-violet-300 border-violet-400/20",
    amber:   "bg-amber-500/10 text-amber-300 border-amber-400/20",
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${tones[tone]}`}>
      <Icon className="w-4 h-4" />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </div>
  );
}

function ShiftDuration({ start }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = Date.now() - new Date(start).getTime();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [start]);
  return <span className="font-mono">{elapsed}</span>;
}

export default function EntertainerCheckInPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("checkin");

  useEffect(() => {
    const load = async () => {
      try {
        const nupsSession = sessionStorage.getItem("nups_session");
        if (nupsSession) { setUser(JSON.parse(nupsSession)); return; }
        const u = await base44.auth.me().catch(() => null);
        setUser(u);
      } catch { /* anonymous OK */ }
    };
    load();
  }, []);

  const { data: roster = [] } = useQuery({
    queryKey: ["entertainers-roster"],
    queryFn: () => base44.entities.Entertainer.list("-created_date", 200),
    refetchInterval: 15_000,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["entertainers-active-shifts"],
    queryFn: () => base44.entities.EntertainerShift.filter({ status: "checked_in" }, "-check_in_time", 100),
    refetchInterval: 10_000,
  });

  const onboarded = roster.filter(e => e.contract_signed);
  const pending   = roster.filter(e => !e.contract_signed);
  const entById   = Object.fromEntries(roster.map(e => [e.id, e]));

  return (
    <div className="min-h-screen bg-slate-950 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(168,85,247,0.6)]">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Entertainers</h1>
              <p className="text-[11px] text-slate-500">Check-in · Roster · Onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatPill icon={Clock}        label="On Floor"   value={shifts.length}   tone="emerald" />
            <StatPill icon={Users}        label="Roster"     value={onboarded.length} tone="violet" />
            <StatPill icon={UserPlus}     label="Pending"    value={pending.length}   tone="amber" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-slate-900/60 border border-white/5 p-1">
            <TabsTrigger value="checkin"  className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-200">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Checked In
            </TabsTrigger>
            <TabsTrigger value="roster"   className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-200">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Roster
            </TabsTrigger>
            <TabsTrigger value="onboard"  className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-200">
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Onboard
            </TabsTrigger>
          </TabsList>

          {/* CHECKED IN — live floor + PIN check-in pad */}
          <TabsContent value="checkin" className="mt-4 space-y-4">
            {shifts.length > 0 && (
              <Card className="bg-slate-900/40 border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    On the Floor Now
                  </h3>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-400/20">{shifts.length} active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {shifts.map(s => {
                    const ent = entById[s.entertainer_id];
                    return (
                      <div key={s.id} className="p-3 rounded-lg bg-emerald-500/[0.04] border border-emerald-400/20 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-sm">{ent?.stage_name || "Unknown"}</div>
                          <div className="text-[11px] text-slate-500">{s.location || "Main Floor"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Shift</div>
                          <div className="text-sm text-emerald-300"><ShiftDuration start={s.check_in_time} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <EntertainerCheckInComponent user={user} />
          </TabsContent>

          {/* ROSTER — every onboarded entertainer */}
          <TabsContent value="roster" className="mt-4">
            <Card className="bg-slate-900/40 border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Onboarded Roster</h3>
                <Badge className="bg-violet-500/10 text-violet-300 border-violet-400/20">{onboarded.length} total</Badge>
              </div>
              {onboarded.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No entertainers onboarded yet. Use the Onboard tab to add the first one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {onboarded.map(e => {
                    const onShift = shifts.some(s => s.entertainer_id === e.id);
                    return (
                      <div key={e.id} className={`p-3 rounded-lg border flex items-center justify-between ${
                        onShift ? "bg-emerald-500/[0.04] border-emerald-400/20" : "bg-white/[0.02] border-white/5"
                      }`}>
                        <div>
                          <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                            {e.stage_name}
                            {onShift && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          </div>
                          <div className="text-[11px] text-slate-500">{e.legal_name}</div>
                        </div>
                        <Badge className={`text-[10px] ${
                          e.contract_status === "VALID" ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}>
                          {e.contract_status || e.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ONBOARD — new hire packet (signing = activation = check-in) */}
          <TabsContent value="onboard" className="mt-4">
            <Card className="bg-slate-900/40 border-white/5 p-4">
              <OnboardingPacket currentUser={user} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}