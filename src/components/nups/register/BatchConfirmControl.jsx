/**
 * BatchConfirmControl — step 2 of the two-step batch open.
 * Manager opens the batch; the door operator confirms the drawer before the
 * first transaction. The lookup is scoped by venue + operating mode so a
 * training register can never confirm a live batch.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode, markTrainingStep } from "@/lib/nups/operatingMode";
import { writeEntity } from "@/lib/nups/writeEntity";

export default function BatchConfirmControl({
  operatorName,
  operatorRole,
  operatorEmail,
  operatorId,
}) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);

  const { data: batch } = useQuery({
    queryKey: [
      "active-batch-confirm",
      venueId,
      modeState.ledgerMode,
      modeState.operatingMode,
      modeState.trainingSession?.id || null,
    ],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.filter({ status: "open" }, "-created_date", 100);
      return scopeRowsToOperatingMode(all, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      })[0] || null;
    },
    refetchInterval: 15000,
  });

  if (!batch || batch.door_confirmed) return null;

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let liveActor = null;
      try { liveActor = await base44.auth.me(); } catch (_) { /* kiosk identity may be primary */ }
      const result = await writeEntity({
        entity: "POSBatch",
        operation: "update",
        id: batch.id,
        data: {
          door_confirmed: true,
          door_confirmed_by: operatorName || operatorEmail || "door",
          door_confirmed_at: new Date().toISOString(),
        },
        actor: {
          email: liveActor?.email || operatorEmail,
          id: liveActor?.id || operatorId,
          role: operatorRole || "DOOR_GIRL",
        },
        venue_id: venueId,
        intent: `${modeState.operatingMode}_BATCH_DOOR_CONFIRMATION`,
        requestContext: {
          mode: modeState.ledgerMode,
          validation_run: modeState.isNonLive,
          session_id: modeState.trainingSession?.id || null,
        },
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Batch confirmation was rejected.");
      if (modeState.isTraining) markTrainingStep(venueId, "batch-confirmed");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-batch-confirm"] }),
        queryClient.invalidateQueries({ queryKey: ["active-batch"] }),
        queryClient.invalidateQueries({ queryKey: ["active-pos-batch"] }),
      ]);
      toast.success(`${modeState.operatingMode} batch confirmed`);
    } catch (error) {
      toast.error(`Batch confirmation failed: ${error?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  const ref = (batch.batch_id || batch.id || "").toString().slice(-8).toUpperCase();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3">
      <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-bold text-cyan-300">
          {modeState.operatingMode} batch {ref} opened by {batch.opened_by || batch.cashier_name || batch.cashier || "manager"}
        </div>
        <div className="text-[11px] text-cyan-200/70">
          Confirm the drawer (${Number(batch.opening_cash || 0).toFixed(2)} opening cash) before the first transaction.
        </div>
      </div>
      <Button
        type="button"
        onClick={confirm}
        disabled={busy}
        className="ml-auto min-h-[44px] bg-cyan-600 hover:bg-cyan-700 text-white font-bold disabled:opacity-60"
      >
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…</> : "Confirm Batch"}
      </Button>
    </div>
  );
}