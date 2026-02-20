import React from "react";
import { NEU_DIVIDER, NEU_CELL, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";

const PROTOCOLS = [
  { title: "Transaction Documentation Protocol", definition: "Defined logging and retention framework." },
  { title: "Contract Verification Protocol", definition: "Timestamp-anchored agreement preservation." },
  { title: "Payout Governance Protocol", definition: "Documented payout distribution and reporting logic." },
  { title: "Prepaid Instrument Reporting Protocol", definition: "Serialized issuance and redemption documentation." },
  { title: "Submission Dossier Protocol", definition: "Compiled underwriting documentation package." }
];

export default function DeterministicRiskProfile() {
  return (
    <FinancialSectionShell orbSeed={2}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section II</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Deterministic Risk Profile
          </h2>
        </div>

        <p className="text-[14px] text-slate-300 leading-[1.8] max-w-3xl mx-auto text-center mb-8" style={GEORGIA}>
          A documentation control model that converts venue operations into structured, review-ready underwriting format.
        </p>

        <div className="grid md:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {PROTOCOLS.map((p, i) => (
            <div key={i} className={`${NEU_CELL} p-5`}>
              <h3 className="text-xs font-bold text-amber-400/90 mb-1.5 tracking-wide" style={CINZEL}>
                {p.title}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed" style={GEORGIA}>
                {p.definition}
              </p>
            </div>
          ))}
          {PROTOCOLS.length % 2 !== 0 && <div />}
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}