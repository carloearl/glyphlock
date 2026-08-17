/**
 * RecentTransactionsStrip — venue/mode-isolated cashier awareness.
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Receipt, ChevronRight } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode } from "@/lib/nups/operatingMode";

export default function RecentTransactionsStrip({ onViewAll }) {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);

  const { data: recent = [] } = useQuery({
    queryKey: [
      "register-recent-transactions",
      venueId,
      modeState.ledgerMode,
      modeState.operatingMode,
      modeState.trainingSession?.id || null,
    ],
    queryFn: async () => {
      const rows = await base44.entities.POSTransaction.list("-created_date", 100);
      return scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      }).filter((row) => row.status !== "void").slice(0, 5);
    },
    refetchInterval: 30000,
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Receipt className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 truncate">
            Recent {modeState.operatingMode} Transactions
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 min-h-[44px] px-2 shrink-0"
        >
          Receipts <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!modeState.isLive && (
        <div className="mb-2 rounded-md border border-amber-400/25 bg-amber-400/[.06] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-200">
          Funds off · isolated from live books
        </div>
      )}

      {recent.length === 0 ? (
        <div className="text-[11px] text-slate-500 py-2">No transactions in this venue and mode yet.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {recent.map((transaction) => (
            <div key={transaction.id || transaction.transaction_id} className="flex items-center justify-between gap-3 py-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-slate-300 truncate">{transaction.transaction_id || transaction.id}</div>
                <div className="mt-0.5 flex gap-2 text-[10px] text-slate-500">
                  <span>{transaction.payment_method || "—"}</span>
                  <span className="uppercase">{transaction.station || "POS"}</span>
                  <span>
                    {transaction.created_date
                      ? new Date(transaction.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </div>
              </div>
              <span className="font-bold text-white font-mono shrink-0">
                ${Number(transaction.total || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
