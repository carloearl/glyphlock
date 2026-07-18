/**
 * OpenBatchControl — manager-only control to open tonight's POS batch
 * directly from the Register console (no back-office trip required).
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Unlock } from "lucide-react";
import { getActiveVenueId } from "@/hooks/useActiveVenue";

export default function OpenBatchControl({ cashierName }) {
  const [openingCash, setOpeningCash] = useState("300");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const openBatch = async () => {
    setBusy(true);
    try {
      await base44.entities.POSBatch.create({
        batch_id: `BATCH-${Date.now()}`,
        venue_id: getActiveVenueId() || "dream_palace",
        opening_cash: parseFloat(openingCash) || 0,
        cashier: cashierName || "Manager",
        status: "open",
        start_time: new Date().toISOString(),
        total_sales: 0,
        transaction_count: 0,
      });
      await queryClient.invalidateQueries({ queryKey: ["active-pos-batch"] });
      await queryClient.invalidateQueries({ queryKey: ["active-batch"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
      <Unlock className="w-5 h-5 text-emerald-400 shrink-0" />
      <div className="text-sm font-bold text-emerald-300">Open Tonight's Batch</div>
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-slate-400">Opening cash $</span>
        <Input
          type="number"
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          className="w-24 h-10 bg-slate-900 border-slate-700 text-white"
        />
        <Button onClick={openBatch} disabled={busy} className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white">
          {busy ? "Opening…" : "Open Batch"}
        </Button>
      </div>
    </div>
  );
}