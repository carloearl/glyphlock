import React from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, Percent } from "lucide-react";

/**
 * Preset quick-charge buttons for common fees.
 * Each button adds a line item to the cart.
 */
const PRESETS = [
  { label: "Door Fee", amount: 30, color: "cyan" },
  { label: "VIP Entry", amount: 100, color: "purple" },
  { label: "Bottle Service", amount: 250, color: "pink" },
  { label: "Cover Charge", amount: 20, color: "blue" },
  { label: "Private Dance", amount: 40, color: "amber" },
  { label: "Champagne Room", amount: 500, color: "rose" },
  { label: "Two-Drink Min", amount: 25, color: "emerald" },
  { label: "Late Night Fee", amount: 15, color: "indigo" },
];

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];

export default function QuickChargePanel({ onAddItem, onSetDiscount, currentDiscount }) {
  return (
    <div className="space-y-4">
      {/* Quick Charges */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> Quick Charges
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              onClick={() => onAddItem({
                product_id: `preset-${p.label.toLowerCase().replace(/\s/g, '-')}`,
                product_name: p.label,
                quantity: 1,
                price: p.amount,
                total: p.amount,
                is_preset: true,
              })}
              className="h-16 flex-col gap-0.5 border-white/10 hover:border-white/30 bg-black/40 active:scale-95 transition-all"
            >
              <span className="text-[10px] text-gray-400 leading-tight">{p.label}</span>
              <span className="text-lg font-bold text-green-400">${p.amount}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Discount Presets */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
          <Percent className="w-3 h-3" /> Quick Discount
        </div>
        <div className="grid grid-cols-6 gap-2">
          {DISCOUNT_PRESETS.map((d) => (
            <Button
              key={d}
              variant="outline"
              onClick={() => onSetDiscount(d)}
              className={`h-10 text-sm font-bold active:scale-95 transition-all ${
                currentDiscount === d
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              {d}%
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}