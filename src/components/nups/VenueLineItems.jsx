import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowRight } from "lucide-react";

export default function VenueLineItems({
  lineItems, setLineItems,
  waitressTip, setWaitressTip,
  grandTotal, onBack, onNext, venue = null
}) {
  const updateLine = (idx, field, value) => {
    setLineItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Recalculate amount = room_fee + product whenever either changes
      if (['room_fee', 'product'].includes(field)) {
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
          <DollarSign className="w-5 h-5" /> VIP Room Order Details
        </CardTitle>
        <p className="text-xs text-gray-400">Enter each room session as a line item. Room Fee + Product = Line Amount.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-center">
                <th className="py-2 px-1 text-left w-6">#</th>
                <th className="py-2 px-1 text-left w-12">RM #</th>
                <th className="py-2 px-1 text-left">Entertainer</th>
                <th className="py-2 px-1 text-left w-20">Duration</th>
                <th className="py-2 px-1 text-left w-24">ENT Club ID#</th>
                <th className="py-2 px-1 text-right w-24">Room Fee ($)</th>
                <th className="py-2 px-1 text-center w-4 text-gray-600">+</th>
                <th className="py-2 px-1 text-right w-24">Product ($)</th>
                <th className="py-2 px-1 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={idx} className="border-b border-gray-800/60">
                  <td className="py-1 px-1 text-gray-500 text-center">{li.line_number}</td>
                  <td className="py-1 px-1">
                    <Input
                      value={li.room_number || ''}
                      onChange={e => updateLine(idx, 'room_number', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-center"
                      placeholder="e.g. 3"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      value={li.entertainer || ''}
                      onChange={e => updateLine(idx, 'entertainer', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700"
                      placeholder="Stage name"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      value={li.duration || ''}
                      onChange={e => updateLine(idx, 'duration', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-center"
                      placeholder="e.g. 30 min"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      value={li.ent_club_id || ''}
                      onChange={e => updateLine(idx, 'ent_club_id', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-center"
                      placeholder="Club ID"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      type="number" step="0.01"
                      value={li.room_fee || ''}
                      onChange={e => updateLine(idx, 'room_fee', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="text-center text-gray-600 px-1">+</td>
                  <td className="py-1 px-1">
                    <Input
                      type="number" step="0.01"
                      value={li.product || ''}
                      onChange={e => updateLine(idx, 'product', e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="py-1 px-1 text-right font-bold text-white">${(li.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          {lineTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Line Items Subtotal</span>
              <span className="text-white font-mono">${lineTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-pink-400">Waitress Tip <span className="text-gray-500 font-normal">(Customer Decides)</span></Label>
            <Input
              type="number" step="1"
              value={waitressTip || ''}
              onChange={e => setWaitressTip(parseFloat(e.target.value) || 0)}
              className="w-32 text-right bg-gray-700 border-pink-500/40 font-bold text-pink-400"
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center justify-between border-t-2 border-gray-600 pt-3">
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