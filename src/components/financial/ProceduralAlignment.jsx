import React from "react";
import { GRID_BG, NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";

const STEPS = [
  "Operational Documentation Review",
  "Structural Alignment Implementation",
  "Documentation Validation",
  "Profile Activation",
  "Dossier Compilation"
];

export default function ProceduralAlignment() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section VI</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Qualification Procedure
          </h2>
        </div>

        <div className={`${NEU_CARD} overflow-hidden max-w-2xl mx-auto`}>
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-baseline gap-6 px-8 py-5 ${i < STEPS.length - 1 ? 'border-b border-emerald-900/15' : ''}`}>
              <span className="text-lg font-bold text-emerald-600/40 tabular-nums" style={{ ...CINZEL, minWidth: '28px' }}>
                {i + 1}.
              </span>
              <span className="text-[15px] text-slate-300" style={GEORGIA}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}