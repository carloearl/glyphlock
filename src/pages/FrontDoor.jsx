import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, AlertCircle, Ticket } from "lucide-react";
import { hasPermission } from "@/config/roles";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import RoleClassGuard from "@/components/nups/RoleClassGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import GuestCheckIn from "@/components/nups/GuestCheckIn";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import DriverQuickAdd from "@/components/nups/frontdoor/DriverQuickAdd";
import StaffClockInOut from "@/components/nups/StaffClockInOut";
import POSCashRegister from "@/components/nups/POSCashRegister";
import BatchConfirmControl from "@/components/nups/register/BatchConfirmControl";
import FrontDoorStats from "@/components/nups/frontdoor/FrontDoorStats";
import SettlementTicker from "@/components/nups/frontdoor/SettlementTicker";
import FundsOffDrawerPanel from "@/components/nups/frontdoor/FundsOffDrawerPanel";
import FrontDoorConfigPanel from "@/components/nups/frontdoor/FrontDoorConfigPanel";
import EmergencyOverrideButton from "@/components/nups/frontdoor/EmergencyOverrideButton";
import OperatorStatusBar from "@/components/nups/frontdoor/OperatorStatusBar";
import FrontDoorSideNav from "@/components/nups/frontdoor/FrontDoorSideNav";
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

// Workflow order — what comes first in real life at the door.
const STEP_ORDER = ["drivers", "guests", "dancers", "staff"];

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
          // ─── 3-PANEL FRONT DOOR ──────────────────────────────────────────
          // ┌─────────────┬──────────────────────┬──────────────────────────┐
          // │ ① Workflow  │  ② Active Step       │  ③ Live Pulse            │
          // │   Rail      │     (Driver / Guest  │     (Stats · Settlement  │
          // │             │      / Dancer /Staff)│      · Funds-Off Drawer) │
          // └─────────────┴──────────────────────┴──────────────────────────┘
          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px] gap-5">
            {/* Panel 1 — Workflow rail */}
            <div>
              <FrontDoorSideNav
                activeId={activeTab}
                onSelect={setActiveTab}
                enabledIds={enabledIds}
              />
            </div>

            {/* Panel 2 — Active workflow content */}
            <div className="min-w-0 rounded-xl border border-white/5 bg-slate-950/40 p-4">
              {activeTab === "drivers" && <DriverQuickAdd user={user} />}
              {activeTab === "guests" && <GuestCheckIn />}
              {activeTab === "register" && (
                <div className="space-y-3">
                  <BatchConfirmControl operatorName={user?.full_name || user?.username} />
                  <POSCashRegister station="door" user={user} venueId={venueId} />
                </div>
              )}
              {activeTab === "dancers" && <EntertainerCheckIn user={user} />}
              {activeTab === "staff" && <StaffClockInOut user={user} venueId={venueId} station="door" />}
            </div>

            {/* Panel 3 — Live pulse */}
            <div className="space-y-4">
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
            </div>
          </div>
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