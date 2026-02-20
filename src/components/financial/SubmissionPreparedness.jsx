import React from "react";
import { FIN_DIVIDER, FIN_CARD, CINZEL, GEORGIA } from "./FinancialDesignTokens";
import FinancialSectionShell from "./FinancialSectionShell";
import FinancialCTA from "./FinancialCTA";

export default function SubmissionPreparedness() {
  return (
    <FinancialSectionShell>
      <div className="max-w-4xl mx-auto px-6">
        <div className={FIN_DIVIDER + " mb-14"} />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[5px] text-indigo-400/60 mb-5 font-medium">Section VII</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ ...CINZEL, letterSpacing: '0.5px' }}>
            Formal Submission Preparedness
          </h2>
        </div>

        <div className={`${FIN_CARD} p-8 md:p-10 max-w-3xl mx-auto mb-12`}>
          <p className="text-[15px] text-slate-300 leading-[1.85] text-center" style={GEORGIA}>
            Venues operating under the Verified Operations Standard submit structured documentation aligned to formal underwriting review environments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <FinancialCTA to="Consultation" variant="primary">
            Initiate Qualification
          </FinancialCTA>
          <FinancialCTA to="Consultation" variant="outline">
            Schedule Formal Review
          </FinancialCTA>
        </div>

        <div className={FIN_DIVIDER + " mt-14"} />
      </div>
    </FinancialSectionShell>
  );
}