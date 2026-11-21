import React from "react";

/**
 * Glyph's face: a slowly turning prism ring around a dark core with the glyph mark.
 * Pure CSS/SVG, no images. Motion stops under prefers-reduced-motion.
 */
export default function GlyphOrb({ size = 56, pulse = false }) {
  return (
    <span
      className={`glyph-orb${pulse ? " glyph-orb--pulse" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <style>{`
        .glyph-orb { position: relative; display: inline-block; border-radius: 9999px; flex-shrink: 0; }
        .glyph-orb::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit;
          background: conic-gradient(from 0deg, #22d3ee, #6366f1, #a855f7, #ec4899, #f59e0b, #22d3ee);
          animation: glyphSpin 6s linear infinite;
          box-shadow: 0 0 18px rgba(34,211,238,.45), 0 0 36px rgba(168,85,247,.3);
        }
        .glyph-orb > .glyph-core {
          position: absolute; inset: 9%; border-radius: inherit;
          background: radial-gradient(circle at 35% 30%, #1e2a52 0%, #0a0f24 70%);
          display: flex; align-items: center; justify-content: center;
        }
        .glyph-orb--pulse::after {
          content: ""; position: absolute; inset: -6px; border-radius: inherit;
          border: 2px solid rgba(34,211,238,.55); animation: glyphPulse 2.4s ease-out infinite;
        }
        @keyframes glyphSpin { to { transform: rotate(360deg); } }
        @keyframes glyphPulse { 0% { transform: scale(.9); opacity: .9; } 100% { transform: scale(1.25); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .glyph-orb::before, .glyph-orb--pulse::after { animation: none; }
        }
      `}</style>
      <span className="glyph-core">
        <svg viewBox="0 0 24 24" width="52%" height="52%" fill="none" stroke="url(#glyphMarkGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="glyphMarkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#67e8f9" />
              <stop offset="1" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
          <path d="M18 7.5A7 7 0 1 0 19 13h-6.5" />
          <path d="M12 9.5v5" />
        </svg>
      </span>
    </span>
  );
}
