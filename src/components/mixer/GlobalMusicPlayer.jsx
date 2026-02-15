/**
 * GlobalMusicPlayer — Standalone music player widget.
 * Drop this anywhere in the app for instant music playback
 * with full transport controls, waveform progress, and volume.
 * 
 * Can be used independently of the Mixer module.
 */
import React, { useState, useCallback } from "react";
import AudioEngine from "@/components/mixer/AudioEngine";
import { Music, ChevronDown, ChevronUp, ListMusic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalMusicPlayer({ playlist = [], initialTrackIndex = 0 }) {
  const [trackIndex, setTrackIndex] = useState(initialTrackIndex);
  const [collapsed, setCollapsed] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const currentTrack = playlist[trackIndex] || null;

  const handleNext = useCallback(() => {
    if (trackIndex < playlist.length - 1) setTrackIndex(i => i + 1);
  }, [trackIndex, playlist.length]);

  const handlePrev = useCallback(() => {
    if (trackIndex > 0) setTrackIndex(i => i - 1);
  }, [trackIndex]);

  const handleEnded = useCallback(() => {
    if (trackIndex < playlist.length - 1) {
      setTrackIndex(i => i + 1);
    }
  }, [trackIndex, playlist.length]);

  if (!playlist.length) return null;

  if (collapsed) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:border-purple-500/40 transition-colors"
        onClick={() => setCollapsed(false)}
      >
        <div className="flex gap-0.5 items-center">
          <span className="w-1 h-2.5 bg-purple-400 rounded-full animate-pulse" />
          <span className="w-1 h-3.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-white truncate max-w-[180px]">
          {currentTrack?.title || "Music Player"}
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Music className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Now Playing</span>
          {playlist.length > 1 && (
            <span className="text-[9px] text-slate-600">
              {trackIndex + 1}/{playlist.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {playlist.length > 1 && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowQueue(!showQueue)}>
              <ListMusic className="w-3 h-3 text-slate-400" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCollapsed(true)}>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Queue */}
      {showQueue && (
        <div className="max-h-40 overflow-y-auto border-b border-slate-700/30 bg-black/30">
          {playlist.map((t, i) => (
            <button
              key={i}
              onClick={() => { setTrackIndex(i); setShowQueue(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-slate-800/50 transition-colors ${
                i === trackIndex ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400'
              }`}
            >
              <span className="w-4 text-[10px] text-slate-600 text-right">{i + 1}</span>
              <span className="truncate">{t.title}</span>
              <span className="text-[10px] text-slate-600 ml-auto flex-shrink-0">{t.artist}</span>
            </button>
          ))}
        </div>
      )}

      {/* Player */}
      <div className="p-3">
        <AudioEngine
          src={currentTrack?.src || currentTrack?.uploadUrl || currentTrack?.audio_url}
          title={currentTrack?.title}
          artist={currentTrack?.artist}
          autoPlay={true}
          onEnded={handleEnded}
          onNext={trackIndex < playlist.length - 1 ? handleNext : undefined}
          onPrev={trackIndex > 0 ? handlePrev : undefined}
        />
      </div>
    </div>
  );
}