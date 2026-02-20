import React from "react";

const NEU_CARD = "bg-[#0a1a0f] border border-emerald-800/30 shadow-[6px_6px_16px_rgba(0,0,0,0.7),_-4px_-4px_12px_rgba(16,185,129,0.06)]";
const NEU_DIVIDER = "w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent";
const GRID_BG = {
  backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`,
  backgroundSize: '48px 48px'
};

export default function FrameworkAuthority() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section I</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Operational Qualification Architecture
          </h2>
        </div>

        <div className={`${NEU_CARD} rounded-lg p-8 md:p-10 max-w-3xl mx-auto space-y-6`}>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={{ fontFamily: "'Georgia', serif" }}>
            GlyphLock Financial establishes a structured operational qualification architecture for nightlife and entertainment venues operating within high-scrutiny underwriting environments.
          </p>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={{ fontFamily: "'Georgia', serif" }}>
            This architecture standardizes documentation, governance reporting, and submission preparation aligned to formal review protocols.
          </p>
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}