/**
 * AudioVisualizer — Real Web Audio API FFT visualizer.
 * Taps an <audio> element via AnalyserNode and renders animated frequency bars
 * on a canvas. Used when a deck is playing an audio-only track (SoundCloud,
 * Jamendo, SoundHelix, uploaded MP3) without a video feed.
 *
 * Props:
 *  - audioEl: the HTMLAudioElement to visualize (required)
 *  - active: boolean — whether to render (gate rAF)
 *  - palette: "purple" | "cyan" | "fuchsia" | "amber" (optional)
 *  - mode: "bars" | "wave" | "combo" (default "combo")
 */
import React, { useEffect, useRef } from "react";

const PALETTES = {
  purple:  ["#7c3aed", "#a855f7", "#d946ef"],
  cyan:    ["#0891b2", "#06b6d4", "#22d3ee"],
  fuchsia: ["#be185d", "#ec4899", "#f472b6"],
  amber:   ["#d97706", "#f59e0b", "#fbbf24"],
};

// One shared AudioContext per page — some browsers cap total contexts
let sharedCtx = null;
function getSharedCtx() {
  if (typeof window === "undefined") return null;
  if (sharedCtx) return sharedCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  sharedCtx = new AC();
  return sharedCtx;
}

// Keep track of which <audio> elements we've already wired to avoid
// the "HTMLMediaElement already connected" error.
const wiredElements = new WeakMap(); // audioEl -> { source, analyser }

function wireAudio(audioEl) {
  if (!audioEl) return null;
  if (wiredElements.has(audioEl)) return wiredElements.get(audioEl);

  const ctx = getSharedCtx();
  if (!ctx) return null;

  try {
    const source = ctx.createMediaElementSource(audioEl);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    const entry = { source, analyser };
    wiredElements.set(audioEl, entry);
    return entry;
  } catch (err) {
    // Already wired in another visualizer instance
    return null;
  }
}

export default function AudioVisualizer({ audioEl, active = true, palette = "purple", mode = "combo" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const colors = PALETTES[palette] || PALETTES.purple;

  useEffect(() => {
    if (!active || !audioEl || !canvasRef.current) return;

    const ctx = getSharedCtx();
    // Some browsers require a user-gesture resume
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});

    const entry = wireAudio(audioEl);
    const canvas = canvasRef.current;
    const g = canvas.getContext("2d");
    if (!g) return;

    // HiDPI sizing
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      // Fade prior frame for motion trail
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(0, 0, W, H);

      if (!entry?.analyser) {
        // No analyser (wiring failed or not yet connected) — draw pulsing idle
        const t = Date.now() / 600;
        for (let i = 0; i < 40; i++) {
          const x = (i / 40) * W;
          const h = (Math.sin(t + i * 0.35) + 1) * 0.5 * H * 0.25 + 6;
          g.fillStyle = colors[i % colors.length] + "80";
          g.fillRect(x, H - h, (W / 40) - 2, h);
        }
        return;
      }

      const analyser = entry.analyser;
      const freqBins = analyser.frequencyBinCount;

      // ─── Bars (frequency) ───
      if (mode === "bars" || mode === "combo") {
        const freq = new Uint8Array(freqBins);
        analyser.getByteFrequencyData(freq);

        const bars = 56;
        const step = Math.floor(freqBins / bars);
        const gap = 2;
        const barW = (W / bars) - gap;

        for (let i = 0; i < bars; i++) {
          // Average a few bins per bar for smoother look
          let sum = 0;
          for (let j = 0; j < step; j++) sum += freq[i * step + j] || 0;
          const v = sum / step / 255; // 0..1
          const h = Math.max(2, v * H * 0.85);
          const x = i * (barW + gap);
          const y = H - h;

          const grad = g.createLinearGradient(0, y, 0, H);
          grad.addColorStop(0, colors[2]);
          grad.addColorStop(0.5, colors[1]);
          grad.addColorStop(1, colors[0]);
          g.fillStyle = grad;
          g.shadowBlur = 12;
          g.shadowColor = colors[1];
          g.fillRect(x, y, barW, h);
        }
        g.shadowBlur = 0;
      }

      // ─── Waveform (time domain) ───
      if (mode === "wave" || mode === "combo") {
        const wave = new Uint8Array(freqBins);
        analyser.getByteTimeDomainData(wave);

        g.strokeStyle = colors[2];
        g.lineWidth = 2;
        g.shadowBlur = 10;
        g.shadowColor = colors[2];
        g.beginPath();
        const slice = W / freqBins;
        for (let i = 0; i < freqBins; i++) {
          const v = wave[i] / 128.0; // centered at 1
          const y = (v * H) / 2;
          const x = i * slice;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
        g.shadowBlur = 0;
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, audioEl, palette, mode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ background: "#000" }}
      aria-hidden="true"
    />
  );
}