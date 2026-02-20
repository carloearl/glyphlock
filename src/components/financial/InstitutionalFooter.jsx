import React from "react";
import { NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

export default function InstitutionalFooter() {
  return (
    <FinancialSectionShell orbSeed={8}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mb-8" />

        <div className={`${NEU_CARD} p-6 md:p-8 text-center space-y-3`}>
          <p className="text-sm font-bold text-white tracking-[4px] uppercase" style={CINZEL}>
            GlyphLock Financial LLC
          </p>
          <div className="space-y-0.5">
            <p className="text-[10px] text-amber-500/40 tracking-[3px] uppercase" style={GEORGIA}>
              Operational Qualification Architecture
            </p>
            <p className="text-[10px] text-amber-500/40 tracking-[3px] uppercase" style={GEORGIA}>
              Deterministic Risk Profile
            </p>
            <p className="text-[10px] text-amber-500/40 tracking-[3px] uppercase" style={GEORGIA}>
              Verified Operations Standard
            </p>
          </div>

          <div className="w-12 h-px bg-amber-500/25 mx-auto my-4" />

          <p className="text-[10px] text-slate-600 leading-relaxed max-w-2xl mx-auto" style={GEORGIA}>
            Framework designed for structured underwriting review and machine-readable compliance reporting environments.
          </p>

          <p className="text-[10px] text-slate-700 pt-1">
            © {new Date().getFullYear()} GlyphLock Financial, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </FinancialSectionShell>
  );
}