import React from "react";

export default function FrameworkAuthority() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Gold divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section I</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Operational Qualification Architecture
          </h2>
        </div>

        <div className="space-y-6 max-w-3xl mx-auto">
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={{ fontFamily: "'Georgia', serif" }}>
            GlyphLock Financial establishes a structured operational qualification architecture for nightlife and entertainment venues operating within high-scrutiny underwriting environments.
          </p>
          <p className="text-[15px] text-slate-300 leading-[1.85]" style={{ fontFamily: "'Georgia', serif" }}>
            This architecture standardizes documentation, governance reporting, and submission preparation aligned to formal review protocols.
          </p>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}