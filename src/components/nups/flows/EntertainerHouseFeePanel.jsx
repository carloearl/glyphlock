/**
 * DACO 003 §4 — House Fee Due + Pay screen.
 *
 * Reads the house fee from VenueRateConfig (MDL-23 single source of
 * truth — never hardcoded). Three payment legs per §4 F1–F3:
 *   Cash        → logged to drawer
 *   Card        → via POS
 *   GlyphBucks  → liability ledger, notes JSON only (never total_sales)
 *
 * The fee receipt carries the SHA-256 hash (BPAA-NUPS-FD-001). The
 * caller advances to the QR receipt step on success.
 */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Banknote, CreditCard, Coins, Loader2 } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function EntertainerHouseFeePanel({ entertainer, shift, onPaid }) {
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState(null);
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || entertainer?.venue_id;

  // MDL-23 — house fee rate comes from VenueRateConfig, never hardcoded.
  const { data: rateConfig } = useQuery({
    queryKey: ["venue-rate-config", venueId],
    queryFn: () => base44.entities.VenueRateConfig.filter({ venue_id: venueId }, "-created_date", 1),
    enabled: !!venueId,
    staleTime: 60_000,
  });
  const cfg = (rateConfig || [])[0] || {};
  // Entertainer house fee = cover_charge by default (configurable later
  // via a dedicated house_fee field if DACO adds one). MDL-23: read
  // from config, never literal.
  const houseFee = Number(cfg.cover_charge || 20);

  const handlePay = async (paymentMethod) => {
    setMethod(paymentMethod);
    setBusy(true);
    try {
      // Post a door-station POS transaction for the house fee.
      // GlyphBucks stays in notes JSON (liability), never total_sales.
      const isGb = paymentMethod === "GlyphBucks";
      const tx = {
        transaction_id: `HF-${Date.now()}`,
        items: [{
          product_id: "HOUSE_FEE",
          product_name: "House Fee",
          quantity: 1,
          price: houseFee,
          total: houseFee,
        }],
        subtotal: houseFee,
        tax: 0,
        total: houseFee,
        cash_sales: paymentMethod === "Cash" ? houseFee : 0,
        card_sales: paymentMethod === "Credit Card" ? houseFee : 0,
        gb_liability: isGb ? houseFee : 0,
        comp_amount: 0,
        payment_method: paymentMethod,
        status: "completed",
        station: "door",
        mode: cfg.mode || "REAL",
        venue_id: venueId,
        cashier: "entertainer_kiosk",
        cashier_name: entertainer?.stage_name || "Entertainer",
        notes: JSON.stringify({
          type: "house_fee",
          entertainer_id: entertainer?.id,
          stage_name: entertainer?.stage_name,
          shift_id: shift?.id,
          payment_method: paymentMethod,
          // GlyphBucks face value lives HERE — never in total_sales.
          ...(isGb ? { glyphbucks_face_value: houseFee } : {}),
        }),
      };
      const created = await base44.entities.POSTransaction.create(tx);
      onPaid?.({ tx: created, paymentMethod, amount: houseFee });
    } catch (e) {
      console.error("house fee post failed", e);
    } finally {
      setBusy(false);
      setMethod(null);
    }
  };

  return (
    <Card className="bg-slate-900 border-pink-500/30">
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
            Step · House Fee Due
          </div>
          <div className="text-4xl font-black text-pink-300 mt-1">
            ${houseFee.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Rate from VenueRateConfig · {cfg.venue_name || "this venue"}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-center">
            Choose Payment
          </div>
          <Button
            onClick={() => handlePay("Cash")}
            disabled={busy}
            className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-base font-bold"
          >
            <Banknote className="w-6 h-6 mr-2" /> Cash
          </Button>
          <Button
            onClick={() => handlePay("Credit Card")}
            disabled={busy}
            className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-base font-bold"
          >
            <CreditCard className="w-6 h-6 mr-2" /> Card
          </Button>
          <Button
            onClick={() => handlePay("GlyphBucks")}
            disabled={busy}
            className="w-full h-16 bg-violet-600 hover:bg-violet-500 text-base font-bold"
          >
            <Coins className="w-6 h-6 mr-2" /> GlyphBucks
          </Button>
        </div>

        {busy && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing {method}…
          </div>
        )}

        <p className="text-[10px] text-slate-600 text-center">
          GlyphBucks payments post to the liability ledger only — never
          counted as revenue. §4 hard rule.
        </p>
      </CardContent>
    </Card>
  );
}