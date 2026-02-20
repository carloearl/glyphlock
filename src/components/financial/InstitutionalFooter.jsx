import React from "react";
import { FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

export default function InstitutionalFooter() {
  return (
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent mb-12" />

        <div className={`${FIN_CARD} p-8 md:p-10 text-center space-y-4`}>
          <p className="text-sm font-bold text-white tracking-[4px] uppercase" style={CINZEL}>
            GlyphLock Financial LLC
          </p>
          <div className="space-y-1">
            <p className="text-[11px] text-indigo-400/50 tracking-[3px] uppercase" style={GEORGIA}>
              Operational Qualification Architecture
            </p>
            <p className="text-[11px] text-indigo-400/50 tracking-[3px] uppercase" style={GEORGIA}>
              Deterministic Risk Profile
            </p>
            <p className="text-[11px] text-indigo-400/50 tracking-[3px] uppercase" style={GEORGIA}>
              Verified Operations Standard
            </p>
          </div>

          <div className="w-16 h-px bg-indigo-500/20 mx-auto my-6" />

          <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl mx-auto" style={GEORGIA}>
            Framework designed for structured underwriting review and compliance-aligned reporting environments. Designations reflect architectural alignment and do not constitute formal certification unless explicitly stated.
          </p>

          <p className="text-[10px] text-slate-600 pt-2">
            © {new Date().getFullYear()} GlyphLock Financial, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </FinancialSectionShell>
  );
}