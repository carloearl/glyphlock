import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Banknote, Plus, Minus, Printer } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const DENOMINATIONS = [
  { label: "$100", value: 100 }, { label: "$50", value: 50 },
  { label: "$20", value: 20 }, { label: "$10", value: 10 },
  { label: "$5", value: 5 }, { label: "$1", value: 1 },
  { label: "Quarters", value: 0.25 }, { label: "Dimes", value: 0.10 },
  { label: "Nickels", value: 0.05 }, { label: "Pennies", value: 0.01 },
];

export default function CashDrawerLog() {
  const activeVenue = useActiveVenue();
  const venueLabel = [activeVenue?.name || "Active Venue", activeVenue?.address, activeVenue?.city, activeVenue?.state].filter(Boolean).join(" — ");
  const [counts, setCounts] = useState(DENOMINATIONS.map(() => 0));
  const [reason, setReason] = useState("end_of_shift");

  const total = DENOMINATIONS.reduce((s, d, i) => s + d.value * counts[i], 0);

  const updateCount = (idx, delta) => {
    setCounts(prev => {
      const n = [...prev];
      n[idx] = Math.max(0, n[idx] + delta);
      return n;
    });
  };

  const handlePrint = () => {
    const rows = DENOMINATIONS.map((d, i) => counts[i] > 0 ?
      `<tr><td style="padding:3px 6px;border-bottom:1px dotted #ccc;">${d.label}</td><td style="text-align:center;padding:3px;border-bottom:1px dotted #ccc;">${counts[i]}</td><td style="text-align:right;padding:3px 6px;border-bottom:1px dotted #ccc;">$${(d.value * counts[i]).toFixed(2)}</td></tr>` : ''
    ).filter(Boolean).join('');
    const html = `<html><head><title>Cash Count</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;font-size:12px;width:302px;}table{width:100%;border-collapse:collapse;}@media print{@page{margin:0;size:80mm auto;}}</style></head><body>
      <div style="text-align:center;font-weight:bold;font-size:16px;">CASH DRAWER COUNT</div>
      <div style="text-align:center;font-size:10px;">${venueLabel}</div>
      <div style="text-align:center;font-size:10px;">${new Date().toLocaleString()}</div>
      <hr style="margin:8px 0;"/>
      <table><tr style="font-weight:bold;"><td>Denom</td><td style="text-align:center;">Count</td><td style="text-align:right;">Total</td></tr>${rows}</table>
      <hr style="margin:8px 0;border-top:2px solid #000;"/>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;"><span>DRAWER TOTAL:</span><span>$${total.toFixed(2)}</span></div>
      <div style="text-align:center;font-size:8px;color:#666;margin-top:12px;">N.U.P.S. POS v2.0 — Secured by GlyphLock</div>
    </body></html>`;
    const w = window.open('','_blank','width=350,height=600');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-green-400 flex items-center gap-2">
          <Banknote className="w-4 h-4" /> Cash Drawer Count
        </CardTitle>
        <Button size="sm" onClick={handlePrint} variant="outline" className="border-green-500/30 text-green-400 text-xs h-7">
          <Printer className="w-3 h-3 mr-1" /> Print Count
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {DENOMINATIONS.map((d, i) => (
            <div key={d.label} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
              <span className="text-sm text-white w-20">{d.label}</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={() => updateCount(i, -1)}
                  className="h-7 w-7 border-white/10 text-gray-400">
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center font-mono text-white font-bold">{counts[i]}</span>
                <Button size="icon" variant="outline" onClick={() => updateCount(i, 1)}
                  className="h-7 w-7 border-white/10 text-gray-400">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <span className="font-mono text-green-400 w-20 text-right">${(d.value * counts[i]).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
          <span className="text-sm font-bold text-white">DRAWER TOTAL</span>
          <span className="text-2xl font-black text-green-400 font-mono">${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}