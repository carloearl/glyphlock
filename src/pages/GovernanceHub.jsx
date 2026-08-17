import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, FileSearch, Scale, ClipboardCheck, AlertTriangle } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import VerificationIntakeForm from '@/components/verification/VerificationIntakeForm';
import AlignmentTiers from '@/components/verification/AlignmentTiers';
import VerificationFramework from '@/components/verification/VerificationFramework';
import EngagementOptions from '@/components/verification/EngagementOptions';
import VerificationDeliverables from '@/components/verification/VerificationDeliverables';
import ImportantNotice from '@/components/verification/ImportantNotice';
import VerificationIntro from '@/components/verification/VerificationIntro';

const principles = [
  [FileSearch, 'Evidence before claims', 'Public statements should be traceable to code, records, filings, contracts, test results or clearly labeled internal research.'],
  [Scale, 'Framework is not law', 'The Master Covenant is a GlyphLock-authored governance framework. Its existence does not itself create court, regulatory or third-party authority.'],
  [ShieldCheck, 'Controls need owners', 'Architecture, policy and operational controls should identify scope, responsible parties, evidence and review cadence.'],
  [ClipboardCheck, 'Gaps become roadmap', 'Unverified or incomplete areas are recorded as remediation work rather than represented as completed validation.'],
];

export default function GovernanceHub() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="min-h-screen bg-transparent text-white overflow-hidden">
      <SEOHead title="Governance Hub | GlyphLock" description="GlyphLock governance framework, evidence discipline, alignment review methodology, remediation workflow and public-claims boundaries." keywords="GlyphLock governance, Master Covenant, governance framework, evidence review, operational controls, remediation" url="/governance-hub" />
      <section className="relative px-5 pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="absolute left-[8%] top-[12%] h-80 w-80 rounded-full bg-cyan-500/12 blur-[120px] pointer-events-none" />
        <div className="absolute right-[5%] top-[5%] h-96 w-96 rounded-full bg-violet-600/14 blur-[140px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-violet-400/[.07] px-4 py-2 font-mono text-[10px] tracking-[.22em] text-violet-200"><ShieldCheck className="h-4 w-4" /> GLYPHLOCK // GOVERNANCE HUB</div>
          <h1 className="mt-7 max-w-5xl text-5xl md:text-7xl lg:text-8xl font-black tracking-[-.055em] leading-[.84]">GOVERNANCE<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400">WITH RECEIPTS.</span></h1>
          <p className="mt-7 max-w-3xl text-lg md:text-xl leading-relaxed text-slate-300">The Master Covenant organizes GlyphLock's governance concepts and review criteria. This hub separates internal framework alignment from external certification, legal enforceability and regulatory approval.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {principles.map(([Icon,title,text]) => <div key={title} className="rounded-2xl border border-white/10 bg-[#040815]/55 p-5 backdrop-blur-2xl shadow-[0_0_28px_rgba(59,130,246,.08)]"><Icon className="h-6 w-6 text-cyan-300"/><h2 className="mt-5 font-black">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p></div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-24">
        <div className="mb-7 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-5 text-sm text-amber-100/80"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300"/><span><strong className="text-amber-200">Public boundary:</strong> a GlyphLock alignment review is an internal/framework-based assessment unless an identified outside organization conducts the review. It is not represented here as an independent certification.</span></div></div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto grid-cols-2 lg:grid-cols-6 gap-2 bg-[#030714]/70 border border-white/10 p-2 rounded-2xl backdrop-blur-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="engagement">Engagement</TabsTrigger><TabsTrigger value="framework">Framework</TabsTrigger><TabsTrigger value="tiers">Alignment Tiers</TabsTrigger><TabsTrigger value="deliverables">Deliverables</TabsTrigger><TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>
          <div className="mt-8">
            <TabsContent value="overview"><VerificationIntro /></TabsContent>
            <TabsContent value="engagement"><EngagementOptions /></TabsContent>
            <TabsContent value="framework"><VerificationFramework /></TabsContent>
            <TabsContent value="tiers"><AlignmentTiers /></TabsContent>
            <TabsContent value="deliverables"><VerificationDeliverables /></TabsContent>
            <TabsContent value="request"><VerificationIntakeForm /></TabsContent>
          </div>
        </Tabs>
        <div className="mt-8"><ImportantNotice /></div>
      </section>
    </main>
  );
}
