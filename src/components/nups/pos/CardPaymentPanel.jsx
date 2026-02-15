import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Smartphone, Wifi } from "lucide-react";

/**
 * Card / Tap-to-Pay / Digital Wallet panel.
 * Simulates waiting for a card reader.
 * In production, this would integrate with Stripe Terminal SDK.
 */
export default function CardPaymentPanel({ total, method, onConfirm }) {
  const [lastFour, setLastFour] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [processing, setProcessing] = useState(false);

  const isTap = method === "Digital Wallet";
  const title = isTap ? "Tap to Pay" : method === "Debit Card" ? "Debit Card" : "Credit Card";

  const handleProcess = () => {
    setProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setProcessing(false);
      onConfirm({
        card_last_four: lastFour || "0000",
        approval_code: approvalCode || `APR-${Date.now().toString(36).toUpperCase()}`,
        method,
      });
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Amount */}
      <div className="bg-black/70 border border-cyan-500/30 rounded-xl p-4 text-center">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Charge Amount</div>
        <div className="text-4xl font-mono font-black text-cyan-400">${total.toFixed(2)}</div>
      </div>

      {/* Payment Method Indicator */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className={`rounded-xl p-4 border transition-all ${
          !isTap ? 'bg-cyan-500/10 border-cyan-500/40 scale-105' : 'bg-black/30 border-white/10 opacity-50'
        }`}>
          <CreditCard className="w-8 h-8 mx-auto mb-1 text-cyan-400" />
          <div className="text-[10px] text-gray-300 font-bold">Swipe / Insert</div>
        </div>
        <div className={`rounded-xl p-4 border transition-all ${
          isTap ? 'bg-purple-500/10 border-purple-500/40 scale-105' : 'bg-black/30 border-white/10 opacity-50'
        }`}>
          <Smartphone className="w-8 h-8 mx-auto mb-1 text-purple-400" />
          <div className="text-[10px] text-gray-300 font-bold">Phone / Watch</div>
        </div>
        <div className={`rounded-xl p-4 border transition-all bg-black/30 border-white/10 ${
          !isTap ? 'opacity-100' : 'opacity-50'
        }`}>
          <Wifi className="w-8 h-8 mx-auto mb-1 text-blue-400" />
          <div className="text-[10px] text-gray-300 font-bold">NFC Tap</div>
        </div>
      </div>

      {processing ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-16 h-16 mx-auto border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-lg font-bold text-cyan-400">Processing...</div>
          <div className="text-xs text-gray-500">
            {isTap ? "Hold device near terminal" : "Waiting for card reader"}
          </div>
        </div>
      ) : (
        <>
          {/* Manual Entry (fallback) */}
          <div className="space-y-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Manual Entry (Optional)</div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Last 4 digits"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-center font-mono text-lg bg-black/40 border-white/15 text-white"
                maxLength={4}
              />
              <Input
                placeholder="Approval code"
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg bg-black/40 border-white/15 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleProcess}
            className="w-full h-16 text-xl font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {isTap ? "📱 Process Tap Payment" : "💳 Process Card"}
          </Button>
        </>
      )}
    </div>
  );
}