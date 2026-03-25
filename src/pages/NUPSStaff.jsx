import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShoppingCart, LogOut, Users, FileText, Clock, CreditCard, Loader2, DollarSign, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import POSCashRegister from "../components/nups/POSCashRegister.jsx";
import NUPSRouteGuard from "../components/nups/NUPSRouteGuard.jsx";
import BatchManagement from "../components/nups/BatchManagement.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import TimeClock from "../components/nups/TimeClock.jsx";
import UnifiedDreamDollarHub from "../components/nups/UnifiedDreamDollarHub";
import VIPRoomBoard from "../components/nups/VIPRoomBoard.jsx";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { GLYPHLOCK_DISCLAIMER } from '@/constants/legalDisclaimer';
import OfflineSyncBanner from "../components/nups/OfflineSyncBanner.jsx";
import { mapNUPSRoleToRBAC, hasPermission, ROLES } from '../src/config/roles.js';

export default function NUPSStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rbacRole, setRbacRole] = useState(ROLES.BARTENDER);

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
        if (!isAuth) { navigate('/NUPSLogin'); return; }
        const currentUser = await base44.auth.me();

        try {
          const res = await base44.functions.invoke('getUserPermissions', {});
          currentUser._rbac = res.data;
          currentUser._highestRole = res.data?.highest_role || null;
        } catch (e) {}

        const OWNER_TIER = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];
        const hasOwnerAccess = currentUser._rbac?.venue_access?.some(
          va => OWNER_TIER.includes(va.role_key)
        ) || currentUser.role === "admin";
        if (hasOwnerAccess) { navigate('/NUPSOwner'); return; }

        const mapped = mapNUPSRoleToRBAC(currentUser._highestRole || currentUser.role);
        setRbacRole(mapped);

        sessionStorage.setItem("nups_session", JSON.stringify(currentUser));
        setUser(currentUser);
      } catch (error) {
        navigate('/NUPSLogin');
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ["staff-transactions", user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allTransactions = await base44.entities.POSTransaction.list("-created_date", 100);
      return allTransactions.filter((t) => t.cashier === user.email);
    },
    enabled: !!user,
  });

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const todayTransactions = transactions.filter((t) => {
    const txDate = new Date(t.created_date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

  // RBAC-gated tab visibility
  const canAccessPOS = hasPermission(rbacRole, 'ACCESS_POS');
  const canAccessVIP = hasPermission(rbacRole, 'ACCESS_VIP_ROOMS');
  const canAccessBatch = hasPermission(rbacRole, 'ACCESS_BATCH_MANAGEMENT');
  const canClockIn = hasPermission(rbacRole, 'CLOCK_IN_OUT');

  // Determine default tab based on role
  const getDefaultTab = () => {
    if (canAccessVIP && !canAccessPOS) return 'vip';
    if (canClockIn && !canAccessPOS && !canAccessVIP) return 'timeclock';
    return 'register';
  };

  // Role label for display
  const roleLabels = {
    manager: 'Manager', bartender: 'Bartender', door_girl: 'Door',
    hostess: 'Hostess', security: 'Security', dj: 'DJ'
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="N.U.P.S. Staff Terminal | GlyphLock"
        description="Staff point-of-sale terminal."
        keywords="POS terminal, staff timeclock, GlyphLock NUPS"
        url="/nups-staff"
      />
      <OfflineSyncBanner />
      <header className="border-b border-cyan-500/20 p-4 sticky top-0 bg-black/95 backdrop-blur-lg" style={{ zIndex: 9990, position: 'sticky', pointerEvents: 'auto' }}>
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">N.U.P.S. POS</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Staff Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {canAccessPOS && (
              <div className="bg-gray-900/80 px-3 py-1.5 rounded-lg hidden sm:block">
                <div className="text-xs text-gray-400">Today</div>
                <div className="text-base font-bold text-green-400">${todayRevenue.toFixed(2)}</div>
              </div>
            )}
            <div className="hidden md:flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white truncate max-w-[120px]">{user?.email}</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs">
                {roleLabels[rbacRole] || user?._highestRole || "Staff"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 min-h-[44px]"
              aria-label="Sign out of staff terminal"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6" style={{ position: 'relative', zIndex: 20 }}>
        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <TabsList className="bg-gray-900/95 border border-cyan-500/30 flex gap-1 p-1.5 w-full min-h-0 flex-wrap" style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto' }}>
            {canAccessPOS && (
              <TabsTrigger value="register" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 flex-1" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <ShoppingCart className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Register</span>
              </TabsTrigger>
            )}
            {canAccessPOS && (
              <TabsTrigger value="contracts" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 flex-1" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <DollarSign className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Contracts</span>
              </TabsTrigger>
            )}
            {canAccessBatch && (
              <TabsTrigger value="batch" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 flex-1" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Batch</span>
              </TabsTrigger>
            )}
            {canAccessVIP && (
              <TabsTrigger value="vip" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 flex-1" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <DoorOpen className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">VIP Rooms</span>
              </TabsTrigger>
            )}
            {canClockIn && (
              <TabsTrigger value="timeclock" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 flex-1" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <Clock className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Time Clock</span>
              </TabsTrigger>
            )}
            {canAccessPOS && (
              <TabsTrigger value="history" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 flex-1" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                <FileText className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">My Sales</span>
              </TabsTrigger>
            )}
          </TabsList>

          {canAccessPOS && (
            <TabsContent value="register" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <POSCashRegister user={user} />
            </TabsContent>
          )}
          {canAccessPOS && (
            <TabsContent value="contracts" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <UnifiedDreamDollarHub venue_id="dream_palace" />
            </TabsContent>
          )}
          {canAccessBatch && (
            <TabsContent value="batch" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <BatchManagement user={user} />
            </TabsContent>
          )}
          {canAccessVIP && (
            <TabsContent value="vip" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <VIPRoomBoard />
            </TabsContent>
          )}
          {canClockIn && (
            <TabsContent value="timeclock" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <TimeClock user={user} role={user?._highestRole || "BARTENDER"} />
            </TabsContent>
          )}
          {canAccessPOS && (
            <TabsContent value="history" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
              <TransactionHistory transactions={todayTransactions} showReceipt={true} />
            </TabsContent>
          )}
        </Tabs>

        <footer className="text-center text-[10px] text-gray-700 py-6 border-t border-gray-800 mt-12">
          {GLYPHLOCK_DISCLAIMER}
        </footer>
      </div>
    </div>
  );
}