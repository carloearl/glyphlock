/**
 * DACO Directive 003 §3 — Staff linear shift flow.
 *
 * One role = one home screen = one linear flow. The next required
 * action is always the largest element on screen.
 *
 * Steps (§3 order):
 *   SCAN → CLOCK_IN → WORK → (BREAK) → CLOCK_OUT → RECEIPT
 *
 * ID-01: verifyLiveIdentity() probes before every identity-stamping
 * write. If the probe fails, the flow shows a manager-override screen
 * (logged as exception per §3 C1).
 *
 * This component REPLACES the loose tiles in StaffHome with a strict
 * state machine — staff never see anything except their next action.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StaffClockInOut from "@/components/nups/StaffClockInOut";
import {
  DoorOpen, Coffee, LogOut as LogOutIcon, Receipt, ShieldAlert, CheckCircle2, Loader2,
} from "lucide-react";
import { verifyLiveIdentity } from "@/lib/nups/identityVerify";
import { logActivity } from "@/lib/nups/activityLog";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import {
  STAFF_STEP, resolveStaffStep, ROLE_TASK_ROUTE, ROLE_TASK_LABEL,
} from "@/lib/nups/flows/staffFlowState";
import { writeIdentityRecord } from "@/lib/nups/identityWrites";

function elapsedLabel(fromISO, toISO) {
  const end = toISO ? new Date(toISO).getTime() : Date.now();
  const ms = Math.max(0, end - new Date(fromISO).getTime());
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StaffShiftFlow({ user, venueId, station = "door" }) {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const vId = venueId || activeVenue?.id || activeVenue?.venue_id;

  const [probe, setProbe] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [closedShift, setClosedShift] = useState(null);
  const [onBreak, setOnBreak] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const role = (user?.role || "").toUpperCase();
  const taskRoute = ROLE_TASK_ROUTE[role] || "/FrontDoor";
  const taskLabel = ROLE_TASK_LABEL[role] || "Work the Door";

  // Identity probe on mount — §3 identity gateway
  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await verifyLiveIdentity(user?.email || user?.username);
      if (!alive) return;
      setProbe(p);
      if (!p.ok) {
        await logActivity({
          action_type: "LOGIN",
          entity_affected: "StaffShift:identity_block",
          after_value: { attempted: user?.email, live: p.live?.email, reason: p.reason },
          venue_id: vId || null,
          notes: `§3 ID-01 BLOCK: ${p.reason}`,
        });
      }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  // Re-attach to open shift
  useEffect(() => {
    let alive = true;
    if (!user?.email) return;
    (async () => {
      try {
        const open = await base44.entities.StaffShift.filter(
          { user_email: user.email, status: "checked_in" }, "-created_date", 1
        );
        if (alive) setActiveShift(open?.[0] || null);
      } catch { /* entity may not exist yet */ }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  const step = resolveStaffStep({ probe, activeShift, onBreak, closedShift });

  const handleClockOut = async () => {
    if (!activeShift) return;
    if (!window.confirm("Clock out now? Your shift will end.")) return;
    setCheckingOut(true);
    try {
      const p = await verifyLiveIdentity(activeShift.user_email);
      if (!p.ok) { setProbe(p); return; }
      const updated = await writeIdentityRecord({
        entity: "StaffShift",
        operation: "update",
        id: activeShift.id,
        venueId: vId,
        actor: user,
        intent: "staff:shift_flow:clockout",
        data: {
          ...activeShift,
          venue_id: vId,
          check_out_time: new Date().toISOString(),
          status: "checked_out",
        },
      });
      setActiveShift(null);
      setClosedShift(updated);
    } catch (e) {
      console.error("clock out failed", e);
    } finally {
      setCheckingOut(false);
    }
  };

  // ─── Step renders — only the current step shows, largest = next action ──

  if (!probe) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (step === STAFF_STEP.IDENTITY_BLOCK) {
    return (
      <Card className="bg-red-950/40 border-red-500/40">
        <CardContent className="p-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-white">Sign-in needs a refresh</h2>
            <p className="text-sm text-red-200/70 mt-1">{probe.reason}</p>
          </div>
          <Button
            onClick={() => base44.auth.logout("/NUPSLanding")}
            className="w-full bg-red-600 hover:bg-red-500 h-12 font-bold"
          >
            Sign Out & Re-enter
          </Button>
          <p className="text-[10px] text-slate-500">
            §3 C1 — manager override logged as exception.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === STAFF_STEP.CLOCK_IN) {
    return <StaffClockInOut user={user} venueId={vId} station={station} />;
  }

  if (step === STAFF_STEP.WORK) {
    return (
      <div className="space-y-4">
        {/* On-shift banner */}
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">On Shift</div>
          <div className="text-3xl font-black text-emerald-200 mt-1 tabular-nums">
            {elapsedLabel(activeShift.check_in_time)}
          </div>
        </div>

        {/* LARGEST ELEMENT — the next required action */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(taskRoute)}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(taskRoute); }}
          className="cursor-pointer bg-gradient-to-br from-cyan-600/20 via-blue-600/10 to-transparent border-cyan-500/40 hover:border-cyan-400 transition-colors"
        >
          <CardContent className="p-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <DoorOpen className="w-8 h-8 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
                Next Action
              </div>
              <div className="font-black text-white text-2xl">{taskLabel}</div>
              <div className="text-sm text-slate-400 mt-0.5">Tap to open your work surface.</div>
            </div>
            <div className="text-cyan-300 font-mono text-sm">GO →</div>
          </CardContent>
        </Card>

        {/* Secondary actions — small, below the primary */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setOnBreak(true)}
            className="h-12 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
          >
            <Coffee className="w-4 h-4 mr-2" /> Break
          </Button>
          <Button
            variant="outline"
            onClick={handleClockOut}
            disabled={checkingOut}
            className="h-12 border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            <LogOutIcon className="w-4 h-4 mr-2" /> {checkingOut ? "…" : "Clock Out"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === STAFF_STEP.BREAK) {
    return (
      <Card className="bg-amber-950/30 border-amber-500/40">
        <CardContent className="p-6 text-center space-y-4">
          <Coffee className="w-12 h-12 text-amber-400 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-white">On Break</h2>
            <p className="text-sm text-slate-400 mt-1">Your shift is still active.</p>
          </div>
          <Button
            onClick={() => setOnBreak(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 h-14 text-base font-bold"
          >
            <DoorOpen className="w-5 h-5 mr-2" /> Back to Work
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === STAFF_STEP.RECEIPT) {
    const hours = elapsedLabel(closedShift.check_in_time, closedShift.check_out_time);
    return (
      <Card className="bg-slate-900 border-emerald-500/30">
        <CardContent className="p-6 space-y-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              Shift Summary
            </div>
            <h2 className="text-xl font-bold text-white mt-1">You're Done</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="text-[10px] uppercase text-slate-500">Hours</div>
              <div className="text-2xl font-black text-white">{hours}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="text-[10px] uppercase text-slate-500">Tips</div>
              <div className="text-2xl font-black text-emerald-300">
                ${(closedShift.tips || 0).toFixed(2)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Per current pool rules · {new Date(closedShift.check_out_time).toLocaleString()}
          </div>
          <Button
            onClick={() => base44.auth.logout("/NUPSLanding")}
            className="w-full bg-slate-700 hover:bg-slate-600 h-12 font-bold"
          >
            <Receipt className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}