import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, AlertCircle, Ticket, Music, Clock } from "lucide-react";
import { hasPermission } from "@/config/roles";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import RoleClassGuard from "@/components/nups/RoleClassGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import GuestCheckIn from "@/components/nups/GuestCheckIn";
import DriverQuickAdd from "@/components/nups/frontdoor/DriverQuickAdd";
import BatchConfirmControl from "@/components/nups/register/BatchConfirmControl";
import FrontDoorStats from "@/components/nups/frontdoor/FrontDoorStats";
import SettlementTicker from "@/components/nups/frontdoor/SettlementTicker";
import FundsOffDrawerPanel from "@/components/nups/frontdoor/FundsOffDrawerPanel";
import FrontDoorConfigPanel from "@/components/nups/frontdoor/FrontDoorConfigPanel";
import EmergencyOverrideButton from "@/components/nups/frontdoor/EmergencyOverrideButton";
import OperatorStatusBar from "@/components/nups/frontdoor/OperatorStatusBar";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useFrontDoorConfig, DEFAULT_FRONT_DOOR_CONFIG } from "@/hooks/useFrontDoorConfig";

/**
 * FrontDoor — Unified onboarding console for the door operator.
 *
 * Tabs, labels, dashboard widgets, and visibility all driven by FrontDoorConfig
 * (per-venue, edited live by admins via the gear icon). Zero hardcoded layout.
 */
export default function FrontDoor() {
  // DACO 003 §2 — role-class scoping. STAFF works the door, MANAGER supervises,
  // ADMIN is the superset. ENTERTAINERs never see the register.
  // Legacy NUPSRouteGuard stays as an authentication gate; RoleClassGuard is
  // the canonical §2 scope check.
  return (
    <NUPSRouteGuard
      requiredRoles={[
        "PLATFORM_ADMIN",
        "VENUE_OWNER",
        "VENUE_MANAGER",
        "FLOOR_HOST",
        "DOOR_GIRL",
        "DOORMAN",
        "SECURITY",
      ]}
    >
      <RoleClassGuard allow={["STAFF", "MANAGER", "ADMIN"]}>
        <FrontDoorContent />
      </RoleClassGuard>
    </NUPSRouteGuard>
  );
}

// Workflow order — ID verification is ALWAYS first at the door.
const STEP_ORDER = ["guests", "drivers", "dancers", "staff"];

// Full flow including the permanent Register step — this is the vertical
// scroll order of the page (top → bottom = the order of every guest's night).
const FLOW_META = {
  guests:   { step: 1, title: "Guest Check-In",       hint: "Scan ID — verify age first" },
  drivers:  { step: 2, title: "Driver Drop-Off",      hint: "Tap a driver, +1 per guest" },
  register: { step: 3, title: "Ring Up",              hint: "Cover, drinks, payouts" },
  dancers:  { step: 4, title: "Entertainer Check-In", hint: "Acknowledgments + clock in" },
  staff:    { step: 5, title: "Staff Clock In/Out",   hint: "Punch in for shift" },
};

// One full-screen section per workflow step — vertical flow directive
// 2026-07-20: each section covers the screen for phones, tablets, desktops.
function FlowSection({ id, meta, children }) {
  return (
    <section
      id={`fd-${id}`}
      className="min-h-[100svh] w-full flex flex-col py-5 scroll-mt-20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black shrink-0">
          {meta.step}
        </div>
        <div>
          <h2 className="text-lg font-black text-white leading-tight">{meta.title}</h2>
          <p className="text-xs text-slate-400">{meta.hint}</p>
        </div>
      </div>
      <div className="flex-1 rounded-xl border border-white/5 bg-slate-950/40 p-4">
        {children}
      </div>
    </section>
  );
}

// Launch card — same pattern as the Ring Up step: one big button that jumps
// to the feature's canonical page instead of embedding a duplicate copy.
function LaunchCard({ icon: Icon, tone, title, subtitle, onClick }) {
  const tones = {
    pink:    "border-pink-500/40 from-pink-600/15 via-fuchsia-600/10 hover:border-pink-400",
    emerald: "border-emerald-500/40 from-emerald-600/15 via-teal-600/10 hover:border-emerald-400",
  };
  const iconTones = {
    pink:    "bg-pink-500/20 border-pink-500/40 text-pink-300",
    emerald: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  };
  const goTones = { pink: "text-pink-300", emerald: "text-emerald-300" };
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[120px] rounded-xl border bg-gradient-to-br to-transparent transition-colors flex items-center gap-5 p-6 text-left active:scale-[0.99] ${tones[tone]}`}
    >
      <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${iconTones[tone]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-white text-xl">{title}</div>
        <div className="text-sm text-slate-400 mt-0.5">{subtitle}</div>
      </div>
      <div className={`font-mono text-sm shrink-0 ${goTones[tone]}`}>GO →</div>
    </button>
  );
}

function FrontDoorContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;

  const { config, save } = useFrontDoorConfig(venueId);
  const effective = config || { ...DEFAULT_FRONT_DOOR_CONFIG, venue_id: venueId };
  const enabledIds = (effective.tabs || [])
    .filter(t => t.enabled)
    .map(t => t.id)
    .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b));

  useEffect(() => {
    (async () => {
      // 1) Kiosk PIN session (staff clocked in at the door)
      try {
        const raw = sessionStorage.getItem("nups_session");
        if (raw) { setUser(JSON.parse(raw)); return; }
      } catch { /* fall through */ }
      // 2) Platform sign-in (owner/admin/manager back-office identity)
      try {
        const me = await base44.auth.me();
        const rows = await base44.entities.NUPSUser.filter({ username: me.email });
        const nu = rows?.[0];
        setUser({
          full_name: nu?.full_name || me.full_name,
          username: me.email,
          email: me.email,
          role: nu?.role || (me.role === "admin" ? "PLATFORM_ADMIN" : ""),
          venue_id: nu?.venue_id,
        });
      } catch { /* guard already validated auth */ }
    })();
  }, []);

  // Default to step 1 — the first thing that happens at the door.
  // "register" is a permanent in-place step (not in the config's tab list) —
  // it must never be snapped back to step 1 (Ring Up bug, 2026-07-17).
  useEffect(() => {
    if (enabledIds.length === 0) return;
    if (!activeTab || (activeTab !== "register" && !enabledIds.includes(activeTab))) {
      setActiveTab(enabledIds[0]);
    }
  }, [enabledIds, activeTab]);

  const handleSignOut = () => {
    if (typeof window !== "undefined" &&
        !window.confirm("Sign out of Front Door? Any unsaved work will be lost.")) return;
    sessionStorage.removeItem("nups_session");
    navigate("/NUPSKiosk");
  };

  const role = (user?.role || "").toUpperCase();
  const canEditConfig = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"].includes(role);
  // §4b — permission-gated, NOT hidden-by-CSS. The button renders ONLY when the
  // logged-in role's allowlist includes create_vip_contract; every other role
  // is not-rendered (no inert element left in the DOM).
  const canCreateVipContract = hasPermission(role, "CREATE_VIP_CONTRACT");

  const actions = (
    <>
      {canCreateVipContract && (
        <Button
          size="sm"
          onClick={() => navigate("/Contracts")}
          className="min-h-[64px] px-5 font-bold rounded-xl bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-amber-400/50 text-amber-300 hover:border-amber-300 hover:text-amber-200 shadow-[0_0_20px_-6px_rgba(251,191,36,0.5)]"
          title="Start a new VIP contract"
        >
          <Ticket className="w-5 h-5 mr-2" /> VIP Contract
        </Button>
      )}
      <EmergencyOverrideButton venueId={venueId} />
      {canEditConfig && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfigOpen(true)}
          className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
          title="Configure Front Door tabs and dashboard"
        >
          <Settings className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Configure</span>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
      >
        <LogOut className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </>
  );

  return (
    <NUPSAppShell
      title="Front Door"
      subtitle={`${user?.full_name || user?.username || "Operator"}${user?.role ? " · " + user.role.replace(/_/g, " ") : ""}${activeVenue?.name ? " · " + activeVenue.name : ""}`}
      actions={actions}
      role={(user?.role || "DOOR_GIRL").toUpperCase()}
    >
      <div className="max-w-[1500px] mx-auto">
        <OperatorStatusBar
          user={user}
          venueId={venueId}
          venueName={activeVenue?.name || activeVenue?.venue_name}
        />
        {effective.notes && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{effective.notes}</span>
          </div>
        )}

        {enabledIds.length === 0 ? (
          <div className="bg-red-950/30 border border-red-500/40 rounded-lg p-6 text-center">
            <p className="text-red-300 font-semibold">All workflow steps are disabled.</p>
            {canEditConfig && (
              <Button
                onClick={() => setConfigOpen(true)}
                className="mt-3 bg-violet-600 hover:bg-violet-500 text-white"
              >
                <Settings className="w-4 h-4 mr-1" /> Open Configuration
              </Button>
            )}
          </div>
        ) : (
          // ─── VERTICAL FLOW FRONT DOOR ────────────────────────────────────
          // One full-screen section per step, stacked top → bottom in the
          // order of every guest's night. Sticky jump bar for fast hops.
          (() => {
            const flowIds = ["guests", "drivers", "register", "dancers", "staff"]
              .filter(id => id === "register" || enabledIds.includes(id));
            const jumpTo = (id) => {
              setActiveTab(id);
              document.getElementById(`fd-${id}`)?.scrollIntoView({ behavior: "smooth" });
            };
            return (
              <div className="w-full">
                {/* Sticky step jump bar */}
                <div className="sticky top-12 z-30 -mx-1 px-1 py-2 bg-[#0a0f1a]/90 backdrop-blur border-b border-white/5 flex gap-1.5 overflow-x-auto scrollbar-hide rounded-b-xl">
                  {flowIds.map(id => (
                    <button
                      key={id}
                      onClick={() => jumpTo(id)}
                      className="shrink-0 min-h-[44px] px-3 rounded-lg text-xs font-bold bg-slate-900/70 border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                    >
                      {FLOW_META[id].step}. {FLOW_META[id].title}
                    </button>
                  ))}
                  <button
                    onClick={() => document.getElementById("fd-pulse")?.scrollIntoView({ behavior: "smooth" })}
                    className="shrink-0 min-h-[44px] px-3 rounded-lg text-xs font-bold bg-slate-900/70 border border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
                  >
                    Live Pulse
                  </button>
                </div>

                {/* Full-screen sections, in night order */}
                {flowIds.map(id => (
                  <FlowSection key={id} id={id} meta={FLOW_META[id]}>
                    {id === "guests" && <GuestCheckIn />}
                    {id === "drivers" && <DriverQuickAdd user={user} />}
                    {id === "register" && (
                      <div className="space-y-3">
                        <BatchConfirmControl operatorName={user?.full_name || user?.username} />
                        {/* ONE register rule (owner directive 2026-07-20): the door
                            till lives ONLY on /Register. This step launches it —
                            no second live register embedded here. */}
                        <button
                          onClick={() => navigate("/Register")}
                          className="w-full min-h-[120px] rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-600/15 via-blue-600/10 to-transparent hover:border-cyan-400 transition-colors flex items-center gap-5 p-6 text-left active:scale-[0.99]"
                        >
                          <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                            <Ticket className="w-7 h-7 text-cyan-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-white text-xl">Open the Register</div>
                            <div className="text-sm text-slate-400 mt-0.5">Cover, drinks & payouts ring up on the POS terminal — one register, one drawer.</div>
                          </div>
                          <div className="text-cyan-300 font-mono text-sm shrink-0">GO →</div>
                        </button>
                      </div>
                    )}
                    {/* ONE home per feature (Section 1 fix, 2026-07-21): talent
                        check-in and staff clock live on their own pages — these
                        steps LAUNCH them, no duplicate embedded forms. */}
                    {id === "dancers" && (
                      <LaunchCard
                        icon={Music}
                        tone="pink"
                        title="Open Entertainer Check-In"
                        subtitle="Acknowledgments + PIN clock-in on the dedicated door station."
                        onClick={() => navigate("/EntertainerCheckIn")}
                      />
                    )}
                    {id === "staff" && (
                      <LaunchCard
                        icon={Clock}
                        tone="emerald"
                        title="Open Staff Clock In/Out"
                        subtitle="Punch in for shift at the kiosk time clock."
                        onClick={() => navigate("/NUPSKiosk?panel=clockIn")}
                      />
                    )}
                  </FlowSection>
                ))}

                {/* Live Pulse — final section */}
                <section id="fd-pulse" className="min-h-[100svh] w-full py-5 scroll-mt-20 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-black shrink-0">
                      ⚡
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white leading-tight">Live Pulse</h2>
                      <p className="text-xs text-slate-400">Stats · Settlement · Funds-Off Drawer</p>
                    </div>
                  </div>
                  {effective.show_stats && (
                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Live Floor</div>
                      <FrontDoorStats venueId={venueId} />
                    </div>
                  )}
                  {effective.show_settlement_ticker && (
                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Settlement</div>
                      <SettlementTicker
                        venueId={venueId}
                        businessDate={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  )}
                  <FundsOffDrawerPanel
                    venueId={venueId}
                    businessDate={new Date().toISOString().split("T")[0]}
                  />
                </section>
              </div>
            );
          })()
        )}
      </div>

      <FrontDoorConfigPanel
        open={configOpen}
        onOpenChange={setConfigOpen}
        config={effective}
        onSave={(next) => save.mutateAsync(next)}
        user={user}
      />
    </NUPSAppShell>
  );
}