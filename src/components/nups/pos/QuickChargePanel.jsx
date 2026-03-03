import React from "react";
import { Percent } from "lucide-react";

const PRESETS = [
  { label: "Door Fee",       amount: 30,  accent: "#06b6d4" }, // cyan
  { label: "VIP Entry",      amount: 100, accent: "#a855f7" }, // purple
  { label: "Bottle Service", amount: 250, accent: "#ec4899" }, // pink
  { label: "Cover Charge",   amount: 20,  accent: "#3b82f6" }, // blue
  { label: "Private Dance",  amount: 40,  accent: "#f59e0b" }, // amber
  { label: "Champagne Room", amount: 500, accent: "#f43f5e" }, // rose
  { label: "Two-Drink Min",  amount: 25,  accent: "#10b981" }, // emerald
  { label: "Late Night Fee", amount: 15,  accent: "#6366f1" }, // indigo
];

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];

export default function QuickChargePanel({ onAddItem, onSetDiscount, currentDiscount }) {
  return (
    <div className="space-y-5">
      {/* Quick Charges — big touch targets */}
      <div className="grid grid-cols-4 gap-2.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onAddItem({
              product_id: `preset-${p.label.toLowerCase().replace(/\s/g, '-')}`,
              product_name: p.label,
              quantity: 1,
              price: p.amount,
              total: p.amount,
              is_preset: true,
            })}
            className="rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all select-none"
            style={{
              height: '76px',
              background: `linear-gradient(135deg, ${p.accent}18, ${p.accent}08)`,
              border: `1.5px solid ${p.accent}35`,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${p.accent}70`}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${p.accent}35`}
          >
            <span className="text-[11px] font-semibold leading-tight text-center px-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{p.label}</span>
            <span className="text-xl font-black" style={{ color: p.accent }}>${p.amount}</span>
          </button>
        ))}
      </div>

      {/* Discount strip */}
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
          <Percent className="w-3 h-3" /> Quick Discount
        </div>
        <div className="flex gap-2">
          {DISCOUNT_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => onSetDiscount(currentDiscount === d ? 0 : d)}
              className="flex-1 h-10 rounded-lg text-sm font-bold transition-all active:scale-95"
              style={{
                background: currentDiscount === d ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                border: currentDiscount === d ? '1.5px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.08)',
                color: currentDiscount === d ? '#f59e0b' : 'rgba(255,255,255,0.45)',
              }}
            >
              {d}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}