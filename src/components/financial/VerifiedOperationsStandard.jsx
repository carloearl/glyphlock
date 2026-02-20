import React from "react";

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
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section III</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Verified Operations Standard
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Georgia', serif" }}>
          The Verified Operations Standard designates qualification status upon verified alignment with Deterministic Risk Profile documentation criteria.
        </p>

        {/* Comparison Table */}
        <div className="border border-yellow-600/25 overflow-hidden max-w-3xl mx-auto">
          {/* Header */}
          <div className="grid grid-cols-2 gap-px bg-yellow-600/20">
            <div className="bg-yellow-600/10 px-6 py-4">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[3px]" style={{ fontFamily: "'Cinzel', serif" }}>
                Probabilistic Review Model
              </h3>
            </div>
            <div className="bg-emerald-600/10 px-6 py-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[3px]" style={{ fontFamily: "'Cinzel', serif" }}>
                Structured Review Model
              </h3>
            </div>
          </div>

          {/* Rows */}
          {PROBABILISTIC.map((item, i) => (
            <div key={i} className="grid grid-cols-2 gap-px bg-yellow-600/10">
              <div className="bg-black/80 px-6 py-4 border-t border-yellow-600/10">
                <p className="text-[13px] text-slate-500 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>{item}</p>
              </div>
              <div className="bg-black/80 px-6 py-4 border-t border-yellow-600/10">
                <p className="text-[13px] text-slate-300 leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>{STRUCTURED[i]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}