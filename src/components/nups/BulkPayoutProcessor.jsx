/**
 * Phase 6 / C2 — Bulk Payout Processor
 *
 * Sticky bottom action bar. Renders only when payouts are selected.
 * Loops PENDING → PROCESSED with per-row ActivityLog (PAYOUT_TOGGLE), matching
 * the single-row toggle behavior exactly. Sequential to keep audit timing clean.
 */

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, X, Loader2, Truck, AlertTriangle } from "lucide-react";
import { logActivity } from "@/lib/nups/activityLog";

export default function BulkPayoutProcessor({ selectedPayouts = [], currentUser, onComplete, onClear }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });

  const pending = selectedPayouts.filter(p => (p.payout_status || "PENDING") === "PENDING");
  const total = pending.reduce((s, p) => s + (Number(p.total_payout) || 0), 0);
  const skipCount = selectedPayouts.length - pending.length;

  if (selectedPayouts.length === 0) return null;

  const handleBulkProcess = async () => {
    setBusy(true);
    setProgress({ done: 0, total: pending.length, failed: 0 });
    const nowIso = new Date().toISOString();
    let done = 0;
    let failed = 0;

    for (const p of pending) {
      try {
        const before = {
          payout_status: "PENDING",
          processed_by: p.processed_by || null,
          processed_at: p.processed_at || null,
        };
        const updates = {
          payout_status: "PROCESSED",
          processed_by: currentUser?.email || "unknown",
          processed_at: nowIso,
        };

        const write = await writeEntity({
          entity: "DriverPayout",
          operation: "update",
          id: p.id,
          data: updates,
          actor: { email: currentUser?.email, id: currentUser?.id, role: currentUser?._highestRole || currentUser?.role || "External" },
          venue_id: p.venue_id || null,
          intent: "DRIVER_PAYOUT_BULK_PROCESSED",
        });
        if (!write?.ok) throw new Error(write?.block_reason || "Driver payout bulk update was rejected.");

        await logActivity({
          action_type: "PAYOUT_TOGGLE",
          entity_affected: `DriverPayout:${p.id}`,
          before_value: before,
          after_value: { ...before, ...updates },
          venue_id: p.venue_id || null,
          notes: `BULK driver=${p.driver_name} amount=${p.total_payout} PENDING→PROCESSED`,
        });

        done += 1;
      } catch {
        failed += 1;
      }
      setProgress({ done, total: pending.length, failed });
    }

    setBusy(false);
    setConfirmOpen(false);
    if (onComplete) onComplete({ done, failed });
  };

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[calc(100%-2rem)]">
        <div className="bg-gradient-to-r from-violet-950 to-emerald-950 border-2 border-violet-500/50 rounded-2xl shadow-2xl shadow-violet-500/30 backdrop-blur-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-violet-300" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white">
                {selectedPayouts.length} selected · <span className="text-emerald-300">${total.toFixed(2)}</span> to process
              </div>
              <div className="text-[10px] text-slate-400">
                {pending.length} pending eligible{skipCount > 0 ? ` · ${skipCount} already processed (will skip)` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={pending.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Process {pending.length}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Bulk Process {pending.length} Payout{pending.length === 1 ? "" : "s"}?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Eligible (PENDING)</span><span className="font-bold">{pending.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total disbursement</span><span className="font-bold text-emerald-400">${total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Processed by</span><span className="font-mono text-[11px]">{currentUser?.email || "—"}</span></div>
              {skipCount > 0 && (
                <div className="flex justify-between text-amber-300"><span>Already processed (skip)</span><span>{skipCount}</span></div>
              )}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-xs text-emerald-200">
              Each payout writes a <span className="font-mono">PAYOUT_TOGGLE</span> entry to ActivityLog. Safe to interrupt mid-batch — completed records stay PROCESSED.
            </div>

            {busy && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-violet-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing {progress.done} / {progress.total}…
                  {progress.failed > 0 && <span className="text-red-400">· {progress.failed} failed</span>}
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
                    style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {progress.failed > 0 && !busy && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {progress.failed} payout{progress.failed === 1 ? "" : "s"} failed. They remain PENDING — review manually.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleBulkProcess} disabled={busy || pending.length === 0} className="bg-emerald-600 hover:bg-emerald-500">
              {busy ? "Processing…" : `Confirm Process ${pending.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}