import React from "react";
import { motion } from "framer-motion";

export default function FinancialSectionShell({ children, orbSeed = 0 }) {
  const orbs = [
    { x: '20%', y: '30%', size: 300, color: 'rgba(234,179,8,0.15)', dur: 6, delay: 0 },
    { x: '80%', y: '50%', size: 250, color: 'rgba(249,115,22,0.12)', dur: 7, delay: 2 },
    { x: '50%', y: '70%', size: 200, color: 'rgba(16,185,129,0.1)', dur: 8, delay: 3 },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Match hero: emerald-to-black gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-black to-emerald-950/40 pointer-events-none" />

      {/* Grid lines matching hero */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      {/* Gold grid pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.02, 0.07, 0.02] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: orbSeed * 0.4 }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(234,179,8,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,179,8,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Glow orbs */}
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: o.x, top: o.y,
            width: o.size + orbSeed * 15,
            height: o.size + orbSeed * 15,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            filter: 'blur(70px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.06, 0.2, 0.06] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut", delay: o.delay + orbSeed * 0.3 }}
        />
      ))}

      {/* Content — tighter padding */}
      <div className="relative z-10 py-10 md:py-14">
        {children}
      </div>
    </section>
  );
}