/**
 * BatchConfirmControl — step 2 of the two-step batch open.
 * Manager opens tonight's batch on the Manager Console; the Front Door
 * operator confirms it here before the first transaction of the shift.
 * Self-fetching: renders nothing when there's no open batch or it's
 * already confirmed.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function BatchConfirmControl({ operatorName }) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const { data: batch } = useQuery({
    queryKey: ["active-batch-confirm"],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.list("-created_date", 5);
      return all.find((b) => (b.status || "open").toLowerCase() === "open") || null;
    },
    refetchInterval: 15000,
  });

  if (!batch || batch.door_confirmed) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      await base44.entities.POSBatch.update(batch.id, {
        door_confirmed: true,
        door_confirmed_by: operatorName || "door",
        door_confirmed_at: new Date().toISOString(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-batch-confirm"] }),
        queryClient.invalidateQueries({ queryKey: ["active-batch"] }),
        queryClient.invalidateQueries({ queryKey: ["active-pos-batch"] }),
      ]);
    } finally {
      setBusy(false);
    }
  };

  const ref = (batch.batch_id || batch.id || "").toString().slice(-6).toUpperCase();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3">
      <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-bold text-cyan-300">
          Batch {ref} opened by {batch.opened_by || batch.cashier || "manager"}
        </div>
        <div className="text-[11px] text-cyan-200/70">
          Confirm the drawer (${Number(batch.opening_cash || 0).toFixed(2)} opening cash) before the first transaction.
        </div>
      </div>
      <Button
        onClick={confirm}
        disabled={busy}
        className="ml-auto min-h-[44px] bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
      >
        {busy ? "Confirming…" : "Confirm Batch"}
      </Button>
    </div>
  );
}