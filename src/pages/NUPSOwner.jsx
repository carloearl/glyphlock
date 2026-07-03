import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield, DollarSign, ShoppingCart, TrendingUp, Users, LogOut, UserCheck, DoorOpen, FileText,
  Eye, Clock, Receipt, CreditCard, Loader2, BarChart3, Banknote, Package, Tag, ScrollText,
  RotateCcw, Heart, Megaphone, UserCog, Brain, PieChart, Wallet, HandCoins, KeyRound, Star, Coins, Building2,
  Music, Calculator, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import EntertainerContract from "../components/nups/EntertainerContract.jsx";
import EntertainerCheckIn from "../components/nups/EntertainerCheckIn.jsx";
import VIPRoomBoard from "../components/nups/VIPRoomBoard.jsx";
import GuestCheckIn from "../components/nups/GuestCheckIn.jsx";
import GuestTracking from "../components/nups/GuestTracking.jsx";
import VIPRoomManagement from "../components/nups/VIPRoomManagement.jsx";
import NUPSManagerDashboard from "../components/nups/NUPSManagerDashboard.jsx";
import POSCashRegister from "../components/nups/POSCashRegister.jsx";
import ClubCurrencyPressView from "@/components/nups/press/ClubCurrencyPressView";
import GlyphBucksContract from "../components/nups/GlyphBucksContract.jsx";
import StaffManagement from "../components/nups/StaffManagement.jsx";
import ZReportGenerator from "../components/nups/ZReportGenerator.jsx";
import BatchManagement from "../components/nups/BatchManagement.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import TimeClock from "../components/nups/TimeClock.jsx";
import LiveFloorView from "../components/nups/LiveFloorView.jsx";
import OwnerAnalytics from "../components/nups/OwnerAnalytics.jsx";
import ProductManagement from "../components/nups/ProductManagement.jsx";
import InventoryManagement from "../components/nups/InventoryManagement.jsx";
import TipBreakdown from "../components/nups/TipBreakdown.jsx";
import DailySummary from "../components/nups/DailySummary.jsx";
import CashDrawerLog from "../components/nups/CashDrawerLog.jsx";
import RefundManager from "../components/nups/RefundManager.jsx";
import CustomerManagement from "../components/nups/CustomerManagement.jsx";
import MarketingCampaigns from "../components/nups/MarketingCampaigns.jsx";
import LoyaltyProgram from "../components/nups/LoyaltyProgram.jsx";
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
import ContractorTaxFormsList from "../components/nups/payroll/ContractorTaxFormsList.jsx";
import AuditLogDashboard from "../components/nups/AuditLogDashboard.jsx";
import ActivityAuditPanel from "../components/admin/ActivityAuditPanel.jsx";
import POSBarRegister from "../components/nups/POSBarRegister.jsx";
import StaffOnboardingPanel from "../components/nups/StaffOnboardingPanel.jsx";
import UnifiedGlyphBucksTab from "../components/nups/glyphbucks/UnifiedGlyphBucksTab.jsx";
import ContractManager from "../components/nups/ContractManager.jsx";
import UnifiedMusicConsole from "../components/mixer/UnifiedMusicConsole.jsx";
import FraudAlertMonitor from "../components/nups/FraudAlertMonitor.jsx";
import VenueSettings from "../components/nups/VenueSettings.jsx";
import OfficialChecks from "./OfficialChecks.jsx";
import OfflineSyncBanner from "../components/nups/OfflineSyncBanner.jsx";
import HardwareStatusPanel from "../components/nups/hardware/HardwareStatusPanel.jsx";
import DemoCredentialsPanel from "../components/nups/DemoCredentialsPanel.jsx";
import { useActiveVenue } from '../hooks/useActiveVenue';
import { mapNUPSRoleToRBAC, hasPermission } from '../config/roles.js';
import { GLYPHLOCK_DISCLAIMER } from '@/constants/legalDisclaimer';

export default function NUPSOwner() {
  const navigate = useNavigate();
  const location = useLocation();
  // Sidebar deep-links via /NUPSOwner?tab=staff. Read it on every render so
  // navigation between sidebar items lands on the right module.
  const initialTab = (() => {
    try { return new URLSearchParams(location.search).get('tab') || 'dashboard'; }
    catch { return 'dashboard'; }
  })();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [posSubTab, setPosSubTab] = useState("cash");
  const [activeModule, setActiveModule] = useState(initialTab);

  // Keep active module in sync if the URL changes (sidebar click while page mounted)
  useEffect(() => {
    try {
      const next = new URLSearchParams(location.search).get('tab');
      if (next && next !== activeModule) setActiveModule(next);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  const [rbacRole, setRbacRole] = useState('manager');
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();

  const venueId = activeVenue?.id;

  const handleRefreshAll = () => {
    queryClient.clear();
    window.location.reload();
  };

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

        let permissionsData = null;
        try {
          const res = await base44.functions.invoke('getUserPermissions', {});
          permissionsData = res.data;
        } catch (e) {
          console.warn("RBAC payload unavailable, falling back to base44 role:", e);
        }

        const OWNER_TIER = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];
        const hasOwnerAccess = permissionsData?.venue_access?.some(
          va => OWNER_TIER.includes(va.role_key)
        ) || currentUser.role === "admin";

        if (!hasOwnerAccess) { navigate('/NUPSStaff'); return; }

        currentUser._rbac = permissionsData;
        currentUser._highestRole = permissionsData?.highest_role || (currentUser.role === "admin" ? "VENUE_OWNER" : null);
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

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["pos-transactions"],
    queryFn: () => base44.entities.POSTransaction.list({
      filter: { mode: "REAL" },
      sort: "-created_date"
    }),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const { data: entertainers = [], isLoading: entLoading } = useQuery({
    queryKey: ["entertainers"],
    queryFn: () => base44.entities.Entertainer.list(),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  const { data: activeShifts = [], isLoading: shiftLoading } = useQuery({
    queryKey: ["active-shifts"],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list("-created_date", 100);
      return allShifts.filter((shift) => !shift.check_out_time);
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  const { data: vipRooms = [], isLoading: roomLoading } = useQuery({
    queryKey: ["vip-rooms"],
    queryFn: () => base44.entities.VIPRoom.list(),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  const { data: vipGuests = [], isLoading: guestLoading } = useQuery({
    queryKey: ["vip-guests"],
    queryFn: () => base44.entities.VIPGuest.list("-created_date", 100),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ["pos-products"],
    queryFn: () => base44.entities.POSProduct.list(),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // TASK 7.1 — Filter demo/test transactions from ALL financial views
  const realTransactions = transactions.filter(t =>
    (!t.mode || t.mode === 'REAL') &&
    !t.transaction_id?.startsWith('DEMO-') &&
    !t.cashier?.includes('demo@')
  );

  const isLoading = txLoading || entLoading || shiftLoading || roomLoading || guestLoading || prodLoading;

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    );
  }

  const todayTransactions = realTransactions.filter((t) => {
    const txDate = new Date(t.created_date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  });

  // F-1: Tips excluded from all revenue calculations — BPAAA v3.0
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
  const totalRevenue = realTransactions.reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
  const activeGuestsCount = vipGuests.filter((g) => g.status === "in_building").length;
  const occupiedRooms = vipRooms.filter((r) => r.status === "occupied").length;

  // RBAC permission flags
  const canFinance = hasPermission(rbacRole, 'ACCESS_FINANCIAL_OVERVIEW');
  const canZReport = hasPermission(rbacRole, 'ACCESS_Z_REPORTS');
  const canBatch = hasPermission(rbacRole, 'ACCESS_BATCH_MANAGEMENT');
  const canPayroll = hasPermission(rbacRole, 'ACCESS_PAYROLL');
  const canManageStaff = hasPermission(rbacRole, 'MANAGE_STAFF');
  const canAudit = hasPermission(rbacRole, 'ACCESS_AUDIT_LOG');
  const canInventory = hasPermission(rbacRole, 'ACCESS_INVENTORY');
  const canMarketing = hasPermission(rbacRole, 'ACCESS_MARKETING');
  const canRBAC = hasPermission(rbacRole, 'ACCESS_RBAC');
  const canVoid = hasPermission(rbacRole, 'VOID_TRANSACTIONS');

  const isAdminUser = user?._highestRole === 'PLATFORM_ADMIN' || user?._highestRole === 'VENUE_OWNER' || user?.role === 'admin';

  // NUPSOwner tabs = ONLY modules that don't have a dedicated standalone page.
  // Front Door → /FrontDoor, Register → /Register, VIP → /Contracts?tab=vip,
  // GlyphBucks → /Contracts?tab=glyphbucks. Those are NOT listed here.
  const NAV_MODULES = [
    { key: 'dashboard',  label: 'Dashboard',      icon: BarChart3 },
    { key: 'staff',      label: 'Staff',          icon: Users },
    { key: 'dj',         label: 'DJ',             icon: Music },
    { key: 'customers',  label: 'Customers',      icon: Heart },
    { key: 'marketing',  label: 'Marketing',      icon: Megaphone },
    { key: 'payroll',    label: 'Payroll',        icon: DollarSign },
    { key: 'reports',    label: 'Reports',        icon: FileText },
    { key: 'analytics',  label: 'Analytics',      icon: TrendingUp },
    { key: 'inventory',  label: 'Inventory',      icon: Package },
    { key: 'audit',      label: 'Audit Log',      icon: Shield },
    { key: 'admin',      label: 'Admin',          icon: KeyRound },
    { key: 'venue',      label: 'Venue Settings', icon: Building2 },
    { key: 'demo',       label: 'Demo Keys',      icon: KeyRound },
  ];
  const ROLE_MODULE_ACCESS = {
    manager:   new Set(NAV_MODULES.map(m => m.key)),
    bartender: new Set(['pos']),
    door_girl: new Set(['pos','door']),
    hostess:   new Set(['vip']),
    security:  new Set(['door']),
    dj:        new Set(['staff','dj']),
  };
  const allowedModuleSet = isAdminUser
    ? new Set(NAV_MODULES.map(m => m.key))
    : (ROLE_MODULE_ACCESS[rbacRole] || new Set(['dashboard']));
  const visibleModules = NAV_MODULES.filter(m => allowedModuleSet.has(m.key));

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="N.U.P.S. Owner Dashboard | GlyphLock"
        description="Venue owner operations dashboard."
        keywords="venue management, POS system, staff management, VIP room tracking, GlyphLock NUPS"
        url="/nups-owner"
      />
      <OfflineSyncBanner />
      <header className="border-b border-purple-500/20 p-4 sticky top-0 z-50 bg-black/95 backdrop-blur-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/NUPSGateway')}
                className="text-gray-400 hover:text-white p-2 mr-1"
                aria-label="Back to gateway"
              >
                ←
              </Button>
              <Shield className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">N.U.P.S. Admin</h1>
                <p className="text-xs md:text-sm text-gray-400 hidden sm:block">Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white truncate max-w-[150px]">{user?.email}</span>
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">{user?._highestRole || "Owner"}</Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 min-h-[44px] gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">View As</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-white">
                  <DropdownMenuLabel className="text-gray-400 text-xs">Switch Role View</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  {[
                    { label: 'Manager', role: 'VENUE_MANAGER' },
                    { label: 'Bartender', role: 'BARTENDER' },
                    { label: 'Door Staff', role: 'SECURITY' },
                    { label: 'Hostess', role: 'HOSTESS' },
                    { label: 'DJ', role: 'DJ' },
                  ].map(({ label, role }) => (
                    <DropdownMenuItem
                      key={role}
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => {
                        const staffSession = { ...user, _highestRole: role, _viewAsRole: role };
                        sessionStorage.setItem('nups_session', JSON.stringify(staffSession));
                        navigate('/NUPSStaff');
                      }}
                    >
                      {label} View
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-gray-800 text-xs text-gray-400"
                    onClick={() => {
                      setActiveModule('dashboard');
                      const adminSession = { ...user, _highestRole: user?._highestRole || 'PLATFORM_ADMIN' };
                      delete adminSession._viewAsRole;
                      sessionStorage.setItem('nups_session', JSON.stringify(adminSession));
                      queryClient.clear();
                      window.location.reload();
                    }}
                  >
                    ↩ Reset to Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 min-h-[44px]"
                aria-label="Refresh all data"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => base44.auth.logout()}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 min-h-[44px]"
                aria-label="Sign out of owner dashboard"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/NUPSGateway')}
                className="text-gray-400 hover:text-red-400 p-2 min-h-[44px]"
                aria-label="Close dashboard"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-4"><FraudAlertMonitor /></div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-700/30 animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 w-6 bg-gray-700 rounded mb-2" />
                  <div className="h-8 w-16 bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
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
              <div className="text-2xl font-bold text-green-400">{activeShifts.length}</div>
              <div className="text-xs text-gray-400">Staff Active</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-pink-500/30">
            <CardContent className="p-4">
              <DoorOpen className="w-6 h-6 text-pink-400 mb-1" />
              <div className="text-2xl font-bold text-pink-400">{occupiedRooms}</div>
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
          )}

        {/* Module Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-700 overflow-x-auto">
          {visibleModules.map(mod => {
            const ModIcon = mod.icon;
            return (
              <Button
                key={mod.key}
                onClick={() => mod.route ? navigate(mod.route) : setActiveModule(mod.key)}
                variant={activeModule === mod.key ? 'default' : 'outline'}
                className={`min-h-[44px] text-sm gap-2 flex-shrink-0 ${
                  activeModule === mod.key
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                    : mod.route
                      ? 'border-emerald-600/50 text-emerald-300 hover:border-emerald-400 bg-emerald-900/10'
                      : 'border-gray-700 text-gray-300 hover:border-purple-500/50 bg-transparent'
                }`}
              >
                <ModIcon className="w-4 h-4" />
                {mod.label}
              </Button>
            );
          })}
        </div>

        {!isLoading && (
        <div className="space-y-4 pb-8">
          {activeModule === 'dashboard' && (
            <NUPSManagerDashboard
              user={user}
              transactions={realTransactions}
              activeShifts={activeShifts}
              vipRooms={vipRooms}
              vipGuests={vipGuests}
              todayRevenue={todayRevenue}
              totalRevenue={totalRevenue}
              occupiedRooms={occupiedRooms}
              activeGuestsCount={activeGuestsCount}
            />
          )}
          {activeModule === 'dj' && <UnifiedMusicConsole />}
          {activeModule === 'payroll' && (
            <div className="space-y-6">
              {/* 1099 contractor tax forms — must be on file before any payout */}
              {canPayroll && <ContractorTaxFormsList currentUser={user} />}
              <div className="border-t border-white/5 pt-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">
                  1099 Earnings & Payouts
                </div>
                <EntertainerPayrollEngine user={user} />
              </div>
              {canPayroll && <TipBreakdown transactions={realTransactions} />}
              {canPayroll && <PayrollReport />}
              {canPayroll && <OfficialChecks />}
            </div>
          )}
          {activeModule === 'reports' && (
            <div className="space-y-4">
              <OwnerAnalytics transactions={realTransactions} />
              {canZReport && <ZReportGenerator user={user} />}
              {canMarketing && <SalesReport transactions={realTransactions} products={products} />}
              <DailySummary transactions={realTransactions} />
            </div>
          )}
          {activeModule === 'analytics' && (
            <OwnerAnalytics user={user} transactions={realTransactions} />
          )}
          {activeModule === 'contracts' && (
            <div className="space-y-4">
              <ContractManager user={user} venue_id={venueId} />
            </div>
          )}
          {activeModule === 'staff' && (
            <div className="space-y-4">
              <StaffOnboardingPanel />
              <EntertainerContract onContractSigned={handleRefreshAll} />
              <StaffManagement />
              <EntertainerCheckIn user={user} />
              {canManageStaff && <EmployeeManagement />}
              {canManageStaff && <NUPSUserManager currentUser={user} />}
              <TimeClock user={user} role={user?._highestRole || "VENUE_OWNER"} />
              <EntertainerDashboard user={user} />
            </div>
          )}
          {activeModule === 'customers' && (
            <div className="space-y-4">
              <GuestTracking />
              {canMarketing && <CustomerManagement />}
              {canMarketing && <LoyaltyProgram />}
            </div>
          )}
          {activeModule === 'marketing' && (
            <div className="space-y-4">
              {canMarketing && <MarketingCampaigns />}
              {canMarketing && <AIInsights />}
            </div>
          )}
          {activeModule === 'inventory' && (
            <div className="space-y-4">
              {canInventory && <ProductManagement />}
              {canInventory && <InventoryManagement products={products} />}
              {canBatch && <CashDrawerLog />}
            </div>
          )}
          {activeModule === 'audit' && (
            <div className="space-y-4">
              {/* Unified Activity + Audit browser with role/action filters */}
              {canAudit && <ActivityAuditPanel />}
              {canAudit && <AuditLogDashboard user={user} />}
              <TransactionHistory transactions={realTransactions} showReceipt={true} />
            </div>
          )}
          {activeModule === 'admin' && (
            <div className="space-y-4">
              {canRBAC && <RBACAdminPanel />}
              {canVoid && <RefundManager user={user} />}
              <LiveFloorView />
              {isAdminUser && (
                <iframe src="/NUPSMISReport" className="w-full border-0 rounded-lg" style={{ height: '85vh' }} title="Q MIS Report" />
              )}
              <HardwareStatusPanel user={user} activeVenue={activeVenue} />
            </div>
          )}
          {activeModule === 'venue' && <VenueSettings user={user} />}
          {activeModule === 'demo' && isAdminUser && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-amber-950/40 to-orange-950/30 border-amber-500/40">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold text-amber-100">Demo Data Manager</h3>
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px]">ADMIN ONLY</Badge>
                    </div>
                    <p className="text-xs text-amber-200/70">
                      Seed full demo dataset (contracts, ID scans, GlyphBucks serials, Z-Reports, payroll, settlements) or safely wipe demo records. All actions audit-logged.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/NUPSDemoManager')}
                    className="bg-amber-600 hover:bg-amber-500 text-black font-bold min-h-[44px] gap-2 flex-shrink-0"
                  >
                    <KeyRound className="w-4 h-4" />
                    Open Demo Manager
                  </Button>
                </CardContent>
              </Card>
              <DemoCredentialsPanel />
            </div>
          )}
        </div>
        )}

        <footer className="text-center text-[10px] text-gray-700 py-6 border-t border-gray-800 mt-12">
          {GLYPHLOCK_DISCLAIMER}
        </footer>
      </div>
    </div>
  );
}