import React from "react";
import { NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

export default function FrameworkAuthority() {
  return (
    <FinancialSectionShell orbSeed={1}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section I</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Operational Qualification Architecture
          </h2>
        </div>

        <div className={`${NEU_CARD} p-6 md:p-8 max-w-3xl mx-auto space-y-4`}>
          <p className="text-[14px] text-slate-300 leading-[1.8]" style={GEORGIA}>
            GlyphLock Financial establishes a structured operational qualification architecture for nightlife and entertainment venues operating within high-scrutiny underwriting environments.
          </p>
          <p className="text-[14px] text-slate-300 leading-[1.8]" style={GEORGIA}>
            This architecture standardizes documentation, governance reporting, and submission preparation aligned to formal review protocols.
          </p>
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}