import React from "react";
import { NEU_DIVIDER, NEU_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";
import FinancialCTA from "./FinancialCTA";

export default function SubmissionPreparedness() {
  return (
    <FinancialSectionShell orbSeed={7}>
      <div className="max-w-4xl mx-auto px-6">
        <div className={NEU_DIVIDER + " mb-8"} />

        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[5px] text-amber-500/50 mb-3 font-medium">Section VII</p>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '1px' }}>
            Formal Submission Preparedness
          </h2>
        </div>

        <div className={`${NEU_CARD} p-6 md:p-8 max-w-3xl mx-auto mb-8`}>
          <p className="text-[14px] text-slate-300 leading-[1.8] text-center" style={GEORGIA}>
            Venues operating under the Verified Operations Standard submit structured documentation aligned to formal underwriting review environments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <FinancialCTA to="Consultation" variant="primary">
            Initiate Qualification
          </FinancialCTA>
          <FinancialCTA to="Consultation" variant="outline">
            Schedule Review
          </FinancialCTA>
        </div>

        <div className={NEU_DIVIDER + " mt-8"} />
      </div>
    </FinancialSectionShell>
  );
}