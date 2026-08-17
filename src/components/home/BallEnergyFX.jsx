import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const MODELS = [
  { name: 'Alfred', logo: 'https://cdn.simpleicons.org/openai/ffffff' },
  { name: 'Claude', logo: 'https://cdn.simpleicons.org/anthropic/ffffff' },
  { name: 'Gemini', logo: 'https://cdn.simpleicons.org/googlegemini/ffffff' },
  { name: 'Copilot', logo: 'https://cdn.simpleicons.org/githubcopilot/ffffff' },
  { name: 'Perplexity', logo: 'https://cdn.simpleicons.org/perplexity/ffffff' },
  { name: 'Cursor', logo: 'https://cdn.simpleicons.org/cursor/ffffff' },
];

/**
 * Electric energy rig around the Dream Team ball.
 * Ambient arcs + sparks always run; the role ring only appears on hover
 * of the parent `group` element.
 */
export default function BallEnergyFX() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 3 }} aria-hidden="true">
      {/* ATMOSPHERIC NEBULA ORB — drifting plumes behind the ball */}
      <motion.div
        animate={reduceMotion ? { scale: 1, opacity: 0.65 } : { scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[8%] rounded-full blur-[38px]"
        style={{
          background:
            'radial-gradient(circle at 38% 34%, rgba(34,211,238,.55), transparent 46%), radial-gradient(circle at 68% 62%, rgba(217,70,239,.45), transparent 48%), radial-gradient(circle at 52% 50%, rgba(99,102,241,.55), transparent 62%)',
        }}
      />
      <motion.div
        animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 34, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[14%] rounded-full blur-[26px] opacity-70 mix-blend-screen"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(34,211,238,.30), rgba(129,140,248,.28), rgba(217,70,239,.30), rgba(34,211,238,.30))',
        }}
      />
      <motion.div
        animate={reduceMotion ? { rotate: 0, scale: 1 } : { rotate: -360, scale: [1.02, 0.96, 1.02] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[22%] rounded-full blur-[18px] opacity-60 mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at 30% 70%, rgba(124,58,237,.55), transparent 55%), radial-gradient(circle at 74% 30%, rgba(56,189,248,.5), transparent 55%)',
        }}
      />

      {/* Electric sweep arcs */}
      <motion.div
        animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[12%] rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, rgba(34,211,238,.85), transparent 18%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 62%, black 64%, black 68%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 62%, black 64%, black 68%, transparent 70%)',
          filter: 'drop-shadow(0 0 12px #22d3ee)',
        }}
      />
      <motion.div
        animate={reduceMotion ? { rotate: 0 } : { rotate: -360 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 9, repeat: Infinity, ease: 'linear' }}
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
        animate={reduceMotion ? { scale: 1, opacity: 0.5 } : { scale: [1, 1.06, 1], opacity: [0.35, 0.75, 0.35] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[16%] rounded-full border border-cyan-200/50 shadow-[0_0_40px_rgba(34,211,238,.35)_inset]"
      />
      <motion.div
        animate={reduceMotion ? { scale: 1, opacity: 0.35 } : { scale: [1.04, 0.98, 1.04], opacity: [0.2, 0.55, 0.2] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-[4%] rounded-full border border-dashed border-violet-200/40"
      />

      {/* Orbiting sparks. The outer wrapper owns each fixed angular offset,
          while Framer only owns the inner orbit. This preserves the six-point
          distribution when reduced motion freezes the animation. */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={deg}
          className="absolute inset-0"
          style={{ transform: `rotate(${deg}deg)` }}
        >
          <motion.div
            animate={reduceMotion ? { rotate: 0 } : { rotate: i % 2 === 0 ? 360 : -360 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 7 + i, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <motion.span
              animate={reduceMotion ? { opacity: 0.65, scale: 1 } : { opacity: [0.25, 1, 0.25], scale: [0.7, 1.4, 0.7] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1.6 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/2 top-[9%] h-2 w-2 -translate-x-1/2 rounded-full"
              style={{
                background: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#d946ef',
                boxShadow: '0 0 16px currentColor',
                color: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#d946ef',
              }}
            />
          </motion.div>
        </div>
      ))}

      {/* HIDDEN UNTIL HOVER — role ring reveals around the ball */}
      <motion.div
        animate={reduceMotion ? { rotate: 0 } : { rotate: 360 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 26, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        {MODELS.map((m, i) => (
          <div
            key={m.name}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{ transform: `rotate(${i * 60}deg) translateY(-176px)` }}
          >
            <span
              className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/60 bg-black/80 shadow-[0_0_22px_rgba(34,211,238,.55)] backdrop-blur-md"
              style={{ transform: `translate(-50%,-50%) rotate(${-i * 60}deg)` }}
              title={m.name}
            >
              <img
                src={m.logo}
                alt={m.name}
                className="h-5 w-5 object-contain"
                loading="lazy"
                draggable="false"
                onError={(e) => {
                  e.currentTarget.replaceWith(
                    Object.assign(document.createElement('span'), {
                      className: 'font-mono text-[9px] font-black tracking-widest text-cyan-100',
                      textContent: m.name.slice(0, 3).toUpperCase(),
                    })
                  );
                }}
              />
            </span>
          </div>
        ))}
      </motion.div>

      {/* HOVER — expanding shockwave rings */}
      <div className={`absolute inset-[20%] rounded-full border-2 border-cyan-200/70 opacity-0 ${reduceMotion ? "group-hover:opacity-70" : "group-hover:animate-ping group-hover:opacity-100"}`} />
      <div className={`absolute inset-[26%] rounded-full border border-fuchsia-300/70 opacity-0 ${reduceMotion ? "group-hover:opacity-60" : "[animation-delay:.35s] group-hover:animate-ping group-hover:opacity-100"}`} />

      {/* HOVER — chromatic split halo */}
      <div className="absolute inset-[10%] rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-90 mix-blend-screen"
        style={{ background: 'radial-gradient(circle at 44% 46%, rgba(34,211,238,.5), transparent 52%), radial-gradient(circle at 58% 56%, rgba(255,60,180,.45), transparent 52%)' }}
      />

      {/* HIDDEN UNTIL HOVER — charge burst */}
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,.35),rgba(124,58,237,.22)_55%,transparent_72%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}