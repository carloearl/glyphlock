import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Printer, DollarSign, CreditCard, ShoppingCart } from "lucide-react";

export default function DailySummary({ transactions = [] }) {
  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => new Date(t.created_date).toDateString() === today);
  
  const revenue = todayTx.reduce((s, t) => s + (t.total || 0), 0);
  const tips = todayTx.reduce((s, t) => s + (t.tip || 0), 0);
  const tax = todayTx.reduce((s, t) => s + (t.tax || 0), 0);
  const discounts = todayTx.reduce((s, t) => s + (t.discount || 0), 0);
  const items = todayTx.reduce((s, t) => s + (t.items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0);

  const byMethod = {};
  todayTx.forEach(t => {
    const m = t.payment_method || 'Cash';
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
    byMethod[m].count++;
    byMethod[m].total += (t.total || 0);
  });

  const byHour = {};
  todayTx.forEach(t => {
    const h = new Date(t.created_date).getHours();
    const label = h > 12 ? `${h-12}PM` : h === 0 ? '12AM' : `${h}AM`;
    byHour[label] = (byHour[label] || 0) + (t.total || 0);
  });

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Daily Summary — {new Date().toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-xl font-black text-green-400 font-mono">${revenue.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">Revenue</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
            <ShoppingCart className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <div className="text-xl font-black text-cyan-400">{todayTx.length}</div>
            <div className="text-[10px] text-gray-500">Transactions</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <DollarSign className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-black text-amber-400 font-mono">${tips.toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">Tips</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
            <CreditCard className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-xl font-black text-purple-400">{items}</div>
            <div className="text-[10px] text-gray-500">Items Sold</div>
          </div>
        </div>

        {/* By Payment Method */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">By Payment Method</div>
          <div className="space-y-1">
            {Object.entries(byMethod).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{method}</span>
                  <Badge className="bg-white/5 text-gray-400 text-[9px]">{data.count}x</Badge>
                </div>
                <span className="font-mono text-green-400 font-bold">${data.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tax + Discounts */}
        <div className="flex gap-4 text-xs text-gray-400">
          <span>Tax Collected: <span className="text-white font-mono">${tax.toFixed(2)}</span></span>
          <span>Discounts: <span className="text-red-400 font-mono">${discounts.toFixed(2)}</span></span>
        </div>
      </CardContent>
    </Card>
  );
}