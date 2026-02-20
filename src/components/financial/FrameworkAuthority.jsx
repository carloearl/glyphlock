import React from "react";
import { FIN_DIVIDER, FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

export default function FrameworkAuthority() {
  return (
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section I</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Operational Qualification Architecture
          </h2>
        </div>

        <div className={`${FIN_CARD} p-8 md:p-10 max-w-3xl mx-auto space-y-5`}>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={GEORGIA}>
            GlyphLock Financial establishes a structured operational qualification architecture for nightlife and entertainment venues operating within high-scrutiny underwriting environments.
          </p>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={GEORGIA}>
            This architecture standardizes documentation, governance reporting, and submission preparation aligned to formal review protocols.
          </p>
        </div>

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}