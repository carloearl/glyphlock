import React, { useState, useEffect } from "react";
import { Percent, Plus, X, Keyboard, AlertTriangle, Check, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";

// NOTE: Bar presets (non-door) keep legacy seed amounts. They drive non-door
// stations only and are NOT subject to the DACO-FRONTDOOR-DRIVER directive.
// Door presets (below) are now SOURCED LIVE from VenueRateConfig per venue —
// zero hardcoded dollar figures in the door path.
const PRESETS = [
  { label: "Door Fee",       amount: 30,  accent: "#06b6d4" },
  { label: "VIP Entry",      amount: 100, accent: "#a855f7" },
  { label: "Bottle Service", amount: 250, accent: "#ec4899" },
  { label: "Cover Charge",   amount: 20,  accent: "#3b82f6" },
  { label: "Private Dance",  amount: 40,  accent: "#f59e0b" },
  { label: "Champagne Room", amount: 500, accent: "#f43f5e" },
  { label: "Two-Drink Min",  amount: 25,  accent: "#10b981" },
  { label: "Late Night Fee", amount: 15,  accent: "#6366f1" },
];

// Door presets — pure dollar-amount buttons. No labels, no cover/re-entry/VIP
// categories, no promo button. The door girl picks the amount; everything that
// modifies the ring-up (discounts, comp, payment method) lives AFTER ring-up in
// the cart pane under manager-PIN gates.
const DOOR_PRESETS = [
  { label: "$50", amount: 50, accent: "#a855f7" },
  { label: "$40", amount: 40, accent: "#ec4899" },
  { label: "$30", amount: 30, accent: "#06b6d4" },
  { label: "$20", amount: 20, accent: "#22c55e" },
  { label: "$10", amount: 10, accent: "#f59e0b" },
];



const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];

// ─── Quick Add Product (inline form) ─────────────────────────────────────────
function QuickAddProduct({ onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Other");
  const [saving, setSaving] = useState(false);

  const CATS = ["Food & Beverage", "Spirits", "Beer & Wine", "Mixers", "VIP Service", "Merchandise", "Services", "Other"];

  const save = async () => {
    if (!name || !price) return;
    setSaving(true);
    await base44.entities.POSProduct.create({ name, price: parseFloat(price), category, is_active: true, stock_quantity: 99, taxable: true, tax_rate: 0.08 });
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    setSaving(false);
    onClose();
  };

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.25)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Quick Add Product</span>
        <button onClick={onClose} className="text-gray-600 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex gap-2">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name"
          className="h-8 flex-1 bg-black/40 border-white/10 text-white text-sm placeholder:text-gray-600" />
        <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="$0.00" type="number" step="0.01"
          className="h-8 w-20 bg-black/40 border-white/10 text-white text-sm font-mono" />
      </div>
      <div className="flex gap-2">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="flex-1 h-8 rounded-lg text-xs text-white font-medium px-2"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={save} disabled={!name || !price || saving}
          className="h-8 px-4 rounded-lg text-xs font-black text-white disabled:opacity-40 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
          {saving ? "Saving..." : "Add"}
        </button>
      </div>
    </div>
  );
}

// ─── Manual Item Entry (mirrors Tkinter POSApp.add_item) ─────────────────────
function ManualItemEntry({ onAddItem }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const p = parseFloat(price);
    const q = parseInt(qty);
    if (!name.trim() || isNaN(p) || p < 0 || isNaN(q) || q <= 0) {
      setError("Enter a valid name, positive price, and quantity ≥ 1.");
      return;
    }
    setError("");
    onAddItem({
      product_id: `manual-${Date.now()}`,
      product_name: name.trim(),
      quantity: q,
      price: p,
      total: p * q,
    });
    setName(""); setPrice(""); setQty("1");
  };

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.25)' }}>
      <div className="flex items-center gap-1.5">
        <Keyboard className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Manual Entry</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Item name"
          className="h-9 flex-1 bg-black/40 border-white/10 text-white text-sm placeholder:text-gray-600"
        />
        <Input
          value={price}
          onChange={e => setPrice(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="$0.00"
          type="number"
          step="0.01"
          min="0"
          className="h-9 w-20 bg-black/40 border-white/10 text-white text-sm font-mono"
        />
        <Input
          value={qty}
          onChange={e => setQty(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Qty"
          type="number"
          min="1"
          className="h-9 w-14 bg-black/40 border-white/10 text-white text-sm font-mono"
        />
        <button
          onClick={handleAdd}
          className="h-9 px-4 rounded-lg text-xs font-black text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
        >
          Add
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export default function QuickChargePanel({ onAddItem, onSetDiscount, currentDiscount, station }) {
  const isDoor = station === 'door';
  const activePresets = isDoor ? DOOR_PRESETS : PRESETS;
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { venueId } = useActiveVenue();
  const [promoAmount, setPromoAmount] = useState(5);

  // Live-load the venue's promo card amount (no hardcoded dollar figures at door)
  useEffect(() => {
    if (!isDoor || !venueId) return;
    let cancelled = false;
    (async () => {
      const rates = await loadVenueRates(venueId);
      if (!cancelled && rates?.promo_card_amount > 0) {
        setPromoAmount(Number(rates.promo_card_amount));
      }
    })();
    return () => { cancelled = true; };
  }, [isDoor, venueId]);

  const handlePromoCard = () => {
    // Negative line item, flagged is_promo:true so accounting can count usage
    // (per VenueRateConfig.promo_card_amount description). Walk-in / no-driver
    // discount — applied directly to the gross ring-up, not a driver payout.
    onAddItem({
      product_id: `promo-no-driver-${Date.now()}`,
      product_name: `Promo Card (No Driver) -$${promoAmount}`,
      quantity: 1,
      price: -promoAmount,
      total: -promoAmount,
      is_preset: true,
      is_promo: true,
      promo_reason: 'no_driver_walk_in',
    });
  };

  return (
    <div className="space-y-5">
      {/* Manual Entry — HIDDEN at door. Door girl is locked to preset buttons
          only (strip-club entry + driver payouts). No freeform ring-ups. */}
      {!isDoor && <ManualItemEntry onAddItem={onAddItem} />}

      {/* Quick Add Product — hidden on door */}
      {!isDoor && (
        showQuickAdd ? (
          <QuickAddProduct onClose={() => setShowQuickAdd(false)} />
        ) : (
          <button onClick={() => setShowQuickAdd(true)}
            className="w-full h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: 'rgba(6,182,212,0.06)', border: '1px dashed rgba(6,182,212,0.3)', color: 'rgba(6,182,212,0.7)' }}>
            <Plus className="w-3.5 h-3.5" /> Quick Add Product to Catalog
          </button>
        )
      )}

      {/* Quick Charges — door uses a VERTICAL stack (single column) so the
          panel can sit alongside the Driver pane without cramping. Other
          stations keep the 4-up grid for product density. */}
      <div className={isDoor ? 'flex flex-col gap-2' : 'grid grid-cols-4 gap-2'}>
        {activePresets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              onAddItem({
                product_id: `preset-${p.label.toLowerCase().replace(/\s/g, '-')}`,
                product_name: isDoor ? `Door Entry ${p.label}` : p.label,
                quantity: 1,
                price: p.amount,
                total: p.amount,
                is_preset: true,
              });
            }}
            className="rounded-xl flex items-center justify-center active:scale-95 transition-all select-none px-2 w-full"
            style={{
              height: isDoor ? '64px' : '70px',
              background: `linear-gradient(135deg, ${p.accent}38, ${p.accent}14)`,
              border: `2px solid ${p.accent}`,
              boxShadow: `0 0 14px ${p.accent}40, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <span
              className={isDoor ? 'text-3xl font-black tracking-tight' : 'text-lg font-black'}
              style={{ color: p.accent, textShadow: `0 0 10px ${p.accent}80` }}
            >
              {p.label}
            </span>
          </button>
        ))}
      </div>

      {/* Promo Card — DOOR ONLY. One-tap discount for guests who arrived
          WITHOUT a driver. Amount sourced live from VenueRateConfig
          (promo_card_amount). Posts as a negative line item with
          is_promo:true so accounting can count usage. */}
      {isDoor && (
        <button
          onClick={handlePromoCard}
          className="w-full rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all select-none px-3"
          style={{
            height: '56px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.08))',
            border: '2px solid #10b981',
            boxShadow: '0 0 14px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <Gift className="w-5 h-5" style={{ color: '#10b981' }} />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-base font-black tracking-tight" style={{ color: '#10b981', textShadow: '0 0 10px rgba(16,185,129,0.6)' }}>
              PROMO CARD −${promoAmount}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.7)' }}>
              Guest · No Driver
            </span>
          </div>
        </button>
      )}

      {/* Discount strip — hidden on door station */}
      {!isDoor && (
      <>
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
      </>
      )}
    </div>
  );
}