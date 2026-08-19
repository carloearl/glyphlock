/**
 * useFableBeat — microphone tempo/energy tracker for Fable Engine X.
 *
 * Listens to the room mic and produces per-frame band levels plus a detected
 * BPM from bass onsets, so the visuals ride the actual music in the club.
 *
 * IMPORTANT: the analyser is NEVER connected to ctx.destination — the mic is
 * only measured, never played back. This feature produces no sound.
 */
import { useEffect, useRef, useState } from "react";

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

export default function useFableBeat({ enabled, onFrame }) {
  const [bpm, setBpm] = useState(null);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) {
      setListening(false);
      return;
    }

    let stream = null;
    let ctx = null;
    let raf = null;
    let cancelled = false;

    const history = [];      // recent bass values for adaptive threshold
    const intervals = [];    // ms between detected beats
    let lastBeatAt = 0;
    let beatCount = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (cancelled) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        if (ctx.state === "suspended") await ctx.resume().catch(() => {});
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser); // terminal node — no output path, so silent
        setListening(true);
        setError(null);

        const freq = new Uint8Array(analyser.frequencyBinCount);
        const wave = new Uint8Array(analyser.frequencyBinCount);

        const avg = (from, to) => {
          let sum = 0;
          for (let i = from; i < to; i++) sum += freq[i];
          return sum / Math.max(1, to - from) / 255;
        };

        const tick = () => {
          raf = requestAnimationFrame(tick);
          analyser.getByteFrequencyData(freq);
          analyser.getByteTimeDomainData(wave);

          const bass = avg(1, 10);
          const mid = avg(10, 60);
          const high = avg(60, 180);
          const energy = bass * 0.55 + mid * 0.3 + high * 0.15;

          history.push(bass);
          if (history.length > 60) history.shift();
          const localAvg = history.reduce((a, b) => a + b, 0) / history.length;

          const now = performance.now();
          let beat = false;
          if (bass > 0.06 && bass > localAvg * 1.32 && now - lastBeatAt > 240) {
            if (lastBeatAt) {
              const gap = now - lastBeatAt;
              if (gap < 1400) {
                intervals.push(gap);
                if (intervals.length > 16) intervals.shift();
              }
            }
            lastBeatAt = now;
            beat = true;
            beatCount += 1;

            if (intervals.length >= 4) {
              let detected = 60000 / median(intervals);
              while (detected < 70) detected *= 2;
              while (detected > 180) detected /= 2;
              const rounded = Math.round(detected);
              setBpm((prev) => (prev && Math.abs(prev - rounded) < 2 ? prev : rounded));
            }
          }

          // Waveform snapshot (downsampled) for ribbon visuals.
          const shape = new Array(64);
          const step = Math.floor(wave.length / 64);
          for (let i = 0; i < 64; i++) shape[i] = (wave[i * step] - 128) / 128;

          onFrameRef.current?.({
            bass, mid, high, energy, beat, beatCount,
            bands: Array.from(freq.slice(0, 128), (v) => v / 255),
            shape,
          });
        };
        raf = requestAnimationFrame(tick);
      } catch (err) {
        setError(err?.name === "NotAllowedError" ? "Microphone access denied" : "Microphone unavailable");
        setListening(false);
      }
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
      try { ctx?.close(); } catch { /* noop */ }
      setListening(false);
    };
  }, [enabled]);

  return { bpm, error, listening };
}