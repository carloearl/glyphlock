import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Smartphone, Wifi, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * Card / Tap-to-Pay / Digital Wallet panel.
 *
 * LIVE mode never fabricates an approval. Until a processor SDK is configured,
 * the operator must enter the last four digits and the authorization code from
 * the physical terminal. TRAINING/DEMO may simulate a clearly labeled sample.
 */
export default function CardPaymentPanel({
  total,
  method,
  onConfirm,
  isLive = false,
  terminalConfigured = false,
}) {
  const [lastFour, setLastFour] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const isTap = method === "Digital Wallet";
  const title = isTap ? "Tap to Pay" : method === "Debit Card" ? "Debit Card" : "Credit Card";

  const handleProcess = async () => {
    if (processing) return;
    setError("");

    if (isLive && (!/^\d{4}$/.test(lastFour) || approvalCode.trim().length < 3)) {
      setError("Enter the card's last four digits and the authorization code shown by the payment terminal.");
      return;
    }

    setProcessing(true);
    try {
      if (!isLive) await new Promise((resolve) => setTimeout(resolve, 700));
      const sampleSuffix = Date.now().toString(36).toUpperCase();
      onConfirm?.({
        payment_method: method,
        card_last_four: isLive ? lastFour : (lastFour || "4242"),
        approval_code: isLive ? approvalCode.trim() : (approvalCode.trim() || `TRAIN-${sampleSuffix}`),
        payment_source: isLive
          ? (terminalConfigured ? "configured_terminal_manual_confirmation" : "external_terminal_manual_confirmation")
          : "training_simulation",
        payment_confirmed_at: new Date().toISOString(),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-black/70 border border-cyan-500/30 rounded-xl p-4 text-center">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Charge Amount</div>
        <div className="text-4xl font-mono font-black text-cyan-400">${Number(total || 0).toFixed(2)}</div>
        <div className="mt-1 text-xs font-bold text-slate-300">{title}</div>
      </div>

      {isLive ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[.06] p-3 text-xs text-emerald-100">
          <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" /> LIVE PAYMENT CONFIRMATION</div>
          <p className="mt-1 leading-relaxed text-emerald-100/65">
            Run the card on the physical terminal, wait for approval, then record the terminal response below. NUPS will not invent an authorization code.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[.06] p-3 text-xs text-amber-100">
          <div className="flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4" /> TRAINING SIMULATION</div>
          <p className="mt-1 text-amber-100/65">No card is charged. A sample approval record will be generated for practice.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center" aria-label="Card-present method">
        <div className={`rounded-xl p-4 border ${!isTap ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-black/30 border-white/10 opacity-60'}`}>
          <CreditCard className="w-8 h-8 mx-auto mb-1 text-cyan-400" />
          <div className="text-[10px] text-gray-300 font-bold">Insert / Swipe</div>
        </div>
        <div className={`rounded-xl p-4 border ${isTap ? 'bg-purple-500/10 border-purple-500/40' : 'bg-black/30 border-white/10 opacity-60'}`}>
          <Smartphone className="w-8 h-8 mx-auto mb-1 text-purple-400" />
          <div className="text-[10px] text-gray-300 font-bold">Phone / Watch</div>
        </div>
        <div className="rounded-xl p-4 border bg-blue-500/10 border-blue-500/40">
          <Wifi className="w-8 h-8 mx-auto mb-1 text-blue-400" />
          <div className="text-[10px] text-gray-300 font-bold">NFC Tap</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          {isLive ? "Terminal approval details (required)" : "Sample details (optional)"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="Card last four digits"
            placeholder="Last 4 digits"
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="text-center font-mono text-lg bg-black/40 border-white/15 text-white"
            inputMode="numeric"
            maxLength={4}
          />
          <Input
            aria-label="Terminal authorization code"
            placeholder="Approval code"
            value={approvalCode}
            onChange={(e) => setApprovalCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32))}
            className="text-center font-mono text-lg bg-black/40 border-white/15 text-white"
            maxLength={32}
          />
        </div>
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300" role="alert">{error}</div>}
      </div>

      <Button
        type="button"
        onClick={handleProcess}
        disabled={processing}
        className="w-full h-16 text-lg font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60"
      >
        {processing ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Recording…</>
        ) : isLive ? (
          <><ShieldCheck className="w-5 h-5 mr-2" /> Record Approved Payment</>
        ) : (
          <>Run Training Payment</>
        )}
      </Button>
    </div>
  );
}
