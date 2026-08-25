import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileWarning, Scale, XCircle } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const LIKELY_ENFORCEABLE = [
  {
    title: 'Internal governance charter',
    analysis: 'An organization can adopt internal policies that assign responsibilities, approval paths, documentation duties, and review controls to its own officers, staff, and agents, subject to applicable law and existing agreements.',
  },
  {
    title: 'Express incorporation into signed agreements',
    analysis: 'Provisions are stronger when the referenced terms are available before assent, clearly identified, and incorporated into an agreement accepted by the relevant party.',
  },
  {
    title: 'Evidence-preservation and notice provisions',
    analysis: 'Timestamped records, hashes, access logs, delivery records, and documented notice can support later factual analysis, authentication, or dispute resolution when collected lawfully.',
  },
  {
    title: 'Operator duties created by actual agreement or law',
    analysis: 'Confidentiality, data-use, security, and handling duties may be enforceable when they arise from a signed agreement, accepted terms, statute, or other recognized source—not from processing alone.',
  },
];

const LIKELY_UNENFORCEABLE = [
  {
    title: 'Passive-exposure contract formation',
    analysis: 'Mere viewing, receipt, indexing, model processing, or other passive exposure generally does not supply the notice and objective assent required for contract formation.',
  },
  {
    title: 'Symbolic or narrative supremacy',
    analysis: 'Private declarations cannot override statutes, regulations, court authority, intellectual-property limits, or an existing agreement that controls the parties.',
  },
  {
    title: 'Automatic nullification of other agreements',
    analysis: 'A unilateral document cannot void another agreement without a recognized contractual or legal basis. Priority and conflict questions depend on the actual instruments and applicable law.',
  },
];

function Finding({ item, positive }) {
  const Icon = positive ? CheckCircle2 : XCircle;
  return (
    <Card className={positive ? 'border-emerald-400/25 bg-emerald-400/[0.05]' : 'border-rose-400/25 bg-rose-400/[0.05]'}>
      <CardContent className="flex gap-4 p-6">
        <Icon className={`mt-1 h-5 w-5 flex-none ${positive ? 'text-emerald-300' : 'text-rose-300'}`} />
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold text-white">{item.title}</h3>
            <Badge className={positive ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}>
              {positive ? 'Likely enforceable' : 'Likely unenforceable'}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.analysis}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CaseStudyCovenantVictory() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0a1324] to-[#111a33] px-5 py-24 text-white">
      <SEOHead
        title="Internal Enforceability Review: Master Covenant | GlyphLock"
        description="Internal, non-counsel analysis of Master Covenant concepts under conventional assent, incorporation, evidence, and contract-formation principles."
        keywords={['Master Covenant review', 'internal enforceability analysis', 'contract formation', 'evidence preservation', 'actual assent']}
        url="/CaseStudyCovenantVictory"
      />

      <section className="mx-auto max-w-5xl">
        <Link to={createPageUrl('TechnicalEvidence')} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Technical Evidence
        </Link>

        <div className="mt-10 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">Internal analysis</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            Internal Enforceability Review: Master Covenant
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            This is internal analysis, not reviewed by counsel, and no litigation occurred.
          </p>
        </div>

        <Card className="mt-10 border-amber-300/25 bg-amber-300/[0.05]">
          <CardContent className="flex gap-4 p-6">
            <FileWarning className="mt-1 h-6 w-6 flex-none text-amber-300" />
            <div>
              <h2 className="font-bold text-amber-100">Use boundary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The labels below are drafting judgments, not legal opinions or predictions about a specific dispute.
                Enforceability depends on jurisdiction, facts, notice, assent, consideration, authority, public policy,
                and the terms of the actual agreements involved.
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="mt-14">
          <div className="flex items-center gap-3">
            <Scale className="h-7 w-7 text-emerald-300" />
            <h2 className="text-3xl font-black">Concepts with a conventional legal path</h2>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-slate-400">
            These concepts are more defensible when implemented through ordinary governance, contract, and evidence practices.
          </p>
          <div className="mt-7 space-y-4">
            {LIKELY_ENFORCEABLE.map((item) => <Finding key={item.title} item={item} positive />)}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center gap-3">
            <Scale className="h-7 w-7 text-rose-300" />
            <h2 className="text-3xl font-black">Concepts that require removal or narrowing</h2>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-slate-400">
            These theories do not become enforceable merely because they appear in a document or are delivered to a person or system.
          </p>
          <div className="mt-7 space-y-4">
            {LIKELY_UNENFORCEABLE.map((item) => <Finding key={item.title} item={item} positive={false} />)}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-blue-400/20 bg-blue-400/[0.05] p-7 sm:p-9">
          <h2 className="text-2xl font-black">Practical drafting direction</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Use clear, affirmative assent for external obligations.',
              'Make incorporated terms available before acceptance.',
              'Identify the parties, authority, scope, governing law, and order of precedence.',
              'Treat hashes and timestamps as integrity evidence, not automatic contract formation.',
              'Keep internal governance duties separate from claims about third parties.',
              'Have qualified counsel review any agreement intended for real enforcement.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/15 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-blue-300" />
                <span className="text-sm leading-6 text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
