import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Banknote, CreditCard } from "lucide-react";

/**
 * DACO-20260613-DOOR-RBAC — Funds-Off Drawer Panel
 *
 * Surfaces the totals of quarantined `validation_run = true` POSTransactions
 * that the official DailySettlementDashboard hides by design. Operator sees
 * tonight's funds-off cash + card + total as an isolated number — separate
 * from the real-books SettlementTicker.
 *
 * Auto-hides when there are zero funds-off records for the venue + date, so
 * the panel only appears during/after a validation run, never on a normal night.
 */
export default function FundsOffDrawerPanel({ venueId, businessDate }) {
  const today = businessDate || new Date().toISOString().split("T")[0];

  const { data: txns = [] } = useQuery({
    queryKey: ["funds-off-txns", venueId, today],
    queryFn: async () => {
      if (!venueId) return [];
      const all = await base44.entities.POSTransaction.filter(
        { venue_id: venueId, status: "completed", validation_run: true },
        "-created_date",
        500
      );
      // Scope to the venue's business date using created_date prefix.
      return all.filter((t) => (t.created_date || "").slice(0, 10) === today);
    },
    refetchInterval: 30000,
    enabled: !!venueId,
  });

  // Silent on normal nights — only appears when funds-off records exist.
  if (txns.length === 0) return null;

  const cash = txns.reduce((s, t) => s + (Number(t.cash_sales) || 0), 0);
  const card = txns.reduce((s, t) => s + (Number(t.card_sales) || 0), 0);
  const total = cash + card;

  // Compact stacked rows — sized for the narrow Live Pulse side rail.
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
          Funds-Off Drawer · Validation Run
        </span>
      </div>
      <div className="text-[10px] text-amber-500/70 mb-3">
        {txns.length} record{txns.length === 1 ? "" : "s"} · excluded from official settlement
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between bg-black/30 border border-amber-500/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
            <Banknote className="w-3 h-3" /> Cash
          </div>
          <div className="text-base font-black text-amber-200 tabular-nums">${cash.toFixed(2)}</div>
        </div>
        <div className="flex items-center justify-between bg-black/30 border border-amber-500/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
            <CreditCard className="w-3 h-3" /> Card
          </div>
          <div className="text-base font-black text-amber-200 tabular-nums">${card.toFixed(2)}</div>
        </div>
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/50 rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
            Funds-Off Total
          </div>
          <div className="text-base font-black text-amber-100 tabular-nums">${total.toFixed(2)}</div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-amber-500/60 leading-relaxed">
        These records carry <code className="text-amber-300">validation_run: true</code> and are
        quarantined from booked revenue. They do not roll into <code className="text-amber-300">total_sales</code>,
        the DailySettlement dashboard, or driver-payout reconciliation.
      </p>
    </div>
  );
}