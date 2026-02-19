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
          {transactions.map((transaction) => (
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

              <div className="mt-3 pt-3 border-t border-gray-700 pl-8 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Cashier:</span>
                  <span>{transaction.cashier}</span>
                </div>
              </div>
            </div>
          ))}
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