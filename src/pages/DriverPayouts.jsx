/**
 * DriverPayouts — standalone page.
 * Hosts:
 *   1. QuickDriverGuestAdd  — tap driver → enter guests → manager PIN approval
 *   2. DriverDropOffTracker — full driver onboarding + session controls
 *   3. DriverPayoutHistory  — settled / paid records
 * Split out of /Register so the operator has a single screen for the
 * driver workflow.
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import QuickDriverGuestAdd from "@/components/nups/QuickDriverGuestAdd";
import DriverDropOffTracker from "@/components/nups/DriverDropOffTracker";
import DriverPayoutHistory from "@/pages/DriverPayoutHistory";

function DriverPayoutsInner() {
  const [me, setMe] = useState(null);
  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  return (
    <NUPSAppShell
      title="Driver Payouts"
      subtitle="Quick add · Sessions · History — coupled to active batch"
      role="DOOR"
    >
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Intent strip */}
        <Card className="bg-white/[0.02] border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-pink-300 font-bold text-base">
              <Truck className="w-5 h-5" /> Driver Payouts — Coupled to Active Batch
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every payout below is a money-OUT disbursement, reconciled against the POS Batch
              it was issued under. Driver payouts are never deducted from <code>total_sales</code>.
            </p>
          </CardContent>
        </Card>

        {/* The simple, daily-use workflow at the top */}
        <QuickDriverGuestAdd user={me} />

        {/* Power-user / detail workflow underneath */}
        <DriverDropOffTracker user={me} />

        {/* Settled history */}
        <DriverPayoutHistory />
      </div>
    </NUPSAppShell>
  );
}

export default function DriverPayouts() {
  return (
    <NUPSRouteGuard requiredPermission="pos_access">
      <DriverPayoutsInner />
    </NUPSRouteGuard>
  );
}