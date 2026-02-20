import React from "react";

const TIERS = [
  { tier: "Tier I", name: "Structured", desc: "Documented and governance-aligned operational posture." },
  { tier: "Tier II", name: "Partial Alignment", desc: "Defined controls present but remediation required." },
  { tier: "Tier III", name: "Structural Gaps Identified", desc: "Material governance deficiencies limit eligibility." }
];

export default function AlignmentTiers() {
  return (
    <section className="max-w-3xl mx-auto mb-20 md:mb-28 px-4">
      <p className="text-[10px] uppercase tracking-[5px] text-amber-500/70 mb-4 font-medium text-center">Section V</p>
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10 tracking-tight">
        Alignment Tiers
      </h2>

      <div className="space-y-0 border border-slate-700/50">
        {TIERS.map((t, i) => (
          <div key={i} className={`p-6 md:p-8 ${i < TIERS.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{t.tier}</span>
              <span className="text-sm text-slate-500">—</span>
              <span className="text-base font-bold text-white">{t.name}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pl-0 md:pl-[calc(3.5rem)]">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}