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
  { key: "dj",          label: "DJ Console",     icon: BarChart3,    roles: new Set(["manager","dj"]) },
  { key: "history",     label: "My Transactions", icon: BarChart3,   roles: new Set(["manager","bartender"]) },
];

export default function NUPSStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rbacRole, setRbacRole] = useState("door_girl");
  const [activeModule, setActiveModule] = useState("timeclock");
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const nupsSession = sessionStorage.getItem("nups_session");
        if (nupsSession) {
          const sessionUser = JSON.parse(nupsSession);
          setUser(sessionUser);
          const mapped = mapNUPSRoleToRBAC(sessionUser._highestRole || sessionUser.role);
          setRbacRole(mapped);
          setAuthChecked(true);
          return;
        }
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { navigate("/NUPSLogin"); return; }
        const me = await base44.auth.me();

        let permissionsData = null;
        try {
          const res = await base44.functions.invoke("getUserPermissions", {});
          permissionsData = res.data;
        } catch (e) { /* fallback */ }

        me._rbac = permissionsData;
        me._highestRole = permissionsData?.highest_role || (me.role === "admin" ? "VENUE_OWNER" : null);
        const mapped = mapNUPSRoleToRBAC(me._highestRole || me.role);
        setRbacRole(mapped);
        sessionStorage.setItem("nups_session", JSON.stringify(me));
        setUser(me);
      } catch {
        navigate("/NUPSLogin");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ["pos-transactions"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 50),
    enabled: !!user,
  });

  // TASK 7.1 – Filter demo/test transactions from ALL financial views
  const realTransactions = transactions.filter(t =>
    (!t.mode || t.mode === 'REAL') &&
    !t.transaction_id?.startsWith('DEMO-') &&
    !t.cashier?.includes('demo@')
  );
  const todayTransactions = realTransactions.filter(t => {
    return new Date(t.created_date).toDateString() === new Date().toDateString();
  });
  const todayRevenue = todayTransactions.reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const visibleModules = STAFF_MODULES.filter(m => m.roles.has(rbacRole));
  // Ensure active module is valid for this role
  const validKeys = new Set(visibleModules.map(m => m.key));
  const currentModule = validKeys.has(activeModule) ? activeModule : (visibleModules[0]?.key || "pos");

  const handleLogout = () => {
    sessionStorage.removeItem("nups_session");
    base44.auth.logout();
  };

  return (
    <NUPSRouteGuard requiredRoles={["VENUE_MANAGER","PLATFORM_ADMIN","VENUE_OWNER","BARTENDER","DJ","SECURITY"]}>
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

        {/* Module Content */}
        <div className="space-y-4 pb-8">
          {currentModule === "door_pos" && <POSCashRegister user={user} station="door" />}
          {currentModule === "bar_pos" && <POSBarRegister user={user} />}
          {currentModule === "door" && <GuestCheckIn />}
          {currentModule === "entertainer" && <EntertainerCheckIn user={user} />}
          {currentModule === "vip" && <VIPRoomBoard user={user} />}
          {currentModule === "timeclock" && (
            <TimeClock user={user} role={user?._highestRole || rbacRole} />
          )}
          {currentModule === "dj" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="w-16 h-16 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">DJ Console</h2>
              <p className="text-gray-400">DJ tools and music management coming soon.</p>
            </div>
          )}
          {currentModule === "history" && (
            <TransactionHistory
              transactions={realTransactions.filter(t => t.cashier === user?.email)}
              showReceipt={true}
            />
          )}
          {currentModule === "drivers" && <DriverDropOffTracker user={user} />}
        </div>

        <footer className="text-center text-[10px] text-gray-700 py-4 border-t border-gray-800 mt-8">
          {GLYPHLOCK_DISCLAIMER}
        </footer>
      </div>
    </div>
    </NUPSRouteGuard>
  );
}