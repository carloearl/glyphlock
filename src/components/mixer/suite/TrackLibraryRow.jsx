import React from 'react';
import { Music, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEntityToMixerSong, isEntityTrackPlayable } from '@/lib/djTrackAdapter';

/**
 * One Track Library row. Playable tracks are draggable straight onto Deck A/B
 * using the mixer's drag protocol; unplayable rows are flagged and locked.
 */
export default function TrackLibraryRow({ track, onDelete }) {
  const playable = isEntityTrackPlayable(track);

  function handleDragStart(e) {
    const song = trackEntityToMixerSong(track);
    if (!song) return;
    e.dataTransfer.setData('application/mixer-song', JSON.stringify(song));
    e.dataTransfer.setData('application/mixer-song-id', song.id);
    e.dataTransfer.setData('text/plain', song.youtubeUrl || song.uploadUrl || '');
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <Card
      draggable={playable}
      onDragStart={playable ? handleDragStart : undefined}
      className={`bg-slate-900/50 border-slate-700/50 transition ${
        playable ? 'hover:border-purple-500/50 cursor-grab active:cursor-grabbing' : 'opacity-60 border-amber-600/40'
      }`}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <GripVertical className={`w-4 h-4 flex-shrink-0 ${playable ? 'text-slate-600' : 'text-slate-800'}`} />
        {track.thumbnail_url ? (
          <img src={track.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover pointer-events-none" />
        ) : (
          <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center"><Music className="w-5 h-5 text-slate-500" /></div>
        )}
        <div className="flex-1 min-w-0 pointer-events-none">
          <div className="text-sm font-semibold text-white truncate">{track.title}</div>
          <div className="text-xs text-gray-400 truncate">{track.artist || '—'}</div>
        </div>
        <div className="hidden sm:flex gap-1 flex-wrap">
          {!playable && (
            <Badge variant="outline" className="text-xs border-amber-500/60 text-amber-300 gap-1">
              <AlertTriangle className="w-3 h-3" /> No audio
            </Badge>
          )}
          {track.genre && <Badge variant="outline" className="text-xs">{track.genre}</Badge>}
          {track.mood && <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">{track.mood}</Badge>}
          {track.bpm && <Badge variant="outline" className="text-xs">{track.bpm} BPM</Badge>}
          {track.source && track.source !== 'manual' && <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">{track.source}</Badge>}
        </div>
        <Button size="icon" variant="ghost" onClick={() => onDelete(track.id)} className="text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4 pointer-events-none" />
        </Button>
      </CardContent>
    </Card>
  );
}