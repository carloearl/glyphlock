import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Code2,
  CreditCard,
  FileCheck2,
  GitBranch,
  Globe2,
  Layers3,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';

const capabilities = [
  {
    icon: Code2,
    title: 'Custom software',
    text: 'Web apps, internal tools, dashboards, portals, and purpose-built business systems.',
  },
  {
    icon: CreditCard,
    title: 'Operations systems',
    text: 'Point of sale, settlements, payouts, scheduling, contracts, receipts, and reporting workflows.',
  },
  {
    icon: GitBranch,
    title: 'Integrations',
    text: 'APIs, payments, data services, identity, source control, automation, and third-party systems.',
  },
  {
    icon: Bot,
    title: 'AI workflows',
    text: 'Multi-provider assistants for research, analysis, coding, review, support, and workflow automation.',
  },
  {
    icon: ShieldCheck,
    title: 'Access & audit controls',
    text: 'Roles, permissions, activity logs, verification records, and operational traceability.',
  },
  {
    icon: Wrench,
    title: 'Deployment & support',
    text: 'Implementation, configuration, staff onboarding, maintenance, updates, and on-site technical work.',
  },
];

const products = [
  {
    eyebrow: 'VENUE OPERATIONS',
    title: 'NUPS',
    text: 'A venue operations platform built around point of sale, contracts, receipts, payouts, reporting, role-based access, and audit records.',
    link: 'NUPSLanding',
    icon: Building2,
  },
  {
    eyebrow: 'VERIFICATION',
    title: 'QR Studio',
    text: 'Custom QR generation with configurable payloads, signed-data options, scan workflows, and logging.',
    link: 'Qr',
    icon: QrCode,
  },
  {
    eyebrow: 'GOVERNANCE',
    title: 'Governance Hub',
    text: 'GlyphLock’s published internal governance, documentation, change-control, and AI workflow standards.',
    link: 'GovernanceHub',
    icon: FileCheck2,
  },
  {
    eyebrow: 'AI TOOLING',
    title: 'GlyphBot',
    text: 'AI-assisted chat, review, site analysis, and software workflow tooling across multiple providers.',
    link: 'GlyphBot',
    icon: Sparkles,
  },
];

const stack = [
  'Base44',
  'GitHub',
  'Supabase',
  'React',
  'Vite',
  'Stripe',
  'OpenAI',
  'Anthropic',
  'Google AI',
  'Oracle / OPERA integration work',
];

const aiRoles = [
  ['Orchestrate', 'Route work, preserve context, sequence tasks.'],
  ['Research', 'Gather current sources and supporting evidence.'],
  ['Reason', 'Analyze constraints, edge cases, and tradeoffs.'],
  ['Build', 'Write, refactor, test, and integrate software.'],
  ['Review', 'Check outputs, claims, code paths, and regressions.'],
  ['Ship', 'Document, deploy, monitor, and iterate.'],
];

export default function Home() {
  return (
    <>
      <SEOHead
        title="GlyphLock — Custom Software, Operations Systems & AI Workflows"
        description="GlyphLock designs, builds, integrates, and maintains custom software, operations systems, NUPS venue technology, QR tooling, audit workflows, and AI-assisted business systems."
        keywords="GlyphLock, custom software, NUPS, venue operations, web development, POS software, API integrations, AI workflows, QR tooling, business systems"
        url="/"
      />

      <main className="min-h-screen bg-[#05070d] text-white overflow-hidden">
        <section className="relative border-b border-white/10">
          <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(circle at 70% 15%, rgba(37,99,235,.20), transparent 36%), radial-gradient(circle at 15% 70%, rgba(8,145,178,.12), transparent 34%)'}} />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-20 md:pt-32 md:pb-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/5 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-cyan-300 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              GlyphLock LLC · Software & Systems
            </div>

            <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-12 items-end mt-8">
              <div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[.92] tracking-[-0.045em] max-w-5xl">
                  We build the system your business actually needs.
                </h1>
                <p className="mt-7 text-lg md:text-xl leading-relaxed text-white/65 max-w-3xl">
                  Custom software, operational tooling, integrations, AI workflows, and hands-on deployment — designed around the way you already work, then maintained as you grow.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link to={createPageUrl('Consultation')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-6 py-4 font-bold hover:bg-cyan-100 transition-colors">
                    Start a project <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to={createPageUrl('NUPSLanding')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-4 font-bold text-white hover:bg-white/[0.08] transition-colors">
                    See NUPS
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-7 backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-5">What we are</div>
                <div className="space-y-4">
                  {[
                    'A custom software studio',
                    'Builders of the NUPS venue platform',
                    'A systems integration and deployment team',
                    'An AI-assisted development operation',
                  ].map((item) => (
                    <div key={item} className="flex gap-3 items-start text-sm md:text-base text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-12 lg:gap-20">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-bold">One team, end to end</p>
              <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">Design it. Build it. Integrate it. Run it.</h2>
              <p className="mt-5 text-white/60 leading-relaxed">
                We focus on useful systems instead of inflated technology claims. The goal is simple: build software that works, connect it to the systems that matter, document it, and keep it moving.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {capabilities.map(({icon: Icon, title, text}) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 hover:border-cyan-400/30 transition-colors">
                  <Icon className="w-6 h-6 text-cyan-300" />
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.018]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Proof of work</p>
              <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">Products and systems you can inspect.</h2>
              <p className="mt-5 text-white/60 leading-relaxed">These are concrete GlyphLock modules and working product areas — not a wall of logos pretending every technology is a partnership.</p>
            </div>

            <div className="mt-10 grid md:grid-cols-2 gap-4">
              {products.map(({eyebrow, title, text, link, icon: Icon}) => (
                <Link key={title} to={createPageUrl(link)} className="group rounded-2xl border border-white/10 bg-[#090c14] p-7 md:p-8 hover:border-blue-400/40 transition-all">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="text-[10px] tracking-[0.2em] font-bold text-white/35">{eyebrow}</div>
                      <h3 className="mt-3 text-2xl font-black">{title}</h3>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 group-hover:bg-blue-400/10 transition-colors">
                      <Icon className="w-6 h-6 text-blue-300" />
                    </div>
                  </div>
                  <p className="mt-5 text-white/55 leading-relaxed">{text}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/80 group-hover:text-cyan-300">
                    Open module <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300 font-bold">AI-assisted development</p>
              <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">Multiple models. Defined jobs. Human ownership.</h2>
              <p className="mt-5 text-white/60 leading-relaxed">
                GlyphLock uses multiple AI providers as tools inside a structured workflow. We do not represent third-party AI companies as legally bound partners. The workflow assigns roles, preserves evidence, and keeps final responsibility with the people operating the system.
              </p>
              <Link to={createPageUrl('DreamTeam')} className="mt-7 inline-flex items-center gap-2 font-bold text-violet-200 hover:text-white">
                View the AI workflow <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {aiRoles.map(([title, text], index) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="text-[10px] font-mono text-white/30">0{index + 1}</div>
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#080b12]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-20">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 font-bold">Technology stack</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-black">Tools we use, support, or integrate with.</h2>
                <p className="mt-4 text-sm text-white/50 leading-relaxed">Technology names identify tooling and integration capability. They do not imply endorsement, certification, banking status, or a formal partnership unless separately documented.</p>
              </div>
              <Link to={createPageUrl('Services')} className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
                Explore services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/65">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/[0.025] to-cyan-400/5 p-8 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
              <div className="max-w-3xl">
                <Globe2 className="w-8 h-8 text-cyan-300" />
                <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight">Tell us what is broken, manual, disconnected, or missing.</h2>
                <p className="mt-5 text-white/60 text-lg leading-relaxed">We’ll scope the system, identify what should be built versus integrated, and give you a practical path forward.</p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
                <Link to={createPageUrl('Consultation')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-6 py-4 font-bold hover:bg-cyan-100 transition-colors">
                  Start a project <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to={createPageUrl('Contact')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-4 font-bold hover:bg-white/[0.05] transition-colors">
                  Contact GlyphLock
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-col md:flex-row gap-5 md:items-center md:justify-between text-sm text-white/45">
            <div>
              <div className="font-bold text-white/80">GlyphLock LLC</div>
              <div className="mt-1">El Mirage, Arizona · Custom software and systems</div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link to={createPageUrl('About')} className="hover:text-white">About</Link>
              <Link to={createPageUrl('Services')} className="hover:text-white">Services</Link>
              <Link to={createPageUrl('TrustSecurity')} className="hover:text-white">Trust & Security</Link>
              <Link to={createPageUrl('Privacy')} className="hover:text-white">Privacy</Link>
              <Link to={createPageUrl('Terms')} className="hover:text-white">Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
