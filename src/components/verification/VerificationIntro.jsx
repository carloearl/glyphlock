import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, FileCheck2, AlertTriangle } from 'lucide-react';

export default function VerificationIntro() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#040815]/60 border-cyan-300/20 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,.08)]">
        <CardHeader><CardTitle className="flex items-center gap-2 text-cyan-200"><ShieldCheck className="h-6 w-6" /> What the review actually is</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-slate-300">
          <p className="leading-relaxed">A paid documentation review. GlyphLock reads what you provide, compares it against our own written <span className="text-cyan-300 font-semibold">Master Covenant</span> checklist, and hands back written findings and a list of gaps. Conclusions depend entirely on the documents and access you give us.</p>
          <p className="text-sm text-slate-400">What we look at:</p>
          <div className="grid md:grid-cols-2 gap-3">
            {['Architecture and data-flow documents you supply','Which controls exist on paper and who owns them','Security documentation and known exposure','Whether records and evidence are actually kept','AI workflow accountability, where it applies','A prioritized list of gaps to fix'].map(item => <div key={item} className="flex items-start gap-2 rounded-xl border border-white/[.07] bg-black/20 p-3"><FileCheck2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300"/><span className="text-sm">{item}</span></div>)}
          </div>
          <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm text-amber-100/80"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300"/><span>What it is not: not a certification, not an accredited audit, not a legal opinion, not SOC 2, not ISO, not a penetration test, and not evidence of compliance with any law or regulation. We do not verify facts we cannot see, and we do not test systems unless that testing is separately scoped in writing.</span></div>
        </CardContent>
      </Card>
    </div>
  );
}