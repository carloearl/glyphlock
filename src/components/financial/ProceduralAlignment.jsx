import React from "react";
import { NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

const STEPS = [
  "Operational Documentation Review",
  "Structural Alignment Implementation",
  "Documentation Validation",
  "Profile Activation",
  "Dossier Compilation"
];

export default function ProceduralAlignment() {
  return (
    <FinancialSectionShell orbSeed={6}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section VI</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Qualification Procedure
          </h2>
        </div>

        <div className={`${NEU_CARD} overflow-hidden max-w-2xl mx-auto`}>
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-baseline gap-5 px-6 py-3.5 ${i < STEPS.length - 1 ? 'border-b border-amber-500/8' : ''}`}>
              <span className="text-sm font-bold text-amber-500/30 tabular-nums" style={{ ...CINZEL, minWidth: '24px' }}>
                {i + 1}.
              </span>
              <span className="text-[14px] text-slate-300" style={GEORGIA}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}