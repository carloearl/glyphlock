import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function SubmissionPreparedness() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section VII</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Formal Submission Preparedness
          </h2>
        </div>

        <p className="text-[15px] text-slate-300 leading-[1.85] max-w-3xl mx-auto text-center mb-14" style={{ fontFamily: "'Georgia', serif" }}>
          Venues operating under the Verified Operations Standard submit structured documentation aligned to formal underwriting review environments.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("Consultation")}>
            <Button className="bg-emerald-700 hover:bg-emerald-600 text-white px-10 py-5 text-sm font-bold tracking-wider uppercase rounded-none border border-emerald-500/30" style={{ fontFamily: "'Cinzel', serif" }}>
              Initiate Qualification
            </Button>
          </Link>
          <Link to={createPageUrl("Consultation")}>
            <Button variant="outline" className="border-yellow-600/40 text-yellow-500 hover:bg-yellow-600/10 px-10 py-5 text-sm font-bold tracking-wider uppercase rounded-none" style={{ fontFamily: "'Cinzel', serif" }}>
              Schedule Formal Review
            </Button>
          </Link>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}