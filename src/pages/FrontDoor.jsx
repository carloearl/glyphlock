import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Settings, AlertCircle } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import GuestCheckIn from "@/components/nups/GuestCheckIn";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import DriverQuickAdd from "@/components/nups/frontdoor/DriverQuickAdd";
import StaffClockInOut from "@/components/nups/StaffClockInOut";
import FrontDoorStats from "@/components/nups/frontdoor/FrontDoorStats";
import SettlementTicker from "@/components/nups/frontdoor/SettlementTicker";
import FundsOffDrawerPanel from "@/components/nups/frontdoor/FundsOffDrawerPanel";
import FrontDoorConfigPanel from "@/components/nups/frontdoor/FrontDoorConfigPanel";
import EmergencyOverrideButton from "@/components/nups/frontdoor/EmergencyOverrideButton";
import OperatorStatusBar from "@/components/nups/frontdoor/OperatorStatusBar";
import FrontDoorSideNav from "@/components/nups/frontdoor/FrontDoorSideNav";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useFrontDoorConfig, DEFAULT_FRONT_DOOR_CONFIG } from "@/hooks/useFrontDoorConfig";

/**
 * FrontDoor — Unified onboarding console for the door operator.
 *
 * Tabs, labels, dashboard widgets, and visibility all driven by FrontDoorConfig
 * (per-venue, edited live by admins via the gear icon). Zero hardcoded layout.
 */
export default function FrontDoor() {
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
      <FrontDoorContent />
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
    try {
      const raw = sessionStorage.getItem("nups_session");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // guard already validated auth
    }
  }, []);

  // Default to step 1 — the first thing that happens at the door.
  useEffect(() => {
    if (enabledIds.length === 0) return;
    if (!activeTab || !enabledIds.includes(activeTab)) {
      setActiveTab(enabledIds[0]);
    }
  }, [enabledIds, activeTab]);

  const handleSignOut = () => {
    if (typeof window !== "undefined" &&
        !window.confirm("Sign out of Front Door? Any unsaved work will be lost.")) return;
    sessionStorage.removeItem("nups_session");
    navigate("/NUPSLogin");
  };

  const role = (user?.role || "").toUpperCase();
  const canEditConfig = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"].includes(role);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-violet-950/30 via-black to-blue-950/30 px-4 py-3 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-tight">Front Door</h1>
                {(user?.full_name || user?.role || activeVenue?.name) && (
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    {user?.full_name || user?.username || "Operator"}
                    {user?.role && (
                      <span className="ml-2 text-violet-400 uppercase tracking-wider">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    )}
                    {activeVenue?.name && (
                      <span className="ml-2 text-slate-400">· {activeVenue.name}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <EmergencyOverrideButton venueId={venueId} />
              {canEditConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigOpen(true)}
                  className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
                  title="Configure Front Door tabs and dashboard"
                >
                  <Settings className="w-3.5 h-3.5 mr-1.5" /> Configure
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
              </Button>
            </div>
          </div>
          {/* Always-on operator status: name · role · venue · mode · shift */}
          <OperatorStatusBar
            user={user}
            venueId={venueId}
            venueName={activeVenue?.name || activeVenue?.venue_name}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {effective.notes && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{effective.notes}</span>
          </div>
        )}

        {effective.show_stats && <FrontDoorStats venueId={venueId} />}

        {effective.show_settlement_ticker && (
          <SettlementTicker
            venueId={venueId}
            businessDate={new Date().toISOString().split("T")[0]}
          />
        )}

        {/* DACO-20260613-DOOR-RBAC — Funds-Off Drawer panel.
            Auto-hides when no validation_run records exist. */}
        <FundsOffDrawerPanel
          venueId={venueId}
          businessDate={new Date().toISOString().split("T")[0]}
        />

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
          <div className="flex flex-col lg:flex-row gap-6">
            <FrontDoorSideNav
              activeId={activeTab}
              onSelect={setActiveTab}
              enabledIds={enabledIds}
            />
            <div className="flex-1 min-w-0">
              {activeTab === "drivers" && <DriverQuickAdd user={user} />}
              {activeTab === "guests" && <GuestCheckIn />}
              {activeTab === "dancers" && <EntertainerCheckIn user={user} />}
              {activeTab === "staff" && <StaffClockInOut user={user} venueId={venueId} station="door" />}
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
    </div>
  );
}