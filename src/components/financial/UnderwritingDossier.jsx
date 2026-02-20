import React from "react";
import { GRID_BG, NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialCTA from "./FinancialCTA";

const DOSSIER_ITEMS = [
  "Operational Summary Report",
  "Payout Governance Outline",
  "Prepaid Instrument Reporting Records",
  "Contract Documentation Samples",
  "Verification Records"
];

export default function UnderwritingDossier() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section V</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Underwriting Documentation Package
          </h2>
        </div>

        <div className={`${NEU_CARD} overflow-hidden max-w-2xl mx-auto mb-14`}>
          <div className="bg-[#0c1e12] px-6 py-3 border-b border-emerald-900/25">
            <p className="text-[10px] uppercase tracking-[4px] text-emerald-400 font-bold" style={CINZEL}>
              Package Contents
            </p>
          </div>
          {DOSSIER_ITEMS.map((item, i) => (
            <div key={i} className={`px-6 py-4 flex items-center gap-4 ${i < DOSSIER_ITEMS.length - 1 ? 'border-b border-emerald-900/15' : ''}`}>
              <span className="text-[11px] text-emerald-600/50 font-bold tabular-nums" style={CINZEL}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[14px] text-slate-300" style={GEORGIA}>
                {item}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <FinancialCTA to="Consultation" variant="outline">
            Request Documentation Sample
          </FinancialCTA>
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}