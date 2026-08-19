/**
 * useFableSyntheticBeat — keeps Fable Engine X alive when no audio measurement
 * is available (no deck element tapped yet, or the operator declined the audio
 * input prompt). Generates a clock-driven 4/4 frame from the known BPM so the
 * stage always shows full motion instead of a dead screen. Purely visual.
 */
import { useEffect, useRef } from "react";

export default function useFableSyntheticBeat({ enabled, bpm, onFrame }) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    if (!enabled) return;
    let raf = null;
    let beatCount = 0;
    let nextBeatAt = performance.now();
    const start = performance.now();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const tempo = Math.min(180, Math.max(70, Number(bpmRef.current) || 124));
      const period = 60000 / tempo;

      let beat = false;
      if (now >= nextBeatAt) {
        beat = true;
        beatCount += 1;
        nextBeatAt = now + period;
      }

      const phase = 1 - Math.min(1, (nextBeatAt - now) / period); // 0 → 1 per beat
      const swell = Math.pow(1 - phase, 2);
      const t = (now - start) / 1000;

      const bass = 0.28 + swell * 0.55;
      const mid = 0.22 + (Math.sin(t * 1.7) * 0.5 + 0.5) * 0.4;
      const high = 0.16 + (Math.sin(t * 3.1 + 1.2) * 0.5 + 0.5) * 0.34;

      const bands = new Array(128);
      for (let i = 0; i < 128; i++) {
        const fall = 1 - i / 128;
        bands[i] =
          Math.max(
            0,
            fall * (0.35 + swell * 0.5) + Math.sin(t * 2.4 + i * 0.22) * 0.16 * fall
          ) * 1.05;
      }

      const shape = new Array(64);
      for (let i = 0; i < 64; i++) {
        shape[i] =
          Math.sin(t * 5 + i * 0.28) * (0.35 + swell * 0.5) +
          Math.sin(t * 11 + i * 0.6) * 0.12;
      }

      onFrameRef.current?.({
        bass,
        mid,
        high,
        energy: bass * 0.55 + mid * 0.3 + high * 0.15,
        beat,
        beatCount,
        beatInBar: (beatCount % 4) + 1,
        barCount: Math.floor(beatCount / 4),
        bands,
        shape,
        synthetic: true,
      });
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [enabled]);
}