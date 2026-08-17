import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Code2,
  Workflow,
  QrCode,
  Bot,
  Building2,
  Sparkles,
  Image,
  DollarSign,
  Radio,
  Music2,
  ScanLine,
  PanelsTopLeft,
  Cpu,
  Rocket,
  Gauge,
  FileSignature,
  ChevronDown,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { createPageUrl } from '@/utils';
import HeroSection from '@/components/home/HeroSection';
import FlagshipNUPSShowcase from '@/components/home/FlagshipNUPSShowcase';
import FeaturedIntegrationsMarquee from '@/components/home/FeaturedIntegrationsMarquee';
import HomeDreamTeamCTA from '@/components/home/HomeDreamTeamCTA';
import ServicesGrid from '@/components/home/ServicesGrid';
import TechnologyMarquee from '@/components/TechnologyMarquee';
import TechServicesPreview from '@/components/home/TechServicesPreview';
import OnSiteServices from '@/components/home/OnSiteServices';
import PlatformCapabilities from '@/components/home/PlatformCapabilities';
import CTASection from '@/components/home/CTASection';
import GlyphHoverEngine from '@/components/home/GlyphHoverEngine';

const platformModules = [
  {
    icon: Building2,
    title: 'NUPS',
    status: 'FLAGSHIP',
    text: 'Venue operations across front door, POS, contracts, staff, payouts, reporting and audit trails.',
    link: 'NUPSLanding',
    accent: '#22d3ee',
  },
  {
    icon: QrCode,
    title: 'QR Studio',
    status: 'ONLINE',
    text: 'Custom payloads, branded codes, scan logging, signing options, verification and vault workflows.',
    link: 'Qr',
    accent: '#38bdf8',
  },
  {
    icon: ShieldCheck,
    title: 'Governance Hub',
    status: 'PUBLISHED',
    text: 'Master Covenant governance, operating standards, documentation and accountability architecture.',
    link: 'GovernanceHub',
    accent: '#8b5cf6',
  },
  {
    icon: Bot,
    title: 'GlyphBot',
    status: 'ACTIVE',
    text: 'Multi-provider AI assistance for research, code analysis, site audits, support and workflows.',
    link: 'GlyphBot',
    accent: '#818cf8',
  },
  {
    icon: Image,
    title: 'Image Lab',
    status: 'CREATIVE',
    text: 'AI image generation, visual analysis, interactive hotspots and product-ready media tooling.',
    link: 'ImageLab',
    accent: '#d946ef',
  },
  {
    icon: DollarSign,
    title: 'GlyphLock Financial',
    status: 'OPERATIONS',
    text: 'Ledgers, settlements, payout workflows, reconciliation and operational reporting surfaces.',
    link: 'GlyphLockFinancial',
    accent: '#10b981',
  },
  {
    icon: Radio,
    title: 'Security Operations',
    status: 'MONITORING',
    text: 'Access controls, activity visibility, audit events, alerting and security operations tooling.',
    link: 'SecurityOperationsCenter',
    accent: '#f43f5e',
  },
  {
    icon: Music2,
    title: 'DJ Pro Mixer',
    status: 'CREATOR',
    text: 'Creative audio and DJ workflows connected to the wider GlyphLock operating ecosystem.',
    link: 'GlyphBotMixer',
    accent: '#f59e0b',
  },
];

const capabilityCards = [
  {
    icon: Code2,
    title: 'CUSTOM SOFTWARE',
    text: 'Web apps, internal tools, dashboards, portals and purpose-built interfaces engineered around the operation.',
    accent: '#22d3ee',
  },
  {
    icon: Workflow,
    title: 'SYSTEM INTEGRATION',
    text: 'Payments, identity, APIs, data and third-party platforms connected into one controlled workflow.',
    accent: '#3b82f6',
  },
  {
    icon: Cpu,
    title: 'AI ENGINEERING',
    text: 'Multi-model workflows for research, coding, analysis, review, assistance and automation.',
    accent: '#8b5cf6',
  },
  {
    icon: Gauge,
    title: 'OPERATIONS SOFTWARE',
    text: 'POS, contracts, scheduling, payouts, roles, reporting, audit logs and live business controls.',
    accent: '#d946ef',
  },
];

const buildStages = [
  ['01', 'DESIGN', PanelsTopLeft],
  ['02', 'BUILD', Code2],
  ['03', 'INTEGRATE', ScanLine],
  ['04', 'OPERATE', Gauge],
];

function CommandRail() {
  const items = [
    ['FLAGSHIP', '#flagship'],
    ['PLATFORM', '#platform-universe'],
    ['AI WORKFLOW', '#ai-workflow'],
    ['SERVICES', '#services'],
    ['START PROJECT', '#start-project'],
  ];

  return (
    <div className="sticky top-[68px] md:top-[76px] z-[70] px-3 md:px-5 -mt-px">
      <nav
        aria-label="Homepage sections"
        className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto rounded-b-2xl border-x border-b border-cyan-300/25 bg-[#020713]/[.78] backdrop-blur-2xl px-2 py-2 shadow-[0_18px_55px_rgba(0,0,0,.45),0_0_35px_rgba(34,211,238,.10)] [scrollbar-width:none]"
      >
        <div className="hidden sm:flex items-center gap-2 px-3 mr-1 font-mono text-[9px] tracking-[.24em] text-emerald-300 whitespace-nowrap">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_#6ee7b7] animate-pulse" />
          SYSTEM MAP
        </div>
        {items.map(([label, href], index) => (
          <a
            key={label}
            href={href}
            className="group relative flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[.035] px-3.5 py-2.5 font-mono text-[9px] md:text-[10px] font-bold tracking-[.14em] text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/[.55] hover:text-cyan-100 hover:shadow-[0_0_26px_rgba(34,211,238,.22)]"
          >
            <span className="mr-2 text-cyan-400/[.55]">0{index + 1}</span>
            {label}
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 transition-transform duration-300 group-hover:scale-x-100" />
          </a>
        ))}
      </nav>
    </div>
  );
}

function BuildStageRail() {
  return (
    <div className="relative z-20 max-w-7xl mx-auto -mt-1 px-4 md:px-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-2xl border border-cyan-300/20 bg-[#030611]/[.58] backdrop-blur-2xl p-2 shadow-[0_0_40px_rgba(34,211,238,.10),0_24px_70px_rgba(0,0,0,.38)]">
        {buildStages.map(([number, title, Icon]) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-xl border border-white/[.07] bg-white/[.035] px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/[.45] hover:bg-cyan-300/[.055] hover:shadow-[0_0_28px_rgba(34,211,238,.18)]"
          >
            <div className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-cyan-400/10 blur-2xl transition-colors group-hover:bg-violet-400/20" />
            <div className="relative flex items-center gap-3">
              <Icon className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_9px_rgba(34,211,238,.8)]" />
              <div>
                <span className="font-mono text-[9px] text-cyan-400/[.55]">{number}</span>
                <div className="font-black tracking-[.16em] text-xs text-white">{title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapabilityGrid() {
  return (
    <section id="capabilities" className="gl-home-section relative max-w-7xl mx-auto px-5 py-20 md:py-28">
      <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px] pointer-events-none" />
      <div className="relative mb-12 grid gap-7 lg:grid-cols-[1fr_.7fr] lg:items-end">
        <div>
          <div className="font-mono text-cyan-300 text-[10px] md:text-xs tracking-[.28em] mb-4">// GLYPHLOCK ENGINEERING CORE</div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-[-.045em] leading-[.9]">
            BUILD THE SYSTEM.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400 drop-shadow-[0_0_24px_rgba(34,211,238,.28)]">
              CONNECT THE STACK.
            </span>
          </h2>
        </div>
        <p className="text-base md:text-lg text-slate-300 leading-relaxed lg:pb-1">
          GlyphLock combines product design, software engineering, operations architecture, AI-assisted workflows and deployment into one build team.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {capabilityCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08, duration: 0.65 }}
              whileHover={{ y: -7, scale: 1.01 }}
              className="group gl-cyber-panel relative min-h-[245px] overflow-hidden rounded-[24px] border border-white/10 bg-[#050817]/[.52] backdrop-blur-2xl p-7 md:p-9 transition-all duration-300"
              style={{ '--gl-accent': card.accent }}
            >
              <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.08) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full blur-[75px] opacity-20 transition-opacity duration-300 group-hover:opacity-35" style={{ background: card.accent }} />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-black/30 shadow-[inset_0_0_25px_rgba(255,255,255,.03)]" style={{ borderColor: `${card.accent}55`, boxShadow: `0 0 28px ${card.accent}25, inset 0 0 24px ${card.accent}12` }}>
                    <Icon className="h-7 w-7" style={{ color: card.accent, filter: `drop-shadow(0 0 10px ${card.accent})` }} />
                  </div>
                  <span className="font-mono text-[9px] tracking-[.2em] text-white/[.35]">CORE_0{index + 1}</span>
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="text-xl md:text-2xl font-black tracking-wide text-white transition-colors" style={{ textShadow: `0 0 20px ${card.accent}22` }}>{card.title}</h3>
                  <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-slate-400">{card.text}</p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function PlatformUniverse() {
  return (
    <section id="platform-universe" className="gl-home-section relative max-w-7xl mx-auto px-5 py-20 md:py-28">
      <div className="absolute right-[4%] top-[6%] h-80 w-80 rounded-full bg-violet-600/[.12] blur-[120px] pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-7 mb-12">
        <div>
          <div className="font-mono text-violet-300 text-[10px] md:text-xs tracking-[.28em] mb-4">// GLYPHLOCK PLATFORM UNIVERSE</div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-[-.045em] leading-[.9]">
            ONE ECOSYSTEM.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-400 to-cyan-300">MULTIPLE ENGINES.</span>
          </h2>
        </div>
        <Link
          to={createPageUrl('NUPSLanding')}
          className="gl-energy-button group inline-flex self-start md:self-auto items-center gap-2 rounded-xl border border-cyan-200/60 bg-cyan-300/[.15] px-5 py-3.5 font-black text-cyan-50 shadow-[0_0_30px_rgba(34,211,238,.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-cyan-200 hover:text-slate-950 hover:shadow-[0_0_55px_rgba(34,211,238,.58)]"
        >
          ENTER THE FLAGSHIP <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: index * 0.055, duration: 0.6 }}
              whileHover={{ y: -9, scale: 1.025 }}
            >
              <Link
                to={createPageUrl(module.link)}
                className="group relative block min-h-[285px] overflow-hidden rounded-[24px] border border-white/10 bg-[#040815]/[.52] backdrop-blur-2xl p-6 transition-all duration-300 hover:border-white/25"
                style={{ boxShadow: `0 0 28px ${module.accent}22, inset 0 0 60px ${module.accent}0d` }}
              >
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full blur-[65px] opacity-20 transition-all duration-300 group-hover:opacity-40 group-hover:scale-125" style={{ background: module.accent }} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-25 group-hover:opacity-80" />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-black/[.35]" style={{ borderColor: `${module.accent}55`, boxShadow: `0 0 24px ${module.accent}25` }}>
                    <Icon className="h-6 w-6" style={{ color: module.accent, filter: `drop-shadow(0 0 9px ${module.accent})` }} />
                  </div>
                  <span className="rounded-full border px-2.5 py-1 font-mono text-[8px] tracking-[.18em]" style={{ color: module.accent, borderColor: `${module.accent}55`, background: `${module.accent}10` }}>{module.status}</span>
                </div>
                <div className="relative mt-12">
                  <div className="font-mono text-[9px] tracking-[.18em] text-white/30">MODULE_{String(index + 1).padStart(2, '0')}</div>
                  <h3 className="mt-2 text-xl font-black text-white transition-colors group-hover:text-cyan-100">{module.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{module.text}</p>
                </div>
                <div className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[.035] text-white/[.35] transition-all duration-300 group-hover:border-white/[.35] group-hover:text-white group-hover:shadow-[0_0_22px_rgba(255,255,255,.18)]">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function AIWorkflowIntro() {
  return (
    <section id="ai-workflow" className="gl-home-section relative max-w-7xl mx-auto px-5 pt-20 md:pt-28">
      <div className="relative overflow-hidden rounded-[30px] border border-violet-300/25 bg-[#06071a]/[.48] backdrop-blur-2xl p-8 md:p-12 shadow-[0_0_55px_rgba(124,58,237,.15),inset_0_0_70px_rgba(59,130,246,.06)]">
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.10) 1px,transparent 1px)', backgroundSize: '38px 38px' }} />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs tracking-[.25em] text-cyan-300 mb-5"><Workflow className="h-4 w-4" /> ORCHESTRATED INTELLIGENCE</div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-[-.04em] leading-[.92]">
              MULTIPLE MODELS.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400">ONE EXECUTION CHAIN.</span>
            </h2>
            <p className="mt-6 max-w-3xl text-base md:text-lg leading-relaxed text-slate-300">
              GlyphLock assigns defined roles across research, coding, analysis, review and automation while people remain responsible for decisions, approvals and outcomes.
            </p>
          </div>
          <Link
            to={createPageUrl('DreamTeam')}
            className="gl-energy-button group inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/60 bg-violet-500/20 px-6 py-4 font-black text-violet-50 shadow-[0_0_32px_rgba(139,92,246,.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-violet-400/30 hover:shadow-[0_0_58px_rgba(139,92,246,.62)]"
          >
            OPEN DREAM TEAM <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CommandCTA() {
  return (
    <section id="start-project" className="gl-home-section max-w-7xl mx-auto px-5 py-12 md:py-20">
      <div className="relative overflow-hidden rounded-[32px] border border-cyan-200/[.35] bg-[#030714]/50 backdrop-blur-2xl px-6 py-12 md:px-12 md:py-16 shadow-[0_0_50px_rgba(34,211,238,.16),0_0_120px_rgba(124,58,237,.14),inset_0_0_70px_rgba(59,130,246,.07)]">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.09) 1px,transparent 1px)', backgroundSize: '38px 38px' }} />
        <motion.div animate={{ x: ['-30%', '130%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} className="absolute top-0 h-px w-[30%] bg-gradient-to-r from-transparent via-cyan-200 to-transparent shadow-[0_0_20px_#22d3ee]" />
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-blue-600/[.18] blur-[110px]" />
        <div className="absolute -bottom-40 left-[20%] h-80 w-80 rounded-full bg-violet-600/[.16] blur-[110px]" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/[.35] bg-emerald-400/[.08] px-4 py-2 font-mono text-[9px] md:text-[10px] tracking-[.22em] text-emerald-200 mb-5">
              <Rocket className="h-3.5 w-3.5" /> BUILD QUEUE // OPEN
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[.88] tracking-[-.045em]">
              BRING US THE
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400">HARD PROBLEM.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-slate-300">
              We design the interface, wire the integrations, build the workflow, deploy the system and stay with it after launch.
            </p>
          </div>
          <div className="flex min-w-[240px] flex-col gap-3">
            <Link to={createPageUrl('Consultation')} className="gl-energy-button group inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-50/80 bg-cyan-200 px-7 py-4 font-black text-slate-950 shadow-[0_0_34px_rgba(34,211,238,.60),0_0_90px_rgba(34,211,238,.22)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:bg-white hover:shadow-[0_0_60px_rgba(255,255,255,.75),0_0_130px_rgba(34,211,238,.35)]">
              <Sparkles className="h-4 w-4" /> START A PROJECT <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to={createPageUrl('Services')} className="gl-energy-button inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/[.45] bg-blue-500/[.12] px-7 py-4 font-black text-blue-100 shadow-[0_0_25px_rgba(59,130,246,.22)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-blue-200/70 hover:bg-blue-400/20 hover:shadow-[0_0_48px_rgba(59,130,246,.48)]">
              <Code2 className="h-4 w-4" /> EXPLORE SERVICES
            </Link>
            <Link to={createPageUrl('NUPSLanding')} className="gl-energy-button inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/50 bg-violet-500/[.14] px-7 py-4 font-black text-violet-100 shadow-[0_0_25px_rgba(139,92,246,.24)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-violet-200/75 hover:bg-violet-400/[.22] hover:shadow-[0_0_50px_rgba(139,92,246,.50)]">
              <Play className="h-4 w-4" /> EXPERIENCE NUPS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SEOHead
        title="GlyphLock — Custom Software, AI & Operations Systems"
        description="GlyphLock designs, builds, integrates, and operates custom software, AI-assisted workflows, websites, apps, and business systems. Explore NUPS and GlyphLock's working platform modules."
        keywords="GlyphLock, custom software, NUPS, software development, AI workflows, integrations, POS, QR verification"
        url="/"
      />

      <main className="gl-home min-h-screen overflow-hidden bg-transparent text-white">
        <GlyphHoverEngine />
        <style>{`
          html { scroll-behavior: smooth; }
          .gl-home {
            --font-display: 'Oxanium', 'Orbitron', system-ui, sans-serif;
            --font-body: 'Space Grotesk', 'Rajdhani', system-ui, sans-serif;
            --font-code: 'JetBrains Mono', ui-monospace, monospace;
            font-family: var(--font-body);
            font-synthesis: none;
            text-rendering: geometricPrecision;
          }
          .gl-home h1,
          .gl-home h2,
          .gl-home h3,
          .gl-home .font-black {
            font-family: var(--font-display);
            letter-spacing: -0.025em;
          }
          .gl-home .font-mono { font-family: var(--font-code); }
          .gl-home h1,
          .gl-home h2,
          .gl-home h3,
          .gl-home a,
          .gl-home button,
          .gl-home [data-glyph-hover] {
            position: relative;
            transition: color .18s ease, text-shadow .18s ease, filter .18s ease;
          }
          .gl-home [data-glyph-active='true'] {
            color: #e9fdff !important;
            text-shadow: 0 0 8px rgba(103,232,249,.82), 0 0 22px rgba(59,130,246,.62), 0 0 42px rgba(139,92,246,.42) !important;
            filter: saturate(1.18);
          }
          .gl-home [data-glyph-active='true']::before {
            content: '';
            position: absolute;
            left: var(--glyph-focus-x, 50%);
            top: 50%;
            width: 4.5em;
            height: 2.2em;
            transform: translate(-50%, -50%);
            pointer-events: none;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(34,211,238,.22), rgba(99,102,241,.12) 45%, transparent 72%);
            filter: blur(10px);
            mix-blend-mode: screen;
          }
          .gl-home-section { scroll-margin-top: 126px; }
          .gl-home-stage { position: relative; isolation: isolate; }
          .gl-home-stage::before {
            content: '';
            position: absolute;
            inset: 2% 1.5%;
            pointer-events: none;
            border: 1px solid rgba(34,211,238,.08);
            border-radius: 34px;
            mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          }
          .gl-cyber-panel {
            box-shadow: 0 0 28px color-mix(in srgb, var(--gl-accent) 18%, transparent), inset 0 0 58px color-mix(in srgb, var(--gl-accent) 7%, transparent);
          }
          .gl-cyber-panel:hover {
            border-color: color-mix(in srgb, var(--gl-accent) 60%, transparent);
            box-shadow: 0 0 48px color-mix(in srgb, var(--gl-accent) 30%, transparent), 0 0 100px color-mix(in srgb, var(--gl-accent) 12%, transparent), inset 0 0 70px color-mix(in srgb, var(--gl-accent) 10%, transparent);
          }
          .gl-energy-button { position: relative; overflow: hidden; isolation: isolate; }
          .gl-energy-button::after {
            content: '';
            position: absolute;
            inset: -2px;
            z-index: -1;
            transform: translateX(-120%) skewX(-18deg);
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.32), transparent);
            transition: transform .65s ease;
          }
          .gl-energy-button:hover::after { transform: translateX(120%) skewX(-18deg); }
          @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            .gl-energy-button::after { display: none; }
          }
        `}</style>

        <HeroSection />
        <CommandRail />

        <section id="flagship" className="gl-home-section gl-home-stage relative pt-6 md:pt-10">
          <FlagshipNUPSShowcase />
          <BuildStageRail />
        </section>

        <section className="relative border-y border-white/10 bg-black/10 py-3 backdrop-blur-sm">
          <FeaturedIntegrationsMarquee />
        </section>

        <CapabilityGrid />
        <PlatformUniverse />

        <AIWorkflowIntro />
        <section className="gl-home-stage relative py-8 md:py-12">
          <HomeDreamTeamCTA />
        </section>

        <section id="services" className="gl-home-section gl-home-stage relative py-8 md:py-14">
          <ServicesGrid />
        </section>

        <section className="gl-home-stage relative py-4 md:py-10">
          <PlatformCapabilities />
        </section>

        <section className="gl-home-stage relative py-8 md:py-12">
          <TechServicesPreview />
        </section>

        <section className="gl-home-stage relative py-8 md:py-12">
          <OnSiteServices />
        </section>

        <section className="relative py-5 md:py-10">
          <TechnologyMarquee />
        </section>

        <CommandCTA />
        <section className="pb-16 md:pb-24">
          <CTASection />
        </section>

        <a href="#top" aria-label="Back to top" className="fixed bottom-5 left-5 z-[80] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/30 bg-[#020713]/[.72] backdrop-blur-xl text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,.18)] transition-all hover:-translate-y-1 hover:border-cyan-200/[.65] hover:shadow-[0_0_38px_rgba(34,211,238,.4)]">
          <ChevronDown className="h-5 w-5 rotate-180" />
        </a>
      </main>
    </>
  );
}