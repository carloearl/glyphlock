import React from "react";

const STEPS = [
  "Operational Documentation Review",
  "Structural Alignment Implementation",
  "Documentation Validation",
  "Profile Activation",
  "Dossier Compilation"
];

export default function ProceduralAlignment() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section VI</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Qualification Procedure
          </h2>
        </div>

        {/* Steps */}
        <div className="max-w-2xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-baseline gap-6 py-5 ${i < STEPS.length - 1 ? 'border-b border-yellow-600/10' : ''}`}>
              <span className="text-lg font-bold text-yellow-600/50 tabular-nums" style={{ fontFamily: "'Cinzel', serif", minWidth: '28px' }}>
                {i + 1}.
              </span>
              <span className="text-[15px] text-slate-300" style={{ fontFamily: "'Georgia', serif" }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}