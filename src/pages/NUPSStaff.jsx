import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Store, ShoppingCart, LogOut, Users, FileText, Clock, Loader2, DollarSign, DoorOpen, BarChart3, Receipt, Star, Coins, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import POSBarRegister from "../components/nups/POSBarRegister.jsx";
import BatchManagement from "../components/nups/BatchManagement.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import TimeClock from "../components/nups/TimeClock.jsx";
import UnifiedGlyphBucksHub from "../components/nups/UnifiedGlyphBucksHub";
import GlyphBucksLedger from "../components/nups/GlyphBucksLedger.jsx";
import ContractManager from "../components/nups/ContractManager.jsx";
import VIPRoomBoard from "../components/nups/VIPRoomBoard.jsx";
import GuestCheckIn from "../components/nups/GuestCheckIn.jsx";
import NUPSManagerDashboard from "../components/nups/NUPSManagerDashboard.jsx";
import ZReportGenerator from "../components/nups/ZReportGenerator.jsx";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { GLYPHLOCK_DISCLAIMER } from '@/constants/legalDisclaimer';
import OfflineSyncBanner from "../components/nups/OfflineSyncBanner.jsx";
import { mapNUPSRoleToRBAC, hasPermission, ROLES } from '../config/roles.js';

export default function NUPSStaff() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rbacRole, setRbacRole] = useState(ROLES.BARTENDER);
  const [activeScreen, setActiveScreen] = useState('bar');

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

  // RBAC-gated screen visibility
  const canAccessPOS = hasPermission(rbacRole, 'ACCESS_POS');
  const canAccessVIP = hasPermission(rbacRole, 'ACCESS_VIP_ROOMS');
  const canAccessBatch = hasPermission(rbacRole, 'ACCESS_BATCH_MANAGEMENT');
  const canClockIn = hasPermission(rbacRole, 'CLOCK_IN_OUT');
  const isManager = rbacRole === 'manager';

  const screens = [
    { id: 'bar',       label: 'Bar Register',  Icon: ShoppingCart, color: 'cyan',   perm: canAccessPOS },
    { id: 'door',      label: 'Door Check-In', Icon: DoorOpen,     color: 'green',  perm: true },
    { id: 'vip',       label: 'VIP Board',     Icon: Star,         color: 'pink',   perm: canAccessVIP },
    { id: 'manager',   label: 'Manager',       Icon: BarChart3,    color: 'purple', perm: isManager },
    { id: 'contracts', label: 'GlyphBucks',    Icon: Coins,        color: 'yellow', perm: canAccessPOS },
    { id: 'contract-mgr', label: 'Contracts',   Icon: ScrollText,   color: 'purple', perm: canAccessPOS },
    { id: 'reports',   label: 'Z Report',      Icon: Receipt,      color: 'orange', perm: canAccessBatch },
    { id: 'timeclock', label: 'Time Clock',    Icon: Clock,        color: 'blue',   perm: canClockIn },
    { id: 'history',   label: 'My Sales',      Icon: DollarSign,   color: 'gray',   perm: canAccessPOS },
  ].filter(s => s.perm);

  const SCREEN_COLORS = {
    cyan:   { active: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',     icon: 'text-cyan-400' },
    green:  { active: 'bg-green-500/15 text-green-400 border-green-500/40',   icon: 'text-green-400' },
    pink:   { active: 'bg-pink-500/15 text-pink-400 border-pink-500/40',      icon: 'text-pink-400' },
    purple: { active: 'bg-purple-500/15 text-purple-400 border-purple-500/40',icon: 'text-purple-400' },
    yellow: { active: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',icon: 'text-yellow-400' },
    orange: { active: 'bg-orange-500/15 text-orange-400 border-orange-500/40',icon: 'text-orange-400' },
    blue:   { active: 'bg-blue-500/15 text-blue-400 border-blue-500/40',      icon: 'text-blue-400' },
    gray:   { active: 'bg-gray-700/50 text-gray-300 border-gray-500/40',      icon: 'text-gray-300' },
  };

  // Resolve active screen — fallback to first available if current not in list
  const activeScreenId = (screens.find(s => s.id === activeScreen) ? activeScreen : screens[0]?.id) || 'bar';
  const activeScreenMeta = screens.find(s => s.id === activeScreenId);

  const renderScreen = () => {
    switch (activeScreenId) {
      case 'bar':       return <POSBarRegister user={user} />;
      case 'door':      return <GuestCheckIn />;
      case 'vip':       return <VIPRoomBoard />;
      case 'manager':   return <NUPSManagerDashboard user={user} />;
      case 'contracts':    return <div className="p-4"><GlyphBucksLedger user={user} venue_id="dream_palace" /></div>;
      case 'contract-mgr': return <div className="p-4"><ContractManager user={user} venue_id="dream_palace" /></div>;
      case 'reports':   return <div className="space-y-4 p-4"><BatchManagement user={user} /><ZReportGenerator user={user} /></div>;
      case 'timeclock': return <TimeClock user={user} role={user?._highestRole || "BARTENDER"} />;
      case 'history':   return <TransactionHistory transactions={todayTransactions} showReceipt={true} />;
      default:          return <div className="text-gray-600 p-8 text-center text-sm">Screen not available</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SEOHead
        title="N.U.P.S. Staff Terminal | GlyphLock"
        description="Staff point-of-sale terminal."
        keywords="POS terminal, staff timeclock, GlyphLock NUPS"
        url="/nups-staff"
      />
      <OfflineSyncBanner />

      {/* HEADER */}
      <header className="border-b border-cyan-500/20 px-4 py-2.5 sticky top-0 bg-black/95 backdrop-blur-lg" style={{ zIndex: 9990 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-cyan-400" />
            <div>
              <h1 className="text-base font-bold text-white leading-none">N.U.P.S.</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">{activeScreenMeta?.label || 'Terminal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {canAccessPOS && (
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-500">Today</div>
                <div className="text-sm font-bold text-green-400">${todayRevenue.toFixed(2)}</div>
              </div>
            )}
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px] hidden md:flex">
              {user?._highestRole || rbacRole || 'Staff'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 w-9 p-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* SCREEN NAVIGATION BAR */}
      <div className="bg-gray-950 border-b border-gray-800 overflow-x-auto" style={{ zIndex: 30 }}>
        <div className="flex min-w-max px-1.5 py-1.5 gap-1">
          {screens.map(({ id, label, Icon, color }) => {
            const isActive = activeScreenId === id;
            const colors = SCREEN_COLORS[color];
            return (
              <button
                key={id}
                onClick={() => setActiveScreen(id)}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg min-w-[72px] transition-all border ${
                  isActive ? colors.active : 'border-transparent text-gray-600 hover:text-gray-300 hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? colors.icon : 'opacity-40'}`} />
                <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCREEN CONTENT */}
      <div className="flex-1 overflow-auto" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
        {renderScreen()}
      </div>

      <footer className="text-center text-[10px] text-gray-700 py-2 border-t border-gray-800">
        {GLYPHLOCK_DISCLAIMER}
      </footer>
    </div>
  );
}