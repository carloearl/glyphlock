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
  Eye, Clock, Receipt, CreditCard, Loader2, BarChart3, Banknote, Package, Tags
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

export default function NUPSOwner() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
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
        if (currentUser.role !== "admin") {
          window.location.href = createPageUrl("NUPSStaff");
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
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">Owner</Badge>
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
        <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
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
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-gray-900/80 border border-gray-800 grid grid-cols-6 md:grid-cols-12 gap-1 p-1.5 w-full">
            <TabsTrigger value="analytics" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Eye className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Live View</span>
            </TabsTrigger>
            <TabsTrigger value="pos" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">POS</span>
            </TabsTrigger>
            <TabsTrigger value="floor" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Floor</span>
            </TabsTrigger>
            <TabsTrigger value="vip" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <DoorOpen className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">VIP</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Users className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Guests</span>
            </TabsTrigger>
            <TabsTrigger value="timeclock" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Time Clock</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Receipt className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">History</span>
            </TabsTrigger>
            <TabsTrigger value="zreport" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Z-Report</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Tags className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Products</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Package className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="press" className="min-h-[48px] flex flex-col items-center justify-center gap-0.5">
              <Banknote className="w-4 h-4" />
              <span className="text-[10px] md:text-xs">Press</span>
            </TabsTrigger>
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
            <TimeClock user={user} role="admin" />
          </TabsContent>
          <TabsContent value="history">
            <TransactionHistory transactions={transactions} showReceipt={true} />
          </TabsContent>
          <TabsContent value="zreport">
            <ZReportGenerator user={user} />
          </TabsContent>
          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryManagement products={products} />
          </TabsContent>
          <TabsContent value="press">
            <ClubCurrencyPressView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}