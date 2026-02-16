/**
 * DJPlayerSection — Dual-deck player with crossfader
 * Manages Deck A / Deck B state, volume derived from crossfader position,
 * and next-track auto-load.
 */
import React, { useState, useCallback, useMemo } from "react";
import PlayerDeck from "@/components/mixer/PlayerDeck";
import Crossfader from "@/components/mixer/Crossfader";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ChevronUp, ChevronDown } from "lucide-react";

export default function DJPlayerSection({ playingSongId, songs, profileSongs, onSkip, collapsed, onToggleCollapse }) {
  const [crossfade, setCrossfade] = useState(50);
  const [deckBSongId, setDeckBSongId] = useState(null);
  const [deckAMuted, setDeckAMuted] = useState(false);
  const [deckBMuted, setDeckBMuted] = useState(false);
  const [deckABaseVol, setDeckABaseVol] = useState(1);
  const [deckBBaseVol, setDeckBBaseVol] = useState(1);

  const deckASong = useMemo(() => songs.find(s => s.id === playingSongId), [songs, playingSongId]);
  const deckBSong = useMemo(() => songs.find(s => s.id === deckBSongId), [songs, deckBSongId]);

  // Derive actual volumes from crossfader
  const deckAVolume = useMemo(() => {
    const cf = Math.min(1, (100 - crossfade) / 50);
    return deckAMuted ? 0 : deckABaseVol * cf;
  }, [crossfade, deckAMuted, deckABaseVol]);

  const deckBVolume = useMemo(() => {
    const cf = Math.min(1, crossfade / 50);
    return deckBMuted ? 0 : deckBBaseVol * cf;
  }, [crossfade, deckBMuted, deckBBaseVol]);

  // Auto-cue next track to Deck B
  const handleCueNext = useCallback(() => {
    if (!profileSongs.length || !playingSongId) return;
    const idx = profileSongs.findIndex(s => s.id === playingSongId);
    const next = profileSongs[idx + 1] || profileSongs[0];
    if (next) setDeckBSongId(next.id);
  }, [profileSongs, playingSongId]);

  // Swap decks
  const handleSwap = useCallback(() => {
    const tempId = deckBSongId;
    setDeckBSongId(playingSongId);
    if (tempId && onSkip) onSkip(playingSongId); // advances deck A
  }, [deckBSongId, playingSongId, onSkip]);

  const hasAnySong = deckASong || deckBSong;

  if (collapsed) {
    return (
      <div
        className="h-10 flex-shrink-0 border-t border-slate-700/50 bg-slate-900/60 flex items-center justify-between px-4 cursor-pointer"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          {deckASong && (
            <div className="flex gap-0.5">
              <span className="w-1.5 h-3 bg-purple-400 rounded-full animate-pulse" />
              <span className="w-1.5 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <span className="text-xs text-white font-medium truncate max-w-[200px]">
            {deckASong ? `${deckASong.title} — ${deckASong.artist}` : 'No track loaded'}
          </span>
        </div>
        <ChevronUp className="w-4 h-4 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-900/60">
      {/* Collapse toggle */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-slate-700/30">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">DJ Player</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-slate-400" onClick={handleCueNext}>
            Cue Next to B
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSwap} title="Swap decks">
            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onToggleCollapse}>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Dual decks */}
      <div className="flex gap-2 p-2">
        <PlayerDeck
          song={deckASong}
          label="Deck A"
          volume={deckAVolume}
          muted={deckAMuted}
          onVolumeChange={(v, m) => { setDeckABaseVol(v); setDeckAMuted(m); }}
          onEnded={() => onSkip?.(playingSongId)}
        />
        <PlayerDeck
          song={deckBSong}
          label="Deck B"
          volume={deckBVolume}
          muted={deckBMuted}
          onVolumeChange={(v, m) => { setDeckBBaseVol(v); setDeckBMuted(m); }}
          onEnded={() => setDeckBSongId(null)}
        />
      </div>

      {/* Crossfader */}
      <Crossfader value={crossfade} onChange={setCrossfade} />
    </div>
  );
}