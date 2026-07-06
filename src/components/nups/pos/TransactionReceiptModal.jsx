import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import ReceiptPrinter from "../ReceiptPrinter";

/**
 * Shared post-sale receipt confirmation modal.
 * Renders in every paymentStep so the cashier is never stranded
 * on a blank screen after a completed sale.
 */
export default function TransactionReceiptModal({ open, onClose, transaction }) {
  return (
    <Dialog open={open && !!transaction} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md bg-slate-950 border-emerald-500/40 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
            Transaction Complete
          </DialogTitle>
        </DialogHeader>
        {transaction && (
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400/70">Total Charged</div>
              <div className="text-3xl font-black text-emerald-300 font-mono">
                ${Number(transaction.total || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {transaction.payment_method} · {transaction.transaction_id}
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