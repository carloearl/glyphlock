/**
 * SongCard - Individual track display with actions
 */
import React from "react";
import { Star, Archive, Play, SkipForward, ExternalLink, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import VibeBadge from "@/components/mixer/VibeBadge";
import { VIBE_META } from "@/components/mixer/types/mixerTypes";

function energyColor(level) {
  if (level <= 3) return "#06b6d4"; // cool
  if (level <= 7) return "#f59e0b"; // medium
  return "#ef4444"; // hot
}

export default function SongCard({
  song,
  isPlaying,
  isSelected,
  viewMode,
  onPlay,
  onSkip,
  onFavorite,
  onArchive,
  onEdit,
  dragHandleProps,
}) {
  const eColor = energyColor(song.energyLevel);

  const hasPlayableSource = song.youtubeUrl || song.uploadUrl;
  const openLink = () => {
    const url = song.youtubeUrl || song.uploadUrl;
    if (url) window.open(url, "_blank", "noopener");
  };
  const copyLink = () => {
    const url = song.youtubeUrl || song.uploadUrl || "";
    if (url) { navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  const isList = viewMode === "list";

  return (
    <div
      className={`group relative rounded-lg border transition-all duration-75 ${
        isPlaying
          ? "border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-500/10"
          : isSelected
          ? "border-cyan-500/40 bg-cyan-500/5"
          : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600"
      } ${isList ? "flex items-center gap-3 px-3 py-2" : "p-3 space-y-2"}`}
    >
      {/* Drag handle zone */}
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center">
        <div className="w-1 h-8 rounded bg-slate-600 group-hover:bg-slate-500" />
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="flex-shrink-0 flex items-center gap-0.5">
          <span className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      )}

      {/* Song info */}
      <div className={`flex-1 min-w-0 ${isList ? "" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{song.title}</span>
          <VibeBadge vibe={song.vibeTag} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400 truncate">{song.artist}</span>
          {/* Energy bar */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${song.energyLevel * 10}%`, backgroundColor: eColor }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: eColor }}>{song.energyLevel}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onPlay} title="Play">
          <Play className="w-3.5 h-3.5 text-green-400" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSkip} title="Skip">
          <SkipForward className="w-3.5 h-3.5 text-slate-400" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onFavorite} title="Favorite">
          <Star className={`w-3.5 h-3.5 ${song.favoriteFlag ? "text-yellow-400 fill-yellow-400" : "text-slate-500"}`} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onArchive} title="Archive">
          <Archive className="w-3.5 h-3.5 text-slate-500" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit">
          <Pencil className="w-3.5 h-3.5 text-slate-500" />
        </Button>
        {hasPlayableSource && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={openLink} title="Open link">
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyLink} title="Copy link">
          <Copy className="w-3.5 h-3.5 text-slate-500" />
        </Button>
      </div>
    </div>
  );
}