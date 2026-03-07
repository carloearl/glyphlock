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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList
            className="h-auto flex flex-wrap gap-1.5 p-2 w-full"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '16px',
              boxShadow: '0 0 30px rgba(168,85,247,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {[
              { value: 'analytics', icon: BarChart3, label: 'Analytics' },
              { value: 'live', icon: Eye, label: 'Live' },
              { value: 'pos', icon: CreditCard, label: 'POS' },
              { value: 'floor', icon: UserCheck, label: 'Floor' },
              { value: 'vip', icon: DoorOpen, label: 'VIP' },
              { value: 'guests', icon: Users, label: 'Guests' },
              { value: 'timeclock', icon: Clock, label: 'Time Clock' },
              { value: 'history', icon: Receipt, label: 'History' },
              { value: 'zreport', icon: FileText, label: 'Z-Report' },
              { value: 'glyphbucks', icon: Banknote, label: 'Glyph Bucks' },
              { value: 'entertainer', icon: Users, label: 'My Stats' },
              { value: 'payroll-engine', icon: DollarSign, label: 'Payroll Engine' },
              { value: 'audit-log', icon: Shield, label: 'Audit Log' },
              { value: 'products', icon: Tag, label: 'Products' },
              { value: 'inventory', icon: Package, label: 'Inventory' },
              { value: 'contract', icon: ScrollText, label: 'Contract' },
              { value: 'press', icon: Banknote, label: 'Press' },
              { value: 'tips', icon: HandCoins, label: 'Tips' },
              { value: 'daily', icon: PieChart, label: 'Daily' },
              { value: 'drawer', icon: Wallet, label: 'Drawer' },
              { value: 'refunds', icon: RotateCcw, label: 'Refunds' },
              { value: 'customers', icon: Heart, label: 'CRM' },
              { value: 'loyalty', icon: Heart, label: 'Loyalty' },
              { value: 'marketing', icon: Megaphone, label: 'Marketing' },
              { value: 'staff', icon: UserCog, label: 'Staff' },
              { value: 'employees', icon: Users, label: 'Employees' },
              { value: 'payroll', icon: Receipt, label: 'Payroll' },
              { value: 'sales', icon: BarChart3, label: 'Sales' },
              { value: 'ai', icon: Brain, label: 'AI' },
              { value: 'contracts', icon: ScrollText, label: 'Contracts' },
              ...((user?._highestRole === 'PLATFORM_ADMIN' || user?._highestRole === 'VENUE_OWNER' || user?.role === 'admin') ? [{ value: 'rbac', icon: KeyRound, label: 'Access' }] : []),
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 transition-all duration-200 border border-transparent"
                style={{
                  background: 'transparent',
                  minHeight: '36px',
                }}
                data-glass-tab
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
            <style>{`
              [data-glass-tab][data-state="active"] {
                background: rgba(168,85,247,0.18) !important;
                border-color: rgba(168,85,247,0.45) !important;
                color: #e9d5ff !important;
                box-shadow: 0 0 14px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.1) !important;
              }
              [data-glass-tab]:hover:not([data-state="active"]) {
                background: rgba(255,255,255,0.06) !important;
                color: #d1d5db !important;
              }
            `}</style>
          </TabsList>

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