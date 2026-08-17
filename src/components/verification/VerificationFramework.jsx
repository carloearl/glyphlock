import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function VerificationFramework() {
  const phases = [
    ['01','Scope + Evidence Intake','Define the system boundary, review objectives, evidence sources, exclusions and responsible contacts.'],
    ['02','Architecture + Data Flow','Review documented components, integrations, trust boundaries, data movement and operational dependencies.'],
    ['03','Controls + Exposure','Map relevant access, logging, recovery, security and operational controls to the evidence supplied for the engagement.'],
    ['04','Governance Alignment','Compare documented practices with the selected GlyphLock governance criteria. External standards may be referenced as benchmarks only where the mapping is explicit.'],
    ['05','Findings + Remediation','Classify observations by evidence strength and priority, then deliver a remediation roadmap with requested proof for unresolved items.'],
  ];
  return <div className="space-y-6"><div className="text-center space-y-2"><h2 className="text-2xl font-bold text-white">Section III — Review Workflow</h2><p className="text-sm text-slate-400">Scoped · Evidence-led · Documented · Remediation-oriented</p></div><div className="space-y-4">{phases.map(([number,title,description])=><Card key={number} className="bg-[#040815]/60 border-white/10 hover:border-cyan-300/35 transition-all backdrop-blur-xl"><CardContent className="p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.16)]"><span className="text-lg font-black">{number}</span></div><div><h3 className="text-lg font-bold text-white mb-2">{title}</h3><p className="text-sm text-slate-300 leading-relaxed">{description}</p></div></div></CardContent></Card>)}</div></div>;
}
