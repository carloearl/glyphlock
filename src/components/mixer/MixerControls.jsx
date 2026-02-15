/**
 * MixerControls - Global actions bar
 */
import React from "react";
import { Plus, Archive, HelpCircle, LayoutGrid, List, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrackVibe, VIBE_META, ViewMode } from "../types/mixerTypes";

const viewIcons = { grid: LayoutGrid, list: List, mixer: Disc3 };

export default function MixerControls({
  viewMode,
  vibeFilter,
  onViewModeChange,
  onVibeFilterChange,
  onAddSong,
  onOpenArchive,
  onOpenShortcuts,
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* View toggle */}
      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden">
        {Object.entries(viewIcons).map(([mode, Icon]) => (
          <button
            key={mode}
            className={`p-1.5 transition-colors ${viewMode === mode ? "bg-purple-500/20 text-purple-300" : "text-slate-500 hover:text-white"}`}
            onClick={() => onViewModeChange(mode)}
            title={mode}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Vibe filter */}
      <Select value={vibeFilter} onValueChange={onVibeFilterChange}>
        <SelectTrigger className="w-36 h-9 bg-slate-800/60 border-slate-700 text-sm">
          <SelectValue placeholder="All Vibes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vibes</SelectItem>
          {Object.entries(VIBE_META).map(([key, meta]) => (
            <SelectItem key={key} value={key}>
              <span style={{ color: meta.color }}>{meta.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <Button size="sm" onClick={onAddSong} className="bg-gradient-to-r from-cyan-600 to-blue-600 h-9 gap-1.5">
        <Plus className="w-4 h-4" /> Add Song
      </Button>
      <Button size="sm" variant="outline" onClick={onOpenArchive} className="h-9 border-slate-700 gap-1.5">
        <Archive className="w-4 h-4" /> Archive
      </Button>
      <Button size="icon" variant="ghost" onClick={onOpenShortcuts} className="h-9 w-9" title="Shortcuts (?)">
        <HelpCircle className="w-4 h-4 text-slate-400" />
      </Button>
    </div>
  );
}