/**
 * NoBatchBanner — explains the blocker before a cashier reaches CHARGE.
 */
import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NoBatchBanner({ batch, operatingMode = "LIVE", onOpenManager }) {
  if (batch) return null;
  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 sm:flex-row sm:items-center"
    >
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-bold text-amber-300">No {operatingMode} batch is open</div>
        <div className="text-[12px] text-amber-200/80 leading-relaxed">
          Transactions are blocked until a manager counts the drawer and opens a batch in this same venue and mode.
        </div>
      </div>
      {onOpenManager && (
        <Button type="button" size="sm" variant="outline" onClick={onOpenManager} className="min-h-[44px] shrink-0 border-amber-400/40 text-amber-200 hover:bg-amber-400/10">
          Manager Console <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
