import React from "react";
import { GRID_BG, NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialCTA from "./FinancialCTA";

export default function SubmissionPreparedness() {
  return (
    <section className="py-20 md:py-28 relative" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none" style={GRID_BG} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={NEU_DIVIDER + " mb-16"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-emerald-500/60 mb-6 font-medium">Section VII</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Formal Submission Preparedness
          </h2>
        </div>

        <div className={`${NEU_CARD} p-8 md:p-10 max-w-3xl mx-auto mb-14`}>
          <p className="text-[15px] text-slate-300 leading-[1.85] text-center" style={GEORGIA}>
            Venues operating under the Verified Operations Standard submit structured documentation aligned to formal underwriting review environments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <FinancialCTA to="Consultation" variant="primary">
            Initiate Qualification
          </FinancialCTA>
          <FinancialCTA to="Consultation" variant="outline">
            Schedule Formal Review
          </FinancialCTA>
        </div>

        <div className={NEU_DIVIDER + " mt-16"} />
      </div>
    </section>
  );
}