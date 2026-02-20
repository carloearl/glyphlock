import React from "react";
import { NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";
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
    <FinancialSectionShell orbSeed={5}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section V</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Underwriting Documentation Package
          </h2>
        </div>

        <div className={`${NEU_CARD} overflow-hidden max-w-2xl mx-auto mb-8`}>
          <div className="bg-black/40 px-5 py-2.5 border-b border-amber-500/15">
            <p className="text-[10px] uppercase tracking-[4px] text-amber-400 font-bold" style={CINZEL}>
              Package Contents
            </p>
          </div>
          {DOSSIER_ITEMS.map((item, i) => (
            <div key={i} className={`px-5 py-3 flex items-center gap-4 ${i < DOSSIER_ITEMS.length - 1 ? 'border-b border-amber-500/8' : ''}`}>
              <span className="text-[10px] text-amber-500/40 font-bold tabular-nums" style={CINZEL}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[13px] text-slate-300" style={GEORGIA}>
                {item}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <FinancialCTA to="Consultation" variant="outline">
            Request Sample
          </FinancialCTA>
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}