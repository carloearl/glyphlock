import React from "react";
import { FIN_DIVIDER, FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";
import FinancialCTA from "./FinancialCTA";

const TIERS = [
  { tier: "Tier I", label: "Documentation Structured" },
  { tier: "Tier II", label: "Partial Alignment" },
  { tier: "Tier III", label: "Documentation Gaps Identified" }
];

export default function QualificationAssessment() {
  return (
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section IV</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Structured Qualification Assessment
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-12" style={GEORGIA}>
          Venues may initiate formal review through a standardized operational questionnaire aligned to Deterministic Risk Profile criteria.
        </p>

        <div className={`${FIN_CARD} overflow-hidden max-w-2xl mx-auto mb-12`}>
          <div className="bg-white/[0.02] px-6 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-[4px] text-indigo-300 font-bold" style={CINZEL}>
              Assessment Output
            </p>
          </div>
          {TIERS.map((t, i) => (
            <div key={i} className={`px-6 py-4 flex items-baseline gap-4 ${i < TIERS.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <span className="text-xs font-bold text-indigo-400 tracking-wider whitespace-nowrap" style={CINZEL}>
                {t.tier}
              </span>
              <span className="text-[13px] text-slate-400" style={GEORGIA}>
                {t.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <FinancialCTA to="Consultation" variant="primary">
            Initiate Qualification Review
          </FinancialCTA>
          <FinancialCTA to="SecurityDocs" variant="outline">
            Download Framework Documentation
          </FinancialCTA>
        </div>

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}