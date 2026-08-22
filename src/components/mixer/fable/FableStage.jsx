/**
 * FableStage — the visual output surface (no audio, ever).
 * Renders background + spectrum on canvas and toggleable text overlays on top.
 * Reads live beat data from a ref so it never re-renders per frame.
 *
 * Optimization: the rAF draw loop mounts ONCE and reads every changing value
 * (settings, theme, background, visual, autoStep, mediaOn) from refs that a
 * layout effect keeps in sync. Previously the effect re-ran on every settings
 * tweak and every auto-rotation step, tearing down the loop, the ResizeObserver
 * and the particle field each time — which caused the visible stutter/flicker.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getTheme, getFont, THEMES, VISUALS } from "./fableThemes";
import { makeParticles, drawBackground, drawVisual } from "./fableRenderers";
import FableMediaLayer from "./FableMediaLayer";
import FableMarquee from "./FableMarquee";
import FableHeadline from "./FableHeadline";
import FableStageFx from "./FableStageFx";
import { resolveFableMedia } from "./fableMedia";

const EMPTY_FRAME = { bass: 0, mid: 0, high: 0, energy: 0, bands: [], shape: [], beatCount: 0, beatInBar: 1, barCount: 0 };
const AUTO_VISUALS = VISUALS.filter((v) => v.key !== "off").map((v) => v.key);

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
  const countRef = useRef(null);
  // Auto mode rotates the look every `autoBars` bars of the detected 4/4 count.
  const [autoStep, setAutoStep] = useState(0);
  const auto = !!settings.autoMode;
  const theme = auto ? THEMES[autoStep % THEMES.length] : getTheme(settings.theme);
  const background = auto ? theme.bg : settings.background;
  const visual = auto ? AUTO_VISUALS[autoStep % AUTO_VISUALS.length] : settings.visual;
  const fontCss = getFont(settings.font);
  // One operator-set scale drives every text overlay on the stage.
  const scale = Math.min(2.5, Math.max(0.6, Number(settings.fontScale) || 1));
  const px = (base) => `${(base * scale).toFixed(2)}px`;
  // When a video backdrop is showing, the canvas must stay see-through.
  const mediaOn = !!resolveFableMedia(settings, track).kind;

  // Refs mirror the render-derived values so the draw loop never restarts.
  const settingsRef = useRef(settings);
  const themeRef = useRef(theme);
  const backgroundRef = useRef(background);
  const visualRef = useRef(visual);
  const autoRef = useRef(auto);
  const autoStepRef = useRef(autoStep);
  const mediaOnRef = useRef(mediaOn);

  useLayoutEffect(() => {
    settingsRef.current = settings;
    themeRef.current = theme;
    backgroundRef.current = background;
    visualRef.current = visual;
    autoRef.current = auto;
    autoStepRef.current = autoStep;
    mediaOnRef.current = mediaOn;
  }, [settings, theme, background, visual, auto, autoStep, mediaOn]);

  // Single stable rAF loop. Reads everything from refs, so a settings tweak
  // or an auto-rotation step updates the look without cancelling/recreating
  // the animation frame, the ResizeObserver or the particle field.
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!g) return undefined;

    let raf = null;
    let particles = [];
    let lastBeat = 0;
    let flash = 0;
    let lastAutoStep = autoStepRef.current;

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
      // Hidden tab (display:none) yields a 0×0 canvas; drawing now produces
      // NaN radii (e.g. `x % (W*1.6)` → "non-finite" createRadialGradient). Skip
      // the frame — the loop already rescheduled above and resumes once visible.
      if (W <= 0 || H <= 0) return;
      const t = performance.now();
      const frame = frameRef?.current || EMPTY_FRAME;

      const s = settingsRef.current;
      const isAuto = autoRef.current;
      const step = autoStepRef.current;
      const media = mediaOnRef.current;
      // Resolve the live look from the latest autoStep (refs stay fresh via the
      // layout effect; recomputing here also covers the one frame between a
      // setAutoStep and the next sync without restarting the loop).
      const liveTheme = isAuto ? THEMES[step % THEMES.length] : themeRef.current;
      const liveBg = isAuto ? liveTheme.bg : backgroundRef.current;
      const liveVisual = isAuto ? AUTO_VISUALS[step % AUTO_VISUALS.length] : visualRef.current;

      if (media) {
        g.clearRect(0, 0, W, H);
      } else if (s.trails) {
        g.fillStyle = `${liveTheme.tint}66`;
        g.fillRect(0, 0, W, H);
      } else {
        g.fillStyle = liveTheme.tint;
        g.fillRect(0, 0, W, H);
      }

      if (!media) drawBackground(g, W, H, t, frame, liveTheme, liveBg, particles);

      g.shadowBlur = s.bloom ? 24 : 0;
      g.shadowColor = liveTheme.colors[1];
      drawVisual(g, W, H, t, frame, liveTheme, liveVisual, Number(s.intensity) || 1);
      g.shadowBlur = 0;

      // Beat reactions
      const beated = frame.beatCount !== lastBeat;
      lastBeat = frame.beatCount;
      if (beated) flash = 1;
      flash *= 0.86;

      if (flashRef.current) {
        const on = s.beatFlash || s.strobe;
        flashRef.current.style.opacity = on ? String(flash * (s.strobe ? 0.55 : 0.22)) : "0";
        flashRef.current.style.background = s.strobe ? "#ffffff" : liveTheme.colors[2];
      }
      if (shellRef.current) {
        const shake = s.beatShake ? flash * 6 : 0;
        shellRef.current.style.transform = shake
          ? `translate3d(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px, 0)`
          : "none";
      }
      if (countRef.current && s.showBeatCounter) {
        countRef.current.textContent = `${frame.beatInBar || 1} / 4`;
        countRef.current.style.opacity = String(0.45 + flash * 0.55);
      }
      if (isAuto) {
        const bars = Math.max(1, Number(s.autoBars) || 8);
        const nextStep = Math.floor((frame.barCount || 0) / bars);
        if (nextStep !== lastAutoStep) {
          lastAutoStep = nextStep;
          setAutoStep(nextStep);
        }
      }
      if (clockRef.current && s.showClock) {
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
    // frameRef is a stable ref object; the loop reads its .current each frame.
  }, [frameRef]);

  const accent = theme.colors[2];

  return (
    <div
      ref={shellRef}
      className={`relative h-full w-full overflow-hidden bg-black ${className}`}
      style={{ fontFamily: fontCss }}
    >
      <FableMediaLayer settings={settings} track={track} />
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
          {settings.showBeatCounter && (
            <span
              ref={countRef}
              className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 font-black"
              style={{ color: theme.colors[1] }}
            >
              1 / 4
            </span>
          )}
        </div>
      </div>

      <FableStageFx settings={settings} theme={theme} />
      {settings.showHeadline && <FableHeadline settings={settings} theme={theme} />}

      {/* On stage · now playing · up next */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 p-6"
        style={{ paddingBottom: settings.showMarquee ? "3.75rem" : undefined }}
      >
        {settings.showDancer && !!settings.dancerName?.trim() && (
          <div className="mb-3">
            <div
              className="font-black uppercase tracking-[0.4em] text-white/50"
              style={{ fontSize: px(10) }}
            >
              {settings.dancerLabel?.trim() || "On Stage"}
            </div>
            <div
              className="truncate font-black leading-none drop-shadow-[0_4px_28px_rgba(0,0,0,0.95)]"
              style={{ fontSize: px(56), color: accent }}
            >
              {settings.dancerName}
            </div>
          </div>
        )}
        {settings.showNowPlaying && (
          <div className="mb-2">
            <div className="font-black uppercase tracking-[0.4em]" style={{ color: accent, fontSize: px(10) }}>
              Now Playing
            </div>
            <div
              className="truncate font-black leading-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
              style={{ fontSize: px(36) }}
            >
              {track?.title || "Awaiting DJ Signal"}
            </div>
            <div className="truncate font-semibold text-white/60" style={{ fontSize: px(18) }}>
              {track?.artist || "—"}
            </div>
          </div>
        )}
        {settings.showUpNext && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2">
            <span className="font-black uppercase tracking-[0.3em] text-white/45" style={{ fontSize: px(10) }}>
              Up Next
            </span>
            <span className="truncate font-bold text-white/85" style={{ fontSize: px(14) }}>
              {settings.upNextName?.trim() ||
                (nextTrack?.title
                  ? `${nextTrack.title}${nextTrack.artist ? ` · ${nextTrack.artist}` : ""}`
                  : "Queue open")}
            </span>
          </div>
        )}
      </div>

      {settings.showMarquee && (
        <FableMarquee settings={settings} track={track} accent={accent} />
      )}
    </div>
  );
}