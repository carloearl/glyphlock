import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileSearch, ShieldCheck, Layers3, ClipboardCheck, AlertTriangle } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { injectServiceSchema } from '@/components/utils/seoHelpers';
import VerificationIntro from '@/components/verification/VerificationIntro';
import EngagementOptions from '@/components/verification/EngagementOptions';
import VerificationFramework from '@/components/verification/VerificationFramework';
import VerificationDeliverables from '@/components/verification/VerificationDeliverables';
import AlignmentTiers from '@/components/verification/AlignmentTiers';
import ImportantNotice from '@/components/verification/ImportantNotice';
import VerificationIntakeForm from '@/components/verification/VerificationIntakeForm';

const reviewAreas = [
  [Layers3, 'Architecture', 'System boundaries, data flows, dependencies and operational controls.'],
  [FileSearch, 'Evidence', 'Policies, technical documentation, screenshots, records and implementation artifacts.'],
  [ShieldCheck, 'Governance', 'Control ownership, decision paths, documented standards and accountability.'],
  [ClipboardCheck, 'Remediation', 'Prioritized gaps, evidence requests and an actionable improvement roadmap.'],
];

export default function Consultation() {
  useEffect(() => {
    const cleanup = injectServiceSchema(
      'GlyphLock Governance Alignment Review',
      'A structured evidence-led review of system architecture, operational controls, documentation and governance against selected GlyphLock framework criteria. This is not regulatory certification, legal validation or an independent third-party audit.',
      '/consultation'
    );
    return cleanup;
  }, []);

  return (
    <main className="min-h-screen bg-transparent text-white overflow-hidden">
      <SEOHead
        title="Governance Alignment Review | GlyphLock"
        description="Evidence-led review of architecture, operational controls, documentation and governance against selected GlyphLock framework criteria. Not regulatory certification, legal validation or a third-party audit."
        keywords="governance review, security architecture review, evidence review, operational controls, remediation roadmap, GlyphLock governance"
        url="/consultation"
      />

      <section className="relative px-5 pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="absolute left-[8%] top-[10%] h-80 w-80 rounded-full bg-cyan-500/12 blur-[120px] pointer-events-none" />
        <div className="absolute right-[5%] top-[2%] h-96 w-96 rounded-full bg-violet-600/14 blur-[140px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/[.07] px-4 py-2 font-mono text-[10px] tracking-[.22em] text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.16)]">
            <ShieldCheck className="h-4 w-4" /> GLYPHLOCK // REVIEW ENGAGEMENT
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-7 max-w-6xl text-5xl md:text-7xl lg:text-8xl font-black tracking-[-.055em] leading-[.84]">
            GOVERNANCE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400">ALIGNMENT REVIEW.</span>
          </motion.h1>
          <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_.72fr] lg:items-end">
            <p className="max-w-3xl text-lg md:text-xl leading-relaxed text-slate-300">
              A structured review of architecture, operational controls, documentation and governance using selected GlyphLock framework criteria. The engagement produces findings and a remediation path—not a government approval, legal ruling, or third-party certification.
            </p>
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[.055] p-5 text-sm leading-relaxed text-amber-100/80 backdrop-blur-xl">
              <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" /><span><strong className="text-amber-200">Scope matters.</strong> “Independent Protocol Verification” is no longer used as the primary public label because GlyphLock performs the review under its own framework. Any truly independent assessment must identify the outside assessor.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviewAreas.map(([Icon, title, text], index) => (
            <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="rounded-2xl border border-cyan-300/15 bg-[#040815]/55 p-5 backdrop-blur-2xl shadow-[0_0_26px_rgba(34,211,238,.08)]">
              <Icon className="h-6 w-6 text-cyan-300 drop-shadow-[0_0_9px_rgba(34,211,238,.7)]" />
              <h2 className="mt-5 font-black text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-24 space-y-10">
        <VerificationIntro />
        <EngagementOptions />
        <VerificationFramework />
        <VerificationDeliverables />
        <AlignmentTiers />
        <ImportantNotice />
        <VerificationIntakeForm />
        <div className="text-center pt-3">
          <a href="mailto:carloearl@glyphlock.com" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200 transition-colors hover:text-white">QUESTIONS? CONTACT GLYPHLOCK <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>
    </main>
  );
}