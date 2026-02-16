import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

const GLYPHS = '⌬⏣◈◇⬡⎔⏢⬢△▽◻◆⬠⏥⎊⏧⌖⌗⍟⍙⍡⎈⎋⎍';

const QUOTE = `"We didn't wait for permission. We didn't ask for funding. We built it from nothing — and we own every line."`;
const ATTRIBUTION = '— GlyphLock Founding Protocol · Bootstrapped Since Day One';
const HIGHLIGHT_START = QUOTE.indexOf('and we own every line.');

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export default function GlyphScramble() {
  const [revealed, setRevealed] = useState(false);
  const hasRevealed = useRef(false);

  // Static glyph per character — computed once
  const glyphMap = useMemo(() => {
    const rng = seededRng(42);
    return QUOTE.split('').map(() => GLYPHS[Math.floor(rng() * GLYPHS.length)]);
  }, []);

  // Stagger: each char resolves 30ms after the previous
  const totalRevealMs = QUOTE.length * 30;

  return (
    <div
      className="relative w-full max-w-3xl mx-auto cursor-pointer select-none"
      onMouseEnter={() => { setRevealed(true); hasRevealed.current = true; }}
      onMouseLeave={() => {}}
      onTouchStart={() => { if (!hasRevealed.current) { setRevealed(true); hasRevealed.current = true; } }}
      role="button"
      tabIndex={0}
      aria-label="Hover to reveal the GlyphLock founding quote"
      onFocus={() => { setRevealed(true); hasRevealed.current = true; }}
      onBlur={() => {}}
      style={{ minHeight: '100px' }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl transition-all duration-1000"
        style={{
          background: revealed
            ? 'radial-gradient(ellipse at center, rgba(87,61,255,0.1) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(79,70,229,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Characters */}
      <div className="relative z-10 py-4 px-2 text-center text-sm sm:text-base md:text-lg leading-relaxed italic">
        {QUOTE.split('').map((char, i) => {
          if (char === ' ') return <span key={i}>&nbsp;</span>;

          const isHighlight = i >= HIGHLIGHT_START;
          const delay = i * 0.03;

          return (
            <motion.span
              key={i}
              className="inline-block"
              initial={false}
              animate={revealed ? 'english' : 'glyph'}
              variants={{
                glyph: {
                  opacity: 1,
                  transition: { duration: 0.2, delay: 0 }
                },
                english: {
                  opacity: 1,
                  transition: { duration: 0.15, delay }
                }
              }}
              style={{ willChange: 'auto' }}
            >
              <motion.span
                className="inline-block"
                initial={false}
                animate={revealed ? 'english' : 'glyph'}
                variants={{
                  glyph: {
                    color: i % 3 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(167,139,250,0.5)',
                    fontFamily: 'monospace',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    textShadow: i % 3 === 0 ? '0 0 4px rgba(255,255,255,0.1)' : '0 0 4px rgba(167,139,250,0.12)',
                    scale: 1,
                  },
                  english: {
                    color: isHighlight ? '#ffffff' : 'rgba(255,255,255,0.9)',
                    fontFamily: 'inherit',
                    fontStyle: 'italic',
                    fontWeight: isHighlight ? 700 : 400,
                    textShadow: isHighlight ? '0 0 16px rgba(167,139,250,0.6), 0 0 4px rgba(255,255,255,0.3)' : 'none',
                    scale: 1,
                  }
                }}
                transition={{ duration: 0.15, delay }}
              >
                {revealed ? char : glyphMap[i]}
              </motion.span>
            </motion.span>
          );
        })}
      </div>

      {/* Attribution */}
      <motion.div
        className="relative z-10 text-center"
        initial={false}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
        transition={{ duration: 0.5, delay: revealed ? totalRevealMs / 1000 + 0.2 : 0 }}
      >
        <span
          className="text-[10px] sm:text-xs uppercase tracking-[3px] font-medium"
          style={{ color: 'rgba(139,92,246,0.5)' }}
        >
          {ATTRIBUTION}
        </span>
      </motion.div>

      {/* Hover hint */}
      <motion.div
        animate={{ opacity: revealed ? 0 : [0.25, 0.5, 0.25] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 text-center mt-2 pointer-events-none"
      >
        <span
          className="text-[9px] sm:text-[10px] uppercase tracking-[4px] font-medium"
          style={{ color: 'rgba(139,92,246,0.4)' }}
        >
          ▸ hover to decode ◂
        </span>
      </motion.div>
    </div>
  );
}