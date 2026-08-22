/**
 * Fable deck analysis subscriber.
 *
 * Uses the canonical per-element deck graph. It never calls
 * createMediaElementSource() itself.
 */
import { useEffect, useRef, useState } from "react";
import { createFrameReader } from "./fableAnalysis";
import { getDeckAudioGraph, resumeDeckAudioContext } from "@/components/mixer/deckAudioGraph";

function findPlayingDeck() {
  const media = Array.from(document.querySelectorAll("audio, video"));
  return media.find((element) =>
    element.src && !element.paused && !element.muted && element.currentTime > 0
  ) || null;
}

export default function useFableDeckAudio({ enabled, onFrame }) {
  const [bpm, setBpm] = useState(null);
  const [connected, setConnected] = useState(false);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return undefined;
    }

    let raf = null;
    let reader = null;
    let element = null;

    const attach = () => {
      const nextElement = findPlayingDeck();
      if (!nextElement || nextElement === element) return;
      const graph = getDeckAudioGraph(nextElement);
      if (!graph?.analyser) {
        setConnected(false);
        return;
      }
      resumeDeckAudioContext();
      reader = createFrameReader(graph.analyser, { onBpm: setBpm });
      element = nextElement;
      setConnected(true);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!reader || element?.paused) attach();
      if (reader && element && !element.paused) onFrameRef.current?.(reader());
    };

    attach();
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      setConnected(false);
    };
  }, [enabled]);

  return { bpm, connected };
}
