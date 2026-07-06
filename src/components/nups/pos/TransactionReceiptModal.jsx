import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import ReceiptPrinter from "../ReceiptPrinter";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { buildReceiptBreakdown } from "@/lib/nups/receiptBreakdown";

/**
 * Shared post-sale receipt confirmation modal.
 * Renders in every paymentStep so the cashier is never stranded
 * on a blank screen after a completed sale. Displays the full fee
 * breakdown (subtotal → service fee → discount → gratuity → tax →
 * processing fee → total) using the shared receiptBreakdown logic.
 */
export default function TransactionReceiptModal({ open, onClose, transaction }) {
  const activeVenue = useActiveVenue();
  const [rates, setRates] = useState(null);

  const venueId = transaction?.venue_id || activeVenue?.venue_id || activeVenue?.id;

  useEffect(() => {
    let alive = true;
    if (!venueId) { setRates({}); return; }
    (async () => {
      try {
        const r = await loadVenueRates(venueId);
        if (alive) setRates(r || {});
      } catch { if (alive) setRates({}); }
    })();
    return () => { alive = false; };
  }, [venueId]);

  const bd = transaction ? buildReceiptBreakdown(transaction, rates || {}) : null;

  return (
    <Dialog open={open && !!transaction} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md bg-slate-950 border-emerald-500/40 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
            Transaction Complete
          </DialogTitle>
        </DialogHeader>
        {transaction && bd && (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400/70">Total Charged</div>
              <div className="text-3xl font-black text-emerald-300 font-mono">
                ${bd.grandTotal.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {transaction.payment_method} · {transaction.transaction_id}
              </div>
            </div>

            {/* Fee breakdown — standardized from receiptBreakdown.js */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Fee Breakdown</div>
              {bd.lines.map(l => (
                <div
                  key={l.key}
                  className={`flex justify-between text-sm ${l.emphasis ? 'text-amber-400 font-bold' : l.negative ? 'text-red-400' : 'text-slate-300'}`}
                >
                  <span>{l.label}</span>
                  <span className="font-mono">{l.negative ? '-' : ''}${Math.abs(l.amount).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-1 flex justify-between text-base font-black text-emerald-300">
                <span>Total</span>
                <span className="font-mono">${bd.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <ReceiptPrinter transaction={transaction} />
            <Button
              onClick={onClose}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12"
            >
              New Transaction
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}