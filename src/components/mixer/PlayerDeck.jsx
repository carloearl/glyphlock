/**
 * PlayerDeck — Single deck (A or B) for the DJ Player.
 * Uses AudioEngine for uploaded/direct audio with full transport controls.
 * Falls back to YouTube iframe for YouTube URLs.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Volume2, VolumeX, Waves, WavesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { parseYoutubeUrl } from "@/components/mixer/services/validation";
import AudioEngine from "@/components/mixer/AudioEngine";
import YouTubePlayer from "@/components/mixer/YouTubePlayer";
import AudioVisualizer, { setDeckAudioFx } from "@/components/mixer/AudioVisualizer";

function extractVideoId(url) {
  if (!url) return null;
  const parsed = parseYoutubeUrl(url);
  if (parsed?.videoId) return parsed.videoId;
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// `volume` = final playback gain (base volume × crossfader curve) — sent to the
// audio/video engine. `baseVolume` = the operator's own fader setting, which is
// what the on-screen slider shows and what mute/unmute must preserve. Mixing the
// two silences the deck: writing the crossfaded value back as the base volume
// collapses to 0 as soon as the crossfader moves or mute is toggled.
const PlayerDeck = forwardRef(function PlayerDeck({ song, label, volume, baseVolume = 1, muted, onVolumeChange, onEnded, onDropSong, onDropExternalSong, onPlaybackError, autoPlay = true }, ref) {
  const [dragOver, setDragOver] = useState(false);
  const [audioEl, setAudioEl] = useState(null);
  const [fxOpen, setFxOpen] = useState(false);
  const [fx, setFx] = useState({ low: 0, mid: 0, high: 0, filter: 100, echo: 0, delay: 0.28 });
  const youtubeRef = useRef(null);
  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null;
  const isUpload = song?.uploadUrl && !videoId;

  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoId) return youtubeRef.current?.play?.();
      return audioEl?.play?.().catch?.(() => {});
    },
    pause: () => {
      if (videoId) return youtubeRef.current?.pause?.();
      return audioEl?.pause?.();
    },
    seekTo: (seconds) => {
      if (videoId) return youtubeRef.current?.seekTo?.(seconds);
      if (audioEl) audioEl.currentTime = Number(seconds) || 0;
    },
    getCurrentTime: () => videoId ? (youtubeRef.current?.getCurrentTime?.() ?? 0) : (audioEl?.currentTime ?? 0),
    getDuration: () => videoId ? (youtubeRef.current?.getDuration?.() ?? 0) : (audioEl?.duration ?? 0),
  }), [videoId, audioEl]);
  // Visualizer preference persisted per browser
  const [visualizerOn, setVisualizerOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("mixer.visualizer") !== "off";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mixer.visualizer", visualizerOn ? "on" : "off");
    }
  }, [visualizerOn]);

  // Reset audio element reference when source changes
  useEffect(() => {
    if (!isUpload) setAudioEl(null);
  }, [isUpload, song?.uploadUrl]);

  useEffect(() => {
    if (!audioEl || !isUpload) return;
    setDeckAudioFx(audioEl, fx);
  }, [audioEl, isUpload, fx]);

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    // Library/search drags carry the full song object (not yet in mixer state).
    const raw = e.dataTransfer.getData("application/mixer-song");
    if (raw && onDropExternalSong) {
      try { onDropExternalSong(JSON.parse(raw)); return; } catch (_) { /* fall through */ }
    }
    const songId = e.dataTransfer.getData("application/mixer-song-id");
    if (songId && onDropSong) onDropSong(songId);
  };

  if (!song) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border p-3 transition-colors ${
          dragOver ? "border-purple-400 bg-purple-500/10" : "border-slate-700/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{label}</span>
        <div className="w-full aspect-video bg-black/40 rounded flex items-center justify-center">
          <span className="text-xs text-slate-600">{dragOver ? "Drop to load" : "Drag a song here"}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col bg-slate-900/40 rounded-lg border overflow-hidden transition-colors ${
        dragOver ? "border-purple-400 bg-purple-500/10" : "border-slate-700/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Deck label + volume */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/30">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
        <div className="flex items-center gap-1">
          {isUpload && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2 text-[9px] ${fxOpen ? "text-fuchsia-300 bg-fuchsia-500/10" : "text-slate-500"}`}
                onClick={() => setFxOpen(v => !v)}
                title="Open real-time deck effects"
              >
                FX
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 ${visualizerOn ? "text-cyan-400" : "text-slate-600"}`}
                onClick={() => setVisualizerOn(v => !v)}
                title={visualizerOn ? "Hide visualizer" : "Show visualizer"}
              >
                <Waves className="w-3 h-3" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onVolumeChange(baseVolume || 1, !muted)}>
            {muted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-slate-400" />}
          </Button>
          <Slider
            value={[muted ? 0 : baseVolume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100, false)}
            min={0} max={100} step={1}
            className="w-16"
          />
        </div>
      </div>

      {/* Player area */}
      {videoId ? (
        <YouTubePlayer
          ref={youtubeRef}
          videoId={videoId}
          autoPlay={autoPlay}
          volume={volume}
          muted={muted}
          onEnded={onEnded}
          onError={onPlaybackError}
        />
      ) : isUpload ? (
        <div className="flex flex-col">
          {/* Visualizer overlay — toggleable, only active when we have an <audio> element */}
          {visualizerOn && (
            <div className="relative w-full aspect-video bg-black border-b border-slate-800">
              <AudioVisualizer
                audioEl={audioEl}
                active={visualizerOn && !!audioEl}
                palette={label === "Deck B" ? "cyan" : "purple"}
              />
              {/* Track title overlay */}
              <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                <div className="text-xs font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] truncate">{song.title}</div>
                <div className="text-[10px] text-white/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] truncate">{song.artist}</div>
              </div>
            </div>
          )}
          {fxOpen && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-2 border-b border-fuchsia-500/20 bg-black/35">
              {[
                ['LOW', 'low', -12, 12, 1], ['MID', 'mid', -12, 12, 1], ['HIGH', 'high', -12, 12, 1],
                ['FILTER', 'filter', 0, 100, 1], ['ECHO', 'echo', 0, 100, 1],
              ].map(([name, key, min, max, step]) => (
                <label key={key} className="text-[8px] font-mono text-slate-500">
                  <span className="flex justify-between mb-1"><b className="text-slate-300">{name}</b><span>{fx[key]}</span></span>
                  <input type="range" min={min} max={max} step={step} value={fx[key]} onChange={(e) => setFx(v => ({ ...v, [key]: Number(e.target.value) }))} className="w-full accent-fuchsia-500" />
                </label>
              ))}
              <div className="col-span-2 md:col-span-5 flex gap-1 pt-1">
                <button onClick={() => setFx({ low: 0, mid: 0, high: 0, filter: 100, echo: 0, delay: 0.28 })} className="px-2 py-1 rounded border border-slate-700 text-[9px] text-slate-400">RESET</button>
                <button onClick={() => setFx({ low: 5, mid: -2, high: 3, filter: 100, echo: 8, delay: 0.22 })} className="px-2 py-1 rounded border border-purple-500/40 text-[9px] text-purple-300">CLUB</button>
                <button onClick={() => setFx(v => ({ ...v, filter: 38, echo: 0 }))} className="px-2 py-1 rounded border border-cyan-500/40 text-[9px] text-cyan-300">LOW PASS</button>
                <button onClick={() => setFx(v => ({ ...v, echo: 58, delay: 0.31 }))} className="px-2 py-1 rounded border border-fuchsia-500/40 text-[9px] text-fuchsia-300">ECHO</button>
              </div>
            </div>
          )}
          <div className="p-3">
            <AudioEngine
              src={song.uploadUrl}
              title={song.title}
              artist={song.artist}
              autoPlay={autoPlay}
              externalVolume={volume}
              onEnded={onEnded}
              onAudioElement={setAudioEl}
              onError={onPlaybackError}
            />
          </div>
        </div>
      ) : (
        <div className="w-full aspect-video bg-black/40 flex flex-col items-center justify-center gap-1 p-2">
          <span className="text-xs text-slate-600">No playable source</span>
          <span className="text-[9px] text-slate-700">Add a YouTube URL or upload audio</span>
        </div>
      )}

      {/* Track info (for YouTube — AudioEngine shows its own) */}
      {videoId && (
        <div className="px-3 py-1.5 bg-slate-900/60">
          <p className="text-xs text-white truncate font-medium">{song.title}</p>
          <p className="text-[10px] text-slate-500 truncate">{song.artist}</p>
        </div>
      )}
    </div>
  );
});

export default PlayerDeck;