import React from "react";
import { GRID_BG, NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";

export default function FrameworkAuthority() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section I</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Operational Qualification Architecture
          </h2>
        </div>

        <div className={`${NEU_CARD} p-8 md:p-10 max-w-3xl mx-auto space-y-6`}>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={GEORGIA}>
            GlyphLock Financial establishes a structured operational qualification architecture for nightlife and entertainment venues operating within high-scrutiny underwriting environments.
          </p>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={GEORGIA}>
            This architecture standardizes documentation, governance reporting, and submission preparation aligned to formal review protocols.
          </p>
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}