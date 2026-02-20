import React from "react";
import { GRID_BG, NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialCTA from "./FinancialCTA";

const TIERS = [
  { tier: "Tier I", label: "Documentation Structured" },
  { tier: "Tier II", label: "Partial Alignment" },
  { tier: "Tier III", label: "Documentation Gaps Identified" }
];

export default function QualificationAssessment() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section IV</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Structured Qualification Assessment
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={GEORGIA}>
          Venues may initiate formal review through a standardized operational questionnaire aligned to Deterministic Risk Profile criteria.
        </p>

        <div className={`${NEU_CARD} overflow-hidden max-w-2xl mx-auto mb-14`}>
          <div className="bg-[#0c1e12] px-6 py-3 border-b border-emerald-900/25">
            <p className="text-[10px] uppercase tracking-[4px] text-emerald-400 font-bold" style={CINZEL}>
              Assessment Output
            </p>
          </div>
          {TIERS.map((t, i) => (
            <div key={i} className={`px-6 py-4 flex items-baseline gap-4 ${i < TIERS.length - 1 ? 'border-b border-emerald-900/15' : ''}`}>
              <span className="text-xs font-bold text-emerald-400 tracking-wider whitespace-nowrap" style={CINZEL}>
                {t.tier}
              </span>
              <span className="text-[13px] text-slate-400" style={GEORGIA}>
                {t.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <FinancialCTA to="Consultation" variant="primary">
            Initiate Qualification Review
          </FinancialCTA>
          <FinancialCTA to="SecurityDocs" variant="outline">
            Download Framework Documentation
          </FinancialCTA>
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}