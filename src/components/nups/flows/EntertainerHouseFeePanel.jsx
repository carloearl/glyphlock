/**
 * EntertainerHouseFeePanel — mode-isolated house-fee collection.
 * Uses VenueRateConfig.house_fee, the active venue/mode batch, the common
 * financial gateway, and honest terminal confirmation for LIVE card payments.
 */
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Banknote, CreditCard, Coins, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { scopeRowsToOperatingMode, stampOperationalRecord } from "@/lib/nups/operatingMode";
import { writeEntity } from "@/lib/nups/writeEntity";
import { computeReceiptHash } from "@/lib/nups/receiptHash";
import CardPaymentPanel from "@/components/nups/pos/CardPaymentPanel";

export default function EntertainerHouseFeePanel({ entertainer, shift, onPaid }) {
  const [busy, setBusy] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || entertainer?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);
  const modeQueryKey = [modeState.ledgerMode, modeState.operatingMode, modeState.trainingSession?.id || null];

  const { data: config = {} } = useQuery({
    queryKey: ["house-fee-rate-config", venueId],
    queryFn: () => loadVenueRates(venueId),
    enabled: Boolean(venueId),
    staleTime: 60000,
  });

  const { data: activeBatch } = useQuery({
    queryKey: ["house-fee-active-batch", venueId, ...modeQueryKey],
    queryFn: async () => {
      const rows = await base44.entities.POSBatch.filter({ status: "open" }, "-created_date", 100);
      return scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      })[0] || null;
    },
    enabled: Boolean(venueId),
    refetchInterval: 30000,
  });

  const houseFee = useMemo(() => Math.max(0, Number(config?.house_fee ?? 20)), [config]);
  const canPost = Boolean(activeBatch?.id && activeBatch?.door_confirmed);

  const postHouseFee = async (paymentMethod, details = {}) => {
    if (busy) return;
    if (!canPost) {
      toast.error("A confirmed batch is required before collecting the house fee.");
      return;
    }
    if (paymentMethod === "GlyphBucks" && modeState.isLive) {
      toast.error("LIVE GlyphBucks payment must use the bill scanner / verified GlyphBucks ledger workflow.");
      return;
    }

    setBusy(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const isGlyphBucks = paymentMethod === "GlyphBucks";
      const now = new Date().toISOString();
      const transaction = stampOperationalRecord({
        ...details,
        transaction_id: `HF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        items: [{
          product_id: "HOUSE_FEE",
          product_name: "Entertainer House Fee",
          quantity: 1,
          price: houseFee,
          total: houseFee,
        }],
        subtotal: houseFee,
        tax: 0,
        discount: 0,
        tip: 0,
        total: houseFee,
        cash_sales: paymentMethod === "Cash" ? houseFee : 0,
        card_sales: paymentMethod === "Credit Card" ? houseFee : 0,
        gb_liability: isGlyphBucks ? houseFee : 0,
        comp_amount: 0,
        payment_method: paymentMethod,
        status: "completed",
        station: "door",
        venue_id: venueId,
        batch_id: activeBatch.id,
        cashier: me?.email || "entertainer_checkin",
        cashier_name: me?.full_name || me?.name || entertainer?.stage_name || "Check-in operator",
        cashier_email: me?.email || null,
        cashier_id: me?.id || null,
        cashier_role: me?._highestRole || me?.role || null,
        customer_id: entertainer?.id || null,
        created_date: now,
        notes: JSON.stringify({
          type: "house_fee",
          entertainer_id: entertainer?.id,
          stage_name: entertainer?.stage_name,
          shift_id: shift?.id,
          payment_method: paymentMethod,
          operating_mode: modeState.operatingMode,
          ...(isGlyphBucks ? { training_glyphbucks_face_value: houseFee } : {}),
        }),
      }, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        supportsDemoFlag: true,
        transactional: true,
      });

      try {
        const { hash, version } = await computeReceiptHash(transaction);
        transaction.receipt_hash = hash;
        transaction.receipt_hash_version = version;
      } catch (_) { /* best effort */ }

      const result = await writeEntity({
        entity: "POSTransaction",
        operation: "create",
        data: transaction,
        actor: {
          email: me?.email,
          id: me?.id,
          role: me?._highestRole || me?.role || "External",
        },
        venue_id: venueId,
        intent: `${modeState.operatingMode}_ENTERTAINER_HOUSE_FEE`,
        requestContext: {
          mode: modeState.ledgerMode,
          validation_run: modeState.isNonLive,
          session_id: modeState.trainingSession?.id || null,
        },
      });
      if (!result?.ok) throw new Error(result?.block_reason || "House-fee transaction was rejected.");
      const created = result.value || transaction;
      toast.success(`${modeState.operatingMode} house fee recorded`);
      onPaid?.({ tx: created, paymentMethod, amount: houseFee });
      setSelectedMethod(null);
    } catch (error) {
      console.error("house fee post failed", error);
      toast.error(`House fee failed: ${error?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-pink-500/30">
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">House Fee Due · {modeState.operatingMode}</div>
          <div className="text-4xl font-black text-pink-300 mt-1">${houseFee.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">VenueRateConfig.house_fee · {config?.venue_name || activeVenue?.name || "selected venue"}</div>
        </div>

        {!modeState.isLive && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/[.07] p-3 text-xs text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {modeState.operatingMode} · funds off · no live cash, card, or GlyphBucks balance is changed.
          </div>
        )}

        {!canPost && (
          <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/[.07] p-3 text-xs text-red-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            A manager must open the {modeState.operatingMode} batch and Front Door must confirm it before payment.
          </div>
        )}

        {selectedMethod === "Credit Card" ? (
          <div className="space-y-3">
            <CardPaymentPanel
              total={houseFee}
              method="Credit Card"
              isLive={modeState.isLive}
              terminalConfigured={Boolean(config?.payment_terminal_enabled)}
              onConfirm={(details) => postHouseFee("Credit Card", details)}
            />
            <Button type="button" variant="outline" onClick={() => setSelectedMethod(null)} className="w-full border-slate-700 text-slate-300">Back to payment choices</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button type="button" onClick={() => postHouseFee("Cash")} disabled={busy || !canPost} className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-base font-bold disabled:opacity-40">
              <Banknote className="w-6 h-6 mr-2" /> Cash
            </Button>
            <Button type="button" onClick={() => setSelectedMethod("Credit Card")} disabled={busy || !canPost} className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-base font-bold disabled:opacity-40">
              <CreditCard className="w-6 h-6 mr-2" /> Card / Terminal
            </Button>
            <Button
              type="button"
              onClick={() => postHouseFee("GlyphBucks")}
              disabled={busy || !canPost || modeState.isLive}
              title={modeState.isLive ? "Use the verified GlyphBucks scanner/ledger workflow in LIVE mode" : "Simulate GlyphBucks payment in training"}
              className="w-full h-16 bg-violet-600 hover:bg-violet-500 text-base font-bold disabled:opacity-40"
            >
              <Coins className="w-6 h-6 mr-2" /> GlyphBucks {modeState.isLive ? "(Use Scanner)" : "Simulation"}
            </Button>
          </div>
        )}

        {busy && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Recording payment…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
