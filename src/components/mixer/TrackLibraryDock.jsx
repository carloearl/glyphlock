/**
 * TrackLibraryDock — searchable NUPS Track Library panel living INSIDE the
 * mixer view, right next to the decks. Every row is draggable onto Deck A/B,
 * has a one-tap Play (loads live deck) and Queue (adds to active playlist).
 */
import React, { useMemo, useState } from "react";
import { Search, Play, ListPlus, ListMusic, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trackEntityToMixerSong, isEntityTrackPlayable } from "@/lib/djTrackAdapter";

export default function TrackLibraryDock({ tracks = [], onPlay, onQueue, onQueueAll, onLoadDeck }) {
  const [query, setQuery] = useState("");

  const playable = useMemo(() => tracks.filter(isEntityTrackPlayable), [tracks]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return playable;
    return playable.filter((t) =>
      `${t.title || ""} ${t.artist || ""} ${t.genre || ""} ${t.mood || ""}`.toLowerCase().includes(q)
    );
  }, [playable, query]);

  const handleDragStart = (e, track) => {
    const song = trackEntityToMixerSong(track);
    if (!song) return;
    e.dataTransfer.setData("application/mixer-song", JSON.stringify(song));
    e.dataTransfer.setData("application/mixer-song-id", song.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
      {/* Search + queue-all */}
      <div className="p-2 space-y-2 border-b border-slate-700/30">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search library…"
            className="h-8 pl-8 text-xs bg-slate-900/60 border-slate-700/50"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!filtered.length}
          onClick={() => onQueueAll?.(filtered.map(trackEntityToMixerSong).filter(Boolean))}
          className="w-full h-8 text-xs gap-1.5 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
        >
          <ListMusic className="w-3.5 h-3.5" /> Queue All ({filtered.length}) → Playlist
        </Button>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-slate-500 py-8">
            {playable.length === 0 ? "No playable tracks in the library yet — import some in Track Library / YT Search." : "No matches."}
          </div>
        )}
        {filtered.map((track) => (
          <div
            key={track.id}
            draggable
            onDragStart={(e) => handleDragStart(e, track)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 hover:border-purple-500/50 cursor-grab active:cursor-grabbing"
            title="Drag onto Deck A or Deck B"
          >
            {track.thumbnail_url ? (
              <img src={track.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover pointer-events-none flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Music className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
            <div className="flex-1 min-w-0 pointer-events-none">
              <div className="text-xs font-semibold text-white truncate">{track.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{track.artist || "—"}{track.bpm ? ` · ${track.bpm} BPM` : ""}</div>
            </div>
            {["A", "B"].map((deck) => (
              <Button
                key={deck}
                size="sm"
                variant="outline"
                className="h-7 min-w-7 px-1 text-[9px] font-black text-violet-300"
                onClick={() => onLoadDeck?.(trackEntityToMixerSong(track), deck)}
                aria-label={`Load ${track.title} to Deck ${deck}`}
                title={`Load Deck ${deck}`}
              >
                {deck}
              </Button>
            ))}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => onPlay?.(trackEntityToMixerSong(track))}
              title="Play now on live deck"
            >
              <Play className="w-3.5 h-3.5 pointer-events-none" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => onQueue?.(trackEntityToMixerSong(track))}
              title="Add to playlist queue"
            >
              <ListPlus className="w-3.5 h-3.5 pointer-events-none" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}