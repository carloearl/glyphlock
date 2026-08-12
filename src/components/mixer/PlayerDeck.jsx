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
import AudioVisualizer from "@/components/mixer/AudioVisualizer";

function extractVideoId(url) {
  if (!url) return null;
  const parsed = parseYoutubeUrl(url);
  if (parsed?.videoId) return parsed.videoId;
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const PlayerDeck = forwardRef(function PlayerDeck({ song, label, volume, muted, onVolumeChange, onEnded, onDropSong, autoPlay = true }, ref) {
  const [dragOver, setDragOver] = useState(false);
  const [audioEl, setAudioEl] = useState(null);
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

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
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
            <Button
              size="icon"
              variant="ghost"
              className={`h-6 w-6 ${visualizerOn ? "text-cyan-400" : "text-slate-600"}`}
              onClick={() => setVisualizerOn(v => !v)}
              title={visualizerOn ? "Hide visualizer" : "Show visualizer"}
            >
              <Waves className="w-3 h-3" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onVolumeChange(muted ? volume : 0, !muted)}>
            {muted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-slate-400" />}
          </Button>
          <Slider
            value={[muted ? 0 : volume * 100]}
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
          <div className="p-3">
            <AudioEngine
              src={song.uploadUrl}
              title={song.title}
              artist={song.artist}
              autoPlay={autoPlay}
              externalVolume={volume}
              onEnded={onEnded}
              onAudioElement={setAudioEl}
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