import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, CreditCard, Calendar, Printer, Search, XCircle } from "lucide-react";
import ReceiptPrinter from "./ReceiptPrinter";

const money = (value) => Number(value || 0).toFixed(2);

function safeDate(value) {
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function modeLabel(transaction) {
  if (transaction?.training_session_id || /\[TRAINING:/i.test(String(transaction?.notes || ""))) return "TRAINING";
  return String(transaction?.mode || (transaction?.validation_run ? "DEMO" : "REAL")).toUpperCase();
}

export default function TransactionHistory({ transactions = [], showReceipt = false }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const sorted = useMemo(
    () => [...(transactions || [])].sort((a, b) => safeDate(b.created_date) - safeDate(a.created_date)),
    [transactions],
  );

  return (
    <>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3 text-white">
            <span>Transaction History</span>
            <Badge variant="outline" className="border-slate-600 text-slate-300 font-mono">{sorted.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {sorted.map((transaction) => {
              const isDoor = (transaction.station || "").toLowerCase() === "door";
              const taxLabel = isDoor ? "Tax / Fee" : "Tax";
              const cardLast4 = transaction.card_last4 || transaction.card_last_four;
              const mode = modeLabel(transaction);
              const isVoided = ["void", "refunded"].includes(String(transaction.status || "").toLowerCase());

              return (
                <article
                  key={transaction.id || transaction.transaction_id}
                  className={`rounded-xl border p-4 ${
                    isVoided ? "border-rose-500/25 bg-rose-950/15 opacity-80" : "border-gray-700 bg-gray-800"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <ShoppingCart className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{transaction.transaction_id || transaction.id || "Transaction"}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {safeDate(transaction.created_date).toLocaleString()}
                          </span>
                          <span className="uppercase">{transaction.station || "POS"}</span>
                          <span>{transaction.cashier_name || transaction.cashier || "Unknown cashier"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start justify-between gap-2 sm:justify-end">
                      <div className="text-right">
                        <div className={`text-xl font-bold ${isVoided ? "line-through text-rose-300" : "text-cyan-400"}`}>
                          ${money(transaction.total)}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          <CreditCard className="mr-1 h-3 w-3" />
                          {transaction.payment_method || "Unknown tender"}
                        </Badge>
                      </div>
                      {showReceipt && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReceipt(transaction)}
                          className="min-h-[40px] border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                          aria-label={`View and print receipt ${transaction.transaction_id || transaction.id}`}
                        >
                          <Printer className="mr-1.5 h-4 w-4" /> Receipt
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 pl-0 sm:pl-8">
                    {(transaction.items || []).map((item, index) => (
                      <div key={`${item.product_id || item.product_name || "item"}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-gray-400">{Number(item.quantity || 0)}× {item.product_name || "Item"}</span>
                        <span className="shrink-0 font-mono text-gray-300">${money(item.total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 pl-0 text-xs sm:grid-cols-5 sm:pl-8">
                    {[
                      ["Subtotal", transaction.subtotal],
                      [taxLabel, Number(transaction.tax || 0) + Number(transaction.processing_fee || 0)],
                      ["Service", transaction.service_fee],
                      ["Discount", transaction.discount],
                      ["Tip", transaction.tip],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-gray-900/50 px-2 py-1.5">
                        <div className="text-[9px] uppercase tracking-wide text-gray-500">{label}</div>
                        <div className="font-mono text-gray-200">${money(value)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-700 pt-3 text-xs sm:pl-8">
                    {transaction.batch_id && <span><span className="text-gray-500">Batch:</span> <span className="font-mono text-gray-300">{String(transaction.batch_id).slice(-8).toUpperCase()}</span></span>}
                    {transaction.terminal_id && <span><span className="text-gray-500">Terminal:</span> <span className="font-mono text-gray-300">{transaction.terminal_id}</span></span>}
                    {cardLast4 && <span><span className="text-gray-500">Card:</span> <span className="font-mono text-gray-300">•••• {cardLast4}</span></span>}
                    {(transaction.auth_code || transaction.approval_code) && <span><span className="text-gray-500">Auth:</span> <span className="font-mono text-gray-300">{transaction.auth_code || transaction.approval_code}</span></span>}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5 sm:pl-8">
                    {transaction.status && transaction.status !== "completed" && (
                      <Badge variant="outline" className="border-yellow-500/40 text-[10px] uppercase text-yellow-300">
                        {isVoided && <XCircle className="mr-1 h-3 w-3" />}{transaction.status}
                      </Badge>
                    )}
                    {mode !== "REAL" && (
                      <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-300">{mode} · FUNDS OFF</Badge>
                    )}
                    {transaction.validation_run && (
                      <Badge variant="outline" className="border-blue-500/40 text-[10px] text-blue-300">VALIDATION RUN</Badge>
                    )}
                    {Number(transaction.comp_amount || 0) > 0 && (
                      <Badge variant="outline" className="border-rose-500/40 text-[10px] text-rose-300">COMP ${money(transaction.comp_amount)}</Badge>
                    )}
                  </div>

                  {transaction.comp_authorized_by && (
                    <div className="mt-2 text-[11px] text-rose-300/80 sm:pl-8">
                      Comp authorized by <span className="font-semibold">{transaction.comp_authorized_by}</span>
                      {transaction.comp_reason ? <> — {transaction.comp_reason}</> : null}
                    </div>
                  )}
                </article>
              );
            })}

            {!sorted.length && (
              <div className="py-12 text-center text-gray-500">
                <Search className="mx-auto mb-3 h-12 w-12 opacity-40" />
                <p>No matching transactions in this venue and mode.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedReceipt)} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto border-cyan-500/30 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle>Receipt · {selectedReceipt?.transaction_id || selectedReceipt?.id}</DialogTitle>
          </DialogHeader>
          {selectedReceipt && <ReceiptPrinter transaction={selectedReceipt} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
