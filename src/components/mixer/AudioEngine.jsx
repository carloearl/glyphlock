/**
 * AudioEngine — Full-featured HTML5 audio player with transport controls,
 * seek bar, volume, progress visualization, and waveform-style display.
 * 
 * Works with uploaded audio URLs and any direct audio source.
 * For YouTube tracks, falls back to iframe embed (no seek/volume control).
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

function formatTime(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioEngine({
  src,
  title = "Unknown Track",
  artist = "",
  autoPlay = false,
  externalVolume,
  onEnded,
  onNext,
  onPrev,
  onPlayStateChange,
  onAudioElement, // called with the <audio> DOM element (for visualizer tap)
  onError,
}) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const animRef = useRef(null);

  // Expose the audio element upward (once) for the visualizer
  useEffect(() => {
    if (audioRef.current && onAudioElement) onAudioElement(audioRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Load new source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.src = src;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    if (autoPlay) {
      audio.play().then(() => setPlaying(true)).catch((error) => onError?.({ source: "audio", message: error?.message || "Audio autoplay failed" }));
    } else {
      setPlaying(false);
    }
  }, [src]);

  // Sync external volume override
  useEffect(() => {
    if (externalVolume !== undefined && externalVolume !== null && audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, externalVolume));
    }
  }, [externalVolume]);

  // Sync volume (only when no external override)
  useEffect(() => {
    if (externalVolume !== undefined && externalVolume !== null) return;
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted, externalVolume]);

  // Sync loop
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  // Animation frame for smooth progress
  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      setCurrentTime(audio.currentTime);
      // Buffered
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    }
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMeta = () => setDuration(audio.duration);
    const onPlay = () => { setPlaying(true); onPlayStateChange?.(true); };
    const onPause = () => { setPlaying(false); onPlayStateChange?.(false); };
    const onEnd = () => {
      setPlaying(false);
      onPlayStateChange?.(false);
      onEnded?.();
    };
    const onMediaError = () => {
      const mediaError = audio.error;
      onError?.({ source: "audio", code: mediaError?.code, message: mediaError?.message || `Audio media error ${mediaError?.code || "unknown"}` });
    };

    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onMediaError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onMediaError);
    };
  }, [onEnded, onPlayStateChange, onError]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (audio.paused) {
      audio.play().catch((error) => onError?.({ source: "audio", message: error?.message || "Audio play failed" }));
    } else {
      audio.pause();
    }
  };

  const handleSeek = (values) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (values[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (values) => {
    const v = values[0] / 100;
    setVolume(v);
    if (v > 0 && muted) setMuted(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      <audio ref={audioRef} preload="metadata" />

      {/* Waveform-style progress visualization */}
      <div
        ref={progressRef}
        className="relative h-10 rounded-lg overflow-hidden bg-black/50 border border-white/[0.06] cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          handleSeek([Math.max(0, Math.min(100, pct))]);
        }}
      >
        {/* Buffer bar */}
        <div
          className="absolute inset-y-0 left-0 bg-white/[0.04] transition-[width] duration-300"
          style={{ width: `${bufferProgress}%` }}
        />
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-75"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(87,61,255,0.4), rgba(168,85,247,0.5))',
          }}
        />
        {/* Faux waveform bars */}
        <div className="absolute inset-0 flex items-center justify-around px-1 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => {
            const isPast = (i / 48) * 100 < progress;
            const h = 8 + Math.sin(i * 0.7) * 6 + Math.cos(i * 1.3) * 4;
            return (
              <div
                key={i}
                className="rounded-full transition-colors duration-100"
                style={{
                  width: 2,
                  height: `${h}px`,
                  backgroundColor: isPast ? 'rgba(168,85,247,0.8)' : 'rgba(255,255,255,0.12)',
                }}
              />
            );
          })}
        </div>
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)] transition-[left] duration-75"
          style={{ left: `${progress}%` }}
        />
        {/* Hover tooltip time */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-0.5">
          <span className="text-[9px] text-white/60 font-mono bg-black/60 px-1 rounded">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-2">
        {/* Time */}
        <span className="text-[10px] font-mono text-gray-500 w-10 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>

        {/* Prev */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onPrev}
          disabled={!onPrev}
          title="Previous"
        >
          <SkipBack className="w-3.5 h-3.5 text-gray-400" />
        </Button>

        {/* Play / Pause */}
        <Button
          size="icon"
          variant="ghost"
          className={`h-10 w-10 rounded-full border transition-all ${
            playing
              ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
              : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
          }`}
          onClick={togglePlay}
          disabled={!src}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>

        {/* Next / Skip */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onNext}
          disabled={!onNext}
          title="Skip"
        >
          <SkipForward className="w-3.5 h-3.5 text-gray-400" />
        </Button>

        {/* Duration */}
        <span className="text-[10px] font-mono text-gray-500 w-10 tabular-nums">
          {formatTime(duration)}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Loop */}
        <Button
          size="icon"
          variant="ghost"
          className={`h-7 w-7 ${loop ? 'text-purple-400' : 'text-gray-600'}`}
          onClick={() => setLoop(!loop)}
          title="Loop"
        >
          <Repeat className="w-3.5 h-3.5" />
        </Button>

        {/* Volume */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setMuted(!muted)}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted || volume === 0
            ? <VolumeX className="w-3.5 h-3.5 text-red-400" />
            : <Volume2 className="w-3.5 h-3.5 text-gray-400" />
          }
        </Button>
        <div className="w-20">
          <Slider
            value={[muted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>

      {/* Track info */}
      {title && (
        <div className="flex items-center gap-2 px-1">
          {playing && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <span className="w-1 h-2.5 bg-purple-400 rounded-full animate-pulse" />
              <span className="w-1 h-3.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <span className="text-xs text-white font-medium truncate">{title}</span>
          {artist && <span className="text-[10px] text-gray-500 truncate">— {artist}</span>}
        </div>
      )}
    </div>
  );
}