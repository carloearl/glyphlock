/**
 * FableStage — the visual output surface (no audio, ever).
 * Renders background + spectrum on canvas and toggleable text overlays on top.
 * Reads live beat data from a ref so it never re-renders per frame.
 */
import React, { useEffect, useRef } from "react";
import { getTheme } from "./fableThemes";
import { makeParticles, drawBackground, drawVisual } from "./fableRenderers";

const EMPTY_FRAME = { bass: 0, mid: 0, high: 0, energy: 0, bands: [], shape: [], beatCount: 0 };

export default function FableStage({
  settings,
  frameRef,
  track,
  nextTrack,
  bpm,
  deck = "A",
  className = "",
}) {
  const canvasRef = useRef(null);
  const shellRef = useRef(null);
  const flashRef = useRef(null);
  const clockRef = useRef(null);
  const theme = getTheme(settings.theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!g) return;

    let raf = null;
    let particles = [];
    let lastBeat = 0;
    let flash = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = makeParticles(140, rect.width, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const t = performance.now();
      const frame = frameRef?.current || EMPTY_FRAME;

      if (settings.trails) {
        g.fillStyle = `${theme.tint}66`;
        g.fillRect(0, 0, W, H);
      } else {
        g.fillStyle = theme.tint;
        g.fillRect(0, 0, W, H);
      }

      drawBackground(g, W, H, t, frame, theme, settings.background, particles);

      g.shadowBlur = settings.bloom ? 24 : 0;
      g.shadowColor = theme.colors[1];
      drawVisual(g, W, H, t, frame, theme, settings.visual, Number(settings.intensity) || 1);
      g.shadowBlur = 0;

      // Beat reactions
      const beated = frame.beatCount !== lastBeat;
      lastBeat = frame.beatCount;
      if (beated) flash = 1;
      flash *= 0.86;

      if (flashRef.current) {
        const on = settings.beatFlash || settings.strobe;
        flashRef.current.style.opacity = on ? String(flash * (settings.strobe ? 0.55 : 0.22)) : "0";
        flashRef.current.style.background = settings.strobe ? "#ffffff" : theme.colors[2];
      }
      if (shellRef.current) {
        const shake = settings.beatShake ? flash * 6 : 0;
        shellRef.current.style.transform = shake
          ? `translate3d(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px, 0)`
          : "none";
      }
      if (clockRef.current && settings.showClock) {
        clockRef.current.textContent = new Date().toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit", timeZone: "America/Phoenix",
        });
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [settings, theme, frameRef]);

  const accent = theme.colors[2];

  return (
    <div ref={shellRef} className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div ref={flashRef} className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen" />

      {/* Top row overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
        <div className="flex items-center gap-3">
          {settings.showOnAir && (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/60 bg-black/50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> On Air
            </span>
          )}
          {settings.showLogo && (
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60">
              Fable Engine X
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono text-sm text-white/70">
          {settings.showDeck && (
            <span className="rounded-lg border border-white/15 bg-black/40 px-2 py-1">DECK {deck}</span>
          )}
          {settings.showBpm && (
            <span className="rounded-lg border border-white/15 bg-black/40 px-2 py-1" style={{ color: accent }}>
              {bpm ? `${bpm} BPM` : "-- BPM"}
            </span>
          )}
          {settings.showClock && (
            <span ref={clockRef} className="rounded-lg border border-white/15 bg-black/40 px-2 py-1" />
          )}
        </div>
      </div>

      {/* Now playing / up next */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
        {settings.showNowPlaying && (
          <div className="mb-2">
            <div className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: accent }}>
              Now Playing
            </div>
            <div className="truncate text-4xl font-black leading-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              {track?.title || "Awaiting DJ Signal"}
            </div>
            <div className="truncate text-lg font-semibold text-white/60">
              {track?.artist || "—"}
            </div>
          </div>
        )}
        {settings.showUpNext && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Up Next</span>
            <span className="truncate text-sm font-bold text-white/85">
              {nextTrack?.title ? `${nextTrack.title}${nextTrack.artist ? ` · ${nextTrack.artist}` : ""}` : "Queue open"}
            </span>
          </div>
        )}
      </div>

      {/* Marquee */}
      {settings.showMarquee && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full" />
      )}
      {settings.showMarquee && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden">
          <div
            className="animate-ticker whitespace-nowrap text-center text-[13px] font-black uppercase tracking-[0.5em]"
            style={{ color: `${accent}88` }}
          >
            {`${track?.title || "N.U.P.S."} · ${track?.artist || "Autonomous DJ"} · Dream Palace · `.repeat(6)}
          </div>
        </div>
      )}
    </div>
  );
}