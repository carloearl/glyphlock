import React from "react";

const NEU_CELL = "bg-[#0a1a0f] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),_inset_-2px_-2px_6px_rgba(16,185,129,0.04)]";
const NEU_DIVIDER = "w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent";
const GRID_BG = {
  backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`,
  backgroundSize: '48px 48px'
};

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
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Deterministic Risk Profile
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Georgia', serif" }}>
          The Deterministic Risk Profile is a documentation control model that converts venue operations into structured, review-ready underwriting format.
        </p>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {PROTOCOLS.map((p, i) => (
            <div key={i} className={`${NEU_CELL} rounded-lg p-6 border border-emerald-900/30`}>
              <h3 className="text-sm font-bold text-emerald-300 mb-2 tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                {p.title}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
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