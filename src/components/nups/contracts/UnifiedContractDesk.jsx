import React from "react";
import UnifiedContractFlowV2 from "@/components/nups/contracts/UnifiedContractFlowV2";
import { FileSignature } from "lucide-react";

/**
 * Unified Contract Desk — one guided flow for identity, terms, payment,
 * signatures, contract generation, and the final receipt.
 */
export default function UnifiedContractDesk() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <FileSignature className="w-5 h-5 text-[#e8c86a]" /> UNIFIED CONTRACT — GlyphBucks + VIP
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-200">
          IDENTITY-BOUND WORKFLOW
        </span>
      </div>
      <UnifiedContractFlowV2 />
    </div>
  );
}
