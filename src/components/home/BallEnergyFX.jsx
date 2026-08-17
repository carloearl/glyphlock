import React from 'react';
import { motion } from 'framer-motion';

const ROLES = ['ALFRED', 'CLAUDE', 'GEMINI', 'COPILOT', 'PERPLEXITY', 'CURSOR'];

/**
 * Electric energy rig around the Dream Team ball.
 * Ambient arcs + sparks always run; the role ring only appears on hover
 * of the parent `group` element.
 */
export default function BallEnergyFX() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 3 }} aria-hidden="true">
      {/* Electric sweep arcs */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[12%] rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, rgba(34,211,238,.85), transparent 18%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 62%, black 64%, black 68%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 62%, black 64%, black 68%, transparent 70%)',
          filter: 'drop-shadow(0 0 12px #22d3ee)',
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[2%] rounded-full"
        style={{
          background: 'conic-gradient(from 140deg, rgba(217,70,239,.8), transparent 14%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 66%, black 68%, black 71%, transparent 73%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 66%, black 68%, black 71%, transparent 73%)',
          filter: 'drop-shadow(0 0 14px #d946ef)',
        }}
      />

      {/* Breathing containment rings */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[16%] rounded-full border border-cyan-200/50 shadow-[0_0_40px_rgba(34,211,238,.35)_inset]"
      />
      <motion.div
        animate={{ scale: [1.04, 0.98, 1.04], opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[4%] rounded-full border border-dashed border-violet-200/40"
      />

      {/* Orbiting sparks */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div
          key={deg}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 7 + i, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
          style={{ transform: `rotate(${deg}deg)` }}
        >
          <motion.span
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.4, 0.7] }}
            transition={{ duration: 1.6 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-1/2 top-[9%] h-2 w-2 -translate-x-1/2 rounded-full"
            style={{
              background: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#d946ef',
              boxShadow: '0 0 16px currentColor',
              color: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#d946ef',
            }}
          />
        </motion.div>
      ))}

      {/* HIDDEN UNTIL HOVER — role ring reveals around the ball */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        {ROLES.map((role, i) => (
          <div
            key={role}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{ transform: `rotate(${i * 60}deg) translateY(-196px)` }}
          >
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-cyan-200/60 bg-black/80 px-3 py-1 font-mono text-[9px] font-black tracking-[.22em] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.55)] backdrop-blur-md"
              style={{ transform: `translate(-50%,-50%) rotate(${-i * 60}deg)` }}
            >
              {role}
            </span>
          </div>
        ))}
      </motion.div>

      {/* HIDDEN UNTIL HOVER — charge burst */}
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,.35),rgba(124,58,237,.22)_55%,transparent_72%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}