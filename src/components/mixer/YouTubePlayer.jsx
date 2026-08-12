/**
 * YouTubePlayer — Real YouTube IFrame API wrapper.
 * Exposes programmatic volume, play, pause, seek — so the mixer crossfader
 * actually crossfades YouTube audio (not just a cosmetic slider).
 *
 * Loads the YT IFrame API once per page, safe to mount many decks.
 */
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";

// ─── Global YT API loader (singleton) ───
let ytApiPromise = null;
function loadYouTubeAPI() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(tag, first);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) try { prev(); } catch (_) { /* noop */ }
      resolve(window.YT);
    };
  });
  return ytApiPromise;
}

const YouTubePlayer = forwardRef(function YouTubePlayer(
  { videoId, autoPlay = true, volume = 1, muted = false, onEnded, onReady, onStateChange, onError },
  ref
) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Expose imperative controls (play/pause/seek) to parent
  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo?.(),
    pause: () => playerRef.current?.pauseVideo?.(),
    seekTo: (s) => playerRef.current?.seekTo?.(s, true),
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
    getDuration: () => playerRef.current?.getDuration?.() ?? 0,
  }), []);

  // Mount player when videoId / container available
  useEffect(() => {
    let cancelled = false;
    if (!videoId || !containerRef.current) return;

    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      // Destroy any prior instance to reset cleanly
      try { playerRef.current?.destroy?.(); } catch (_) { /* noop */ }

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (e) => {
            setReady(true);
            try {
              e.target.setVolume(Math.round((muted ? 0 : volume) * 100));
              if (muted) e.target.mute(); else e.target.unMute();
              if (autoPlay) e.target.playVideo();
            } catch (_) { /* noop */ }
            onReady && onReady(e);
          },
          onStateChange: (e) => {
            onStateChange && onStateChange(e.data);
            // 0 = ended
            if (e.data === 0 && onEnded) onEnded();
          },
          onError: (e) => {
            onError?.({ source: "youtube", code: e.data, message: `YouTube playback error ${e.data}` });
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch (_) { /* noop */ }
      playerRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Live volume/mute updates — this is what makes the crossfader actually work
  useEffect(() => {
    if (!ready || !playerRef.current) return;
    try {
      const pct = Math.max(0, Math.min(100, Math.round((muted ? 0 : volume) * 100)));
      playerRef.current.setVolume(pct);
      if (muted) playerRef.current.mute(); else playerRef.current.unMute();
    } catch (_) { /* noop */ }
  }, [volume, muted, ready]);

  return (
    <div className="relative w-full aspect-video bg-black">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
});

export default YouTubePlayer;