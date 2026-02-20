import React from "react";
import { GRID_BG, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";

export default function InstitutionalFooter() {
  return (
    <section className="py-16 md:py-20 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent mb-12" />

        <div className={`${NEU_CARD} p-8 md:p-10 text-center space-y-4`}>
          <p className="text-sm font-bold text-white tracking-[4px] uppercase" style={CINZEL}>
            GlyphLock Financial LLC
          </p>
          <div className="space-y-1">
            <p className="text-[11px] text-emerald-500/50 tracking-[3px] uppercase" style={GEORGIA}>
              Operational Qualification Architecture
            </p>
            <p className="text-[11px] text-emerald-500/50 tracking-[3px] uppercase" style={GEORGIA}>
              Deterministic Risk Profile
            </p>
            <p className="text-[11px] text-emerald-500/50 tracking-[3px] uppercase" style={GEORGIA}>
              Verified Operations Standard
            </p>
          </div>

          <div className="w-16 h-px bg-yellow-600/30 mx-auto my-6" />

          <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl mx-auto" style={GEORGIA}>
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