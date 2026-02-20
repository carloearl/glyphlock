import React from "react";

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

      {/* Gold grid pulse — CSS-only */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(234,179,8,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,179,8,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: `fin-grid-pulse ${5 + orbSeed * 0.4}s ease-in-out infinite`,
        }}
      />
      <style>{`
        @keyframes fin-grid-pulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.07; }
        }
      `}</style>

      {/* Glow orbs — CSS-only, no JS animation on load */}
      {orbs.map((o, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: o.x, top: o.y,
            width: o.size + orbSeed * 15,
            height: o.size + orbSeed * 15,
            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
            filter: 'blur(70px)',
            transform: 'translate(-50%, -50%)',
            opacity: 0.12,
            willChange: 'opacity',
            animation: `fin-orb-pulse ${o.dur}s ease-in-out infinite ${o.delay + orbSeed * 0.3}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes fin-orb-pulse {
          0%, 100% { opacity: 0.06; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.25); }
        }
      `}</style>

      {/* Content — tighter padding */}
      <div className="relative z-10 py-10 md:py-14">
        {children}
      </div>
    </section>
  );
}