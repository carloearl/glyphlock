/**
 * useFableDeckAudio — taps the DJ deck's own audio element so the visuals are
 * locked to the track that is actually playing (Serato / VirtualDJ behaviour),
 * instead of guessing from the room mic.
 *
 * The element is routed source → analyser → destination, so playback keeps
 * flowing to the club output exactly as before; we only measure it. Each element
 * can be tapped only once per AudioContext, so taps are cached in a WeakMap.
 */
import { useEffect, useRef, useState } from "react";
import { createFrameReader } from "./fableAnalysis";

let sharedCtx = null;
const taps = new WeakMap();

function getCtx() {
  if (!sharedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    sharedCtx = new AC();
  }
  if (sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function findPlayingDeck() {
  const media = Array.from(document.querySelectorAll("audio, video"));
  return media.find((el) => el.src && !el.paused && !el.muted && el.currentTime > 0) || null;
}

/** source→analyser→destination tap for one media element (cached). */
function tapElement(el) {
  if (taps.has(el)) return taps.get(el);
  const ctx = getCtx();
  const source = ctx.createMediaElementSource(el);
  const analyser = ctx.createAnalyser();
  source.connect(analyser);
  analyser.connect(ctx.destination); // keeps the deck audible
  taps.set(el, analyser);
  return analyser;
}

export default function useFableDeckAudio({ enabled, onFrame }) {
  const [bpm, setBpm] = useState(null);
  const [connected, setConnected] = useState(false);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let raf = null;
    let reader = null;
    let element = null;

    const attach = () => {
      const el = findPlayingDeck();
      if (!el || el === element) return;
      try {
        const ctx = getCtx();
        const analyser = tapElement(el);
        reader = createFrameReader(analyser, { onBpm: setBpm });
        element = el;
        setConnected(true);
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
      } catch {
        setConnected(false);
      }
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!reader || element?.paused) attach();
      if (reader) onFrameRef.current?.(reader());
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