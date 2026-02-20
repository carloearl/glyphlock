import React from "react";

const PROTOCOLS = [
  {
    title: "Transaction Documentation Protocol",
    definition: "Defined logging and retention framework."
  },
  {
    title: "Contract Verification Protocol",
    definition: "Timestamp-anchored agreement preservation."
  },
  {
    title: "Payout Governance Protocol",
    definition: "Documented payout distribution and reporting logic."
  },
  {
    title: "Prepaid Instrument Reporting Protocol",
    definition: "Serialized issuance and redemption documentation."
  },
  {
    title: "Submission Dossier Protocol",
    definition: "Compiled underwriting documentation package."
  }
];

export default function DeterministicRiskProfile() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section II</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Deterministic Risk Profile
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Georgia', serif" }}>
          The Deterministic Risk Profile is a documentation control model that converts venue operations into structured, review-ready underwriting format.
        </p>

        {/* Protocol Grid */}
        <div className="grid md:grid-cols-2 gap-px bg-yellow-600/20 border border-yellow-600/20 rounded-none overflow-hidden max-w-3xl mx-auto">
          {PROTOCOLS.map((p, i) => (
            <div key={i} className="bg-black/80 p-6 md:p-8">
              <h3 className="text-sm font-bold text-white mb-2 tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                {p.title}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
                {p.definition}
              </p>
            </div>
          ))}
          {/* Fill empty cell for odd count */}
          {PROTOCOLS.length % 2 !== 0 && <div className="bg-black/80" />}
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}