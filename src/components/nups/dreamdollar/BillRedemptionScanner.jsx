import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ScanLine, Loader2, Users, Archive, UserCheck
} from "lucide-react";
import BillScanner from "./BillScanner";

export default function BillRedemptionScanner() {
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [completedPayouts, setCompletedPayouts] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // RBAC: Check user permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || !['admin', 'manager', 'staff'].includes(currentUser.role)) {
          window.location.href = '/nups-login';
          return;
        }
        setUser(currentUser);
      } catch (error) {
        window.location.href = '/nups-login';
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // Fetch active entertainers
  const { data: entertainers = [], isLoading } = useQuery({
    queryKey: ['active-entertainers'],
    queryFn: async () => {
      const shifts = await base44.entities.EntertainerShift.filter({
        status: { $in: ["checked_in", "on_floor", "in_vip"] }
      }, '-check_in_time', 50);
      return shifts;
    }
  });

  const handlePayoutComplete = (payoutData) => {
    setCompletedPayouts(prev => [...prev, {
      ...payoutData,
      timestamp: new Date().toISOString()
    }]);
    setSelectedContractor(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ScanLine className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Dream Dollar Redemption</h1>
          </div>
          <p className="text-sm text-gray-400">Scan bills to calculate contractor payout (50% redemption)</p>
        </div>

        {/* Contractor Selection */}
        {!selectedContractor ? (
          <Card className="bg-gray-900/60 border-pink-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <span className="text-pink-400">Select Entertainer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {entertainers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">No entertainers checked in</p>
                  <p className="text-xs text-gray-600 mt-1">Entertainers must check in before redemption</p>
                </div>
              ) : (
                entertainers.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedContractor({
                      id: shift.entertainer_id,
                      name: shift.stage_name
                    })}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-pink-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-pink-400" />
                      <div className="text-left">
                        <div className="font-bold text-white">{shift.stage_name}</div>
                        <div className="text-xs text-gray-400">
                          Checked in: {new Date(shift.check_in_time).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Active</Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Selected Contractor Header */}
            <Card className="bg-pink-900/20 border-pink-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-pink-400" />
                  <div>
                    <div className="text-sm font-bold text-white">{selectedContractor.name}</div>
                    <div className="text-xs text-gray-400">Ready for redemption</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedContractor(null)}
                  className="border-gray-700 text-gray-400"
                >
                  Change
                </Button>
              </CardContent>
            </Card>

            {/* Bill Scanner */}
            <BillScanner
              contractorId={selectedContractor.id}
              contractorName={selectedContractor.name}
              onPayoutComplete={handlePayoutComplete}
            />
          </>
        )}

        {/* Completed Payouts Today */}
        {completedPayouts.length > 0 && (
          <Card className="bg-gray-900/60 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Archive className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Completed Payouts Today ({completedPayouts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {completedPayouts.map((payout, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700">
                  <div className="text-sm">
                    <span className="text-gray-300">{payout.contractor_name || `Contractor ${payout.contractor_id}`}</span>
                    <span className="text-xs text-gray-500 ml-2">({payout.bills_redeemed} bills)</span>
                  </div>
                  <div className="font-mono font-bold text-green-400">${payout.total_payout.toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}