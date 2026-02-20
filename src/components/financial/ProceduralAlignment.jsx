import React from "react";

const NEU_DIVIDER = "w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent";
const GRID_BG = {
  backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`,
  backgroundSize: '48px 48px'
};

const STEPS = [
  "Operational Documentation Review",
  "Structural Alignment Implementation",
  "Documentation Validation",
  "Profile Activation",
  "Dossier Compilation"
];

export default function ProceduralAlignment() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section VI</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Qualification Procedure
          </h2>
        </div>

        <div className="bg-[#0a1a0f] border border-emerald-900/30 rounded-lg overflow-hidden shadow-[6px_6px_16px_rgba(0,0,0,0.7),_-4px_-4px_12px_rgba(16,185,129,0.06)] max-w-2xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-baseline gap-6 px-8 py-5 ${i < STEPS.length - 1 ? 'border-b border-emerald-900/15' : ''}`}>
              <span className="text-lg font-bold text-emerald-600/40 tabular-nums" style={{ fontFamily: "'Cinzel', serif", minWidth: '28px' }}>
                {i + 1}.
              </span>
              <span className="text-[15px] text-slate-300" style={{ fontFamily: "'Georgia', serif" }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}