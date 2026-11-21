import React from "react";
import { GLYPH_PHASES } from "./glyphPhases";

/**
 * The GlyphBot Prime card's emblem (rings, tether, morphing core, phase symbol, Omega eye),
 * drawn at any size so Glyph wears the card's face in the launcher, header and avatar.
 * size: rendered width in px. phase: 0 (Void) .. 12 (Omega). busy: spins up while thinking.
 */
export const EMBLEM_CSS = `
@property --gcc { syntax: "<color>"; inherits: true; initial-value: #8b93a7; }
@property --gcc2 { syntax: "<color>"; inherits: true; initial-value: #3a4152; }
.gce { position: relative; width: 12.4em; height: 12.4em; display: grid; place-items: center; flex: none;
  transition: --gcc .9s ease, --gcc2 .9s ease; }
.gce > * { position: absolute; }
.gce-r1 { inset: 0; border-radius: 50%;
  background: repeating-conic-gradient(var(--gcc) 0 5deg, transparent 5deg calc(30deg - var(--lvl) * 1.6deg));
  -webkit-mask: radial-gradient(circle, transparent 60%, #000 61% 66%, transparent 67%);
  mask: radial-gradient(circle, transparent 60%, #000 61% 66%, transparent 67%);
  opacity: calc(.4 + var(--lvl) * .05); animation: gce-spin 22s linear infinite; }
.gce-r1::after { content: ""; position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(#ff4646, #ff8a1f, #ffd60a, #2ee87a, #22e6e6, #3d86ff, #6a5cff, #a66bff, #c9b8ff, #ff4646);
  opacity: var(--omg); }
.gce-glow { inset: 18%; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--gcc) 45%, transparent), transparent 70%); filter: blur(.6em); }
.gce-teth { inset: 0; animation: gce-spin 10s linear infinite; }
.gce-teth::before { content: ""; position: absolute; left: 50%; top: 50%; width: 38%; height: 1px; transform-origin: 0 50%;
  background: linear-gradient(90deg, var(--gcc), color-mix(in srgb, var(--gcc2) 80%, #fff)); opacity: .85; }
.gce-lock { position: absolute; left: 88%; top: 50%; width: .95em; height: .95em; transform: translate(-50%, -50%) rotate(45deg);
  border: 1.5px solid var(--gcc); background: #0a0c12; box-shadow: 0 0 .6em var(--gcc); }
.gce-core { width: 5.2em; height: 5.2em; clip-path: var(--shape); transition: clip-path .9s cubic-bezier(.6,0,.2,1);
  background: radial-gradient(circle at 50% 38%, #fff, var(--gcc) 42%, var(--gcc2) 100%);
  opacity: calc(1 - var(--omg)); animation: gce-spin 30s linear infinite, gce-pulse 3s ease-in-out infinite; }
.gce-sym { font-family: system-ui, "Segoe UI", sans-serif; font-weight: 900; font-size: 1.9em; line-height: 1; color: #fff;
  text-shadow: 0 0 .4em var(--gcc), 0 0 .1em #000; opacity: calc(1 - var(--omg)); animation: gce-pop .7s cubic-bezier(.2,.8,.2,1) both; }
.gce-eye { inset: 1.2em; border-radius: 50%;
  background: radial-gradient(circle, #000 0 13%, #fff 14% 16%, transparent 17%),
    radial-gradient(circle, transparent 0 24%, #ffb800 25% 26.5%, transparent 27.5% 36%, rgba(255,244,214,.8) 37% 38%, transparent 39%),
    repeating-conic-gradient(rgba(255,244,214,.75) 0 1deg, transparent 1deg 10deg);
  -webkit-mask: radial-gradient(circle, #000 55%, transparent 70%); mask: radial-gradient(circle, #000 55%, transparent 70%);
  opacity: var(--omg); animation: gce-spin 40s linear infinite reverse; }
.gce-wave { inset: 2em; border-radius: 50%; border: 2px solid var(--gcc); opacity: 0; animation: gce-wave .9s ease-out both; }
.gce.is-busy .gce-r1 { animation-duration: 2.6s; }
.gce.is-busy .gce-teth { animation-duration: 1.6s; }
.gce.is-busy .gce-core { animation: gce-spin 4s linear infinite, gce-pulse .9s ease-in-out infinite; }
@keyframes gce-spin { to { transform: rotate(360deg); } }
@keyframes gce-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.35) drop-shadow(0 0 .5em var(--gcc)); } }
@keyframes gce-pop { from { transform: scale(.4); opacity: 0; } }
@keyframes gce-wave { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(1.7); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .gce *, .gce *::before, .gce *::after { animation: none !important; }
}
`;

export function phaseVars(phase) {
  const p = GLYPH_PHASES[Math.max(0, Math.min(12, phase | 0))];
  return {
    "--gcc": p.c,
    "--gcc2": p.c2,
    "--lvl": String(phase | 0),
    "--omg": phase >= 12 ? "1" : "0",
    "--shape": p.shape,
    "--tex": p.tex,
  };
}

export default function GlyphEmblem({ size = 120, phase = 0, busy = false, style }) {
  const p = GLYPH_PHASES[Math.max(0, Math.min(12, phase | 0))];
  return (
    <div
      className={`gce${busy ? " is-busy" : ""}`}
      style={{ fontSize: `${size / 12.4}px`, ...phaseVars(phase), ...style }}
      aria-hidden="true"
    >
      <div className="gce-glow" />
      <div className="gce-wave" key={`w${phase}`} />
      <div className="gce-r1" />
      <div className="gce-teth"><i className="gce-lock" /></div>
      <div className="gce-core" />
      {size >= 60 && <div className="gce-sym" key={`s${phase}`}>{p.sym}</div>}
      <div className="gce-eye" />
    </div>
  );
}
