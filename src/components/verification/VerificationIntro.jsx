import React from "react";

export default function VerificationIntro() {
  return (
    <section className="max-w-3xl mx-auto mb-20 md:mb-28 px-4">
      <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-4 font-medium text-center">Section I</p>
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 tracking-tight">
        Independent Protocol Verification
      </h2>
      <div className="border border-slate-700/50 rounded-lg p-6 md:p-10 bg-slate-900/40">
        <p className="text-sm md:text-base text-slate-300 leading-[1.9]">
          A structured governance and security alignment review conducted under the Deterministic Risk Profile 
          and Master Covenant framework. This engagement evaluates system architecture, documentation discipline, 
          threat exposure posture, and enforceability positioning — aligned with enterprise security platform 
          standards and zero-trust architecture principles.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
        <a href="#intake-form" className="inline-block text-center px-8 py-4 bg-white text-black font-bold text-sm uppercase tracking-wider rounded-none hover:bg-slate-200 transition-colors">
          Request Verification Review
        </a>
        <a href="#deliverables" className="inline-block text-center px-8 py-4 border border-slate-500 text-slate-300 font-bold text-sm uppercase tracking-wider rounded-none hover:border-white hover:text-white transition-colors">
          Download Verification Overview
        </a>
      </div>
    </section>
  );
}