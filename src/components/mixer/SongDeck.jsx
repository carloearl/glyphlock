/**
 * SongDeck - Playlist for active profile with drag-drop reorder
 * Uses @hello-pangea/dnd (installed in project)
 */
import React, { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Music } from "lucide-react";
import SongCard from "@/components/mixer/components/SongCard";
import { emitTelemetry } from "@/components/mixer/events/mixerTelemetry";

export default function SongDeck({
  songs,
  profile,
  playingSongId,
  selectedSongId,
  viewMode,
  searchQuery,
  vibeFilter,
  onReorder,
  onPlay,
  onSkip,
  onFavorite,
  onArchive,
  onEdit,
  onSelectSong,
  onFocusZone,
}) {
  const profileSongs = useMemo(() => {
    if (!profile) return [];
    return profile.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean)
      .filter((s) => !s.archivedFlag);
  }, [profile, songs]);

  const filtered = useMemo(() => {
    let list = profileSongs;
    if (vibeFilter && vibeFilter !== "all") {
      list = list.filter((s) => s.vibeTag === vibeFilter);
    }
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }
    return list;
  }, [profileSongs, vibeFilter, searchQuery]);

  const handleDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const songId = filtered[result.source.index]?.id;
    emitTelemetry("PLAYLIST_REORDER", { songId, oldIndex: result.source.index, newIndex: result.destination.index });
    onReorder(result.source.index, result.destination.index, filtered);
  };

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <div className="text-center space-y-2">
          <Music className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm">Select or create a dancer profile</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      onClick={() => onFocusZone("deck")}
      tabIndex={-1}
    >
      {/* Deck header */}
      <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: profile.colorTheme }} />
        <span className="text-sm font-semibold text-white">{profile.name}</span>
        <span className="text-xs text-slate-500">· {filtered.length} tracks</span>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {profileSongs.length === 0 ? "No songs in this deck. Add some!" : "No songs match your filters."}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="song-deck">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {filtered.map((song, idx) => (
                    <Draggable key={song.id} draggableId={song.id} index={idx}>
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          onClick={() => onSelectSong(song.id)}
                        >
                          <SongCard
                            song={song}
                            isPlaying={song.id === playingSongId}
                            isSelected={song.id === selectedSongId}
                            viewMode={viewMode}
                            onPlay={() => onPlay(song.id)}
                            onSkip={() => onSkip(song.id)}
                            onFavorite={() => onFavorite(song.id)}
                            onArchive={() => onArchive(song.id)}
                            onEdit={() => onEdit(song)}
                            dragHandleProps={prov.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}