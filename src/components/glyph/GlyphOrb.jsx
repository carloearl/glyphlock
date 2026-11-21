import React, { useEffect, useRef } from "react";

/**
 * Glyph's face: a turning prism ring around a dark glass core with two glowing eyes.
 * - Eyes blink every few seconds and (with `track`) glance toward the pointer.
 * - mood "thinking" spins the ring fast and narrows the eyes; "happy" curves them.
 * Pure CSS/SVG, no images. Motion stops under prefers-reduced-motion.
 */
const STYLES = `
.gorb { position: relative; display: inline-block; border-radius: 9999px; flex-shrink: 0; }
.gorb::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: conic-gradient(from 0deg, #22d3ee, #6366f1, #a855f7, #ec4899, #f59e0b, #22d3ee);
  animation: gorbSpin 6s linear infinite;
  box-shadow: 0 0 18px rgba(34,211,238,.45), 0 0 40px rgba(168,85,247,.35);
}
.gorb--thinking::before { animation-duration: 1.1s; }
.gorb__core {
  position: absolute; inset: 8%; border-radius: inherit; overflow: hidden;
  background: radial-gradient(circle at 32% 26%, #2b3b72 0%, #0d1330 55%, #070a1c 100%);
  box-shadow: inset 0 -6px 14px rgba(0,0,0,.55), inset 0 4px 10px rgba(120,160,255,.18);
}
.gorb__core::after {
  content: ""; position: absolute; left: 18%; top: 10%; width: 38%; height: 22%;
  border-radius: 50%; background: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,0));
  transform: rotate(-18deg);
}
.gorb__eyes {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 16%;
  transform: translate(var(--gx, 0px), var(--gy, 0px)); transition: transform .25s ease-out;
}
.gorb__eye {
  width: 14%; height: 30%; border-radius: 999px;
  background: linear-gradient(180deg, #a5f3fc, #67e8f9 55%, #c4b5fd);
  box-shadow: 0 0 6px rgba(103,232,249,.95), 0 0 14px rgba(103,232,249,.55);
  transform-origin: center; animation: gorbBlink 5.2s infinite;
}
.gorb--thinking .gorb__eye { height: 12%; animation: gorbScan 1.2s ease-in-out infinite alternate; }
.gorb--happy .gorb__eye {
  height: 16%; background: transparent; box-shadow: none; border-radius: 0; animation: none;
  border-top: 3px solid #67e8f9; border-radius: 50% 50% 0 0; filter: drop-shadow(0 0 4px rgba(103,232,249,.9));
}
.gorb--pulse::after {
  content: ""; position: absolute; inset: -6px; border-radius: inherit;
  border: 2px solid rgba(34,211,238,.55); animation: gorbPulse 2.4s ease-out infinite;
}
@keyframes gorbSpin { to { transform: rotate(360deg); } }
@keyframes gorbPulse { 0% { transform: scale(.9); opacity: .9; } 100% { transform: scale(1.3); opacity: 0; } }
@keyframes gorbBlink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.1); } }
@keyframes gorbScan { from { transform: translateX(-35%); } to { transform: translateX(35%); } }
@media (prefers-reduced-motion: reduce) {
  .gorb::before, .gorb--pulse::after, .gorb__eye { animation: none !important; }
  .gorb__eyes { transition: none; }
}
`;

export default function GlyphOrb({ size = 56, pulse = false, mood = "idle", track = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!track || typeof window === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        const max = r.width * 0.07;
        el.style.setProperty("--gx", `${((dx / len) * max).toFixed(2)}px`);
        el.style.setProperty("--gy", `${((dy / len) * max).toFixed(2)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [track]);

  return (
    <span
      ref={ref}
      className={`gorb gorb--${mood}${pulse ? " gorb--pulse" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <style>{STYLES}</style>
      <span className="gorb__core">
        <span className="gorb__eyes">
          <span className="gorb__eye" />
          <span className="gorb__eye" />
        </span>
      </span>
    </span>
  );
}
