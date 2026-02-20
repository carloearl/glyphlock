import React from "react";
import { FIN_DIVIDER, FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
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
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section V</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Underwriting Documentation Package
          </h2>
        </div>

        <div className={`${FIN_CARD} overflow-hidden max-w-2xl mx-auto mb-12`}>
          <div className="bg-white/[0.02] px-6 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-[4px] text-indigo-300 font-bold" style={CINZEL}>
              Package Contents
            </p>
          </div>
          {DOSSIER_ITEMS.map((item, i) => (
            <div key={i} className={`px-6 py-4 flex items-center gap-4 ${i < DOSSIER_ITEMS.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <span className="text-[11px] text-indigo-500/40 font-bold tabular-nums" style={CINZEL}>
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

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}