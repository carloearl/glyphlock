import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Circle, ArrowRight, ShieldCheck, Rocket, Layers3, Gauge, FileCheck2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';

const lanes = [
  {
    phase: 'FOUNDATION',
    period: '2025',
    status: 'delivered',
    icon: CheckCircle2,
    accent: '#22d3ee',
    summary: 'Core platform surfaces moved from concept into working software and public documentation.',
    items: [
      ['GlyphLock platform foundation', 'delivered'],
      ['QR Studio and verification workflows', 'delivered'],
      ['GlyphBot / multi-provider AI workflow surfaces', 'delivered'],
      ['Governance Hub and Master Covenant publication', 'delivered'],
      ['NUPS operating-platform foundation', 'delivered'],
    ],
  },
  {
    phase: 'OPERATIONALIZATION',
    period: 'H1 2026',
    status: 'delivered',
    icon: Layers3,
    accent: '#3b82f6',
    summary: 'The ecosystem expanded into venue operations, reporting, security visibility and integration work.',
    items: [
      ['NUPS command surfaces, POS and operational workflows', 'delivered'],
      ['Contracts, shift records, payout and settlement workflows', 'delivered'],
      ['Security Operations and audit visibility', 'delivered'],
      ['Oracle OHIP authenticated integration work', 'delivered'],
      ['Public GitHub / Base44 canonical source alignment', 'delivered'],
    ],
  },
  {
    phase: 'HARDENING',
    period: 'H2 2026',
    status: 'active',
    icon: Gauge,
    accent: '#8b5cf6',
    summary: 'Current work is focused on proof, reliability, public-claims discipline, testing and deployment maturity.',
    items: [
      ['End-to-end module verification and regression coverage', 'active'],
      ['Public claims registry with evidence/status ownership', 'active'],
      ['Performance, accessibility and mobile hardening', 'active'],
      ['NUPS recovery/failover expansion', 'active'],
      ['Security control mapping and evidence collection', 'active'],
    ],
  },
  {
    phase: 'VALIDATION',
    period: 'NEXT',
    status: 'planned',
    icon: FileCheck2,
    accent: '#d946ef',
    summary: 'External validation milestones are tracked separately from internal implementation so the site never implies completion before evidence exists.',
    items: [
      ['Independent security assessment / penetration testing', 'planned'],
      ['Formal compliance readiness assessment where commercially justified', 'planned'],
      ['Documented customer deployment references and case studies', 'planned'],
      ['IP filing/registration records linked only after authoritative verification', 'planned'],
      ['Independent review of governance methodology', 'planned'],
    ],
  },
  {
    phase: 'SCALE',
    period: 'FUTURE',
    status: 'planned',
    icon: Rocket,
    accent: '#10b981',
    summary: 'Expansion follows validated product demand and operational evidence rather than speculative valuation or partner-count targets.',
    items: [
      ['Multi-venue NUPS deployment tooling', 'planned'],
      ['Enterprise SDK and integration packaging', 'planned'],
      ['Expanded identity and hardware integration options', 'planned'],
      ['Internationalization and deployment-region support', 'planned'],
      ['Post-quantum migration experiments aligned to applicable standards', 'planned'],
    ],
  },
];

const statusStyle = {
  delivered: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  active: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100',
  planned: 'border-white/15 bg-white/[.04] text-slate-300',
};

export default function Roadmap() {
  return (
    <>
      <SEOHead
        title="GlyphLock Engineering Roadmap | Build, Harden, Validate, Scale"
        description="Evidence-led GlyphLock engineering roadmap covering delivered platform foundations, current hardening work, independent validation targets, and future scale milestones."
        keywords="GlyphLock roadmap, NUPS roadmap, software engineering roadmap, security validation, platform hardening, governance roadmap"
        url="/roadmap"
      />
      <main className="min-h-screen bg-transparent text-white overflow-hidden">
        <section className="relative px-5 pt-28 pb-16 md:pt-36 md:pb-24">
          <div className="absolute left-[10%] top-[15%] h-80 w-80 rounded-full bg-cyan-500/12 blur-[120px] pointer-events-none" />
          <div className="absolute right-[8%] top-[5%] h-96 w-96 rounded-full bg-violet-600/12 blur-[140px] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[.07] px-4 py-2 font-mono text-[10px] tracking-[.22em] text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.14)]">
              <ShieldCheck className="h-4 w-4" /> GLYPHLOCK // EVIDENCE-LED DEVELOPMENT
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl md:text-7xl lg:text-8xl font-black tracking-[-.055em] leading-[.84]">
              ENGINEERING
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400">ROADMAP.</span>
            </h1>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <p className="max-w-3xl text-lg md:text-xl leading-relaxed text-slate-300">
                What has shipped, what is being hardened now, what requires independent validation, and what comes next. Dates are directional unless a milestone is explicitly marked delivered.
              </p>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-5 text-sm leading-relaxed text-amber-100/80 backdrop-blur-xl">
                <strong className="text-amber-200">Status discipline:</strong> planned certifications, registrations, partnerships, deployments and external validations are not represented as completed until documentary evidence exists.
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 pb-24 md:pb-32">
          <div className="relative">
            <div className="absolute left-[25px] md:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-cyan-300/60 via-violet-400/45 to-emerald-400/30 md:-translate-x-1/2" />
            <div className="space-y-10 md:space-y-14">
              {lanes.map((lane, index) => {
                const Icon = lane.icon;
                return (
                  <motion.article
                    key={lane.phase}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.65, delay: index * 0.06 }}
                    className={`relative grid md:grid-cols-2 gap-8 md:gap-14 ${index % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}
                  >
                    <div className="absolute left-[17px] md:left-1/2 top-8 z-20 h-4 w-4 rounded-full border-2 bg-[#02040d] md:-translate-x-1/2" style={{ borderColor: lane.accent, boxShadow: `0 0 20px ${lane.accent}` }} />
                    <div className={`${index % 2 ? 'md:pl-7' : 'md:pr-7'} pl-14 md:pl-0`}>
                      <div className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#040815]/55 p-6 md:p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25" style={{ boxShadow: `0 0 32px ${lane.accent}18, inset 0 0 60px ${lane.accent}0b` }}>
                        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[70px] opacity-20" style={{ background: lane.accent }} />
                        <div className="relative flex items-start justify-between gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-black/30" style={{ borderColor: `${lane.accent}55`, boxShadow: `0 0 22px ${lane.accent}25` }}>
                            <Icon className="h-6 w-6" style={{ color: lane.accent }} />
                          </div>
                          <span className={`rounded-full border px-3 py-1 font-mono text-[9px] tracking-[.18em] uppercase ${statusStyle[lane.status]}`}>{lane.status}</span>
                        </div>
                        <div className="relative mt-7">
                          <div className="font-mono text-[10px] tracking-[.22em]" style={{ color: lane.accent }}>{lane.period}</div>
                          <h2 className="mt-2 text-2xl md:text-3xl font-black">{lane.phase}</h2>
                          <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-400">{lane.summary}</p>
                        </div>
                        <div className="relative mt-7 space-y-2.5">
                          {lane.items.map(([title, status]) => (
                            <div key={title} className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-black/20 p-3.5">
                              {status === 'delivered' ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" /> : status === 'active' ? <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" /> : <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />}
                              <span className="text-sm text-slate-200">{title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block" />
                  </motion.article>
                );
              })}
            </div>
          </div>

          <div className="mt-20 rounded-[28px] border border-cyan-300/25 bg-[#030714]/55 p-7 md:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,.10)]">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="font-mono text-[10px] tracking-[.22em] text-cyan-300">ROADMAP // SOURCE OF TRUTH</div>
                <h2 className="mt-3 text-3xl md:text-4xl font-black">Working software first. Evidence second. Claims last.</h2>
                <p className="mt-4 max-w-3xl text-slate-400 leading-relaxed">This roadmap will be updated as implementation, testing and external evidence change. A future milestone is not a promise of certification, regulatory approval, customer adoption or legal validation.</p>
              </div>
              <Link to={createPageUrl('GovernanceHub')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/50 bg-violet-500/15 px-6 py-4 font-black text-violet-100 shadow-[0_0_28px_rgba(139,92,246,.25)] transition-all hover:-translate-y-1 hover:bg-violet-400/25 hover:shadow-[0_0_48px_rgba(139,92,246,.48)]">
                VIEW GOVERNANCE <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
