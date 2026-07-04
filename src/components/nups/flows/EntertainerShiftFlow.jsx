/**
 * DACO Directive 003 §4 — Entertainer (IC) linear flow.
 *
 * "The entertainer flow is a contract transaction, not an employment
 *  session. No clock-in language anywhere — CHECK IN only."
 *
 * Steps (§4 order):
 *   SCAN → CHECK_IN → HOUSE_FEE_DUE → PAY_FEE → QR_RECEIPT → ON_FLOOR
 *          → BATCH_OUT_REQUEST → SETTLEMENT → CHECK_OUT
 *
 * The next required action is always the largest element on screen.
 * ID-01: verifyLiveIdentity() probes before the check-in write.
 *
 * Wraps the existing EntertainerCheckIn component (checklist + PIN) and
 * layers the house-fee + QR-receipt steps on top per §4.
 */
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, ShieldAlert, LogIn, Coins, QrCode, Music, HandCoins, CheckCircle2,
} from "lucide-react";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";
import EntertainerHouseFeePanel from "./EntertainerHouseFeePanel";
import EntertainerQRReceipt from "./EntertainerQRReceipt";
import { verifyLiveIdentity } from "@/lib/nups/identityVerify";
import { logActivity } from "@/lib/nups/activityLog";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { resolveVenueId } from "@/lib/venueDefaults";
import { IC_STEP, resolveIcStep } from "@/lib/nups/flows/entertainerFlowState";

export default function EntertainerShiftFlow({ user }) {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = resolveVenueId(activeVenue?.id || activeVenue?.venue_id || user?.venue_id);

  const [probe, setProbe] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [checkedInEntertainer, setCheckedInEntertainer] = useState(null);
  const [feeTx, setFeeTx] = useState(null);
  const [receiptAcknowledged, setReceiptAcknowledged] = useState(false);
  const [batchOutRequested, setBatchOutRequested] = useState(false);

  // Identity probe — §4 IC check-in mode
  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await verifyLiveIdentity(user?.email || user?.username);
      if (!alive) return;
      setProbe(p);
      if (!p.ok) {
        await logActivity({
          action_type: "LOGIN",
          entity_affected: "EntertainerShift:identity_block",
          after_value: { attempted: user?.email, live: p.live?.email, reason: p.reason },
          venue_id: venueId || null,
          notes: `§4 ID-01 BLOCK: ${p.reason}`,
        });
      }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  // Load active shifts to detect if this entertainer is already on the floor
  const { data: activeShifts = [] } = useQuery({
    queryKey: ["active-shifts", venueId],
    queryFn: async () => {
      const all = await base44.entities.EntertainerShift.filter({ venue_id: venueId }, "-created_date", 100);
      return all.filter(s => !s.check_out_time);
    },
    enabled: !!venueId,
    staleTime: 0,
    refetchInterval: 30_000,
  });

  // If the check-in mutation in EntertainerCheckIn succeeds, it invalidates
  // the active-shifts query. We detect the new shift here and advance the flow.
  useEffect(() => {
    if (!activeShifts.length) return;
    // Find a shift that was just created (most recent) — the flow advances
    // once we see a shift exist after check-in was triggered.
    if (!activeShift && activeShifts.length > 0) {
      // Don't auto-attach — the EntertainerCheckIn component handles the
      // actual check-in. We just need to know when to show the house fee step.
    }
  }, [activeShifts, activeShift]);

  const step = resolveIcStep({
    probe,
    activeShift: checkedInEntertainer ? activeShift : null,
    feePaid: !!feeTx,
    receiptAcknowledged,
    batchOutRequested,
  });

  // Called by EntertainerCheckIn when check-in succeeds — we need the
  // entertainer record to issue the receipt. We listen for the query
  // invalidation and pick up the most recent shift.
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey?.[0] === "active-shifts" && event.type === "updated") {
        const shifts = event.query.state.data || [];
        if (shifts.length && !checkedInEntertainer) {
          // The most recently checked-in shift is ours (PIN-verified).
          const latest = shifts[0];
          setActiveShift(latest);
          // Fetch the entertainer record for the receipt.
          base44.entities.Entertainer.get(latest.entertainer_id)
            .then(setCheckedInEntertainer)
            .catch(() => {});
        }
      }
    });
    return unsub;
  }, [checkedInEntertainer]);

  if (!probe) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (step === IC_STEP.IDENTITY_BLOCK) {
    return (
      <Card className="bg-red-950/40 border-red-500/40">
        <CardContent className="p-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-white">Can't verify your sign-in</h2>
            <p className="text-sm text-red-200/70 mt-1">{probe.reason}</p>
          </div>
          <Button
            onClick={() => base44.auth.logout("/NUPSLanding")}
            className="w-full bg-red-600 hover:bg-red-500 h-12 font-bold"
          >
            Sign Out & Re-enter
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === IC_STEP.CHECK_IN) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-pink-400 text-center">
          Step 1 · Check In
        </div>
        <EntertainerCheckIn user={user} />
      </div>
    );
  }

  if (step === IC_STEP.HOUSE_FEE_DUE) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-pink-400 text-center">
          Step 2 · House Fee Due
        </div>
        <EntertainerHouseFeePanel
          entertainer={checkedInEntertainer}
          shift={activeShift}
          onPaid={({ tx, paymentMethod, amount }) => setFeeTx({ ...tx, payment_method: paymentMethod, total: amount })}
        />
      </div>
    );
  }

  if (step === IC_STEP.PAY_FEE) {
    // Handled inline by EntertainerHouseFeePanel — this shouldn't render.
    return null;
  }

  if (step === IC_STEP.QR_RECEIPT) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 text-center">
          Step 3 · QR Receipt
        </div>
        <EntertainerQRReceipt
          entertainer={checkedInEntertainer}
          shift={activeShift}
          feeTx={feeTx}
          venueId={venueId}
          onContinue={() => setReceiptAcknowledged(true)}
        />
      </div>
    );
  }

  if (step === IC_STEP.ON_FLOOR) {
    return (
      <Card className="bg-slate-900 border-pink-500/30">
        <CardContent className="p-6 space-y-4 text-center">
          <Music className="w-12 h-12 text-pink-400 mx-auto" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              On Floor
            </div>
            <h2 className="text-xl font-bold text-white mt-1">You're Checked In</h2>
            <p className="text-sm text-slate-400 mt-1">
              {checkedInEntertainer?.stage_name || "Entertainer"}
            </p>
          </div>

          {/* Receipt hash badge — always visible as proof */}
          {feeTx && (
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="text-[9px] uppercase text-slate-500">Receipt</div>
              <div className="font-mono text-xs text-emerald-300">
                {feeTx.transaction_id?.slice(-12) || "—"}
              </div>
            </div>
          )}

          {/* End-of-night action */}
          <Button
            onClick={() => {
              if (window.confirm("Request batch-out? A manager will confirm your settlement.")) {
                setBatchOutRequested(true);
              }
            }}
            className="w-full bg-amber-600 hover:bg-amber-500 h-14 text-base font-bold"
          >
            <HandCoins className="w-5 h-5 mr-2" /> Request Batch-Out
          </Button>
          <p className="text-[10px] text-slate-600">
            End of night: find a manager to batch out together. §4 step 5.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === IC_STEP.BATCH_OUT_REQUEST) {
    return (
      <Card className="bg-slate-900 border-amber-500/30">
        <CardContent className="p-6 space-y-4 text-center">
          <HandCoins className="w-12 h-12 text-amber-400 mx-auto" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              Batch-Out Requested
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Waiting for Manager</h2>
            <p className="text-sm text-slate-400 mt-1">
              A manager will confirm your settlement and check you out.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {checkedInEntertainer?.stage_name || "—"} · since{" "}
            {activeShift?.check_in_time
              ? new Date(activeShift.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </div>
          <Button
            onClick={() => setBatchOutRequested(false)}
            variant="outline"
            className="w-full border-slate-600 text-slate-400 h-10"
          >
            Cancel Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}