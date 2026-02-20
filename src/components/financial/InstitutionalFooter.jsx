import React from "react";

const GRID_BG = {
  backgroundImage: `linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)`,
  backgroundSize: '48px 48px'
};

export default function InstitutionalFooter() {
  return (
    <section className="py-16 md:py-20 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent mb-12" />

        <div className="bg-[#0a1a0f] border border-emerald-900/25 rounded-lg p-8 md:p-10 shadow-[6px_6px_16px_rgba(0,0,0,0.7),_-4px_-4px_12px_rgba(16,185,129,0.05)] text-center space-y-4">
          <p className="text-sm font-bold text-white tracking-[4px] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
            GlyphLock Financial LLC
          </p>
          <div className="space-y-1">
            <p className="text-[11px] text-emerald-500/50 tracking-[3px] uppercase" style={{ fontFamily: "'Georgia', serif" }}>
              Operational Qualification Architecture
            </p>
            <p className="text-[11px] text-emerald-500/50 tracking-[3px] uppercase" style={{ fontFamily: "'Georgia', serif" }}>
              Deterministic Risk Profile
            </p>
            <p className="text-[11px] text-emerald-500/50 tracking-[3px] uppercase" style={{ fontFamily: "'Georgia', serif" }}>
              Verified Operations Standard
            </p>
          </div>

          <div className="w-16 h-px bg-yellow-600/30 mx-auto my-6" />

          <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: "'Georgia', serif" }}>
            Framework designed for structured underwriting review and machine-readable compliance reporting environments.
          </p>

          <p className="text-[10px] text-slate-700 pt-2">
            © {new Date().getFullYear()} GlyphLock Financial, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}