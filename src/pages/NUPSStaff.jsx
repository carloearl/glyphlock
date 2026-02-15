import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShoppingCart, LogOut, Users, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import POSCashRegister from "../components/nups/POSCashRegister.jsx";
import BatchManagement from "../components/nups/BatchManagement.jsx";
import TransactionHistory from "../components/nups/TransactionHistory.jsx";
import { useQuery } from "@tanstack/react-query";

export default function NUPSStaff() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("NUPSLogin"));
      }
    };
    checkAuth();
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ['staff-transactions', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allTransactions = await base44.entities.POSTransaction.list('-created_date', 100);
      return allTransactions.filter(t => t.cashier === user.email);
    },
    enabled: !!user
  });

  const todayTransactions = transactions.filter(t => {
    const txDate = new Date(t.created_date);
    const today = new Date();
    return txDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="glass-nav border-b border-cyan-500/20 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-white">N.U.P.S. Point of Sale</h1>
              <p className="text-sm text-gray-400">Staff Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2">
              <div className="text-xs text-gray-400">Today's Sales</div>
              <div className="text-lg font-bold text-green-400">${todayRevenue.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white">{user?.email}</span>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">Staff</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="glass-card-dark border-gray-800">
            <TabsTrigger value="register">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cash Register
            </TabsTrigger>
            <TabsTrigger value="batch">
              <Clock className="w-4 h-4 mr-2" />
              Batch Management
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" />
              My Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <POSCashRegister user={user} />
          </TabsContent>

          <TabsContent value="batch">
            <BatchManagement user={user} />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory transactions={todayTransactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}