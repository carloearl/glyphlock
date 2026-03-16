import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Shield, DollarSign, ShoppingCart, TrendingUp, 
  Users, LogOut, UserCheck, DoorOpen, FileText,
  Eye, Clock, Receipt, CreditCard, Loader2, BarChart3, Banknote, Package, Tag, ScrollText,
  RotateCcw, Heart, Megaphone, UserCog, Brain, PieChart, Wallet, HandCoins, KeyRound, Star, Coins
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
import NUPSUserManager from "../components/nups/NUPSUserManager.jsx";
import EmployeeManagement from "../components/nups/EmployeeManagement.jsx";
import PayrollReport from "../components/nups/PayrollReport.jsx";
import SEOHead from "@/components/SEOHead";
import GlyphBuckInventory from "../components/nups/GlyphBuckInventory.jsx";
import EntertainerDashboard from "../components/nups/EntertainerDashboard.jsx";
import EntertainerPayrollEngine from "../components/nups/EntertainerPayrollEngine.jsx";
import AuditLogDashboard from "../components/nups/AuditLogDashboard.jsx";
import FraudAlertMonitor from "../components/nups/FraudAlertMonitor.jsx";
import UnifiedDreamDollarHub from "../components/nups/UnifiedDreamDollarHub.jsx";
import OfficialChecks from "./OfficialChecks";
import VIPContractLifecycle from "../components/nups/VIPContractLifecycle.jsx";
import OnboardingPacket from "../components/nups/OnboardingPacket.jsx";

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
                aria-label="Sign out of owner dashboard"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        {/* Fraud Alert Monitor */}
        <div className="mb-4">
          <FraudAlertMonitor />
        </div>

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

        {/* Dashboard Navigation - Dropdown Menus */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Operations Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-h-[44px] bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50 text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2 text-cyan-400" />
                  Operations
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/95 border-cyan-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-cyan-400">Operations</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-cyan-500/20" />
                {[
                  { value: 'analytics', icon: BarChart3, label: 'Dashboard', desc: 'Revenue & metrics' },
                  { value: 'live', icon: Eye, label: 'Live View', desc: 'Real-time floor' },
                  { value: 'pos', icon: CreditCard, label: 'Register', desc: 'Process sales' },
                  { value: 'history', icon: Receipt, label: 'Transactions', desc: 'Sales history' },
                  { value: 'zreport', icon: FileText, label: 'Daily Close', desc: 'End-of-day report' },
                  { value: 'drawer', icon: Wallet, label: 'Cash Log', desc: 'Drawer activity' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`cursor-pointer min-h-[44px] ${
                      activeTab === value ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Staff & Floor Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-h-[44px] bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/30 hover:border-pink-500/50 text-white"
                >
                  <Users className="w-4 h-4 mr-2 text-pink-400" />
                  Staff & Floor
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/95 border-pink-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-pink-400">Staff & Floor</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-pink-500/20" />
                {[
                  { value: 'floor', icon: UserCheck, label: 'Check-In', desc: 'Staff attendance' },
                  { value: 'timeclock', icon: Clock, label: 'Time Clock', desc: 'Hours tracking' },
                  { value: 'vip', icon: DoorOpen, label: 'VIP Rooms', desc: 'Room status' },
                  { value: 'guests', icon: Users, label: 'Guest List', desc: 'Visitor tracking' },
                  { value: 'entertainer', icon: Star, label: 'Performer Stats', desc: 'My earnings' },
                  { value: 'staff', icon: UserCog, label: 'Manage Staff', desc: 'User accounts' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`cursor-pointer min-h-[44px] ${
                      activeTab === value ? 'bg-pink-500/20 text-pink-400' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Finance & Payroll Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-h-[44px] bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                  Finance & Payroll
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/95 border-green-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-green-400">Finance & Payroll</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-green-500/20" />
                {[
                  { value: 'tips', icon: HandCoins, label: 'Tip Pool', desc: 'Distribute tips' },
                  { value: 'payroll-engine', icon: DollarSign, label: 'Payroll', desc: 'Calculate pay' },
                  { value: 'payroll', icon: Receipt, label: 'Pay Records', desc: 'Payment history' },
                  { value: 'official-checks', icon: Banknote, label: 'Official Checks', desc: 'Print payroll checks' },
                  { value: 'employees', icon: Users, label: 'Employees', desc: 'Staff records' },
                  { value: 'daily', icon: PieChart, label: 'Daily Report', desc: 'Day summary' },
                  { value: 'refunds', icon: RotateCcw, label: 'Refunds', desc: 'Process returns' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`cursor-pointer min-h-[44px] ${
                      activeTab === value ? 'bg-green-500/20 text-green-400' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Inventory & Products Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-h-[44px] bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 text-white"
                >
                  <Package className="w-4 h-4 mr-2 text-amber-400" />
                  Inventory & Products
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/95 border-amber-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-amber-400">Inventory & Products</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-amber-500/20" />
                {[
                  { value: 'products', icon: Tag, label: 'Products', desc: 'Menu items' },
                  { value: 'inventory', icon: Package, label: 'Stock', desc: 'Inventory levels' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`cursor-pointer min-h-[44px] ${
                      activeTab === value ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Marketing & Insights Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-h-[44px] bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50 text-white"
                >
                  <Megaphone className="w-4 h-4 mr-2 text-purple-400" />
                  Marketing & Insights
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/95 border-purple-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-purple-400">Marketing & Insights</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-purple-500/20" />
                {[
                  { value: 'customers', icon: Heart, label: 'Customers', desc: 'CRM database' },
                  { value: 'loyalty', icon: Heart, label: 'Loyalty', desc: 'Rewards program' },
                  { value: 'marketing', icon: Megaphone, label: 'Campaigns', desc: 'Promotions' },
                  { value: 'sales', icon: BarChart3, label: 'Sales Report', desc: 'Performance' },
                  { value: 'ai', icon: Brain, label: 'AI Insights', desc: 'Predictions' },
                  { value: 'audit-log', icon: Shield, label: 'Audit Trail', desc: 'Security log' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`cursor-pointer min-h-[44px] ${
                      activeTab === value ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dream Dollar Operations Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-h-[44px] bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30 hover:border-yellow-500/50 text-white"
                >
                  <Coins className="w-4 h-4 mr-2 text-yellow-400" />
                  Dream Dollar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900/95 border-yellow-500/30 backdrop-blur-xl">
                <DropdownMenuLabel className="text-yellow-400">Dream Dollar Operations</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-yellow-500/20" />
                {[
                  { value: 'contracts', icon: ScrollText, label: 'Contracts & Press', desc: 'Sales, printing, archive' },
                  { value: 'glyphbucks', icon: Banknote, label: 'Gift Cards', desc: 'Glyph Bucks' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`cursor-pointer min-h-[44px] ${
                      activeTab === value ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Tools Dropdown */}
            {(user?._highestRole === 'PLATFORM_ADMIN' || user?._highestRole === 'VENUE_OWNER' || user?.role === 'admin') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-h-[44px] bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/30 hover:border-red-500/50 text-white"
                  >
                    <KeyRound className="w-4 h-4 mr-2 text-red-400" />
                    Admin Tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900/95 border-red-500/30 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-red-400">Admin Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-red-500/20" />
                  {[
                    { value: 'rbac', icon: KeyRound, label: 'Access Control', desc: 'Manage permissions' },
                    { value: 'mis-report', icon: BarChart3, label: 'Q MIS Report', desc: 'Quarterly summary' },
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setActiveTab(value)}
                      className={`cursor-pointer min-h-[44px] ${
                        activeTab === value ? 'bg-red-500/20 text-red-400' : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          <TabsContent value="official-checks">
            <OfficialChecks />
          </TabsContent>
          <TabsContent value="ai">
            <AIInsights />
          </TabsContent>
          <TabsContent value="contracts">
            <UnifiedDreamDollarHub venue_id="dream_palace" />
          </TabsContent>
          <TabsContent value="rbac">
            <RBACAdminPanel />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}