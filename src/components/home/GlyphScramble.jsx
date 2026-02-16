import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GLYPHS = '⌬⏣◈◇⬡⎔⏢⬢△▽◻◆⬠⏥⎊⏧⌖⌗⏛⏜⌭⌮⍟⍙⍡⎈⎋⎍⎑⎗⎙⏀⏁⏂⏃⏄⏅⏆⏇⏈⏉⏊⏋⏌⌘⌥⌦⌧⌫⍢⍣⍤⍥⍦⍧⍨⍩⎀⎁⎂⎃⎄⎅⎆⎇';
const COLORS = [
  '#39ff14', // neon green
  '#00ff87', // mint green
  '#4f46e5', // indigo
  '#6366f1', // lighter indigo
  '#818cf8', // lavender indigo
  '#7c3aed', // ultraviolet
  '#a855f7', // purple UV
  '#c084fc', // light UV
  '#8b5cf6', // violet
  '#06ffa5', // electric green
];

const QUOTE_TEXT = `"We didn't wait for permission. We didn't ask for funding. We built it from nothing — and we own every line."`;
const ATTRIBUTION = '— GlyphLock Founding Protocol · Bootstrapped Since Day One';

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const getRandomGlyph = (rng) => GLYPHS[Math.floor(rng() * GLYPHS.length)];
const getRandomColor = (rng) => COLORS[Math.floor(rng() * COLORS.length)];

export default function GlyphScramble() {
  const [revealed, setRevealed] = useState(false);
  const [glyphGrid, setGlyphGrid] = useState([]);
  const [scrambleKey, setScrambleKey] = useState(0);
  const intervalRef = useRef(null);
  const rngRef = useRef(mulberry32(Date.now()));

  // Generate a grid of scrambled glyphs
  const generateGrid = useCallback(() => {
    const rng = mulberry32(Date.now() + Math.random() * 99999);
    rngRef.current = rng;
    const count = 42; // number of glyph cells
    const grid = [];
    for (let i = 0; i < count; i++) {
      grid.push({
        char: getRandomGlyph(rng),
        color: getRandomColor(rng),
        x: (rng() * 100).toFixed(1),
        y: (rng() * 100).toFixed(1),
        size: (0.8 + rng() * 1.4).toFixed(2),
        delay: (rng() * 0.8).toFixed(2),
        rotation: Math.floor(rng() * 360),
      });
    }
    return grid;
  }, []);

  // Continuously scramble glyphs
  useEffect(() => {
    setGlyphGrid(generateGrid());

    intervalRef.current = setInterval(() => {
      if (!revealed) {
        setGlyphGrid(generateGrid());
        setScrambleKey((k) => k + 1);
      }
    }, 1800);

    return () => clearInterval(intervalRef.current);
  }, [revealed, generateGrid]);

  // Stop scrambling on reveal
  useEffect(() => {
    if (revealed && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [revealed]);

  return (
    <div
      className="relative w-full max-w-3xl mx-auto cursor-pointer select-none group"
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onTouchStart={() => setRevealed((r) => !r)}
      style={{ minHeight: '120px' }}
      role="button"
      tabIndex={0}
      aria-label="Hover to reveal the GlyphLock founding quote"
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: revealed
            ? 'radial-gradient(ellipse at center, rgba(87,61,255,0.2) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(57,255,20,0.08) 0%, rgba(79,70,229,0.06) 40%, rgba(124,58,237,0.04) 70%, transparent 100%)',
          filter: 'blur(30px)',
          transition: 'all 0.8s ease',
        }}
      />

      {/* Scrambled Glyphs Layer */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            key={`scramble-${scrambleKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            transition={{ duration: 0.5 }}
            className="relative w-full flex flex-wrap items-center justify-center gap-1 py-4 px-2"
            style={{ minHeight: '100px' }}
          >
            {glyphGrid.map((g, i) => (
              <motion.span
                key={`${scrambleKey}-${i}`}
                initial={{ opacity: 0, scale: 0.3, rotate: g.rotation }}
                animate={{
                  opacity: [0.3, 0.9, 0.5],
                  scale: [0.6, 1, 0.8],
                  rotate: [g.rotation, g.rotation + 30, g.rotation - 15],
                }}
                transition={{
                  duration: 1.5,
                  delay: parseFloat(g.delay),
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                className="inline-block font-mono font-black"
                style={{
                  color: g.color,
                  fontSize: `${g.size}rem`,
                  textShadow: `0 0 12px ${g.color}88, 0 0 24px ${g.color}44, 0 0 4px ${g.color}cc`,
                  filter: `drop-shadow(0 0 6px ${g.color}66)`,
                  lineHeight: 1,
                }}
              >
                {g.char}
              </motion.span>
            ))}

            {/* "Hover to unlock" hint */}
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs uppercase tracking-[4px] font-bold pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, #39ff14, #6366f1, #a855f7)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 8px rgba(57,255,20,0.4))',
              }}
            >
              ▸ HOVER TO UNLOCK ◂
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed Quote Layer */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 py-4 px-2 text-center"
          >
            {/* Horizontal beam */}
            <div
              className="absolute top-1/2 left-0 right-0 h-[1px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 5%, rgba(57,255,20,0.3) 25%, rgba(87,61,255,0.5) 50%, rgba(124,58,237,0.3) 75%, transparent 95%)',
                boxShadow: '0 0 20px rgba(57,255,20,0.3), 0 0 40px rgba(87,61,255,0.2)',
              }}
            />

            <blockquote>
              <p
                className="text-sm sm:text-base md:text-lg italic leading-relaxed"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(147,197,253,0.9) 50%, rgba(255,255,255,0.75) 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 12px rgba(87,61,255,0.3))',
                }}
              >
                "We didn't wait for permission. We didn't ask for funding. We built it from nothing —
                <span
                  style={{
                    background: 'linear-gradient(135deg, #39ff14 0%, #6366f1 50%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    filter: 'drop-shadow(0 0 16px rgba(57,255,20,0.5))',
                  }}
                >
                  {' '}
                  and we own every line.
                </span>
                "
              </p>
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-3 text-[10px] sm:text-xs uppercase tracking-[3px] font-semibold"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(57,255,20,0.6), rgba(99,102,241,0.5), rgba(168,85,247,0.5))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(57,255,20,0.3))',
                }}
              >
                {ATTRIBUTION}
              </motion.footer>
            </blockquote>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}