import React from "react";
import { FIN_DIVIDER, FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
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
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section III</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Verified Operations Standard
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-12" style={GEORGIA}>
          The Verified Operations Standard designates qualification status upon verified alignment with Deterministic Risk Profile documentation criteria.
        </p>

        <div className={`${FIN_CARD} overflow-hidden max-w-3xl mx-auto`}>
          <div className="grid grid-cols-2">
            <div className="px-6 py-4 border-b border-white/[0.06] border-r border-r-white/[0.06] bg-white/[0.02]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[3px]" style={CINZEL}>
                Probabilistic Model
              </h3>
            </div>
            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[3px]" style={CINZEL}>
                Structured Model
              </h3>
            </div>
          </div>
          {PROBABILISTIC.map((item, i) => (
            <div key={i} className={`grid grid-cols-2 ${i < PROBABILISTIC.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <div className="px-6 py-4 border-r border-white/[0.04]">
                <p className="text-[13px] text-slate-500 leading-relaxed" style={GEORGIA}>{item}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-[13px] text-slate-300 leading-relaxed" style={GEORGIA}>{STRUCTURED[i]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}