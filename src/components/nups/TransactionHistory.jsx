import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import ReceiptPrinter from "./ReceiptPrinter";

export default function TransactionHistory({ transactions, showReceipt = false }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {transactions.map((transaction) => {
            const isDoor = (transaction.station || "").toLowerCase() === "door";
            const taxLabel = isDoor ? "Fee (CC)" : "Tax";
            const cardLast4 = transaction.card_last4 || transaction.card_last_four;

            return (
              <div
                key={transaction.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-white">{transaction.transaction_id}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(transaction.created_date), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-start gap-2">
                    <div>
                      <div className="text-xl font-bold text-cyan-400">
                        ${transaction.total?.toFixed(2)}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {transaction.payment_method}
                      </Badge>
                    </div>
                    {showReceipt && <ReceiptPrinter transaction={transaction} />}
                  </div>
                </div>

                <div className="space-y-2 pl-8">
                  {transaction.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="text-gray-300">${item.total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Money breakdown — subtotal / tax-or-fee / discount / tip */}
                <div className="mt-3 pl-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-gray-900/50 rounded px-2 py-1.5">
                    <div className="text-gray-500 text-[10px] uppercase tracking-wide">Subtotal</div>
                    <div className="text-gray-200 font-mono">${(transaction.subtotal || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded px-2 py-1.5">
                    <div className="text-gray-500 text-[10px] uppercase tracking-wide">{taxLabel}</div>
                    <div className="text-gray-200 font-mono">${(transaction.tax || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded px-2 py-1.5">
                    <div className="text-gray-500 text-[10px] uppercase tracking-wide">Discount</div>
                    <div className={`font-mono ${transaction.discount > 0 ? "text-red-300" : "text-gray-500"}`}>
                      {transaction.discount > 0 ? `-$${transaction.discount.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded px-2 py-1.5">
                    <div className="text-gray-500 text-[10px] uppercase tracking-wide">Tip</div>
                    <div className="text-gray-200 font-mono">${(transaction.tip || 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Audit / operations details */}
                <div className="mt-3 pt-3 border-t border-gray-700 pl-8 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  <span>
                    <span className="text-gray-500">Cashier:</span>{" "}
                    <span className="text-gray-300">{transaction.cashier_name || transaction.cashier || "—"}</span>
                  </span>
                  {transaction.station && (
                    <span>
                      <span className="text-gray-500">Station:</span>{" "}
                      <span className="text-gray-300 uppercase">{transaction.station}</span>
                    </span>
                  )}
                  {transaction.batch_id && (
                    <span>
                      <span className="text-gray-500">Batch:</span>{" "}
                      <span className="text-gray-300 font-mono">{String(transaction.batch_id).slice(-6).toUpperCase()}</span>
                    </span>
                  )}
                  {transaction.terminal_id && (
                    <span>
                      <span className="text-gray-500">Terminal:</span>{" "}
                      <span className="text-gray-300 font-mono">{transaction.terminal_id}</span>
                    </span>
                  )}
                  {cardLast4 && (
                    <span>
                      <span className="text-gray-500">Card:</span>{" "}
                      <span className="text-gray-300 font-mono">****{cardLast4}</span>
                    </span>
                  )}
                  {transaction.auth_code && (
                    <span>
                      <span className="text-gray-500">Auth:</span>{" "}
                      <span className="text-gray-300 font-mono">{transaction.auth_code}</span>
                    </span>
                  )}
                </div>

                {/* Status badges row */}
                {(transaction.mode && transaction.mode !== "REAL") || transaction.validation_run || transaction.comp_amount > 0 || transaction.status !== "completed" ? (
                  <div className="mt-2 pl-8 flex flex-wrap gap-1.5">
                    {transaction.status && transaction.status !== "completed" && (
                      <Badge variant="outline" className="border-yellow-500/40 text-yellow-300 text-[10px] uppercase">
                        {transaction.status}
                      </Badge>
                    )}
                    {transaction.mode && transaction.mode !== "REAL" && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px]">
                        {transaction.mode}
                      </Badge>
                    )}
                    {transaction.validation_run && (
                      <Badge variant="outline" className="border-blue-500/40 text-blue-300 text-[10px]">
                        VALIDATION RUN
                      </Badge>
                    )}
                    {transaction.comp_amount > 0 && (
                      <Badge variant="outline" className="border-rose-500/40 text-rose-300 text-[10px]">
                        COMP ${transaction.comp_amount.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                ) : null}

                {transaction.comp_authorized_by && (
                  <div className="mt-2 pl-8 text-[11px] text-rose-300/80">
                    Comp authorized by <span className="font-semibold">{transaction.comp_authorized_by}</span>
                    {transaction.comp_reason ? <> — {transaction.comp_reason}</> : null}
                  </div>
                )}
              </div>
            );
          })}
          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}