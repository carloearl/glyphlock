import React from "react";

const FOUNDING_INCLUDES = [
  "Pre-session documentation intake review",
  "Structured 90-minute moderated verification session",
  "Comprehensive Verification Report",
  "Executive Brief for leadership",
  "Qualification Tier Determination",
  "Remediation Roadmap"
];

const STANDARD_INCLUDES = [
  "Pre-session structured documentation review",
  "Formal 90-minute verification engagement",
  "Comprehensive written determination report",
  "Executive Brief",
  "Credential eligibility statement",
  "Structured enforcement roadmap"
];

export default function EngagementOptions() {
  return (
    <section className="max-w-4xl mx-auto mb-20 md:mb-28 px-4">
      <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-4 font-medium text-center">Section II</p>
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12 tracking-tight">
        Engagement Options
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Founding Cohort */}
        <div className="border border-slate-600 p-6 md:p-8 bg-slate-900/40">
          <p className="text-[10px] uppercase tracking-[4px] text-amber-400/80 mb-2 font-semibold">Subsection A</p>
          <h3 className="text-lg font-bold text-white mb-1">Founding Cohort Verification</h3>
          <p className="text-xs text-slate-400 mb-6">Limited Enrollment Program</p>

          <div className="mb-6">
            <span className="text-3xl font-bold text-white">$6,500</span>
            <p className="text-xs text-slate-400 mt-1">Limited to five organizations</p>
          </div>

          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">Includes:</p>
          <ul className="space-y-2.5 mb-8">
            {FOUNDING_INCLUDES.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-slate-500 mt-0.5 text-xs">—</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-700/50 pt-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon completion of Founding Cohort enrollment, standard engagement pricing applies.
            </p>
          </div>
        </div>

        {/* Standard */}
        <div className="border border-slate-700/50 p-6 md:p-8 bg-slate-900/30">
          <p className="text-[10px] uppercase tracking-[4px] text-slate-500 mb-2 font-semibold">Subsection B</p>
          <h3 className="text-lg font-bold text-white mb-1">Standard Verification Engagement</h3>
          <p className="text-xs text-slate-400 mb-6">For qualified organizations</p>

          <div className="mb-6">
            <span className="text-lg font-semibold text-slate-300">Engagement Fee Provided Upon Qualification</span>
          </div>

          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">Includes:</p>
          <ul className="space-y-2.5">
            {STANDARD_INCLUDES.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-slate-500 mt-0.5 text-xs">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}