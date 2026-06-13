/**
 * Phase 6 / C1 — Settlement Lock Guard Modal
 *
 * Pre-LOCK safety check. When pending driver payouts exist, force the manager to
 * acknowledge — or route them to /admin/payout-history to process first.
 * Locking a settlement with outstanding payouts is allowed, but never silent.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, CheckCircle2, Truck } from "lucide-react";

export default function SettlementLockGuardModal({
  open,
  onClose,
  onConfirm,
  pendingCount = 0,
  pendingTotal = 0,
  processedCount = 0,
  processedTotal = 0,
  businessDate,
  busy = false,
}) {
  const navigate = useNavigate();
  const hasPending = pendingCount > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasPending ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Lock Settlement — Outstanding Payouts
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-emerald-400" />
                Lock Settlement?
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Business date</span>
              <span className="font-mono text-white">{businessDate || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Processed payouts</span>
              <span className="text-emerald-300 font-bold">{processedCount} · ${processedTotal.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between ${hasPending ? "text-amber-300" : "text-slate-500"}`}>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Pending payouts</span>
              <span className="font-bold">{pendingCount} · ${pendingTotal.toFixed(2)}</span>
            </div>
          </div>

          {hasPending ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingCount} driver payout{pendingCount === 1 ? "" : "s"} not yet processed
              </div>
              <p>
                ${pendingTotal.toFixed(2)} will be recorded as <span className="font-mono">driver_payouts_outstanding</span> in this settlement. Once locked, edits require Manager + new audit entry.
              </p>
              <p className="text-amber-300/80 pt-1">
                Best practice: process all payouts <em>before</em> locking. You can lock anyway if needed.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-200">
              ✓ All driver payouts processed. Settlement will lock cleanly.
            </div>
          )}

          <p className="text-[10px] text-slate-500">
            Locking is logged via <span className="font-mono">SETTLEMENT_RUN</span> in ActivityLog.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={busy} className="border-slate-700">
            Cancel
          </Button>
          {hasPending && (
            <Button
              variant="outline"
              onClick={() => navigate("/admin/payout-history")}
              disabled={busy}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            >
              <Truck className="w-3.5 h-3.5 mr-1.5" /> Process Payouts First
            </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={busy}
            className={hasPending ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"}
          >
            {busy ? "Locking…" : hasPending ? "Lock Anyway" : "Confirm Lock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}