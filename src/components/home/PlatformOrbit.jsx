import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Bot, Building2, Image, DollarSign, Radio, ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/d92107808_glyphlock-3d-logo.png';

const ORBIT_SECONDS = 54;
const RADIUS = 196;

const nodes = [
  { icon: Building2, label: 'NUPS', link: 'NUPSLanding', accent: '#22d3ee' },
  { icon: QrCode, label: 'QR STUDIO', link: 'Qr', accent: '#38bdf8' },
  { icon: Image, label: 'IMAGE LAB', link: 'ImageLab', accent: '#d946ef' },
  { icon: Radio, label: 'SECURITY', link: 'SecurityOperationsCenter', accent: '#f43f5e' },
  { icon: ShieldCheck, label: 'GOVERNANCE', link: 'GovernanceHub', accent: '#8b5cf6' },
  { icon: DollarSign, label: 'FINANCIAL', link: 'GlyphLockFinancial', accent: '#10b981' },
  { icon: Bot, label: 'GLYPHBOT', link: 'GlyphBot', accent: '#818cf8' },
];

export default function PlatformOrbit() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="gl-orbit relative hidden lg:block h-[560px] w-full max-w-[560px] justify-self-end"
      aria-label="GlyphLock platform orbit"
    >
      {/* Deep field glow */}
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,.10),rgba(124,58,237,.08)_55%,transparent_72%)] blur-[2px]" />

      {/* Orbit rings */}
      <div className="absolute left-1/2 top-1/2 h-[392px] w-[392px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/[.18]" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 h-[392px] w-[392px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet-300/25"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 h-[268px] w-[268px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/[.28]"
      />

      {/* Sweeping radar arc */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 h-[392px] w-[392px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'conic-gradient(from 0deg, rgba(34,211,238,.20), transparent 22%, transparent 100%)', maskImage: 'radial-gradient(circle, transparent 44%, black 46%, black 50%, transparent 52%)' }}
      />

      {/* Core */}
      <div className="absolute left-1/2 top-1/2 z-20 h-0 w-0">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-0 w-0 items-center justify-center"
        >
          <div className="absolute h-56 w-56 flex-shrink-0 rounded-full bg-cyan-400/[.16] blur-[70px]" />
          <Link
            to={createPageUrl('NUPSLanding')}
            className="group relative flex h-40 w-40 flex-shrink-0 flex-col items-center justify-center rounded-full border border-cyan-100/50 bg-[#020713]/[.72] backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,.32),0_0_130px_rgba(124,58,237,.24),inset_0_0_50px_rgba(59,130,246,.14)] transition-all duration-300 hover:scale-[1.05] hover:border-cyan-100/90 hover:shadow-[0_0_80px_rgba(34,211,238,.55),0_0_170px_rgba(124,58,237,.35)]"
          >
            <img src={LOGO} alt="GlyphLock core" className="h-24 w-24 object-contain drop-shadow-[0_0_22px_rgba(34,211,238,.55)]" loading="eager" decoding="async" />
            <span className="mt-0.5 font-mono text-[8px] tracking-[.24em] text-cyan-200/80 group-hover:text-cyan-100">ENTER CORE</span>
          </Link>
        </motion.div>
      </div>

      {/* Orbiting module nodes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: ORBIT_SECONDS, repeat: Infinity, ease: 'linear' }}
        className="gl-orbit-track absolute inset-0"
      >
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const angle = (360 / nodes.length) * index;
          return (
            <div
              key={node.label}
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{ transform: `rotate(${angle}deg) translateY(-${RADIUS}px)` }}
            >
              <motion.div
                animate={{ rotate: [-angle, -angle - 360] }}
                transition={{ duration: ORBIT_SECONDS, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 top-0 flex h-0 w-0 items-center justify-center"
              >
                <Link
                  to={createPageUrl(node.link)}
                  className="group flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border bg-[#020713]/[.82] px-3 py-2 backdrop-blur-2xl transition-all duration-300 hover:scale-[1.09]"
                  style={{ borderColor: `${node.accent}66`, boxShadow: `0 0 22px ${node.accent}28, inset 0 0 18px ${node.accent}0f` }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-black/40" style={{ borderColor: `${node.accent}55` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: node.accent, filter: `drop-shadow(0 0 7px ${node.accent})` }} />
                  </span>
                  <span className="font-mono text-[9px] font-bold tracking-[.14em] text-slate-200 group-hover:text-white">{node.label}</span>
                </Link>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      <div className="absolute left-1/2 top-[1%] -translate-x-1/2 rounded-full border border-cyan-300/25 bg-black/40 px-3 py-1.5 font-mono text-[8px] tracking-[.2em] text-cyan-200/75 backdrop-blur-xl">
        PLATFORM MATRIX // LIVE
      </div>

      <style>{`
        .gl-orbit:hover .gl-orbit-track,
        .gl-orbit:hover .gl-orbit-track * { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .gl-orbit .gl-orbit-track { animation: none !important; }
        }
      `}</style>
    </motion.div>
  );
}