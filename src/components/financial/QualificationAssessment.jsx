import React from "react";
import { NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";
import FinancialCTA from "./FinancialCTA";

const TIERS = [
  { tier: "Tier I", label: "Documentation Structured" },
  { tier: "Tier II", label: "Partial Alignment" },
  { tier: "Tier III", label: "Documentation Gaps Identified" }
];

export default function QualificationAssessment() {
  return (
    <FinancialSectionShell orbSeed={4}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section IV</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Structured Qualification Assessment
          </h2>
        </div>

        <p className="text-[14px] text-slate-300 leading-[1.8] max-w-3xl mx-auto text-center mb-8" style={GEORGIA}>
          Initiate formal review through a standardized operational questionnaire aligned to Deterministic Risk Profile criteria.
        </p>

        <div className={`${NEU_CARD} overflow-hidden max-w-2xl mx-auto mb-8`}>
          <div className="bg-black/40 px-5 py-2.5 border-b border-amber-500/15">
            <p className="text-[10px] uppercase tracking-[4px] text-amber-400 font-bold" style={CINZEL}>
              Assessment Output
            </p>
          </div>
          {TIERS.map((t, i) => (
            <div key={i} className={`px-5 py-3 flex items-baseline gap-4 ${i < TIERS.length - 1 ? 'border-b border-amber-500/8' : ''}`}>
              <span className="text-xs font-bold text-amber-400/80 tracking-wider whitespace-nowrap" style={CINZEL}>
                {t.tier}
              </span>
              <span className="text-[13px] text-slate-400" style={GEORGIA}>
                {t.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <FinancialCTA to="Consultation" variant="primary">
            Initiate Qualification
          </FinancialCTA>
          <FinancialCTA to="SecurityDocs" variant="outline">
            Framework Docs
          </FinancialCTA>
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}