import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShoppingCart, LogOut, Users, FileText, Clock, CreditCard, Loader2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import POSCashRegister from "../components/nups/POSCashRegister.jsx";
import NUPSRouteGuard from "../components/nups/NUPSRouteGuard.jsx";
import BatchManagement from "../components/nups/BatchManagement.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import TimeClock from "../components/nups/TimeClock.jsx";
import UnifiedDreamDollarHub from "../components/nups/UnifiedDreamDollarHub";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";

export default function NUPSStaff() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl("NUPSLogin");
          return;
        }
        const currentUser = await base44.auth.me();

        // Enrich with RBAC payload
        try {
          const res = await base44.functions.invoke('getUserPermissions', {});
          currentUser._rbac = res.data;
          currentUser._highestRole = res.data?.highest_role || null;
        } catch (e) {}

        // If user has owner/manager tier, redirect to admin dashboard
        const OWNER_TIER = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];
        const hasOwnerAccess = currentUser._rbac?.venue_access?.some(
          va => OWNER_TIER.includes(va.role_key)
        ) || currentUser.role === "admin";
        if (hasOwnerAccess) {
          window.location.href = createPageUrl("NUPSOwner");
          return;
        }

        setUser(currentUser);
      } catch (error) {
        window.location.href = createPageUrl("NUPSLogin");
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

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="N.U.P.S. Staff Terminal | GlyphLock"
        description="Staff point-of-sale terminal. Transaction processing, timeclock, shift management, and batch operations."
        keywords="POS terminal, staff timeclock, transaction processing, batch management, nightclub POS, GlyphLock NUPS"
        url="/nups-staff"
      />
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
            <div className="bg-gray-900/80 px-3 py-1.5 rounded-lg hidden sm:block">
              <div className="text-xs text-gray-400">Today</div>
              <div className="text-base font-bold text-green-400">${todayRevenue.toFixed(2)}</div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white truncate max-w-[120px]">{user?.email}</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs">{user?._highestRole || "Staff"}</Badge>
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
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="bg-gray-900/95 border border-cyan-500/30 grid grid-cols-5 gap-1 p-1.5 w-full min-h-0" style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto' }}>
            <TabsTrigger value="register" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/50" style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 31 }}>
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Register</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 31 }}>
              <DollarSign className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Contracts</span>
            </TabsTrigger>
            <TabsTrigger value="batch" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 31 }}>
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Batch</span>
            </TabsTrigger>
            <TabsTrigger value="timeclock" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 31 }}>
              <Clock className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Time Clock</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 31 }}>
              <FileText className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">My Sales</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
            <POSCashRegister user={user} />
          </TabsContent>
          <TabsContent value="contracts" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
            <UnifiedDreamDollarHub venue_id="dream_palace" />
          </TabsContent>
          <TabsContent value="batch" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
            <BatchManagement user={user} />
          </TabsContent>
          <TabsContent value="timeclock" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
            <TimeClock user={user} role={user?._highestRole || "BARTENDER"} />
          </TabsContent>
          <TabsContent value="history" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
            <TransactionHistory transactions={todayTransactions} showReceipt={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}