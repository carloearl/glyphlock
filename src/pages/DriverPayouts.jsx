/**
 * DriverPayouts — standalone page.
 * Hosts:
 *   1. DriverDropOffTracker — unified driver workflow: onboarding, sessions,
 *      AND instant guest logging (quick +N buttons live directly on each
 *      driver's session row — logged the moment the guest walks in)
 *   2. DriverPayoutHistory  — settled / paid records
 * Merge directive 2026-07-20: the separate Quick Add card was folded into
 * the drivers section so guest entry is one tap on the driver row.
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import DriverDropOffTracker from "@/components/nups/DriverDropOffTracker";
import DriverPayoutHistory from "@/pages/DriverPayoutHistory";
import ShiftAuditExportButton from "@/components/nups/ShiftAuditExportButton";

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
            {/* End-of-shift audit ledger — driver payouts + entertainer
                check-ins → Google Sheets (manager/admin only, enforced server-side) */}
            <div className="mt-3">
              <ShiftAuditExportButton />
            </div>
          </CardContent>
        </Card>

        {/* Unified driver workflow — onboarding, sessions, instant guest add */}
        <DriverDropOffTracker user={me} />

        {/* Settled history — embedded mode: no full-page frame, no sticky overlay */}
        <DriverPayoutHistory embedded />
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