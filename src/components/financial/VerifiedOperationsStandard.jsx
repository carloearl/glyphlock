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
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section III</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Verified Operations Standard
          </h2>
        </div>

        <p className="text-[14px] text-slate-300 leading-[1.8] max-w-3xl mx-auto text-center mb-8" style={GEORGIA}>
          Qualification status upon verified alignment with Deterministic Risk Profile documentation criteria.
        </p>

        <div className={`${NEU_CARD} overflow-hidden max-w-3xl mx-auto`}>
          <div className="grid grid-cols-2">
            <div className="px-5 py-3 border-b border-amber-500/10 border-r border-r-amber-500/10 bg-black/30">
              <h3 className="text-[10px] font-bold text-amber-400/70 uppercase tracking-[3px]" style={CINZEL}>
                Probabilistic Model
              </h3>
            </div>
            <div className="px-5 py-3 border-b border-amber-500/10 bg-black/30">
              <h3 className="text-[10px] font-bold text-amber-300 uppercase tracking-[3px]" style={CINZEL}>
                Structured Model
              </h3>
            </div>
          </div>
          {PROBABILISTIC.map((item, i) => (
            <div key={i} className={`grid grid-cols-2 ${i < PROBABILISTIC.length - 1 ? 'border-b border-amber-500/8' : ''}`}>
              <div className="px-5 py-3 border-r border-amber-500/8">
                <p className="text-[13px] text-slate-500 leading-relaxed" style={GEORGIA}>{item}</p>
              </div>
              <div className="px-5 py-3">
                <p className="text-[13px] text-slate-300 leading-relaxed" style={GEORGIA}>{STRUCTURED[i]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}