import React, { useCallback, useEffect, useMemo, useRef } from "react";

const READY_MESSAGE = "NUPS_FABLE_READY";
const STATE_MESSAGE = "NUPS_FABLE_STATE";

export default function FableEngineVisualizer({
  track,
  bpm,
  activeDeck = "A",
  crossfade = 50,
  transitioning = false,
  className = "",
}) {
  const iframeRef = useRef(null);

  const payload = useMemo(() => ({
    type: STATE_MESSAGE,
    title: track?.title || "N.U.P.S.",
    artist: track?.artist || "AUTONOMOUS DJ",
    bpm: Number(bpm || track?.bpm) || null,
    activeDeck,
    crossfade: Math.max(0, Math.min(100, Number(crossfade) || 0)),
    transitioning: Boolean(transitioning),
    marquee: track
      ? `NOW PLAYING · ${track.title || "UNTITLED"} · ${track.artist || "UNKNOWN ARTIST"} · DECK ${activeDeck}`
      : "N.U.P.S. · DREAM PALACE FABLE ENGINE X · AWAITING DJ SIGNAL",
  }), [track, bpm, activeDeck, crossfade, transitioning]);

  const publishState = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(payload, window.location.origin);
  }, [payload]);

  useEffect(() => {
    publishState();
  }, [publishState]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (
        event.origin === window.location.origin &&
        event.source === iframeRef.current?.contentWindow &&
        event.data?.type === READY_MESSAGE
      ) {
        publishState();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [publishState]);

  return (
    <iframe
      ref={iframeRef}
      src="/fable-engine-x.html?embedded=1"
      title="Dream Palace Fable Engine X visualizer"
      className={`block h-full w-full border-0 bg-black ${className}`}
      allow="autoplay; microphone; fullscreen"
      onLoad={publishState}
    />
  );
}
