import React, { useState } from "react";
import GlyphBucksSaleFlow from "@/components/nups/glyphbucks/GlyphBucksSaleFlow";
import VIPShowGenerator from "@/components/nups/vip/VIPShowGenerator";
import MemberCheckInAutofill from "@/components/nups/contracts/MemberCheckInAutofill";
import { Coins, Crown, Rows3, ArrowRightLeft } from "lucide-react";

/**
 * Unified Contract Desk — GlyphBucks stored-value sale + VIP Show contract on
 * one page. Identity (ID scan), card capture, and purchaser fields entered in
 * the GlyphBucks flow auto-fill the VIP contract live via a shared data bridge.
 */
export default function UnifiedContractDesk() {
  const [view, setView] = useState("BOTH"); // BOTH | GLYPHBUCKS | VIP
  const [shared, setShared] = useState(null);
  const [memberFill, setMemberFill] = useState(null);

  const tabBtn = (v, label, Icon) => (
    <button key={v} onClick={() => setView(v)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] transition-all ${
        view === v ? "bg-purple-800 text-white shadow-[0_0_18px_rgba(147,51,234,0.35)]" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabBtn("BOTH", "Both (Flow)", Rows3)}
        {tabBtn("GLYPHBUCKS", "GlyphBucks", Coins)}
        {tabBtn("VIP", "VIP Contract", Crown)}
        <MemberCheckInAutofill onPick={setMemberFill} />
        {shared?.purchaser_name && (
          <span className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/40 rounded-lg px-3 py-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Auto-fill active: {shared.purchaser_name}{shared.card_last4 ? ` · ••••${shared.card_last4}` : ""}{shared.id_scan_ref ? ` · ${shared.id_scan_ref}` : ""}
          </span>
        )}
      </div>

      {/* Top-to-bottom flow — GlyphBucks capture first, VIP contract auto-fills below */}
      <div className={view === "BOTH" ? "flex flex-col gap-6" : ""}>
        {(view === "BOTH" || view === "GLYPHBUCKS") && (
          <div className="min-w-0">
            <GlyphBucksSaleFlow onShared={setShared} prefill={memberFill} />
          </div>
        )}
        {(view === "BOTH" || view === "VIP") && (
          <div className="min-w-0">
            <VIPShowGenerator prefill={shared} />
          </div>
        )}
      </div>
    </div>
  );
}