import React from "react";

const DELIVERABLES = [
  "Formal Verification Report",
  "Executive Brief",
  "Alignment Tier Classification",
  "Credential Eligibility Statement",
  "Remediation Roadmap"
];

export default function VerificationDeliverables() {
  return (
    <section id="deliverables" className="max-w-3xl mx-auto mb-20 md:mb-28 px-4">
      <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-4 font-medium text-center">Section IV</p>
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10 tracking-tight">
        Verification Deliverables
      </h2>

      <div className="border border-slate-700/50 p-6 md:p-10 bg-slate-900/40">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-5 font-semibold">Client receives:</p>
        <ul className="space-y-4">
          {DELIVERABLES.map((item, i) => (
            <li key={i} className="flex items-center gap-4 text-base text-white font-medium">
              <span className="w-6 text-right text-sm text-slate-500">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}