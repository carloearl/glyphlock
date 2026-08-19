/**
 * FableStageFx — non-canvas post effects layered over the stage.
 * Pure CSS so they cost nothing on the animation loop.
 */
import React from "react";

export default function FableStageFx({ settings, theme }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {settings.vignette && (
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.8) 100%)" }}
        />
      )}
      {settings.scanlines && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 1px, transparent 1px, transparent 4px)",
          }}
        />
      )}
      {settings.grain && (
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.5) 0deg 1deg, transparent 1deg 3deg)",
            backgroundSize: "5px 5px",
          }}
        />
      )}
      {settings.colorSweep && (
        <div
          className="absolute inset-0 opacity-40 mix-blend-color-dodge animate-pan"
          style={{
            background: `linear-gradient(120deg, ${theme.colors[0]}00 20%, ${theme.colors[2]}55 50%, ${theme.colors[1]}00 80%)`,
          }}
        />
      )}
    </div>
  );
}