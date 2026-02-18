import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Printer, Users } from "lucide-react";

export default function TipBreakdown({ transactions = [] }) {
  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => new Date(t.created_date).toDateString() === today);

  const totalTips = todayTx.reduce((s, t) => s + (t.tip || 0), 0);
  const tipsByMethod = {};
  const tipsByCashier = {};

  todayTx.forEach(t => {
    if (t.tip > 0) {
      const m = t.payment_method || 'Cash';
      tipsByMethod[m] = (tipsByMethod[m] || 0) + t.tip;
      const c = t.cashier || 'Unknown';
      tipsByCashier[c] = (tipsByCashier[c] || 0) + t.tip;
    }
  });

  const handlePrint = () => {
    const rows = Object.entries(tipsByCashier).map(([name, amt]) =>
      `<tr><td style="padding:4px;border-bottom:1px solid #ddd;">${name}</td><td style="padding:4px;text-align:right;border-bottom:1px solid #ddd;font-weight:bold;">$${amt.toFixed(2)}</td></tr>`
    ).join('');
    const html = `<html><head><title>Tip Report</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;font-size:12px;width:302px;}table{width:100%;border-collapse:collapse;}@media print{@page{margin:0;size:80mm auto;}}</style></head><body>
      <div style="text-align:center;font-weight:bold;font-size:16px;">TIP BREAKDOWN</div>
      <div style="text-align:center;font-size:10px;">Dream Palace — ${new Date().toLocaleDateString()}</div>
      <div style="text-align:center;font-size:10px;">815 N. Scottsdale Road, Tempe, AZ 85281</div>
      <hr style="margin:8px 0;"/>
      <table>${rows}</table>
      <hr style="margin:8px 0;border-top:2px solid #000;"/>
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;"><span>TOTAL TIPS:</span><span>$${totalTips.toFixed(2)}</span></div>
      <div style="text-align:center;font-size:8px;color:#666;margin-top:12px;">Printed: ${new Date().toLocaleString()} | N.U.P.S. POS v2.0</div>
    </body></html>`;
    const w = window.open('','_blank','width=350,height=600');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Today's Tip Breakdown
        </CardTitle>
        <Button size="sm" onClick={handlePrint} variant="outline" className="border-amber-500/30 text-amber-400 text-xs h-7">
          <Printer className="w-3 h-3 mr-1" /> Print
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-3">
          <div className="text-3xl font-black text-amber-400 font-mono">${totalTips.toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">{todayTx.filter(t => t.tip > 0).length} tipped transactions</div>
        </div>

        {Object.entries(tipsByCashier).length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">By Staff</div>
            {Object.entries(tipsByCashier).sort((a,b) => b[1] - a[1]).map(([name, amt]) => (
              <div key={name} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                <span className="text-sm text-white">{name.split('@')[0]}</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono">${amt.toFixed(2)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}