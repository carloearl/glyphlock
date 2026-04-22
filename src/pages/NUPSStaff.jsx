import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, LogOut, ShoppingCart, DoorOpen, Users, Clock,
  Loader2, BarChart3, UserCheck, Star
} from "lucide-react";

import MusicSuitePanel from "@/components/mixer/suite/MusicSuitePanel";
import POSCashRegister from "../components/nups/POSCashRegister.jsx";
import GuestCheckIn from "../components/nups/GuestCheckIn.jsx";
import EntertainerCheckIn from "../components/nups/EntertainerCheckIn.jsx";
import TimeClock from "../components/nups/TimeClock.jsx";
import VIPRoomBoard from "../components/nups/VIPRoomBoard.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import POSBarRegister from "../components/nups/POSBarRegister.jsx";
import DriverDropOffTracker from "../components/nups/DriverDropOffTracker.jsx";
import OfflineSyncBanner from "../components/nups/OfflineSyncBanner.jsx";
import SEOHead from "@/components/SEOHead";
import { mapNUPSRoleToRBAC } from "../config/roles.js";
import { GLYPHLOCK_DISCLAIMER } from "@/constants/legalDisclaimer";

const STAFF_MODULES = [
  { key: "door_pos",    label: "Door Register",  icon: DoorOpen,    roles: new Set(["manager","door_girl","security"]) },
  { key: "drivers",     label: "Driver Payouts", icon: Users,        roles: new Set(["manager","door_girl"]) },
  { key: "bar_pos",     label: "Bar Register",   icon: ShoppingCart, roles: new Set(["manager","bartender"]) },
  { key: "door",        label: "Door / Check-In", icon: Users,        roles: new Set(["manager","door_girl","security"]) },
  { key: "entertainer", label: "Entertainers",   icon: UserCheck,    roles: new Set(["manager","door_girl"]) },
  { key: "vip",         label: "VIP Rooms",      icon: Star,         roles: new Set(["manager","hostess"]) },
  { key: "timeclock",   label: "Time Clock",     icon: Clock,        roles: new Set(["manager","bartender","door_girl","hostess","security","dj"]) },
  { key: "dj",          label: "DJ Console",     icon: BarChart3,    roles: new Set(["manager","dj","bartender","door_girl","hostess","security"]) },
  { key: "history",     label: "My Transactions", icon: BarChart3,   roles: new Set(["manager","bartender"]) },
];

export default function NUPSStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rbacRole, setRbacRole] = useState("door_girl");
  const [activeModule, setActiveModule] = useState("timeclock");
  const [isClockedIn, setIsClockedIn] = useState(() => {
    try {
      const stored = sessionStorage.getItem('nups_clock_status');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUser(u);
        setRbacRole(mapNUPSRoleToRBAC(u._highestRole || u.role));
      }
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  // Query active shifts — used for admin view only, NOT for gating
  const { data: activeShifts = [] } = useQuery({
    queryKey: ["staff-active-shifts"],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list("-created_date", 100);
      return allShifts.filter(s => !s.check_out_time);
    },
    enabled: !!user,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["pos-transactions"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 50),
    enabled: !!user && activeModule === "history",
    staleTime: 60000,
  });

  // TASK 7.1 – Filter demo/test transactions from ALL financial views — PLUS staff isolation
  const realTransactions = transactions.filter(t =>
    t.cashier === user?.email &&
    t.mode === 'REAL' &&
    !t.id?.startsWith('DEMO-') &&
    !t.cashier?.includes('demo@')
  );

  // Callback for TimeClock to notify when user clocks in/out
  const handleClockStatusChange = (isClockedInNow) => {
    setIsClockedIn(isClockedInNow);
    sessionStorage.setItem('nups_clock_status', String(isClockedInNow));
    // Unlock timeclock tab always; gate other tabs
    if (isClockedInNow) {
      setActiveModule(activeModule === 'timeclock' ? 'timeclock' : activeModule);
    } else {
      setActiveModule('timeclock');
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const effectiveRole = user?._viewAsRole ? mapNUPSRoleToRBAC(user._viewAsRole) : rbacRole;
  const visibleModules = STAFF_MODULES.filter(m => m.roles.has(effectiveRole));
  // Ensure active module is valid for this role
  const validKeys = new Set(visibleModules.map(m => m.key));
  const currentModule = validKeys.has(activeModule) ? activeModule : (visibleModules[0]?.key || "pos");

  const handleLogout = () => {
    sessionStorage.removeItem("nups_session");
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="N.U.P.S. Staff Portal | GlyphLock"
        description="Staff operations dashboard for N.U.P.S."
        url="/NUPSStaff"
      />
      <OfflineSyncBanner />

      {/* Header */}
      <header className="border-b border-cyan-500/20 p-3 sticky top-0 z-50 bg-black/95 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/NUPSGateway")}
              className="text-gray-400 hover:text-white p-2"
              aria-label="Back to gateway"
            >←</Button>
            <Shield className="w-5 h-5 text-cyan-400" />
            <div>
              <h1 className="text-base font-bold text-white leading-none">N.U.P.S. Staff</h1>
              <p className="text-[10px] text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs hidden sm:flex">
              {user?._highestRole || rbacRole}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 min-h-[40px]"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Module Nav */}
        <div className="flex flex-wrap gap-2 mb-5">
          {visibleModules.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => setActiveModule(key)}
              variant={currentModule === key ? "default" : "outline"}
              className={`min-h-[40px] text-sm transition-all ${
                currentModule === key
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500"
                  : "border-gray-700 text-gray-300 hover:border-cyan-500/50 hover:text-white bg-transparent"
              }`}
            >
              <Icon className="w-4 h-4 mr-2 shrink-0" />{label}
            </Button>
          ))}
        </div>

        {/* Clock-in gate — time clock always accessible; all other tabs locked until clocked in */}
        {!isClockedIn && currentModule !== "timeclock" && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Clock In Required</h2>
              <p className="text-gray-400 text-sm mt-1">You must clock in before accessing this module.</p>
            </div>
            <button
              onClick={() => setActiveModule("timeclock")}
              className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all"
            >
              Go to Time Clock
            </button>
          </div>
        )}

        {/* Module Content — only render when clocked in OR on time clock */}
        <div className="space-y-4 pb-8">
          {currentModule === "timeclock" && (
            <TimeClock user={user} role={user?._highestRole || rbacRole} onClockStatusChange={handleClockStatusChange} />
          )}
          {isClockedIn && currentModule !== 'timeclock' ? (
            <>
              {currentModule === "door_pos" && <POSCashRegister user={user} station="door" />}
              {currentModule === "bar_pos" && <POSBarRegister user={user} />}
              {currentModule === "door" && <GuestCheckIn />}
              {currentModule === "entertainer" && <EntertainerCheckIn user={user} />}
              {currentModule === "vip" && <VIPRoomBoard user={user} />}
              {currentModule === "dj" && <MusicSuitePanel />}
            </>
          ) : null}
          {isClockedIn && currentModule === "history" && (
            <TransactionHistory
              transactions={realTransactions.filter(t => t.cashier === user?.email)}
              showReceipt={true}
            />
          )}
          {isClockedIn && currentModule === "drivers" && isClockedIn && <DriverDropOffTracker user={user} />}
        </div>

        <footer className="text-center text-[10px] text-gray-700 py-4 border-t border-gray-800 mt-8">
          {GLYPHLOCK_DISCLAIMER}
        </footer>
      </div>
    </div>
  );
}