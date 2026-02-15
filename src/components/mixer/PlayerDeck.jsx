/**
 * PlayerDeck — Embedded YouTube iframe player for a single deck (A or B)
 * Extracts YouTube video ID and renders an iframe with autoplay.
 * Also supports uploaded file playback via <audio>.
 */
import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { parseYoutubeUrl } from "@/components/mixer/services/validation";

function extractVideoId(url) {
  if (!url) return null;
  const parsed = parseYoutubeUrl(url);
  if (parsed?.videoId) return parsed.videoId;
  // fallback regex
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function PlayerDeck({ song, label, volume, muted, onVolumeChange, onEnded }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null;
  const isUpload = song?.uploadUrl && !videoId;

  // Sync volume to audio element for uploads
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  if (!song) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 rounded-lg border border-slate-700/30 p-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{label}</span>
        <div className="w-full aspect-video bg-black/40 rounded flex items-center justify-center">
          <span className="text-xs text-slate-600">No track loaded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900/40 rounded-lg border border-slate-700/30 overflow-hidden">
      {/* Deck label */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/30">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
        <div className="flex items-center gap-1">
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
      <div className="relative w-full aspect-video bg-black">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&volume=${Math.round(volume * 100)}`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={song.title}
          />
        ) : isUpload ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <audio
              ref={audioRef}
              src={song.uploadUrl}
              onEnded={onEnded}
              className="hidden"
            />
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-purple-400" />
                ) : (
                  <Play className="w-6 h-6 text-purple-400 ml-0.5" />
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={togglePlay} className="text-xs text-slate-300">
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs">
            No playable source
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="px-3 py-1.5 bg-slate-900/60">
        <p className="text-xs text-white truncate font-medium">{song.title}</p>
        <p className="text-[10px] text-slate-500 truncate">{song.artist}</p>
      </div>
    </div>
  );
}