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
import { useNavigate } from "react-router-dom";
import { subscribeClubTV } from "@/components/mixer/ClubBroadcastChannel";
import YouTubePlayer from "@/components/mixer/YouTubePlayer";
import FableEngineVisualizer from "@/components/mixer/FableEngineVisualizer";
import { Disc3, Radio, Maximize2, Sparkles, Video, ListMusic } from "lucide-react";

export default function ClubTV() {
  const navigate = useNavigate();
  const [state, setState] = useState(null); // { deckA, deckB, crossfade }
  const [fs, setFs] = useState(false);
  const [view, setView] = useState("fable");
  const [playlistId, setPlaylistId] = useState("LM");
  const [playlistMuted, setPlaylistMuted] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = "NUPS · Club TV";
    const unsub = subscribeClubTV((payload) => setState(payload));
    return unsub;
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
  const visualDeck = state?.crossfade >= 50 ? "B" : "A";

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/DJHome")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs font-bold hover:bg-cyan-500/20"
            title="Return to the DJ Booth / mixer"
          >
            ← Back to Booth
          </button>
          <div className="flex items-center rounded-lg border border-purple-500/30 bg-black/50 p-0.5">
            <button
              type="button"
              onClick={() => setView("fable")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${view === "fable" ? "bg-fuchsia-500/25 text-fuchsia-100" : "text-white/45 hover:text-white/80"}`}
              title="Dream Palace Fable Engine X"
            >
              <Sparkles className="h-3 w-3" /> Fable X
            </button>
            <button
              type="button"
              onClick={() => setView("video")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${view === "video" ? "bg-cyan-500/25 text-cyan-100" : "text-white/45 hover:text-white/80"}`}
              title="Show source video or classic audio visualizer"
            >
              <Video className="h-3 w-3" /> Video
            </button>
            <button
              type="button"
              onClick={() => setView("playlist")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${view === "playlist" ? "bg-emerald-500/25 text-emerald-100" : "text-white/45 hover:text-white/80"}`}
              title="Continuous YouTube Music playlist — gapless stopgap"
            >
              <ListMusic className="h-3 w-3" /> Playlist
            </button>
          </div>
          {view === "playlist" && (
            <div className="flex items-center gap-2">
              <input
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value.trim())}
                placeholder="Playlist ID"
                className="h-7 w-28 rounded-md border border-emerald-500/30 bg-black/50 px-2 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/60"
                title="YouTube playlist list ID (LM = Liked Music, or paste any public playlist ID)"
              />
              <button
                type="button"
                onClick={() => setPlaylistMuted((m) => !m)}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${playlistMuted ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"}`}
                title={playlistMuted ? "Unmute playlist audio" : "Mute playlist audio"}
              >
                {playlistMuted ? "Unmute" : "Mute"}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={enterFullscreen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-200 text-xs font-bold hover:bg-purple-500/20"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {fs ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Main stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {view === "playlist" && (
          <div className="absolute inset-0 bg-black">
            <iframe
              key={`pl-${playlistId}-${playlistMuted ? "m" : "u"}`}
              className="h-full w-full"
              src={`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId || "LM")}&autoplay=1&mute=${playlistMuted ? 1 : 0}&loop=1&rel=0&modestbranding=1&playsinline=1`}
              title="NUPS Playlist"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {view !== "playlist" && videoId && (
          <div className={view === "video"
            ? "w-full max-w-[1600px] aspect-video m-6 shadow-[0_0_120px_rgba(168,85,247,0.4)] border-2 border-purple-500/30 rounded-2xl overflow-hidden"
            : "absolute inset-0 h-px w-px overflow-hidden opacity-0 pointer-events-none"
          }>
            <YouTubePlayer
              key={videoId /* stable muted visual source; booth owns audible playback */}
              videoId={videoId}
              autoPlay
              volume={0}
              muted
            />
          </div>
        )}

        {view !== "playlist" && (view === "fable" ? (
          <div className="absolute inset-0 bg-black">
            <FableEngineVisualizer
              track={active}
              nextTrack={visualDeck === "A" ? state?.deckB : state?.deckA}
              bpm={active?.bpm}
              activeDeck={visualDeck}
            />
          </div>
        ) : !videoId && audioUrl ? (
          <div className="w-full max-w-[900px] m-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-10 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-cyan-300" />
            <div className="text-xl font-black text-cyan-100">Visual-only stage</div>
            <div className="mt-2 text-sm text-cyan-200/70">
              The authorized audio remains owned by the booth. Fable uses deck analysis received from the session bus or a truthful tempo fallback.
            </div>
          </div>
        ) : !videoId ? (
          <div className="text-center">
            <Radio className="w-20 h-20 text-purple-500/40 mx-auto mb-4 animate-pulse" />
            <div className="text-3xl font-black text-white/70 mb-2">Awaiting DJ Signal…</div>
            <div className="text-sm text-white/40">
              Waiting for a deck to load a track from the mixer.
            </div>
          </div>
        ) : null)}
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