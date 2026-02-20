import React from "react";
import { FIN_DIVIDER, FIN_CELL, CINZEL, GEORGIA } from "./FinancialDesignTokens";
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
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section II</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Deterministic Risk Profile
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-12" style={GEORGIA}>
          The Deterministic Risk Profile is a documentation control model that converts venue operations into structured, review-ready underwriting format.
        </p>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {PROTOCOLS.map((p, i) => (
            <div key={i} className={`${FIN_CELL} p-5`}>
              <h3 className="text-sm font-bold text-indigo-300 mb-2 tracking-wide" style={CINZEL}>
                {p.title}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed" style={GEORGIA}>
                {p.definition}
              </p>
            </div>
          ))}
          {PROTOCOLS.length % 2 !== 0 && <div />}
        </div>

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}