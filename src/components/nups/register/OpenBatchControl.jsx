/**
 * OpenBatchControl — manager-only step 1 of batch activation.
 * The Front Door confirms the same venue/mode batch before sales can post.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Unlock, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode, stampOperationalRecord, markTrainingStep } from "@/lib/nups/operatingMode";
import { writeEntity } from "@/lib/nups/writeEntity";

export default function OpenBatchControl({ cashierName, cashierEmail, cashierId, cashierRole }) {
  const [openingCash, setOpeningCash] = useState("300");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);

  const { data: existingBatch } = useQuery({
    queryKey: [
      "open-batch-control-existing",
      venueId,
      modeState.ledgerMode,
      modeState.operatingMode,
      modeState.trainingSession?.id || null,
    ],
    queryFn: async () => {
      const rows = await base44.entities.POSBatch.filter({ status: "open" }, "-created_date", 100);
      return scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      })[0] || null;
    },
  });

  const openBatch = async () => {
    if (busy) return;
    if (!venueId) {
      toast.error("Select a venue before opening a batch.");
      return;
    }
    if (existingBatch) {
      toast.error(`A ${modeState.operatingMode} batch is already open for this venue.`);
      return;
    }
    const parsedCash = Number(openingCash);
    if (!Number.isFinite(parsedCash) || parsedCash < 0 || parsedCash > 50000) {
      toast.error("Opening cash must be between $0 and $50,000.");
      return;
    }

    setBusy(true);
    try {
      let liveActor = null;
      try { liveActor = await base44.auth.me(); } catch (_) { /* shell user may be primary */ }
      const actorEmail = liveActor?.email || cashierEmail;
      const payload = stampOperationalRecord({
        batch_id: `BATCH-${Date.now()}-${modeState.operatingMode}`,
        venue_id: venueId,
        opening_cash: parsedCash,
        cashier: actorEmail || cashierName || "Manager",
        cashier_email: actorEmail || null,
        cashier_name: cashierName || liveActor?.full_name || liveActor?.name || actorEmail || "Manager",
        opened_by: cashierName || liveActor?.full_name || actorEmail || "Manager",
        door_confirmed: false,
        status: "open",
        start_time: new Date().toISOString(),
        total_sales: 0,
        transaction_count: 0,
        notes: `${modeState.operatingMode} batch opened from Manager Console`,
      }, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        supportsDemoFlag: true,
      });

      const result = await writeEntity({
        entity: "POSBatch",
        operation: "create",
        data: payload,
        actor: {
          email: actorEmail,
          id: liveActor?.id || cashierId,
          role: cashierRole || liveActor?._highestRole || liveActor?.role || "VENUE_MANAGER",
        },
        venue_id: venueId,
        intent: `${modeState.operatingMode}_BATCH_OPEN`,
        requestContext: {
          mode: modeState.ledgerMode,
          validation_run: modeState.isNonLive,
          session_id: modeState.trainingSession?.id || null,
        },
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Batch open was rejected.");

      if (modeState.isTraining) markTrainingStep(venueId, "batch-opened");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-pos-batch"] }),
        queryClient.invalidateQueries({ queryKey: ["active-batch"] }),
        queryClient.invalidateQueries({ queryKey: ["open-batch-control-existing"] }),
      ]);
      toast.success(`${modeState.operatingMode} batch opened. Front Door confirmation is required.`);
    } catch (error) {
      toast.error(`Batch open failed: ${error?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  if (existingBatch) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <Unlock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <div className="text-sm font-bold text-emerald-300">Open {modeState.operatingMode} Batch</div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Count the drawer now. Front Door must independently confirm this amount before the first sale.
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-400" htmlFor="manager-opening-cash">Opening cash $</label>
          <Input
            id="manager-opening-cash"
            type="number"
            min="0"
            max="50000"
            step="0.01"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
            className="h-11 w-28 border-slate-700 bg-slate-900 text-white"
            inputMode="decimal"
          />
          <Button type="button" onClick={openBatch} disabled={busy || !venueId} className="min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening…</> : "Open Batch"}
          </Button>
        </div>
      </div>

      {!modeState.isLive && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[.06] px-3 py-2 text-[10px] text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {modeState.operatingMode} batch · funds off · session isolated from live books.
        </div>
      )}
    </div>
  );
}
