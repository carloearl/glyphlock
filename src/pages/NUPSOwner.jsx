import React, { useState, useEffect, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, DollarSign, ShoppingCart, TrendingUp, 
  Users, LogOut, UserCheck, DoorOpen, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const EntertainerContract = lazy(() => import("../components/nups/EntertainerContract.jsx"));
const EntertainerCheckIn = lazy(() => import("../components/nups/EntertainerCheckIn.jsx"));
const VIPRoomManagement = lazy(() => import("../components/nups/VIPRoomManagement.jsx"));
const GuestTracking = lazy(() => import("../components/nups/GuestTracking.jsx"));
const ZReportGenerator = lazy(() => import("../components/nups/ZReportGenerator.jsx"));

export default function NUPSOwner() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl("NUPSStaff");
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("NUPSLogin"));
      }
    };
    checkAuth();
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ['pos-transactions'],
    queryFn: () => base44.entities.POSTransaction.list('-created_date')
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers'],
    queryFn: () => base44.entities.Entertainer.list()
  });

  const { data: activeShifts = [] } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list('-created_date', 100);
      return allShifts.filter(shift => !shift.check_out_time);
    }
  });

  const { data: vipRooms = [] } = useQuery({
    queryKey: ['vip-rooms'],
    queryFn: () => base44.entities.VIPRoom.list()
  });

  const { data: vipGuests = [] } = useQuery({
    queryKey: ['vip-guests'],
    queryFn: () => base44.entities.VIPGuest.list('-created_date', 100)
  });

  const todayTransactions = transactions.filter(t => {
    const txDate = new Date(t.created_date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const activeGuestsCount = vipGuests.filter(g => g.status === 'in_building').length;
  const occupiedRooms = vipRooms.filter(r => r.status === 'occupied').length;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="glass-nav border-b border-purple-500/20 p-4 sticky top-0 z-50 bg-black/95 backdrop-blur-lg">
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
              <Suspense fallback={null}>
                <EntertainerContract onContractSigned={() => queryClient.invalidateQueries({ queryKey: ['entertainers'] })} />
              </Suspense>
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
        <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="glass-card-hover border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-cyan-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-cyan-400 mb-1">
                ${todayRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Today's Revenue</div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover border-purple-500/30">
            <CardContent className="p-6">
              <ShoppingCart className="w-8 h-8 text-purple-400 mb-2" />
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {todayTransactions.length}
              </div>
              <div className="text-sm text-gray-400">Today's Transactions</div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover border-green-500/30">
            <CardContent className="p-6">
              <UserCheck className="w-8 h-8 text-green-400 mb-2" />
              <div className="text-3xl font-bold text-green-400 mb-1">
                {activeShifts.length}/{entertainers.length}
              </div>
              <div className="text-sm text-gray-400">Entertainers Active</div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover border-pink-500/30">
            <CardContent className="p-6">
              <DoorOpen className="w-8 h-8 text-pink-400 mb-2" />
              <div className="text-3xl font-bold text-pink-400 mb-1">
                {occupiedRooms}/{vipRooms.length}
              </div>
              <div className="text-sm text-gray-400">VIP Rooms Occupied</div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover border-orange-500/30">
            <CardContent className="p-6">
              <DollarSign className="w-8 h-8 text-orange-400 mb-2" />
              <div className="text-3xl font-bold text-orange-400 mb-1">
                ${totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Total Revenue</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="floor" className="space-y-6">
          <TabsList className="glass-card-dark border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-2 p-2 w-full">
            <TabsTrigger value="floor" className="min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
              <UserCheck className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">Floor</span>
            </TabsTrigger>
            <TabsTrigger value="vip" className="min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
              <DoorOpen className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">VIP</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
              <Users className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">Guests</span>
            </TabsTrigger>
            <TabsTrigger value="zreport" className="min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
              <FileText className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">Z-Report</span>
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading...</div>}>
            <TabsContent value="floor">
              <EntertainerCheckIn />
            </TabsContent>

            <TabsContent value="vip">
              <VIPRoomManagement />
            </TabsContent>

            <TabsContent value="guests">
              <GuestTracking />
            </TabsContent>

            <TabsContent value="zreport">
              <ZReportGenerator user={user} />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
}