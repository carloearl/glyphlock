import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, DollarSign, ShoppingCart, TrendingUp, 
  Users, LogOut, UserCheck, DoorOpen, FileText,
  Eye, Clock, Receipt, CreditCard, Loader2, BarChart3, Banknote, Package, Tag, ScrollText,
  RotateCcw, Heart, Megaphone, UserCog, Brain, PieChart, Wallet, HandCoins, KeyRound, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import EntertainerContract from "../components/nups/EntertainerContract.jsx";
import EntertainerCheckIn from "../components/nups/EntertainerCheckIn.jsx";
import VIPRoomManagement from "../components/nups/VIPRoomManagement.jsx";
import GuestTracking from "../components/nups/GuestTracking.jsx";
import ZReportGenerator from "../components/nups/ZReportGenerator.jsx";
import POSCashRegister from "../components/nups/POSCashRegister.jsx";
import BatchManagement from "../components/nups/BatchManagement.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import TimeClock from "../components/nups/TimeClock.jsx";
import LiveFloorView from "../components/nups/LiveFloorView.jsx";
import OwnerAnalytics from "../components/nups/OwnerAnalytics.jsx";
import ClubCurrencyPressView from "@/components/nups/press/ClubCurrencyPressView";
import ProductManagement from "../components/nups/ProductManagement.jsx";
import InventoryManagement from "../components/nups/InventoryManagement.jsx";
import DreamPalaceContract from "../components/nups/DreamPalaceContract.jsx";
import TipBreakdown from "../components/nups/TipBreakdown.jsx";
import DailySummary from "../components/nups/DailySummary.jsx";
import CashDrawerLog from "../components/nups/CashDrawerLog.jsx";
import RefundManager from "../components/nups/RefundManager.jsx";
import CustomerManagement from "../components/nups/CustomerManagement.jsx";
import MarketingCampaigns from "../components/nups/MarketingCampaigns.jsx";
import LoyaltyProgram from "../components/nups/LoyaltyProgram.jsx";
import StaffManagement from "../components/nups/StaffManagement.jsx";
import AIInsights from "../components/nups/AIInsights.jsx";
import SalesReport from "../components/nups/SalesReport.jsx";
import RBACAdminPanel from "../components/nups/RBACAdminPanel.jsx";
import ContractViewer from "../components/nups/ContractViewer.jsx";
import NUPSUserManager from "../components/nups/NUPSUserManager.jsx";
import EmployeeManagement from "../components/nups/EmployeeManagement.jsx";
import PayrollReport from "../components/nups/PayrollReport.jsx";
import SEOHead from "@/components/SEOHead";
import GlyphBuckInventory from "../components/nups/GlyphBuckInventory.jsx";
import EntertainerDashboard from "../components/nups/EntertainerDashboard.jsx";
import EntertainerPayrollEngine from "../components/nups/EntertainerPayrollEngine.jsx";
import AuditLogDashboard from "../components/nups/AuditLogDashboard.jsx";

export default function NUPSOwner() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl("NUPSLogin");
          return;
        }
        const currentUser = await base44.auth.me();

        // §9.2 RBAC — Check via getUserPermissions, not legacy role string
        let permissionsData = null;
        try {
          const res = await base44.functions.invoke('getUserPermissions', {});
          permissionsData = res.data;
        } catch (e) {
          console.warn("RBAC payload unavailable, falling back to base44 role:", e);
        }

        // Determine if user has owner/manager tier access
        const OWNER_TIER = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];
        const hasOwnerAccess = permissionsData?.venue_access?.some(
          va => OWNER_TIER.includes(va.role_key)
        ) || currentUser.role === "admin";

        if (!hasOwnerAccess) {
          window.location.href = createPageUrl("NUPSStaff");
          return;
        }

        // Enrich user object with RBAC data
        currentUser._rbac = permissionsData;
        currentUser._highestRole = permissionsData?.highest_role || (currentUser.role === "admin" ? "VENUE_OWNER" : null);
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
    queryKey: ["pos-transactions"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date"),
    enabled: !!user,
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ["entertainers"],
    queryFn: () => base44.entities.Entertainer.list(),
    enabled: !!user,
  });

  const { data: activeShifts = [] } = useQuery({
    queryKey: ["active-shifts"],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list("-created_date", 100);
      return allShifts.filter((shift) => !shift.check_out_time);
    },
    enabled: !!user,
  });

  const { data: vipRooms = [] } = useQuery({
    queryKey: ["vip-rooms"],
    queryFn: () => base44.entities.VIPRoom.list(),
    enabled: !!user,
  });

  const { data: vipGuests = [] } = useQuery({
    queryKey: ["vip-guests"],
    queryFn: () => base44.entities.VIPGuest.list("-created_date", 100),
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["pos-products"],
    queryFn: () => base44.entities.POSProduct.list(),
    enabled: !!user,
  });

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  const todayTransactions = transactions.filter((t) => {
    const txDate = new Date(t.created_date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const activeGuestsCount = vipGuests.filter((g) => g.status === "in_building").length;
  const occupiedRooms = vipRooms.filter((r) => r.status === "occupied").length;

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="N.U.P.S. Owner Dashboard | GlyphLock"
        description="Venue owner operations dashboard. Staff management, financial reporting, shift oversight, VIP room management, and real-time analytics."
        keywords="venue management, POS system, staff management, VIP room tracking, entertainment venue analytics, nightclub POS, GlyphLock NUPS"
        url="/nups-owner"
      />
      {/* Header */}
      <header className="border-b border-purple-500/20 p-4 sticky top-0 z-50 bg-black/95 backdrop-blur-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">N.U.P.S. Admin</h1>
                <p className="text-xs md:text-sm text-gray-400 hidden sm:block">Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <EntertainerContract onContractSigned={() => queryClient.invalidateQueries({ queryKey: ["entertainers"] })} />
              <div className="hidden md:flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white truncate max-w-[150px]">{user?.email}</span>
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">{user?._highestRole || "Owner"}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => base44.auth.logout()}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardContent className="p-4">
              <DollarSign className="w-6 h-6 text-cyan-400 mb-1" />
              <div className="text-2xl font-bold text-cyan-400">${todayRevenue.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Today Revenue</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-purple-500/30">
            <CardContent className="p-4">
              <ShoppingCart className="w-6 h-6 text-purple-400 mb-1" />
              <div className="text-2xl font-bold text-purple-400">{todayTransactions.length}</div>
              <div className="text-xs text-gray-400">Transactions</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-green-500/30">
            <CardContent className="p-4">
              <UserCheck className="w-6 h-6 text-green-400 mb-1" />
              <div className="text-2xl font-bold text-green-400">{activeShifts.length}/{entertainers.length}</div>
              <div className="text-xs text-gray-400">Staff Active</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-pink-500/30">
            <CardContent className="p-4">
              <DoorOpen className="w-6 h-6 text-pink-400 mb-1" />
              <div className="text-2xl font-bold text-pink-400">{occupiedRooms}/{vipRooms.length}</div>
              <div className="text-xs text-gray-400">VIP Rooms</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-blue-500/30">
            <CardContent className="p-4">
              <Users className="w-6 h-6 text-blue-400 mb-1" />
              <div className="text-2xl font-bold text-blue-400">{activeGuestsCount}</div>
              <div className="text-xs text-gray-400">Guests In</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-orange-500/30">
            <CardContent className="p-4">
              <TrendingUp className="w-6 h-6 text-orange-400 mb-1" />
              <div className="text-2xl font-bold text-orange-400">${totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Total Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Module Cards */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {[
              { value: 'analytics', icon: BarChart3, label: 'Analytics', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
              { value: 'live', icon: Eye, label: 'Live Floor', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/40', glow: 'shadow-green-500/20' },
              { value: 'pos', icon: CreditCard, label: 'POS', color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
              { value: 'floor', icon: UserCheck, label: 'Floor Staff', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/40', glow: 'shadow-pink-500/20' },
              { value: 'vip', icon: DoorOpen, label: 'VIP Rooms', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
              { value: 'guests', icon: Users, label: 'Guests', color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/40', glow: 'shadow-indigo-500/20' },
              { value: 'timeclock', icon: Clock, label: 'Time Clock', color: 'from-teal-500/20 to-cyan-500/20', border: 'border-teal-500/40', glow: 'shadow-teal-500/20' },
              { value: 'history', icon: Receipt, label: 'Transaction History', color: 'from-slate-500/20 to-gray-500/20', border: 'border-slate-500/40', glow: 'shadow-slate-500/20' },
              { value: 'zreport', icon: FileText, label: 'Z-Report', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/40', glow: 'shadow-blue-500/20' },
              { value: 'glyphbucks', icon: Banknote, label: 'Glyph Bucks', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/20' },
              { value: 'entertainer', icon: Star, label: 'My Stats', color: 'from-fuchsia-500/20 to-pink-500/20', border: 'border-fuchsia-500/40', glow: 'shadow-fuchsia-500/20' },
              { value: 'payroll-engine', icon: DollarSign, label: 'Payroll Engine', color: 'from-green-500/20 to-teal-500/20', border: 'border-green-500/40', glow: 'shadow-green-500/20' },
              { value: 'audit-log', icon: Shield, label: 'Audit Log', color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/40', glow: 'shadow-red-500/20' },
              { value: 'products', icon: Tag, label: 'Products', color: 'from-lime-500/20 to-green-500/20', border: 'border-lime-500/40', glow: 'shadow-lime-500/20' },
              { value: 'inventory', icon: Package, label: 'Inventory', color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/40', glow: 'shadow-orange-500/20' },
              { value: 'contract', icon: ScrollText, label: 'Contract', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/40', glow: 'shadow-violet-500/20' },
              { value: 'press', icon: Banknote, label: 'Currency Press', color: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
              { value: 'tips', icon: HandCoins, label: 'Tips', color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
              { value: 'daily', icon: PieChart, label: 'Daily Summary', color: 'from-cyan-500/20 to-teal-500/20', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
              { value: 'drawer', icon: Wallet, label: 'Cash Drawer', color: 'from-pink-500/20 to-fuchsia-500/20', border: 'border-pink-500/40', glow: 'shadow-pink-500/20' },
              { value: 'refunds', icon: RotateCcw, label: 'Refunds', color: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/40', glow: 'shadow-red-500/20' },
              { value: 'customers', icon: Heart, label: 'CRM', color: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/40', glow: 'shadow-rose-500/20' },
              { value: 'loyalty', icon: Heart, label: 'Loyalty', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
              { value: 'marketing', icon: Megaphone, label: 'Marketing', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/40', glow: 'shadow-orange-500/20' },
              { value: 'staff', icon: UserCog, label: 'Staff Mgmt', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/40', glow: 'shadow-blue-500/20' },
              { value: 'employees', icon: Users, label: 'Employees', color: 'from-indigo-500/20 to-violet-500/20', border: 'border-indigo-500/40', glow: 'shadow-indigo-500/20' },
              { value: 'payroll', icon: Receipt, label: 'Payroll', color: 'from-teal-500/20 to-green-500/20', border: 'border-teal-500/40', glow: 'shadow-teal-500/20' },
              { value: 'sales', icon: BarChart3, label: 'Sales Report', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
              { value: 'ai', icon: Brain, label: 'AI Insights', color: 'from-violet-500/20 to-fuchsia-500/20', border: 'border-violet-500/40', glow: 'shadow-violet-500/20' },
              { value: 'contracts', icon: ScrollText, label: 'All Contracts', color: 'from-slate-500/20 to-zinc-500/20', border: 'border-slate-500/40', glow: 'shadow-slate-500/20' },
              ...((user?._highestRole === 'PLATFORM_ADMIN' || user?._highestRole === 'VENUE_OWNER' || user?.role === 'admin') ? [
                { value: 'rbac', icon: KeyRound, label: 'Access Control', color: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/40', glow: 'shadow-red-500/20' }
              ] : []),
            ].map(({ value, icon: Icon, label, color, border, glow }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`
                  relative group p-5 rounded-2xl transition-all duration-300 min-h-[140px]
                  flex flex-col items-center justify-center gap-3 text-center
                  border-2 backdrop-blur-xl
                  ${activeTab === value 
                    ? `bg-gradient-to-br ${color} ${border} shadow-lg ${glow}` 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }
                `}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300
                  ${activeTab === value ? 'bg-white/20 shadow-lg' : 'bg-white/5'}
                `}>
                  <Icon className={`w-7 h-7 ${activeTab === value ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className={`text-sm font-semibold ${activeTab === value ? 'text-white' : 'text-gray-400'}`}>
                  {label}
                </span>
                {activeTab === value && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                )}
              </button>
            ))}
          </div>

          <TabsContent value="analytics">
            <OwnerAnalytics transactions={transactions} />
          </TabsContent>
          <TabsContent value="live">
            <LiveFloorView />
          </TabsContent>
          <TabsContent value="pos">
            <div className="space-y-4">
              <BatchManagement user={user} />
              <POSCashRegister user={user} />
            </div>
          </TabsContent>
          <TabsContent value="floor">
            <EntertainerCheckIn />
          </TabsContent>
          <TabsContent value="vip">
            <VIPRoomManagement />
          </TabsContent>
          <TabsContent value="guests">
            <GuestTracking />
          </TabsContent>
          <TabsContent value="timeclock">
            <TimeClock user={user} role={user?._highestRole || "VENUE_OWNER"} />
          </TabsContent>
          <TabsContent value="history">
            <TransactionHistory transactions={transactions} showReceipt={true} />
          </TabsContent>
          <TabsContent value="zreport">
            <ZReportGenerator user={user} />
          </TabsContent>
          <TabsContent value="glyphbucks">
            <GlyphBuckInventory />
          </TabsContent>
          <TabsContent value="entertainer">
            <EntertainerDashboard user={user} />
          </TabsContent>
          <TabsContent value="payroll-engine">
            <EntertainerPayrollEngine user={user} />
          </TabsContent>
          <TabsContent value="audit-log">
            <AuditLogDashboard user={user} />
          </TabsContent>
          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryManagement products={products} />
          </TabsContent>
          <TabsContent value="contract">
            <DreamPalaceContract
              onCurrencyPrint={(amount, orderNum) => {
                setActiveTab("press");
              }}
              onComplete={() => queryClient.invalidateQueries({ queryKey: ['dream-palace-orders'] })}
            />
          </TabsContent>
          <TabsContent value="press">
            <ClubCurrencyPressView />
          </TabsContent>
          <TabsContent value="sales">
            <SalesReport transactions={transactions} products={products} />
          </TabsContent>
          <TabsContent value="tips">
            <TipBreakdown transactions={transactions} />
          </TabsContent>
          <TabsContent value="daily">
            <DailySummary transactions={transactions} />
          </TabsContent>
          <TabsContent value="drawer">
            <CashDrawerLog />
          </TabsContent>
          <TabsContent value="refunds">
            <RefundManager user={user} />
          </TabsContent>
          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>
          <TabsContent value="loyalty">
            <LoyaltyProgram />
          </TabsContent>
          <TabsContent value="marketing">
            <MarketingCampaigns />
          </TabsContent>
          <TabsContent value="staff">
            <NUPSUserManager currentUser={user} />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>
          <TabsContent value="payroll">
            <PayrollReport />
          </TabsContent>
          <TabsContent value="ai">
            <AIInsights />
          </TabsContent>
          <TabsContent value="contracts">
            <ContractViewer />
          </TabsContent>
          <TabsContent value="rbac">
            <RBACAdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}