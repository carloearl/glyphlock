import React from "react";

export default function IntroHeader() {
  return (
    <div className="w-full text-center pt-6 sm:pt-10 pb-4 px-4 max-w-4xl mx-auto">
      <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">
        GlyphLock · Custom Software Studio
      </p>

      <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
        Custom Software, Built Around How You Actually Work.
      </h2>
    </div>
  );
}