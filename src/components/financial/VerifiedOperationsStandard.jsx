import React from "react";
import { NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

const PROBABILISTIC = [
  "Category classification reliance",
  "Narrative explanations",
  "Incomplete control visibility",
  "Reactive dispute posture"
];

const STRUCTURED = [
  "Defined documentation protocols",
  "Transparent payout governance",
  "Prepaid instrument traceability",
  "Prepared submission dossier"
];

export default function VerifiedOperationsStandard() {
  return (
    <FinancialSectionShell orbSeed={3}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section III</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Verified Operations Standard
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={GEORGIA}>
          The Verified Operations Standard designates qualification status upon verified alignment with Deterministic Risk Profile documentation criteria.
        </p>

        <div className={`${NEU_CARD} overflow-hidden max-w-3xl mx-auto`}>
          <div className="grid grid-cols-2">
            <div className="px-6 py-4 border-b border-emerald-900/30 border-r border-r-emerald-900/20 bg-[#0c1e12]">
              <h3 className="text-xs font-bold text-yellow-500/80 uppercase tracking-[3px]" style={CINZEL}>
                Probabilistic Model
              </h3>
            </div>
            <div className="px-6 py-4 border-b border-emerald-900/30 bg-[#0c1e12]">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[3px]" style={CINZEL}>
                Structured Model
              </h3>
            </div>
          </div>
          {PROBABILISTIC.map((item, i) => (
            <div key={i} className={`grid grid-cols-2 ${i < PROBABILISTIC.length - 1 ? 'border-b border-emerald-900/15' : ''}`}>
              <div className="px-6 py-4 border-r border-emerald-900/15">
                <p className="text-[13px] text-slate-500 leading-relaxed" style={GEORGIA}>{item}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-[13px] text-slate-300 leading-relaxed" style={GEORGIA}>{STRUCTURED[i]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </FinancialSectionShell>
  );
}