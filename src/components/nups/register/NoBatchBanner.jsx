/**
 * W3-012B Cycle 2 (Register) — NoBatchBanner
 * ───────────────────────────────────────────
 * First-shift orientation: display-only banner explaining why the CHARGE
 * button won't post when no POS batch is open. Reads nothing, writes
 * nothing — the host page passes in the batch it already fetched.
 * The existing "open a batch first" enforcement in POSCashRegister is
 * unchanged; this only makes the state understandable before an error.
 */
import React from "react";
import { AlertTriangle } from "lucide-react";

export default function NoBatchBanner({ batch }) {
  if (batch) return null;
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3"
    >
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        <div className="font-bold text-amber-300">No active batch</div>
        <div className="text-[12px] text-amber-200/80 leading-relaxed">
          Transactions can't be posted until a manager opens tonight's batch.
          Ask your manager to open one before ringing up guests.
        </div>
      </div>
    </div>
  );
}