import React from "react";
import { motion } from "framer-motion";

/**
 * Shared ambient section wrapper for all Financial page sections.
 * Gives every section the same alive feel as the hero:
 * - Emerald-to-black gradient bg
 * - Pulsing gold grid overlay
 * - Floating glow orbs (green + gold/orange)
 * - Grid lines
 */
export default function FinancialSectionShell({ children, orbSeed = 0 }) {
  // Vary orb positions/timings per section so they don't look identical
  const offsets = [
    { x: '15%', y: '20%', size: 350, color: 'rgba(16,185,129,0.25)', dur: 5, delay: 0 },
    { x: '75%', y: '60%', size: 300, color: 'rgba(234,179,8,0.2)', dur: 7, delay: 1.5 },
    { x: '50%', y: '80%', size: 250, color: 'rgba(249,115,22,0.15)', dur: 6, delay: 3 },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: 'transparent' }}>
      {/* Base gradient — matches hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/30 to-transparent pointer-events-none" />

      {/* Static grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px'
      }} />

      {/* Animated gold/orange grid pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.02, 0.06, 0.02] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: orbSeed * 0.5 }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(249,115,22,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,179,8,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Floating glow orbs */}
      {offsets.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: o.x,
            top: o.y,
            width: o.size + orbSeed * 20,
            height: o.size + orbSeed * 20,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            filter: 'blur(60px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.22, 0.08],
          }}
          transition={{
            duration: o.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: o.delay + orbSeed * 0.3,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 py-20 md:py-28">
        {children}
      </div>
    </section>
  );
}