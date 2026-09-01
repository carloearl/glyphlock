import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Code2, ExternalLink, FileSearch, FlaskConical, Network, Newspaper, Scale, ShieldCheck } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FEATURED_STORY = {
  publication: 'AI Business',
  title: 'He Watched the Door of a Nightclub Fail in Real Time, and Built the System That Remembers Everything',
  date: 'September 1, 2026',
  url: 'https://aibusiness.vc/startups/glyphlock-nups-nightlife-evidence',
  summary: 'AI Business presents GlyphLock through the problem it was built to solve: disconnected venue records that cannot reliably prove what happened. The story centers human decision-making, evidence integrity, and the enforceable boundaries placed around AI.',
  highlights: [
    'Frames nightlife operations as an evidence gap—not merely a technology gap',
    'Shows how NUPS, DCE, QR Studio, Image Lab, GlyphBot, and DJ tools share one evidence architecture',
    'Turns GlyphLock’s prohibited-AI actions into a practical governance and procurement checklist',
  ],
};

const RECORDS = [
  {
    title: 'NUPS × Oracle Hospitality: OHIP Partner Sandbox Evidence',
    classification: 'Third-party-verifiable integration record',
    date: 'August 24, 2026',
    icon: Network,
    tone: 'emerald',
    summary: 'A controlled, owner-only Oracle OHIP Partner Sandbox request reached response-validated maturity with OAuth accepted, a sanitized 250-row room-configuration response reviewed, and zero writes.',
    evidence: [
      'Seven required server settings present without exposing their values',
      'Oracle OCIM OAuth and a read-only OHIP request succeeded',
      '250 room-configuration rows were checked against local mapping rules',
      'Oracle Cloud Marketplace program enrollment is active; a published NUPS listing, production access, and Simphony Solution Validation remain separate gates',
    ],
    route: 'CaseStudyOracleOHIP',
    cta: 'Review the Oracle evidence',
  },
  {
    title: 'NUPS Product Category and Positioning',
    classification: 'Technical positioning',
    date: 'Updated August 25, 2026',
    icon: ShieldCheck,
    tone: 'cyan',
    summary: 'A factual comparison of the Nexus Unified Portal System with modern payment platforms, centered on integration boundaries and evidence packaging rather than unsupported category claims.',
    evidence: [
      'Acknowledges modern audit, 3-D Secure, KYC, and dispute-evidence tooling',
      'Defines NUPS around venue workflow integration and evidence packaging',
      'States current biometric storage and deletion boundaries',
      'Separates implemented controls from deployment-specific compliance duties',
    ],
    route: 'CaseStudyNUPS',
    cta: 'Read the positioning record',
  },
  {
    title: 'Internal Enforceability Review: Master Covenant',
    classification: 'Internal analysis — not legal advice',
    date: 'Updated August 25, 2026',
    icon: Scale,
    tone: 'violet',
    summary: 'Internal analysis of which Master Covenant concepts are more likely to work through conventional assent and which are likely unenforceable. No litigation occurred and counsel has not reviewed this page.',
    evidence: [
      'Conventional assent and signed incorporation remain the strongest path',
      'Evidence-preservation concepts are separated from contract formation',
      'Passive exposure and symbolic supremacy theories are treated as likely unenforceable',
      'All conclusions are labeled as internal analysis',
    ],
    route: 'CaseStudyCovenantVictory',
    cta: 'Read the internal review',
  },
  {
    title: 'Cursor Milestone: CAB-71 Contactless Discovery Record',
    classification: 'Internal workflow record — internal analysis',
    date: 'November 17, 2025',
    icon: Code2,
    tone: 'cyan',
    summary: 'The sixth and final Dream Team milestone: a Cursor IDE workspace-analysis session ingested the GlyphLock codebase, and the interaction was captured, hashed, and archived under the internal CAB-71 classification. No provider assent, partnership, or endorsement is claimed.',
    evidence: [
      'Workspace analysis via VS Code integration and codebase ingestion was captured as the source context',
      'The interaction record was hashed (Ed25519-BPAA lineage, e61dea5e…3120f5e) and archived internally',
      'Classified as contactless discovery under CAB-71 — an internal BPAAA classification, not assent',
      'Completes the six-role Dream Team lineup as the Sixth Man that binds the stack',
    ],
    route: 'DreamTeam',
    cta: 'View the Cursor milestone',
  },
  {
    title: 'Provenance and Evidence-Preservation Methodology',
    classification: 'Reproducible technical method',
    date: 'Updated August 25, 2026',
    icon: FlaskConical,
    tone: 'blue',
    summary: 'A provider-neutral method for capturing outputs, hashing files, recording timestamps, and cross-referencing artifacts without treating an AI system or its provider as a party to an agreement.',
    evidence: [
      'Preserves original output and capture context',
      'Computes content hashes over stable exported artifacts',
      'Records timestamp source and verification status explicitly',
      'Builds cross-system references without claiming assent or participation',
    ],
    route: 'ProvenanceMethodology',
    cta: 'Review the methodology',
  },
];

const toneClasses = {
  emerald: 'border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200',
  cyan: 'border-cyan-400/30 bg-cyan-400/[0.06] text-cyan-200',
  violet: 'border-violet-400/30 bg-violet-400/[0.06] text-violet-200',
  blue: 'border-blue-400/30 bg-blue-400/[0.06] text-blue-200',
};

export default function TechnicalEvidence() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0a1324] to-[#111a33] px-5 py-24 text-white">
      <SEOHead
        title="Technical Evidence | GlyphLock"
        description="Read the flagship AI Business story on GlyphLock, then review integration evidence, reproducible technical methods, technical positioning, and clearly labeled internal analysis."
        keywords={['GlyphLock AI Business story', 'GlyphLock technical evidence', 'Oracle OHIP evidence', 'NUPS architecture', 'AI governance boundaries', 'evidence preservation']}
        url="/TechnicalEvidence"
      />

      <section className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <Badge className="border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            Public evidence library
          </Badge>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-7xl">Technical Evidence</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Every public claim in this section must point to code, a controlled test, a third-party record,
            or a clearly labeled internal analysis. Unsupported claims are removed rather than promoted.
          </p>
        </div>

        <Card className="mt-10 overflow-hidden border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-400/[0.12] via-cyan-400/[0.06] to-black/20 shadow-[0_0_60px_rgba(217,70,239,0.12)]">
          <CardContent className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-8">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200">
                <Newspaper className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-200">
                Third-party publication · Partner Story
              </p>
              <p className="mt-2 text-sm text-slate-400">{FEATURED_STORY.date}</p>
              <Badge className="mt-4 border border-fuchsia-300/35 bg-fuchsia-300/10 text-fuchsia-100">
                Flagship story
              </Badge>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                Published by {FEATURED_STORY.publication}
              </p>
              <h2 className="mt-3 text-2xl font-black text-white sm:text-4xl">{FEATURED_STORY.title}</h2>
              <p className="mt-4 leading-7 text-slate-300">{FEATURED_STORY.summary}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {FEATURED_STORY.highlights.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-fuchsia-200" />
                    <span className="text-sm leading-6 text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <a href={FEATURED_STORY.url} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex">
                <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-500">
                  Read the flagship story
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Published free of charge. Founder-supplied claims remain identified as such in the article.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-amber-300/25 bg-amber-300/[0.05]">
          <CardContent className="flex gap-4 p-6">
            <FileSearch className="mt-1 h-6 w-6 flex-none text-amber-300" />
            <div>
              <h2 className="font-bold text-amber-100">Evidence standard</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Third-party-verifiable records are distinguished from technical positioning and internal analysis.
                A label describes the evidence class; it is not a certification, endorsement, legal ruling, or production approval.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 space-y-6">
          {RECORDS.map(({ title, classification, date, icon: Icon, tone, summary, evidence, route, cta }) => (
            <Card key={title} className={`overflow-hidden ${toneClasses[tone]}`}>
              <CardContent className="grid gap-8 p-6 md:grid-cols-[220px_1fr] md:p-8">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/20 bg-black/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] opacity-80">{classification}</p>
                  <p className="mt-2 text-sm text-slate-400">{date}</p>

                </div>

                <div>
                  <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
                  <p className="mt-4 leading-7 text-slate-300">{summary}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {evidence.map((item) => (
                      <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/15 p-4">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                        <span className="text-sm leading-6 text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={createPageUrl(route)} className="mt-7 inline-flex">
                    <Button className="bg-cyan-600 text-white hover:bg-cyan-500">
                      {cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}