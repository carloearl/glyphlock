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
import { createFrameReader } from "./fableAnalysis";

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
        source.connect(analyser); // terminal node — no output path, so silent
        setListening(true);
        setError(null);
        const read = createFrameReader(analyser, { onBpm: setBpm });

        const tick = () => {
          raf = requestAnimationFrame(tick);
          onFrameRef.current?.(read());
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