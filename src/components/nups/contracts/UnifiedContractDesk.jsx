import React, { useState } from "react";
import UnifiedContractFlow from "@/components/nups/contracts/UnifiedContractFlow";
import MemberCheckInAutofill from "@/components/nups/contracts/MemberCheckInAutofill";
import { FileSignature } from "lucide-react";

/**
 * Unified Contract Desk — GlyphBucks issuance and the VIP suite contract are
 * MERGED into one flow: terms, guest identity, card capture, and signatures
 * are entered once and seal both records together.
 */
export default function UnifiedContractDesk() {
  const [memberFill, setMemberFill] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <FileSignature className="w-5 h-5 text-[#e8c86a]" /> UNIFIED CONTRACT — GlyphBucks + VIP
        </div>
        <MemberCheckInAutofill onPick={setMemberFill} />
      </div>
      <UnifiedContractFlow memberFill={memberFill} />
    </div>
  );
}