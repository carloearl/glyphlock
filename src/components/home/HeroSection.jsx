import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Sparkles,
  QrCode,
  Bot,
  Building2,
  Image,
  DollarSign,
  Radio,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const ORIGINAL_VIDEO = 'https://base44.app/api/apps/6902128ac3c5c94a82446585/files/public/6902128ac3c5c94a82446585/643dc9ba3_Dec_05__2220_13s_202512052257_lc8rw.mp4';
const HERO_VIDEO = import.meta.env.VITE_GLYPHLOCK_HERO_VIDEO_URL || ORIGINAL_VIDEO;
const HERO_POSTER = 'https://base44.app/api/apps/697a087fb354faebb72df54b/files/public/697a087fb354faebb72df54b/hero-poster.jpg';
const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png';

const nodes = [
  { icon: Building2, label: 'NUPS', link: 'NUPSLanding', pos: 'left-[2%] top-[9%]', accent: '#22d3ee' },
  { icon: QrCode, label: 'QR STUDIO', link: 'Qr', pos: 'right-[1%] top-[11%]', accent: '#38bdf8' },
  { icon: Bot, label: 'GLYPHBOT', link: 'GlyphBot', pos: 'left-[-2%] top-[43%]', accent: '#818cf8' },
  { icon: Image, label: 'IMAGE LAB', link: 'ImageLab', pos: 'right-[-3%] top-[43%]', accent: '#d946ef' },
  { icon: DollarSign, label: 'FINANCIAL', link: 'GlyphLockFinancial', pos: 'left-[7%] bottom-[5%]', accent: '#10b981' },
  { icon: Radio, label: 'SECURITY', link: 'SecurityOperationsCenter', pos: 'right-[7%] bottom-[5%]', accent: '#f43f5e' },
  { icon: ShieldCheck, label: 'GOVERNANCE', link: 'GovernanceHub', pos: 'left-1/2 -translate-x-1/2 bottom-[-3%]', accent: '#8b5cf6' },
];

function PlatformMatrix() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, x: 45 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden lg:block h-[510px] w-full max-w-[510px] justify-self-end"
      aria-label="GlyphLock platform map"
    >
      <div className="absolute inset-[8%] rounded-full border border-cyan-300/20 bg-black/10 backdrop-blur-[2px] shadow-[0_0_80px_rgba(34,211,238,.10),inset_0_0_80px_rgba(124,58,237,.08)]" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[14%] rounded-full border border-dashed border-violet-300/28"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[22%] rounded-full border border-dashed border-cyan-300/30"
      />

      <div className="absolute left-1/2 top-1/2 h-[225px] w-[225px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[60px]" />
      <motion.div
        animate={{ scale: [1, 1.045, 1], filter: ['drop-shadow(0 0 18px rgba(34,211,238,.45))', 'drop-shadow(0 0 42px rgba(139,92,246,.75))', 'drop-shadow(0 0 18px rgba(34,211,238,.45))'] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/45 bg-[#020713]/65 backdrop-blur-2xl shadow-[0_0_45px_rgba(34,211,238,.28),0_0_110px_rgba(124,58,237,.20),inset_0_0_45px_rgba(59,130,246,.12)]"
      >
        <img src={LOGO} alt="GlyphLock platform core" className="h-24 w-24 object-contain" loading="eager" decoding="async" />
      </motion.div>

      <svg className="absolute inset-0 h-full w-full opacity-55" viewBox="0 0 510 510" aria-hidden="true">
        <defs>
          <linearGradient id="matrixLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="#60a5fa" stopOpacity="0.75" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {[
          [255, 255, 95, 80], [255, 255, 415, 85], [255, 255, 75, 250], [255, 255, 435, 250],
          [255, 255, 125, 420], [255, 255, 385, 420], [255, 255, 255, 475],
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line[0]}
            y1={line[1]}
            x2={line[2]}
            y2={line[3]}
            stroke="url(#matrixLine)"
            strokeWidth="1.2"
            strokeDasharray="7 9"
            animate={{ strokeDashoffset: [0, -32] }}
            transition={{ duration: 2.8 + i * 0.14, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>

      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1, y: [0, index % 2 === 0 ? -5 : 5, 0] }}
            transition={{ opacity: { delay: 0.55 + index * 0.08, duration: 0.45 }, scale: { delay: 0.55 + index * 0.08, duration: 0.45 }, y: { delay: index * 0.2, duration: 4 + index * 0.25, repeat: Infinity, ease: 'easeInOut' } }}
            className={`absolute ${node.pos}`}
          >
            <Link
              to={createPageUrl(node.link)}
              className="group flex items-center gap-2.5 rounded-xl border bg-[#020713]/68 px-3.5 py-3 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04]"
              style={{ borderColor: `${node.accent}55`, boxShadow: `0 0 22px ${node.accent}20, inset 0 0 22px ${node.accent}0d` }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border bg-black/25" style={{ borderColor: `${node.accent}45` }}>
                <Icon className="h-4 w-4" style={{ color: node.accent, filter: `drop-shadow(0 0 7px ${node.accent})` }} />
              </span>
              <span className="font-mono text-[9px] font-bold tracking-[.14em] text-slate-200 group-hover:text-white">{node.label}</span>
            </Link>
          </motion.div>
        );
      })}

      <div className="absolute left-1/2 top-[13%] -translate-x-1/2 rounded-full border border-cyan-300/20 bg-black/30 px-3 py-1.5 font-mono text-[8px] tracking-[.2em] text-cyan-200/70 backdrop-blur-xl">
        PLATFORM MATRIX // LIVE
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const [ready, setReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  return (
    <section id="top" className="relative flex min-h-[calc(100vh-64px)] w-full items-center overflow-hidden border-b border-cyan-300/15">
      <div className="absolute inset-0 z-0">
        {(!ready || videoError) && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_32%,rgba(79,70,229,.32),transparent_28%),radial-gradient(circle_at_30%_28%,rgba(6,182,212,.22),transparent_34%),linear-gradient(135deg,#02040d,#071126_48%,#050318)]" />
        )}
        {!videoError && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={HERO_POSTER}
            onCanPlay={() => setReady(true)}
            onLoadedData={() => setReady(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
            aria-label="GlyphLock platform cinematic hero"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,4,13,.96)_0%,rgba(1,4,13,.80)_36%,rgba(1,4,13,.38)_65%,rgba(1,4,13,.70)_100%)] lg:bg-[linear-gradient(90deg,rgba(1,4,13,.96)_0%,rgba(1,4,13,.79)_36%,rgba(1,4,13,.24)_70%,rgba(1,4,13,.54)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040d] via-transparent to-[#02040d]/62" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.13) 1px,transparent 1px)', backgroundSize: '50px 50px', maskImage: 'linear-gradient(to bottom,black,transparent 88%)' }} />
        <div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(255,255,255,.13) 4px)' }} />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent shadow-[0_0_26px_#22d3ee]" />
      <motion.div animate={{ x: ['-18%', '118%'] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} className="absolute top-[17%] z-10 h-px w-[30%] bg-gradient-to-r from-transparent via-cyan-200/85 to-transparent shadow-[0_0_20px_#22d3ee] pointer-events-none" />
      <motion.div animate={{ y: ['-15%', '115%'] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute left-[63%] z-10 h-[22%] w-px bg-gradient-to-b from-transparent via-violet-300/55 to-transparent shadow-[0_0_18px_#8b5cf6] pointer-events-none" />
      <div className="absolute right-[7%] top-[11%] z-10 h-80 w-80 rounded-full bg-violet-500/16 blur-[105px] pointer-events-none" />
      <div className="absolute left-[12%] bottom-[6%] z-10 h-64 w-64 rounded-full bg-cyan-500/12 blur-[100px] pointer-events-none" />

      <div className="relative z-20 mx-auto grid w-full max-w-[1480px] items-center gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.08fr_.72fr] lg:py-24 xl:px-12">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-black/35 px-4 py-2 font-mono text-[10px] tracking-[.22em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.25)] backdrop-blur-xl md:text-xs"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_#6ee7b7] animate-pulse" />
            GLYPHLOCK // PLATFORM ONLINE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 38 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl text-[clamp(3.5rem,8.6vw,8.7rem)] font-black leading-[.81] tracking-[-.058em] text-white drop-shadow-[0_10px_34px_rgba(0,0,0,.78)]"
          >
            BUILD.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-blue-400 to-violet-400">VERIFY.</span>
            <br />
            OPERATE.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.8 }}
            className="mt-7 max-w-2xl text-base leading-relaxed text-slate-200 drop-shadow-[0_4px_14px_rgba(0,0,0,.92)] md:text-xl"
          >
            GlyphLock builds the software layer between an idea and a working operation — custom systems, AI workflows, verification, integrations, financial tooling and the flagship NUPS platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.75 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to={createPageUrl('Consultation')}
              className="gl-energy-button group inline-flex items-center gap-2 rounded-xl border border-white/85 bg-cyan-100 px-7 py-4 font-black text-slate-950 shadow-[0_0_34px_rgba(34,211,238,.68),0_0_100px_rgba(34,211,238,.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.045] hover:bg-white hover:shadow-[0_0_60px_rgba(255,255,255,.82),0_0_140px_rgba(34,211,238,.38)]"
            >
              <Sparkles className="h-4 w-4" /> BUILD WITH GLYPHLOCK <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={createPageUrl('NUPSLanding')}
              className="gl-energy-button group inline-flex items-center gap-2 rounded-xl border border-violet-300/75 bg-violet-500/24 px-7 py-4 font-black text-violet-50 shadow-[0_0_30px_rgba(139,92,246,.48),0_0_85px_rgba(139,92,246,.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:bg-violet-400/35 hover:shadow-[0_0_55px_rgba(139,92,246,.72)]"
            >
              <Play className="h-4 w-4" /> EXPERIENCE NUPS
            </Link>
            <a
              href="#platform-universe"
              className="gl-energy-button group inline-flex items-center gap-2 rounded-xl border border-blue-200/35 bg-blue-400/10 px-6 py-4 font-black text-blue-100 shadow-[0_0_24px_rgba(59,130,246,.24)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.035] hover:border-blue-200/70 hover:bg-blue-400/20 hover:shadow-[0_0_48px_rgba(59,130,246,.48)]"
            >
              EXPLORE PLATFORM <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] tracking-[.17em] text-slate-400 md:text-[10px]"
          >
            <span><b className="text-cyan-300">01</b> CUSTOM SOFTWARE</span>
            <span><b className="text-blue-300">02</b> AI WORKFLOWS</span>
            <span><b className="text-violet-300">03</b> OPERATIONS SYSTEMS</span>
          </motion.div>
        </div>

        <PlatformMatrix />
      </div>

      <a href="#flagship" aria-label="Scroll to the GlyphLock flagship platform" className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[8px] tracking-[.22em] text-cyan-100/65 transition-colors hover:text-cyan-100">
        ENTER SYSTEM
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/25 bg-black/30 backdrop-blur-xl shadow-[0_0_22px_rgba(34,211,238,.16)]">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </a>
    </section>
  );
}
