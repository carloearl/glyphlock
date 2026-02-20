import React from "react";
import { GRID_BG, NEU_DIVIDER, NEU_CELL, CINZEL, GEORGIA } from "./FinancialDesignTokens";

const PROTOCOLS = [
  { title: "Transaction Documentation Protocol", definition: "Defined logging and retention framework." },
  { title: "Contract Verification Protocol", definition: "Timestamp-anchored agreement preservation." },
  { title: "Payout Governance Protocol", definition: "Documented payout distribution and reporting logic." },
  { title: "Prepaid Instrument Reporting Protocol", definition: "Serialized issuance and redemption documentation." },
  { title: "Submission Dossier Protocol", definition: "Compiled underwriting documentation package." }
];

export default function DeterministicRiskProfile() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section II</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Deterministic Risk Profile
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={GEORGIA}>
          The Deterministic Risk Profile is a documentation control model that converts venue operations into structured, review-ready underwriting format.
        </p>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {PROTOCOLS.map((p, i) => (
            <div key={i} className={`${NEU_CELL} p-6`}>
              <h3 className="text-sm font-bold text-emerald-300 mb-2 tracking-wide" style={CINZEL}>
                {p.title}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed" style={GEORGIA}>
                {p.definition}
              </p>
            </div>
          ))}
          {PROTOCOLS.length % 2 !== 0 && <div />}
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}