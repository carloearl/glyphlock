import React from "react";

const PHASES = [
  { num: "01", title: "Authority and Scope Confirmation", desc: "Establish engagement boundaries, define documentation requirements, and confirm organizational authority." },
  { num: "02", title: "System Architecture Review", desc: "Structured evaluation of infrastructure design, data flows, and operational controls against defined governance standards." },
  { num: "03", title: "Threat Surface and Exposure Analysis", desc: "Documented assessment of attack vectors, vulnerability posture, and exposure points aligned with post-quantum readiness criteria." },
  { num: "04", title: "Governance Alignment Assessment", desc: "Review of policy documentation, SOC 2 aligned controls, AI governance framework adherence, and NIST post-quantum standards positioning." },
  { num: "05", title: "Determination and Roadmap Delivery", desc: "Formal qualification tier assignment, credential eligibility statement, and structured remediation roadmap." }
];

export default function VerificationFramework() {
  return (
    <section className="max-w-3xl mx-auto mb-20 md:mb-28 px-4">
      <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-4 font-medium text-center">Section III</p>
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4 tracking-tight">
        Structured 90-Minute Verification Framework
      </h2>
      <p className="text-sm text-slate-400 text-center mb-12 max-w-xl mx-auto">
        Moderated · Structured · Time-controlled · Documentation-based
      </p>

      <div className="space-y-0">
        {PHASES.map((phase, i) => (
          <div key={i} className={`flex gap-6 p-6 ${i < PHASES.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-slate-600">{phase.num}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-2">{phase.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{phase.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}