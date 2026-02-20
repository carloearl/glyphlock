import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const NEU_DIVIDER = "w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent";
const NEU_BTN_PRIMARY = "inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-wider uppercase text-white bg-[#0c2216] border border-emerald-600/40 rounded-lg shadow-[4px_4px_12px_rgba(0,0,0,0.6),_-3px_-3px_10px_rgba(16,185,129,0.08)] hover:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),_inset_-2px_-2px_6px_rgba(16,185,129,0.06)] hover:bg-[#0e2a1a] transition-all duration-200 cursor-pointer";
const NEU_BTN_OUTLINE = "inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-wider uppercase text-yellow-500 bg-[#0a1a0f] border border-yellow-600/30 rounded-lg shadow-[4px_4px_12px_rgba(0,0,0,0.6),_-3px_-3px_10px_rgba(16,185,129,0.06)] hover:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),_inset_-2px_-2px_6px_rgba(234,179,8,0.04)] hover:bg-[#0e1e12] transition-all duration-200 cursor-pointer";
const GRID_BG = {
  backgroundImage: `linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)`,
  backgroundSize: '48px 48px'
};

export default function SubmissionPreparedness() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section VII</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Formal Submission Preparedness
          </h2>
        </div>

        <div className="bg-[#0a1a0f] border border-emerald-900/30 rounded-lg p-8 md:p-10 shadow-[6px_6px_16px_rgba(0,0,0,0.7),_-4px_-4px_12px_rgba(16,185,129,0.06)] max-w-3xl mx-auto mb-14">
          <p className="text-[15px] text-slate-300 leading-[1.85] text-center" style={{ fontFamily: "'Georgia', serif" }}>
            Venues operating under the Verified Operations Standard submit structured documentation aligned to formal underwriting review environments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Consultation")} className={NEU_BTN_PRIMARY} style={{ fontFamily: "'Cinzel', serif" }}>
            Initiate Qualification
          </Link>
          <Link to={createPageUrl("Consultation")} className={NEU_BTN_OUTLINE} style={{ fontFamily: "'Cinzel', serif" }}>
            Schedule Formal Review
          </Link>
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}