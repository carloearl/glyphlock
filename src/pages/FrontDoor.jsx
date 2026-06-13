import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, Users, Sparkles, Car, Clock, LogOut } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import GuestCheckIn from "@/components/nups/GuestCheckIn";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import DriverDropOffTracker from "@/components/nups/DriverDropOffTracker";
import ShiftClockInOut from "@/components/nups/ShiftClockInOut";
import FrontDoorStats from "@/components/nups/frontdoor/FrontDoorStats";
import { useActiveVenue } from "@/hooks/useActiveVenue";

/**
 * FrontDoor — Unified onboarding console for the door operator.
 * 
 * One screen, four tabs, all the people who walk through the door:
 *   Guests → ID-verified VIP entry (age-gated)
 *   Dancers → PIN-pad shift check-in
 *   Drivers → QR-scan + nightly drop tracking
 *   Staff → Clock in/out
 *
 * RBAC: gated by NUPSRouteGuard. Door-tier roles + management see it.
 */
export default function FrontDoor() {
  return (
    <NUPSRouteGuard
      requiredRoles={[
        "PLATFORM_ADMIN",
        "VENUE_OWNER",
        "VENUE_MANAGER",
        "FLOOR_HOST",
        "SECURITY",
      ]}
    >
      <FrontDoorContent />
    </NUPSRouteGuard>
  );
}

function FrontDoorContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("guests");
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nups_session");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore — guard already validated auth
    }
  }, []);

  const handleSignOut = () => {
    sessionStorage.removeItem("nups_session");
    navigate("/NUPSLogin");
  };

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

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Live stats */}
        <FrontDoorStats venueId={venueId} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-gray-900/60 border border-white/5 h-auto p-1 mb-6">
            <TabsTrigger
              value="guests"
              className="data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-300 py-3 flex flex-col gap-1 h-auto"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold">Guests</span>
            </TabsTrigger>
            <TabsTrigger
              value="dancers"
              className="data-[state=active]:bg-pink-600/30 data-[state=active]:text-pink-300 py-3 flex flex-col gap-1 h-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold">Dancers</span>
            </TabsTrigger>
            <TabsTrigger
              value="drivers"
              className="data-[state=active]:bg-yellow-600/30 data-[state=active]:text-yellow-300 py-3 flex flex-col gap-1 h-auto"
            >
              <Car className="w-4 h-4" />
              <span className="text-xs font-bold">Drivers</span>
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-300 py-3 flex flex-col gap-1 h-auto"
            >
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold">Staff</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="mt-0">
            <GuestCheckIn />
          </TabsContent>

          <TabsContent value="dancers" className="mt-0">
            <EntertainerCheckIn user={user} />
          </TabsContent>

          <TabsContent value="drivers" className="mt-0">
            <DriverDropOffTracker user={user} />
          </TabsContent>

          <TabsContent value="staff" className="mt-0">
            <ShiftClockInOut user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}