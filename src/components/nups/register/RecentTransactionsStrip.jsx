/**
 * W3-012B Cycle 2B — RecentTransactionsStrip
 * BPAAA-REGISTER-OPS-STANDARD-v1.0 §1.4 (Operational Awareness)
 * ─────────────────────────────────────────────────────────────
 * Read-only awareness strip: last 5 POSTransaction rows so the cashier can
 * confirm their last ring posted. No accounting reports, no totals math —
 * values are displayed verbatim from stored records. "View all" hands off
 * to the existing Receipts tab.
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Receipt, ChevronRight } from "lucide-react";

export default function RecentTransactionsStrip({ onViewAll }) {
  const { data: recent = [] } = useQuery({
    queryKey: ["register-recent-transactions"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 5),
    refetchInterval: 30000,
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Recent Transactions</span>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 min-h-[44px] px-2"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {recent.length === 0 ? (
        <div className="text-[11px] text-slate-500 py-1">No transactions yet tonight.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-1.5 text-xs">
              <span className="font-mono text-slate-400 truncate">{t.transaction_id || t.id}</span>
              <span className="text-slate-500 hidden sm:inline">{t.payment_method || "—"}</span>
              <span className="text-slate-500 hidden md:inline">
                {t.created_date ? new Date(t.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
              <span className="font-bold text-white font-mono shrink-0">
                ${Number(t.total || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}