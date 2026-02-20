import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const TIERS = [
  { tier: "Tier I", label: "Documentation Structured" },
  { tier: "Tier II", label: "Partial Alignment" },
  { tier: "Tier III", label: "Documentation Gaps Identified" }
];

export default function QualificationAssessment() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section IV</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Structured Qualification Assessment
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Georgia', serif" }}>
          Venues may initiate formal review through a standardized operational questionnaire aligned to Deterministic Risk Profile criteria.
        </p>

        {/* Tier Output */}
        <div className="border border-yellow-600/25 max-w-2xl mx-auto mb-14">
          <div className="bg-yellow-600/10 px-6 py-3 border-b border-yellow-600/15">
            <p className="text-[10px] uppercase tracking-[4px] text-yellow-500 font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
              Assessment Output
            </p>
          </div>
          {TIERS.map((t, i) => (
            <div key={i} className={`px-6 py-4 flex items-baseline gap-4 ${i < TIERS.length - 1 ? 'border-b border-yellow-600/10' : ''}`} style={{ background: 'rgba(0,0,0,0.7)' }}>
              <span className="text-xs font-bold text-emerald-400 tracking-wider whitespace-nowrap" style={{ fontFamily: "'Cinzel', serif" }}>
                {t.tier}
              </span>
              <span className="text-[13px] text-slate-400" style={{ fontFamily: "'Georgia', serif" }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Consultation")}>
            <Button className="bg-emerald-700 hover:bg-emerald-600 text-white px-10 py-5 text-sm font-bold tracking-wider uppercase rounded-none border border-emerald-500/30" style={{ fontFamily: "'Cinzel', serif" }}>
              Initiate Qualification Review
            </Button>
          </Link>
          <Link to={createPageUrl("SecurityDocs")}>
            <Button variant="outline" className="border-yellow-600/40 text-yellow-500 hover:bg-yellow-600/10 px-10 py-5 text-sm font-bold tracking-wider uppercase rounded-none" style={{ fontFamily: "'Cinzel', serif" }}>
              Download Framework Documentation
            </Button>
          </Link>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}