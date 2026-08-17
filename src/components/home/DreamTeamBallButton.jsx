import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import BallEnergyFX from '@/components/home/BallEnergyFX';

/**
 * The Dream Team ball IS the call to action.
 * Compact, self-contained, and safe to drop into any section.
 */
export default function DreamTeamBallButton() {
  const reduceMotion = useReducedMotion();

  return (
    <Link to={createPageUrl('DreamTeam')} className="group block" aria-label="Meet the Dream Team">
      <motion.div
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 20 }}
        className="relative flex flex-col items-center cursor-pointer will-change-transform"
        style={{ isolation: 'isolate', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            zIndex: 2,
            background: 'radial-gradient(circle, rgba(79,70,229,0.5) 0%, rgba(65,105,225,0.28) 42%, transparent 68%)',
            filter: 'blur(34px)',
          }}
        />

        <BallEnergyFX />

        <motion.img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/48ca17dba_c44b0deb.png"
          alt="Meet the Dream Team"
          animate={reduceMotion ? { y: 0 } : { y: [0, -5, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-48 sm:w-56 md:w-64 h-auto will-change-transform dream-team-logo-glow transition-[filter] duration-700 group-hover:[filter:drop-shadow(0_0_26px_rgba(34,211,238,.9))_drop-shadow(0_0_52px_rgba(217,70,239,.6))_saturate(1.4)]"
          style={{ zIndex: 100 }}
          loading="lazy"
          decoding="async"
          draggable="false"
        />

        <motion.p
          animate={reduceMotion ? { opacity: 0.85 } : { opacity: [0.55, 1, 0.55] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mt-3 text-center text-white text-sm md:text-base font-black uppercase tracking-[0.22em] drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          style={{ zIndex: 100 }}
        >
          Take the shot
        </motion.p>
        <p
          className="relative mt-1 text-center font-mono text-[9px] md:text-[10px] tracking-[.2em] text-cyan-200/80"
          style={{ zIndex: 100 }}
        >
          SEE WHO PLAYS EACH POSITION →
        </p>
      </motion.div>
    </Link>
  );
}