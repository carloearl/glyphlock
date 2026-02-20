import React from "react";

const NEU_DIVIDER = "w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent";
const GRID_BG = {
  backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`,
  backgroundSize: '48px 48px'
};

const PROBABILISTIC = [
  "Category classification reliance",
  "Narrative explanations",
  "Incomplete control visibility",
  "Reactive dispute posture"
];

const STRUCTURED = [
  "Defined documentation protocols",
  "Transparent payout governance",
  "Prepaid instrument traceability",
  "Prepared submission dossier"
];

export default function VerifiedOperationsStandard() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section III</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Verified Operations Standard
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Georgia', serif" }}>
          The Verified Operations Standard designates qualification status upon verified alignment with Deterministic Risk Profile documentation criteria.
        </p>

        {/* Neumorphic Comparison Table */}
        <div className="bg-[#0a1a0f] border border-emerald-900/30 rounded-lg overflow-hidden shadow-[6px_6px_16px_rgba(0,0,0,0.7),_-4px_-4px_12px_rgba(16,185,129,0.06)] max-w-3xl mx-auto">
          {/* Header */}
          <div className="grid grid-cols-2">
            <div className="px-6 py-4 border-b border-emerald-900/30 border-r border-r-emerald-900/20 bg-[#0c1e12]">
              <h3 className="text-xs font-bold text-yellow-500/80 uppercase tracking-[3px]" style={{ fontFamily: "'Cinzel', serif" }}>
                Probabilistic Model
              </h3>
            </div>
            <div className="px-6 py-4 border-b border-emerald-900/30 bg-[#0c1e12]">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[3px]" style={{ fontFamily: "'Cinzel', serif" }}>
                Structured Model
              </h3>
            </div>
          </div>
          {PROBABILISTIC.map((item, i) => (
            <div key={i} className={`grid grid-cols-2 ${i < PROBABILISTIC.length - 1 ? 'border-b border-emerald-900/15' : ''}`}>
              <div className="px-6 py-4 border-r border-emerald-900/15">
                <p className="text-[13px] text-slate-500 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>{item}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-[13px] text-slate-300 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>{STRUCTURED[i]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}