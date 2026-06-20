import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Plus, Minus, Save, X, Banknote, Ticket, AlertCircle } from "lucide-react";

/**
 * DriverPayoutPanel — opens when door girl taps a driver card.
 *
 * Vinnie principle: gross cover ALWAYS rings up first at the register.
 * This panel calculates the driver's NET DISBURSEMENT only — it never
 * reduces total_sales. Promo cards & waived-cover guests just shift the
 * per-guest payout leg of the formula.
 *
 *   Standard guest      → per-guest payout (affiliated/outside) from rates
 *   Promo-card guest    → per-guest payout − promo_card_amount
 *   Cover-waived guest  → flat $10 (driver compensated but cover not collected)
 *
 * Output: a single object the parent persists to DriverPayout.notes:
 *   { guests, promo_guests, waived_guests, total_payout, breakdown }
 */
export default function DriverPayoutPanel({
  driver,
  rates,
  initial = {},
  onSave,
  onCancel,
}) {
  const [guests, setGuests] = useState(Number(initial.guests) || 0);
  const [promoGuests, setPromoGuests] = useState(Number(initial.promo_guests) || 0);
  const [waivedGuests, setWaivedGuests] = useState(Number(initial.waived_guests) || 0);

  const affiliated = !!driver?.affiliated;
  const perGuest = affiliated
    ? (Number(rates?.driver_payout_affiliated) || 30)
    : (Number(rates?.driver_payout_outside) || 20);
  const promoAmount = Number(rates?.promo_card_amount) || 5;
  const WAIVED_FLAT = 10; // Vinnie rule: driver gets $10 when guest waives cover

  // Keep sub-counts within bounds — promo + waived can't exceed total guests
  useEffect(() => {
    if (promoGuests + waivedGuests > guests) {
      const overflow = (promoGuests + waivedGuests) - guests;
      if (waivedGuests >= overflow) setWaivedGuests(w => w - overflow);
      else setPromoGuests(p => Math.max(0, p - overflow));
    }
  }, [guests, promoGuests, waivedGuests]);

  const breakdown = useMemo(() => {
    const standard = Math.max(0, guests - promoGuests - waivedGuests);
    const standardPay = standard * perGuest;
    const promoPay = promoGuests * Math.max(0, perGuest - promoAmount);
    const waivedPay = waivedGuests * WAIVED_FLAT;
    const total = standardPay + promoPay + waivedPay;
    return { standard, standardPay, promoPay, waivedPay, total };
  }, [guests, promoGuests, waivedGuests, perGuest, promoAmount]);

  const handleSave = () => {
    onSave({
      guests,
      promo_guests: promoGuests,
      waived_guests: waivedGuests,
      total_payout: breakdown.total,
      breakdown: {
        per_guest: perGuest,
        promo_discount: promoAmount,
        waived_flat: WAIVED_FLAT,
        ...breakdown,
      },
    });
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-slate-950 border-2 border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
      {/* Driver header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Car className="w-5 h-5 text-yellow-400 shrink-0" />
          <span className="font-bold text-white truncate">{driver?.name}</span>
          {affiliated ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px]">Affiliated</Badge>
          ) : (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[9px]">Outside</Badge>
          )}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Reminder strip — Vinnie principle */}
      <div className="flex items-start gap-2 text-[11px] text-amber-200 bg-amber-950/30 border border-amber-500/40 rounded-lg p-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
        <span>Ring up all cover charges at the register FIRST. This panel only calculates the driver's disbursement after the gross is on the books.</span>
      </div>

      {/* Total guests stepper */}
      <Counter
        label="Total guests brought"
        value={guests}
        onChange={setGuests}
        accent="#facc15"
      />

      {/* Promo card guests */}
      <div className="space-y-2">
        <Counter
          label={
            <span className="flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-pink-400" /> Guests with promo card (−${promoAmount}/each)
            </span>
          }
          value={promoGuests}
          onChange={setPromoGuests}
          max={guests - waivedGuests}
          accent="#ec4899"
        />
      </div>

      {/* Waived cover checkbox-style row */}
      <div className="space-y-2">
        <Counter
          label={
            <span className="flex items-center gap-1.5">
              <Checkbox checked={waivedGuests > 0} className="border-cyan-500" />
              Guests waiving cover (driver gets flat ${WAIVED_FLAT})
            </span>
          }
          value={waivedGuests}
          onChange={setWaivedGuests}
          max={guests - promoGuests}
          accent="#06b6d4"
        />
      </div>

      {/* Breakdown ledger */}
      <div className="rounded-lg bg-black/40 border border-gray-800 p-3 space-y-1.5 text-xs font-mono">
        <Row label={`Standard (${breakdown.standard} × $${perGuest})`} value={breakdown.standardPay} />
        <Row label={`Promo card (${promoGuests} × $${Math.max(0, perGuest - promoAmount)})`} value={breakdown.promoPay} />
        <Row label={`Waived cover (${waivedGuests} × $${WAIVED_FLAT})`} value={breakdown.waivedPay} />
        <div className="border-t border-gray-800 mt-1.5 pt-1.5 flex items-center justify-between">
          <span className="text-yellow-300 font-bold flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5" /> DRIVER OWED
          </span>
          <span className="text-2xl font-black text-yellow-400">${breakdown.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
          disabled={guests === 0}
        >
          <Save className="w-4 h-4 mr-1" /> Save Drop-off
        </Button>
        <Button onClick={onCancel} variant="outline" className="border-gray-700 text-gray-300">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Counter({ label, value, onChange, max = 999, accent = "#facc15" }) {
  const set = (v) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div>
      <label className="text-xs text-gray-300 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => set(value - 1)}
          disabled={value <= 0}
          variant="outline"
          className="h-11 w-11 p-0 border-gray-700 text-white"
          style={{ borderColor: `${accent}66` }}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={e => set(parseInt(e.target.value) || 0)}
          className="h-11 text-center text-2xl font-black bg-black/40 border-gray-700 text-white"
          style={{ borderColor: `${accent}66`, color: accent }}
        />
        <Button
          onClick={() => set(value + 1)}
          disabled={value >= max}
          className="h-11 w-11 p-0 text-black font-bold"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-gray-400">
      <span>{label}</span>
      <span className="text-gray-200">${value.toFixed(2)}</span>
    </div>
  );
}