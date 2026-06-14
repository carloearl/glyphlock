import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, Users, Sparkles, Car, Clock, LogOut, Settings, AlertCircle } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import GuestCheckIn from "@/components/nups/GuestCheckIn";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import DriverDropOffTracker from "@/components/nups/DriverDropOffTracker";
import ShiftClockInOut from "@/components/nups/ShiftClockInOut";
import StaffClockInOut from "@/components/nups/StaffClockInOut";
import FrontDoorStats from "@/components/nups/frontdoor/FrontDoorStats";
import SettlementTicker from "@/components/nups/frontdoor/SettlementTicker";
import FrontDoorConfigPanel from "@/components/nups/frontdoor/FrontDoorConfigPanel";
import EmergencyOverrideButton from "@/components/nups/frontdoor/EmergencyOverrideButton";
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

// Static tab definitions — visual chrome only. Visibility / order / labels
// come from FrontDoorConfig.
const TAB_VISUALS = {
  guests:  { icon: Users,    activeCls: "data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-300" },
  dancers: { icon: Sparkles, activeCls: "data-[state=active]:bg-pink-600/30 data-[state=active]:text-pink-300" },
  drivers: { icon: Car,      activeCls: "data-[state=active]:bg-yellow-600/30 data-[state=active]:text-yellow-300" },
  staff:   { icon: Clock,    activeCls: "data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-300" },
};

function FrontDoorContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;

  const { config, save } = useFrontDoorConfig(venueId);
  const effective = config || { ...DEFAULT_FRONT_DOOR_CONFIG, venue_id: venueId };
  const visibleTabs = (effective.tabs || []).filter(t => t.enabled);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nups_session");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // guard already validated auth
    }
  }, []);

  // Pick the first visible tab if the active one was disabled
  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!activeTab || !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const handleSignOut = () => {
    sessionStorage.removeItem("nups_session");
    navigate("/NUPSLogin");
  };

  const role = (user?.role || "").toUpperCase();
  const canEditConfig = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "SOVEREIGN"].includes(role);

  const gridColsCls =
    visibleTabs.length === 1 ? "grid-cols-1"
    : visibleTabs.length === 2 ? "grid-cols-2"
    : visibleTabs.length === 3 ? "grid-cols-3"
    : "grid-cols-4";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-violet-950/30 via-black to-blue-950/30 px-4 py-4 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Front Door</h1>
              <p className="text-xs text-gray-500">
                {user?.full_name || user?.username || "Operator"}
                {user?.role && (
                  <span className="ml-2 text-violet-400 uppercase tracking-wider">
                    {user.role.replace(/_/g, " ")}
                  </span>
                )}
              </p>
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

        {visibleTabs.length === 0 ? (
          <div className="bg-red-950/30 border border-red-500/40 rounded-lg p-6 text-center">
            <p className="text-red-300 font-semibold">All tabs are disabled.</p>
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
          <Tabs value={activeTab || visibleTabs[0].id} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid ${gridColsCls} w-full bg-gray-900/60 border border-white/5 h-auto p-1 mb-6`}>
              {visibleTabs.map(tab => {
                const visual = TAB_VISUALS[tab.id];
                const Icon = visual?.icon || Users;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`${visual?.activeCls || ""} py-3 flex flex-col gap-1 h-auto`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {visibleTabs.some(t => t.id === "guests") && (
              <TabsContent value="guests" className="mt-0"><GuestCheckIn /></TabsContent>
            )}
            {visibleTabs.some(t => t.id === "dancers") && (
              <TabsContent value="dancers" className="mt-0"><EntertainerCheckIn user={user} /></TabsContent>
            )}
            {visibleTabs.some(t => t.id === "drivers") && (
              <TabsContent value="drivers" className="mt-0"><DriverDropOffTracker user={user} /></TabsContent>
            )}
            {visibleTabs.some(t => t.id === "staff") && (
              <TabsContent value="staff" className="mt-0">
                <StaffClockInOut user={user} venueId={venueId} station="door" />
              </TabsContent>
            )}
          </Tabs>
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