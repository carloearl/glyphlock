import React from 'react';
import { motion } from 'framer-motion';

/**
 * Soft volumetric "cloud orb" that wraps the hero core button.
 * Purely decorative — never intercepts clicks on the core link.
 */
export default function CoreCloudOrb() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-0 w-0" aria-hidden="true">
      {/* Outer breathing haze */}
      <motion.div
        animate={{ scale: [1, 1.14, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,.22), rgba(124,58,237,.18) 48%, transparent 72%)' }}
      />

      {/* Rolling cloud puffs */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        className="absolute h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px] opacity-70"
        style={{ background: 'radial-gradient(circle at 30% 35%, rgba(103,232,249,.34), transparent 42%), radial-gradient(circle at 72% 62%, rgba(167,139,250,.30), transparent 44%), radial-gradient(circle at 55% 22%, rgba(255,255,255,.16), transparent 38%)' }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute h-[268px] w-[268px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[34px] opacity-75"
        style={{ background: 'radial-gradient(circle at 68% 38%, rgba(59,130,246,.36), transparent 44%), radial-gradient(circle at 32% 70%, rgba(232,121,249,.26), transparent 42%)' }}
      />

      {/* Inner luminous shell */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[22px]"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,.20), rgba(34,211,238,.24) 40%, transparent 68%)' }}
      />
    </div>
  );
}