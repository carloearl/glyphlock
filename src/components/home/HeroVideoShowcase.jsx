import React from 'react';

const SHOWCASE_VIDEO = 'https://base44.app/api/apps/6902128ac3c5c94a82446585/files/public/6902128ac3c5c94a82446585/643dc9ba3_Dec_05__2220_13s_202512052257_lc8rw.mp4';

export default function HeroVideoShowcase() {
  return (
    <section id="hero-video" className="relative w-full border-b border-cyan-300/[.15] bg-[#02040d] py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1240px] px-5 md:px-8">
        <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[.22em] text-cyan-200/70">
          <span className="h-px w-10 bg-cyan-300/60" />
          GLYPHLOCK // SYSTEM REEL
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-black shadow-[0_0_60px_rgba(34,211,238,.18)]">
          <video
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-auto w-full object-cover"
            aria-label="GlyphLock platform showcase video"
          >
            <source src={SHOWCASE_VIDEO} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}