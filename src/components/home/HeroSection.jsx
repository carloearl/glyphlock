import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, ChevronDown } from 'lucide-react';
import { createPageUrl } from '@/utils';
import PlatformOrbit from '@/components/home/PlatformOrbit';

const ORIGINAL_VIDEO = 'https://base44.app/api/apps/6902128ac3c5c94a82446585/files/public/6902128ac3c5c94a82446585/643dc9ba3_Dec_05__2220_13s_202512052257_lc8rw.mp4';
const HERO_VIDEO = import.meta.env.VITE_GLYPHLOCK_HERO_VIDEO_URL || ORIGINAL_VIDEO;
const HERO_POSTER = 'https://base44.app/api/apps/697a087fb354faebb72df54b/files/public/697a087fb354faebb72df54b/hero-poster.jpg';
export default function HeroSection() {
  const [ready, setReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  return (
    <section id="top" data-build="GLX-HOME-CINEMATIC-R3" className="relative flex min-h-[calc(100vh-64px)] w-full items-center overflow-hidden border-b border-cyan-300/[.15]">
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
            className={`absolute inset-0 h-full w-full scale-[1.12] object-cover object-center transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
            aria-label="GlyphLock platform cinematic hero"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        )}

        {/* Covers the generator watermark in the bottom-right of the source clip */}
        <div className="absolute bottom-0 right-0 h-24 w-56 bg-[#02040d]" />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,4,13,.96)_0%,rgba(1,4,13,.80)_36%,rgba(1,4,13,.38)_65%,rgba(1,4,13,.70)_100%)] lg:bg-[linear-gradient(90deg,rgba(1,4,13,.96)_0%,rgba(1,4,13,.79)_36%,rgba(1,4,13,.24)_70%,rgba(1,4,13,.54)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040d] via-transparent to-[#02040d]/[.62]" />
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.13) 1px,transparent 1px)', backgroundSize: '50px 50px', maskImage: 'linear-gradient(to bottom,black,transparent 88%)' }} />
        <div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(255,255,255,.13) 4px)' }} />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent shadow-[0_0_26px_#22d3ee]" />
      <motion.div animate={{ x: ['-18%', '118%'] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} className="absolute top-[17%] z-10 h-px w-[30%] bg-gradient-to-r from-transparent via-cyan-200/[.85] to-transparent shadow-[0_0_20px_#22d3ee] pointer-events-none" />
      <motion.div animate={{ y: ['-15%', '115%'] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute left-[63%] z-10 h-[22%] w-px bg-gradient-to-b from-transparent via-violet-300/[.55] to-transparent shadow-[0_0_18px_#8b5cf6] pointer-events-none" />
      <div className="absolute right-[7%] top-[11%] z-10 h-80 w-80 rounded-full bg-violet-500/[.16] blur-[105px] pointer-events-none" />
      <div className="absolute left-[12%] bottom-[6%] z-10 h-64 w-64 rounded-full bg-cyan-500/[.12] blur-[100px] pointer-events-none" />

      <div className="relative z-20 mx-auto grid w-full max-w-[1480px] items-center gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.08fr_.72fr] lg:py-24 xl:px-12">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/[.45] bg-black/[.35] px-4 py-2 font-mono text-[10px] tracking-[.22em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.25)] backdrop-blur-xl md:text-xs"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_#6ee7b7] animate-pulse" />
            GLYPHLOCK // PLATFORM ONLINE // R3
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
              className="gl-energy-button group inline-flex items-center gap-2 rounded-xl border border-white/[.85] bg-cyan-100 px-7 py-4 font-black text-slate-950 shadow-[0_0_34px_rgba(34,211,238,.68),0_0_100px_rgba(34,211,238,.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.045] hover:bg-white hover:shadow-[0_0_60px_rgba(255,255,255,.82),0_0_140px_rgba(34,211,238,.38)]"
            >
              <Sparkles className="h-4 w-4" /> BUILD WITH GLYPHLOCK <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={createPageUrl('NUPSLanding')}
              className="gl-energy-button group inline-flex items-center gap-2 rounded-xl border border-violet-300/75 bg-violet-500/[.24] px-7 py-4 font-black text-violet-50 shadow-[0_0_30px_rgba(139,92,246,.48),0_0_85px_rgba(139,92,246,.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:bg-violet-400/[.35] hover:shadow-[0_0_55px_rgba(139,92,246,.72)]"
            >
              <Play className="h-4 w-4" /> EXPERIENCE NUPS
            </Link>
            <a
              href="#platform-universe"
              className="gl-energy-button group inline-flex items-center gap-2 rounded-xl border border-blue-200/[.35] bg-blue-400/10 px-6 py-4 font-black text-blue-100 shadow-[0_0_24px_rgba(59,130,246,.24)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.035] hover:border-blue-200/70 hover:bg-blue-400/20 hover:shadow-[0_0_48px_rgba(59,130,246,.48)]"
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

        <PlatformOrbit />
      </div>

      <a href="#flagship" aria-label="Scroll to the GlyphLock flagship platform" className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[8px] tracking-[.22em] text-cyan-100/[.65] transition-colors hover:text-cyan-100">
        ENTER SYSTEM
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/25 bg-black/30 backdrop-blur-xl shadow-[0_0_22px_rgba(34,211,238,.16)]">
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </a>
    </section>
  );
}