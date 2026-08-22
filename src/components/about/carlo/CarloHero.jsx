import React from "react";

export default function CarloHero() {
  return (
    <section className="w-full max-w-6xl mb-16">
      <div
        className="relative rounded-[2.5rem] overflow-hidden px-8 sm:px-16 py-16 sm:py-20"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(49, 46, 129, 0.15) 100%)',
          border: '2px solid rgba(59, 130, 246, 0.45)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 90px rgba(59, 130, 246, 0.45)'
        }}
      >
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-blue-600/30 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-indigo-600/30 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-7 text-center">
          <div className="inline-block px-6 py-2 rounded-full bg-blue-500/20 border border-blue-400/50">
            <span className="text-xs sm:text-sm tracking-[0.4em] uppercase text-blue-200 font-bold">
              This Is Not a Resume
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Carlo René Earl
          </h1>

          <p className="text-lg sm:text-xl text-blue-200 font-semibold">
            Founder, Owner, CEO and DACO<sup className="text-blue-300">1</sup> — GlyphLock LLC
          </p>

          <p className="max-w-3xl text-lg sm:text-xl text-blue-100/90 leading-relaxed font-light">
            The problem was learned inside real venue operations. The solution was proven
            with a working system in a live venue environment. This page is the record of
            how one led to the other.
          </p>

          <p className="text-xs text-blue-300/70 max-w-2xl">
            <sup>1</sup> DACO — Directing Architectural Control Officer, the internal role that
            holds final authority over architecture and governance decisions at GlyphLock.
          </p>
        </div>
      </div>
    </section>
  );
}