import React from "react";

export default function InstitutionalFooter() {
  return (
    <section className="py-16 md:py-20" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent mb-12" />

        <div className="text-center space-y-3">
          <p className="text-sm font-bold text-white tracking-[4px] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
            GlyphLock Financial LLC
          </p>
          <div className="space-y-1">
            <p className="text-[11px] text-slate-500 tracking-[3px] uppercase" style={{ fontFamily: "'Georgia', serif" }}>
              Operational Qualification Architecture
            </p>
            <p className="text-[11px] text-slate-500 tracking-[3px] uppercase" style={{ fontFamily: "'Georgia', serif" }}>
              Deterministic Risk Profile
            </p>
            <p className="text-[11px] text-slate-500 tracking-[3px] uppercase" style={{ fontFamily: "'Georgia', serif" }}>
              Verified Operations Standard
            </p>
          </div>
        </div>

        <div className="w-16 h-px bg-yellow-600/40 mx-auto my-8" />

        <p className="text-center text-[11px] text-slate-600 leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: "'Georgia', serif" }}>
          Framework designed for structured underwriting review and machine-readable compliance reporting environments.
        </p>

        <p className="text-center text-[10px] text-slate-700 mt-6">
          © {new Date().getFullYear()} GlyphLock Financial, LLC. All rights reserved.
        </p>
      </div>
    </section>
  );
}