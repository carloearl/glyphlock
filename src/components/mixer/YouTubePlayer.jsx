/**
 * Stable YouTube IFrame adapter for the persistent NUPS DJ playback owner.
 * Layout/view changes never own this player and therefore cannot remount it.
 */
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import {
  YOUTUBE_STATES,
  advanceYouTubeWatchdog,
  classifyYouTubeError,
  createYouTubeCommandGate,
  createYouTubeWatchdogState,
} from "@/components/mixer/session/youtubeHealth";

let ytApiPromise = null;

function loadYouTubeAPI() {
  if (typeof window === "undefined") return Promise.reject(new Error("YouTube requires a browser"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const tag = existing || document.createElement("script");
    if (!existing) {
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      const first = document.getElementsByTagName("script")[0];
      first?.parentNode?.insertBefore(tag, first);
    }
    const timeout = window.setTimeout(() => reject(new Error("YouTube IFrame API timed out")), 15000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      try { previous?.(); } catch { /* another consumer is isolated */ }
      resolve(window.YT);
    };
    tag.addEventListener?.("error", () => {
      window.clearTimeout(timeout);
      reject(new Error("YouTube IFrame API failed to load"));
    }, { once: true });
  }).catch((error) => {
    ytApiPromise = null;
    throw error;
  });
  return ytApiPromise;
}

const YouTubePlayer = forwardRef(function YouTubePlayer(
  {
    videoId,
    autoPlay = true,
    volume = 1,
    muted = false,
    onEnded,
    onReady,
    onStateChange,
    onError,
    onHealth,
  },
  ref,
) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const stateRef = useRef("UNSTARTED");
  const watchdogRef = useRef(createYouTubeWatchdogState());
  const commandGateRef = useRef(createYouTubeCommandGate({ volumeCadenceMs: 100, volumeDelta: 1 }));
  const operatorNotifiedRef = useRef(false);
  const [ready, setReady] = useState(false);

  const emitHealth = useCallback((providerState, extra = {}) => {
    const player = playerRef.current;
    let position = 0;
    let duration = 0;
    try {
      position = Number(player?.getCurrentTime?.() || 0);
      duration = Number(player?.getDuration?.() || 0);
    } catch { /* provider is between states */ }
    onHealth?.({
      source: "youtube",
      sourceId: videoId,
      providerState,
      position,
      duration,
      visibility: typeof document === "undefined" ? "unknown" : document.visibilityState,
      online: typeof navigator === "undefined" ? true : navigator.onLine,
      retryCount: watchdogRef.current.retryCount,
      ...extra,
    });
  }, [onHealth, videoId]);

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo?.(),
    pause: () => playerRef.current?.pauseVideo?.(),
    seekTo: (seconds) => playerRef.current?.seekTo?.(Number(seconds) || 0, true),
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    getDuration: () => playerRef.current?.getDuration?.() ?? 0,
    getProviderState: () => stateRef.current,
  }), []);

  useEffect(() => {
    let cancelled = false;
    if (!videoId || !containerRef.current) return undefined;

    setReady(false);
    operatorNotifiedRef.current = false;
    watchdogRef.current = createYouTubeWatchdogState();
    commandGateRef.current.reset();

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;
      try { playerRef.current?.destroy?.(); } catch { /* stale instance */ }

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setReady(true);
            stateRef.current = "READY";
            try {
              event.target.getIframe?.().setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
              const percent = Math.max(0, Math.min(100, Math.round(Number(volume) * 100)));
              event.target.setVolume(percent);
              if (muted) event.target.mute(); else event.target.unMute();
              commandGateRef.current.shouldApplyVolume(percent, performance.now());
              commandGateRef.current.shouldApplyMute(muted);
              if (autoPlay) event.target.playVideo();
            } catch { /* provider can still report its next state */ }
            emitHealth("READY", { effectiveVolume: muted ? 0 : volume, muted, muteReason: muted ? "deck-or-master" : null });
            onReady?.(event);
          },
          onStateChange: (event) => {
            const providerState = YOUTUBE_STATES[event.data] || `UNKNOWN_${event.data}`;
            stateRef.current = providerState;
            emitHealth(providerState, {
              effectiveVolume: muted ? 0 : volume,
              muted,
              muteReason: muted ? "deck-or-master" : null,
            });
            onStateChange?.(event.data);
            if (providerState === "ENDED") onEnded?.();
          },
          onAutoplayBlocked: () => {
            stateRef.current = "AUTOPLAY_BLOCKED";
            emitHealth("AUTOPLAY_BLOCKED", { resolution: "Use Play after an operator gesture." });
            onError?.({
              source: "youtube",
              code: "AUTOPLAY_BLOCKED",
              retryable: true,
              message: "Browser autoplay was blocked. Press Play once to authorize the DJ session.",
            });
          },
          onError: (event) => {
            const error = classifyYouTubeError(event.data);
            stateRef.current = "ERROR";
            emitHealth("ERROR", { errorCode: error.code, resolution: error.message });
            onError?.(error);
          },
        },
      });
    }).catch((error) => {
      if (cancelled) return;
      stateRef.current = "ERROR";
      emitHealth("ERROR", { resolution: error.message });
      onError?.({ source: "youtube", code: "API_LOAD", retryable: true, message: error.message });
    });

    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch { /* already destroyed */ }
      playerRef.current = null;
      stateRef.current = "UNSTARTED";
      setReady(false);
    };
  }, [videoId]);

  // Mute is a separate state transition. Volume writes are coalesced and
  // throttled so a requestAnimationFrame crossfade cannot spam the IFrame API.
  useEffect(() => {
    if (!ready || !playerRef.current) return undefined;
    const player = playerRef.current;
    if (commandGateRef.current.shouldApplyMute(muted)) {
      try { if (muted) player.mute(); else player.unMute(); } catch { /* state event will diagnose */ }
    }
    const timer = window.setTimeout(() => {
      const percent = Math.max(0, Math.min(100, Math.round(Number(volume) * 100)));
      if (commandGateRef.current.shouldApplyVolume(percent, performance.now())) {
        try { player.setVolume(percent); } catch { /* state event will diagnose */ }
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [volume, muted, ready]);

  // A bounded watchdog distinguishes provider BUFFERING from a frozen PLAYING
  // clock. It retries once, then requests operator action or Auto-DJ failover.
  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      let position = 0;
      try { position = Number(player.getCurrentTime?.() || 0); } catch { return; }
      const next = advanceYouTubeWatchdog(watchdogRef.current, {
        now: performance.now(),
        position,
        state: stateRef.current,
      });
      watchdogRef.current = next;
      if (next.action === "retry") {
        emitHealth("STALLED", { resolution: "One bounded resume attempt.", retryCount: next.retryCount });
        try {
          player.seekTo(position, true);
          player.playVideo();
        } catch { /* next interval escalates */ }
      } else if (next.action === "operator" && !operatorNotifiedRef.current) {
        operatorNotifiedRef.current = true;
        const error = {
          source: "youtube",
          code: "STALL",
          retryable: false,
          message: "YouTube stopped advancing after one recovery attempt. Load the backup source or take manual control.",
        };
        emitHealth("STALLED", { resolution: error.message, retryCount: next.retryCount });
        onError?.(error);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ready, emitHealth, onError]);

  return (
    <div className="relative aspect-video w-full bg-black" data-youtube-player-host={videoId}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40 text-[10px] uppercase tracking-wider text-slate-400">
          Connecting YouTube
        </div>
      )}
    </div>
  );
});

export default YouTubePlayer;
