/**
 * Microphone tempo/energy tracker. The selected input is measurement-only and
 * is never connected to an audible destination.
 */
import { useEffect, useRef, useState } from "react";
import { createFrameReader } from "./fableAnalysis";
import { AUDIO_INPUT_EVENT, getAudioInputId } from "@/components/mixer/audioDevicePreferences";

export default function useFableBeat({ enabled, onFrame }) {
  const [bpm, setBpm] = useState(null);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const [inputDeviceId, setInputDeviceId] = useState(getAudioInputId);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const update = (event) => setInputDeviceId(event.detail || "default");
    window.addEventListener(AUDIO_INPUT_EVENT, update);
    return () => window.removeEventListener(AUDIO_INPUT_EVENT, update);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setListening(false);
      return undefined;
    }

    let stream = null;
    let context = null;
    let raf = null;
    let cancelled = false;

    (async () => {
      try {
        const deviceConstraint = inputDeviceId && inputDeviceId !== "default"
          ? { deviceId: { exact: inputDeviceId } }
          : {};
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...deviceConstraint,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        context = new AC();
        if (context.state === "suspended") await context.resume().catch(() => undefined);
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        source.connect(analyser);
        setListening(true);
        setError(null);
        const read = createFrameReader(analyser, { onBpm: setBpm });
        const tick = () => {
          raf = requestAnimationFrame(tick);
          onFrameRef.current?.(read());
        };
        raf = requestAnimationFrame(tick);
      } catch (caught) {
        const missingDevice = caught?.name === "NotFoundError" || caught?.name === "OverconstrainedError";
        setError(missingDevice
          ? "Selected microphone is unavailable"
          : caught?.name === "NotAllowedError"
            ? "Microphone access denied"
            : "Microphone unavailable");
        setListening(false);
      }
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      try { stream?.getTracks().forEach((track) => track.stop()); } catch { /* noop */ }
      try { context?.close(); } catch { /* noop */ }
      setListening(false);
    };
  }, [enabled, inputDeviceId]);

  return { bpm, error, listening, inputDeviceId };
}
