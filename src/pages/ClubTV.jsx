/**
 * ClubTV — fullscreen display window meant to be duplicated/cast to club TVs.
 *
 * Subscribes to the DJ mixer broadcast channel and renders whichever deck is
 * louder (per crossfader) as a massive, branded fullscreen video.
 *
 * Usage: opened via window.open("/ClubTV"). Then the user:
 *   • Drags the window onto the TV-connected display, OR
 *   • Uses browser "Cast…" to mirror the tab to a Chromecast / AirPlay display.
 */
import React, { useEffect, useState, useRef } from "react";
import { subscribeClubTV } from "@/components/mixer/ClubBroadcastChannel";
import YouTubePlayer from "@/components/mixer/YouTubePlayer";
import AudioVisualizer from "@/components/mixer/AudioVisualizer";
import { Disc3, Radio, Maximize2, Volume2 } from "lucide-react";

export default function ClubTV() {
  const [state, setState] = useState(null); // { deckA, deckB, crossfade }
  const [fs, setFs] = useState(false);
  const [audioEl, setAudioEl] = useState(null);
  const rootRef = useRef(null);
  const audioTagRef = useRef(null);

  useEffect(() => {
    document.title = "NUPS · Club TV";
    const unsub = subscribeClubTV((payload) => setState(payload));
    return unsub;
  }, []);

  // Expose audio tag to visualizer
  useEffect(() => {
    if (audioTagRef.current) setAudioEl(audioTagRef.current);
  }, []);

  const enterFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFs(false);
      } else {
        await rootRef.current?.requestFullscreen?.();
        setFs(true);
      }
    } catch (_) { /* noop */ }
  };

  const active =
    state?.crossfade >= 50 ? state?.deckB : state?.deckA; // louder deck wins
  const videoId = active?.videoId || null;
  const audioUrl = active?.audioUrl || null;

  // Load audio URL into TV's <audio> tag when it changes
  useEffect(() => {
    const el = audioTagRef.current;
    if (!el) return;
    if (audioUrl && el.src !== audioUrl) {
      el.src = audioUrl;
      el.play().catch(() => {});
    } else if (!audioUrl) {
      try { el.pause(); el.removeAttribute("src"); el.load(); } catch (_) {}
    }
  }, [audioUrl]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden"
      style={{ zIndex: 100000 }}
    >
      {/* Top brand bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-950/80 via-black to-fuchsia-950/80 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <Disc3 className="w-6 h-6 text-purple-400 animate-spin" style={{ animationDuration: "4s" }} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-purple-300/80 font-bold">
              N.U.P.S. Club TV
            </div>
            <div className="text-sm font-black text-white">LIVE · AUTONOMOUS DJ</div>
          </div>
        </div>
        <button
          type="button"
          onClick={enterFullscreen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-200 text-xs font-bold hover:bg-purple-500/20"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {fs ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      {/* Main stage */}
      <div className="flex-1 relative flex items-center justify-center p-6">
        {videoId ? (
          <div className="w-full max-w-[1600px] aspect-video shadow-[0_0_120px_rgba(168,85,247,0.4)] border-2 border-purple-500/30 rounded-2xl overflow-hidden">
            <YouTubePlayer
              key={videoId /* force remount when track switches */}
              videoId={videoId}
              autoPlay
              volume={1}
              muted={false}
            />
          </div>
        ) : audioUrl ? (
          <div className="w-full max-w-[1600px] aspect-video shadow-[0_0_120px_rgba(6,182,212,0.4)] border-2 border-cyan-500/30 rounded-2xl overflow-hidden relative bg-black">
            {/* Hidden audio element feeds the visualizer */}
            <audio ref={audioTagRef} crossOrigin="anonymous" autoPlay />
            <AudioVisualizer audioEl={audioEl} active palette="cyan" mode="combo" />
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-cyan-500/40">
              <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest">Audio Only</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Radio className="w-20 h-20 text-purple-500/40 mx-auto mb-4 animate-pulse" />
            <div className="text-3xl font-black text-white/70 mb-2">Awaiting DJ Signal…</div>
            <div className="text-sm text-white/40">
              Waiting for a deck to load a track from the mixer.
            </div>
          </div>
        )}
      </div>

      {/* Bottom ticker */}
      <div className="px-6 py-3 bg-gradient-to-r from-black via-purple-950/40 to-black border-t border-purple-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> ON AIR
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {active?.title || "—"}
            </div>
            <div className="text-[11px] text-white/50 truncate">
              {active?.artist || "—"}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] text-white/60">
          <span>
            Deck A: <span className="text-purple-300">{state?.deckA?.title?.slice(0, 30) || "—"}</span>
          </span>
          <span>
            Deck B: <span className="text-fuchsia-300">{state?.deckB?.title?.slice(0, 30) || "—"}</span>
          </span>
          <span>
            X-Fade: <span className="text-cyan-300 font-mono">{Math.round(state?.crossfade ?? 50)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}