import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowRight } from "lucide-react";

export default function DreamPalaceLineItems({
  lineItems, setLineItems, dreamDollarValue, setDreamDollarValue,
  waitressTip, setWaitressTip,
  surcharge, grandTotal, onBack, onNext
}) {
  const updateLine = (idx, field, value) => {
    setLineItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Auto-calc amount
      if (field === 'room_fee' || field === 'product') {
        const rf = field === 'room_fee' ? (parseFloat(value) || 0) : (parseFloat(next[idx].room_fee) || 0);
        const pr = field === 'product' ? (parseFloat(value) || 0) : (parseFloat(next[idx].product) || 0);
        next[idx].amount = rf + pr;
      }
      return next;
    });
  };

  const lineTotal = lineItems.reduce((s, li) => s + (li.amount || 0), 0);

  return (
    <Card className="bg-gray-900/60 border-yellow-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <DollarSign className="w-5 h-5" /> Order Details
        </CardTitle>
        <p className="text-xs text-red-400 font-bold">Dream Dollars (Club Currency) are not legal tender</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="py-2 px-1 text-left w-8">#</th>
                <th className="py-2 px-1 text-left">RM# / ENT. / Dur. / ENT Cub ID#</th>
                <th className="py-2 px-1 text-right w-24">Room Fee</th>
                <th className="py-2 px-1 text-center w-4">+</th>
                <th className="py-2 px-1 text-right w-24">Product</th>
                <th className="py-2 px-1 text-center w-4">+</th>
                <th className="py-2 px-1 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-1 px-1 text-gray-500">{li.line_number}</td>
                  <td className="py-1 px-1">
                    <Input value={li.room_ent_dur_id} onChange={e => updateLine(idx, 'room_ent_dur_id', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700" placeholder="Room / Entertainer / Duration" />
                  </td>
                  <td className="py-1 px-1">
                    <Input type="number" step="0.01" value={li.room_fee || ''} onChange={e => updateLine(idx, 'room_fee', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-right" placeholder="0.00" />
                  </td>
                  <td className="text-center text-gray-600">+</td>
                  <td className="py-1 px-1">
                    <Input type="number" step="0.01" value={li.product || ''} onChange={e => updateLine(idx, 'product', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-right" placeholder="0.00" />
                  </td>
                  <td className="text-center text-gray-600">+</td>
                  <td className="py-1 px-1 text-right font-bold text-white">${(li.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dream Dollar section */}
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-green-400">Dream Dollar Value (Amount Ordered)</Label>
            <Input type="number" step="1" value={dreamDollarValue || ''} onChange={e => setDreamDollarValue(parseFloat(e.target.value) || 0)}
              className="w-32 text-right bg-gray-700 border-gray-600 font-bold text-green-400" placeholder="0" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Processing Surcharge 30% for issuing Dream Dollars</span>
            <span className="font-bold text-yellow-400">${surcharge.toFixed(2)}</span>
          </div>
          <div className="text-[10px] text-gray-500 italic">
            ** Dream Dollars are sold as a Convenience medium of currency for payment and is not valid anywhere else. The Entertainer can redeem the Dream Dollars for Cash.
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
            <span className="text-gray-400">Line Items Total</span>
            <span className="text-white">${lineTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t-2 border-gray-600 pt-2">
            <span className="text-lg font-bold text-white">GRAND TOTAL CHARGE</span>
            <span className="text-2xl font-bold text-cyan-400">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 border-gray-700">← Back</Button>
          <Button onClick={onNext} className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold h-12">
            Next: Review & Agree <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}