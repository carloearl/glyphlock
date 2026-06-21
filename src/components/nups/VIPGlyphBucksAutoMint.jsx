import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

/**
 * VIPGlyphBucksAutoMint
 * ─────────────────────
 * Drops into the post-sign step of VIPContractFlow.
 *
 * When a VIP contract is signed and the room fee is paid, the venue
 * customarily issues the matching face-value GlyphBucks to the customer
 * (entertainer-spend currency). This component asks the LLM to break
 * the face value into denominations that match the tier (high-roller →
 * more $20/$50/$100 bills, mid-tier → mostly $5/$10/$20) then calls the
 * existing `createGlyphBucksSale` backend to mint the batch + bills.
 *
 * IMPORTANT — accounting rules upheld:
 *   • This call mints LIABILITY (face value) + revenue (30% surcharge).
 *   • Face value is never added to total_sales (handled by gateway).
 *   • Audit trail is created by the backend (SystemAuditLog).
 */
export default function VIPGlyphBucksAutoMint({
  guestName,
  faceValue,
  approvalCode,
  processorReference,
  cardLastFour,
  vipTier = "standard", // 'standard' | 'high_roller' | 'whale'
  onComplete,
}) {
  const [status, setStatus] = useState("idle"); // idle | thinking | minting | done | error
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState("");
  const [batch, setBatch] = useState(null);

  // Auto-trigger once mounted with a valid face value
  useEffect(() => {
    if (faceValue > 0 && status === "idle") mintGlyphBucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mintGlyphBucks = async () => {
    setError("");
    setStatus("thinking");
    try {
      // 1. Ask LLM for AI denomination breakdown matched to tier + face value
      const aiResp = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strip club VIP host preparing a GlyphBucks (entertainer-spend currency) breakdown.

Total face value to issue: $${faceValue}
VIP tier: ${vipTier}
Guest name: ${guestName}

Issue this face value as a mix of $1, $5, $10, $20, $50, $100 bills. Rules:
- whale tier ($1000+): mostly $50 + $100 bills, few singles
- high_roller ($500-999): mix of $20, $50, $100
- standard ($100-499): mostly $5, $10, $20 with a few singles
- Total of all (denomination × quantity) MUST exactly equal ${faceValue}
- Prefer fewer total bills for higher tiers (faster handoff)

Return JSON only.`,
        response_json_schema: {
          type: "object",
          properties: {
            denominations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  denomination: { type: "number", enum: [1, 5, 10, 20, 50, 100] },
                  quantity: { type: "number" },
                },
                required: ["denomination", "quantity"],
              },
            },
            reasoning: { type: "string" },
          },
          required: ["denominations"],
        },
      });

      const denoms = (aiResp.denominations || []).filter(
        (d) => d.quantity > 0 && [1, 5, 10, 20, 50, 100].includes(d.denomination)
      );
      // Sanity: AI math must match exactly. If off, fall back to greedy split.
      const total = denoms.reduce((s, d) => s + d.denomination * d.quantity, 0);
      const finalDenoms = total === faceValue ? denoms : greedyBreakdown(faceValue);

      setBreakdown({ denominations: finalDenoms, reasoning: aiResp.reasoning, ai_used: total === faceValue });
      setStatus("minting");

      // 2. Call the secure backend mint function
      const mintResp = await base44.functions.invoke("createGlyphBucksSale", {
        customer_name: guestName,
        denominations: finalDenoms,
        surcharge_rate: 0.3,
        approval_code: approvalCode,
        processor_reference: processorReference,
        card_last_four: cardLastFour,
        payment_method: "Credit Card",
      });

      if (mintResp.data?.success) {
        setBatch(mintResp.data.batch);
        setStatus("done");
        onComplete?.(mintResp.data);
      } else {
        setError(mintResp.data?.error || mintResp.data?.message || "GlyphBucks mint failed");
        setStatus("error");
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Mint failed");
      setStatus("error");
    }
  };

  // Greedy fallback if the LLM math doesn't reconcile
  function greedyBreakdown(face) {
    const denoms = [100, 50, 20, 10, 5, 1];
    let remaining = face;
    const out = [];
    for (const d of denoms) {
      const q = Math.floor(remaining / d);
      if (q > 0) {
        out.push({ denomination: d, quantity: q });
        remaining -= q * d;
      }
    }
    return out;
  }

  if (status === "idle") return null;

  if (status === "thinking" || status === "minting") {
    return (
      <Card className="bg-purple-500/10 border-purple-500/40">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <div>
            <p className="text-purple-300 font-bold text-sm">
              {status === "thinking" ? "AI building GlyphBucks denomination..." : "Minting bills + batch..."}
            </p>
            <p className="text-xs text-gray-400">${faceValue} face value · 30% surcharge applied</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="bg-red-500/10 border-red-500/40">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 font-bold text-sm">GlyphBucks mint failed</p>
          </div>
          <p className="text-xs text-gray-400">{error}</p>
          <Button onClick={mintGlyphBucks} variant="outline" className="border-red-500/50 text-red-300">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // status === 'done'
  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border-emerald-500/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-300 font-bold">${faceValue} GlyphBucks issued to {guestName}</p>
          {breakdown?.ai_used && (
            <span className="ml-auto text-[10px] text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI breakdown
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {breakdown.denominations.map((d) => (
            <div
              key={d.denomination}
              className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2 text-center"
            >
              <div className="text-[10px] text-emerald-400 font-mono">${d.denomination}</div>
              <div className="text-lg font-black text-white">×{d.quantity}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 border-t border-gray-800 pt-2 flex items-center justify-between flex-wrap gap-2">
          <span>
            <Coins className="w-3 h-3 inline mr-1 text-yellow-400" />
            Batch <span className="font-mono text-yellow-300">{batch?.batch_id?.slice(-12)}</span>
          </span>
          <span className="text-gray-500">
            Liability: ${faceValue.toFixed(2)} · Surcharge revenue: ${(faceValue * 0.3).toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}