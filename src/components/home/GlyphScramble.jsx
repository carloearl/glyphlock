import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

const GLYPHS = '⌬⏣◈◇⬡⎔⏢⬢△▽◻◆⬠⏥⎊⏧⌖⌗⏛⏜⌭⌮⍟⍙⍡⎈⎋⎍⎑⎗⎙⏀⏁⏂⏃⏄⏅⏆⏇⏈⏉⏊⏋⏌⌘⌥⌦⌧⌫⍢⍣⍤⍥⍦⍧⍨⍩⎀⎁⎂⎃⎄⎅⎆⎇';

const GLYPH_COLORS = [
  '#39ff14', '#00ff87', '#4f46e5', '#6366f1',
  '#818cf8', '#7c3aed', '#a855f7', '#c084fc',
  '#8b5cf6', '#06ffa5',
];

const QUOTE = `"We didn't wait for permission. We didn't ask for funding. We built it from nothing — and we own every line."`;
const ATTRIBUTION = '— GlyphLock Founding Protocol · Bootstrapped Since Day One';

// Seeded RNG
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Per-character cell component
const GlyphChar = React.memo(({ realChar, index, revealed, glyphChar, glyphColor, totalChars }) => {
  const [displayChar, setDisplayChar] = useState(glyphChar);
  const [displayColor, setDisplayColor] = useState(glyphColor);
  const [isResolved, setIsResolved] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Scramble animation on idle
  useEffect(() => {
    if (!revealed && !isResolved) {
      intervalRef.current = setInterval(() => {
        const rng = mulberry32(Date.now() + index * 7);
        setDisplayChar(GLYPHS[Math.floor(rng() * GLYPHS.length)]);
        setDisplayColor(GLYPH_COLORS[Math.floor(rng() * GLYPH_COLORS.length)]);
      }, 150 + Math.random() * 200);
    }
    return () => clearInterval(intervalRef.current);
  }, [revealed, isResolved, index]);

  // On hover: staggered resolve to real character
  useEffect(() => {
    if (revealed) {
      clearInterval(intervalRef.current);
      // Stagger delay based on character index — cascade left to right
      const staggerDelay = index * 18 + Math.random() * 40;
      // Quick scramble burst before settling
      let burstCount = 0;
      const maxBursts = 3 + Math.floor(Math.random() * 4);

      timeoutRef.current = setTimeout(() => {
        const burstInterval = setInterval(() => {
          burstCount++;
          if (burstCount >= maxBursts) {
            clearInterval(burstInterval);
            setDisplayChar(realChar);
            setDisplayColor('#ffffff');
            setIsResolved(true);
          } else {
            const rng = mulberry32(Date.now() + index + burstCount);
            setDisplayChar(GLYPHS[Math.floor(rng() * GLYPHS.length)]);
            setDisplayColor(GLYPH_COLORS[Math.floor(rng() * GLYPH_COLORS.length)]);
          }
        }, 40);
      }, staggerDelay);
    } else {
      // Reset on un-hover
      clearTimeout(timeoutRef.current);
      setIsResolved(false);
      const rng = mulberry32(Date.now() + index * 3);
      setDisplayChar(GLYPHS[Math.floor(rng() * GLYPHS.length)]);
      setDisplayColor(GLYPH_COLORS[Math.floor(rng() * GLYPH_COLORS.length)]);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [revealed, realChar, index]);

  // Spaces stay as spaces
  if (realChar === ' ') {
    return <span className="inline" style={{ width: '0.3em' }}>&nbsp;</span>;
  }

  // Highlight key phrase "and we own every line."
  const isHighlightZone = index >= QUOTE.indexOf('and we own every line.');
  const resolvedColor = isResolved && isHighlightZone
    ? undefined
    : isResolved
    ? '#ffffff'
    : displayColor;

  const resolvedStyle = isResolved && isHighlightZone
    ? {
        background: 'linear-gradient(135deg, #39ff14 0%, #6366f1 50%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
        fontStyle: 'normal',
      }
    : {};

  return (
    <span
      className="inline-block transition-all duration-150"
      style={{
        color: resolvedColor,
        fontFamily: isResolved ? 'inherit' : 'monospace',
        fontStyle: isResolved ? 'italic' : 'normal',
        fontWeight: isResolved ? (isHighlightZone ? 700 : 400) : 800,
        textShadow: isResolved
          ? 'none'
          : `0 0 8px ${displayColor}88, 0 0 16px ${displayColor}44`,
        filter: isResolved ? 'none' : `drop-shadow(0 0 4px ${displayColor}66)`,
        fontSize: isResolved ? undefined : '1.05em',
        ...resolvedStyle,
      }}
    >
      {displayChar}
    </span>
  );
});

GlyphChar.displayName = 'GlyphChar';

export default function GlyphScramble() {
  const [revealed, setRevealed] = useState(false);
  const [attrRevealed, setAttrRevealed] = useState(false);

  // Show attribution after quote is revealed
  useEffect(() => {
    if (revealed) {
      const t = setTimeout(() => setAttrRevealed(true), QUOTE.length * 18 + 400);
      return () => clearTimeout(t);
    } else {
      setAttrRevealed(false);
    }
  }, [revealed]);

  // Pre-generate initial glyph assignments
  const initialGlyphs = useMemo(() => {
    const rng = mulberry32(42);
    return QUOTE.split('').map(() => ({
      char: GLYPHS[Math.floor(rng() * GLYPHS.length)],
      color: GLYPH_COLORS[Math.floor(rng() * GLYPH_COLORS.length)],
    }));
  }, []);

  return (
    <div
      className="relative w-full max-w-3xl mx-auto cursor-pointer select-none"
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onTouchStart={() => setRevealed(r => !r)}
      role="button"
      tabIndex={0}
      aria-label="Hover to reveal the GlyphLock founding quote"
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
      style={{ minHeight: '110px' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl transition-all duration-700"
        style={{
          background: revealed
            ? 'radial-gradient(ellipse at center, rgba(87,61,255,0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(57,255,20,0.06) 0%, rgba(79,70,229,0.05) 40%, rgba(124,58,237,0.03) 70%, transparent 100%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Horizontal beam */}
      <div
        className="absolute top-1/2 left-0 right-0 h-[1px] pointer-events-none transition-opacity duration-500"
        style={{
          background: revealed
            ? 'linear-gradient(90deg, transparent 5%, rgba(57,255,20,0.3) 25%, rgba(87,61,255,0.5) 50%, rgba(124,58,237,0.3) 75%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, rgba(57,255,20,0.15) 25%, rgba(87,61,255,0.25) 50%, rgba(124,58,237,0.15) 75%, transparent 95%)',
          boxShadow: revealed
            ? '0 0 20px rgba(57,255,20,0.3), 0 0 40px rgba(87,61,255,0.2)'
            : '0 0 10px rgba(57,255,20,0.1)',
          opacity: revealed ? 1 : 0.5,
        }}
      />

      {/* Character grid */}
      <div className="relative z-10 py-4 px-2 text-center text-sm sm:text-base md:text-lg leading-relaxed italic">
        {QUOTE.split('').map((char, i) => (
          <GlyphChar
            key={i}
            realChar={char}
            index={i}
            revealed={revealed}
            glyphChar={initialGlyphs[i].char}
            glyphColor={initialGlyphs[i].color}
            totalChars={QUOTE.length}
          />
        ))}
      </div>

      {/* Attribution - fades in after decode */}
      <div
        className="relative z-10 text-center transition-all duration-500"
        style={{
          opacity: attrRevealed ? 1 : 0,
          transform: attrRevealed ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        <span
          className="text-[10px] sm:text-xs uppercase tracking-[3px] font-semibold"
          style={{
            background: 'linear-gradient(90deg, rgba(57,255,20,0.6), rgba(99,102,241,0.5), rgba(168,85,247,0.5))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(57,255,20,0.3))',
          }}
        >
          {ATTRIBUTION}
        </span>
      </div>

      {/* Hover hint */}
      <motion.div
        animate={{ opacity: revealed ? 0 : [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 text-center mt-1 pointer-events-none"
      >
        <span
          className="text-[9px] sm:text-[10px] uppercase tracking-[4px] font-bold"
          style={{
            background: 'linear-gradient(90deg, #39ff14, #6366f1, #a855f7)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ▸ hover to decode ◂
        </span>
      </motion.div>
    </div>
  );
}