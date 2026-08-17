import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, FileCheck2, AlertTriangle } from 'lucide-react';

export default function VerificationIntro() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#040815]/60 border-cyan-300/20 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,.08)]">
        <CardHeader><CardTitle className="flex items-center gap-2 text-cyan-200"><ShieldCheck className="h-6 w-6" /> Section I — Governance Alignment Review</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-slate-300">
          <p className="leading-relaxed">A structured, evidence-led review using selected <span className="text-cyan-300 font-semibold">GlyphLock governance criteria</span>, including concepts documented in the <span className="text-violet-300 font-semibold">Master Covenant framework</span>.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {['System architecture and data-flow documentation','Operational controls and ownership','Security and exposure documentation','Governance records and evidence discipline','AI workflow accountability where applicable','Prioritized remediation requirements'].map(item => <div key={item} className="flex items-start gap-2 rounded-xl border border-white/[.07] bg-black/20 p-3"><FileCheck2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300"/><span className="text-sm">{item}</span></div>)}
          </div>
          <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm text-amber-100/80"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300"/><span>This review measures alignment to defined criteria. It is not a regulatory certification, legal opinion, court validation, SOC 2 report, ISO certification, or independent third-party audit unless an identified qualified outside assessor separately provides one.</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
