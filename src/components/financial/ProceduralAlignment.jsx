import React from "react";
import { FIN_DIVIDER, FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
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
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section VI</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Qualification Procedure
          </h2>
        </div>

        <div className={`${FIN_CARD} overflow-hidden max-w-2xl mx-auto`}>
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-baseline gap-6 px-8 py-5 ${i < STEPS.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <span className="text-lg font-bold text-indigo-500/40 tabular-nums" style={{ ...CINZEL, minWidth: '28px' }}>
                {i + 1}.
              </span>
              <span className="text-[15px] text-slate-300" style={GEORGIA}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}