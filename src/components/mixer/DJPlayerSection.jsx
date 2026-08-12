/**
 * DJPlayerSection — dual-deck transport + NUPS Auto-DJ transition controller.
 *
 * Deck semantics are explicit:
 *   • active deck may autoplay
 *   • inactive deck is a true paused cue deck
 *   • Auto-DJ starts the cue deck near track end, crossfades, then promotes it
 *   • the newly inactive deck can be replaced with the next recommendation
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlayerDeck from "@/components/mixer/PlayerDeck";
import Crossfader from "@/components/mixer/Crossfader";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ChevronUp, ChevronDown, Tv, WandSparkles } from "lucide-react";
import { getClubTVSender, openClubTVWindow } from "@/components/mixer/ClubBroadcastChannel";
import { parseYoutubeUrl } from "@/components/mixer/services/validation";

function extractVideoId(url) {
  if (!url) return null;
  const parsed = parseYoutubeUrl(url);
  if (parsed?.videoId) return parsed.videoId;
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function DJPlayerSection({
  playingSongId,
  songs,
  profileSongs,
  onSkip,
  collapsed,
  onToggleCollapse,
  onPlay,
  autoDj = false,
  automationNextSongId = null,
  onActiveSongChange,
  onPlaybackError,
  transitionSeconds = 6,
}) {
  const [crossfade, setCrossfade] = useState(0);
  const [deckASongId, setDeckASongId] = useState(playingSongId || null);
  const [deckBSongId, setDeckBSongId] = useState(null);
  const [activeDeck, setActiveDeck] = useState("A");
  const [transitioning, setTransitioning] = useState(false);
  const [deckAMuted, setDeckAMuted] = useState(false);
  const [deckBMuted, setDeckBMuted] = useState(false);
  const [deckABaseVol, setDeckABaseVol] = useState(1);
  const [deckBBaseVol, setDeckBBaseVol] = useState(1);

  const deckARef = useRef(null);
  const deckBRef = useRef(null);
  const transitionRef = useRef(false);
  const rafRef = useRef(null);

  const deckASong = useMemo(() => songs.find((song) => song.id === deckASongId), [songs, deckASongId]);
  const deckBSong = useMemo(() => songs.find((song) => song.id === deckBSongId), [songs, deckBSongId]);
  const activeSongId = activeDeck === "A" ? deckASongId : deckBSongId;
  const activeSong = activeDeck === "A" ? deckASong : deckBSong;
  const inactiveSongId = activeDeck === "A" ? deckBSongId : deckASongId;

  // External/manual song selections load onto the active deck. If the requested
  // song is already resident on either deck (e.g. after an Auto-DJ promotion),
  // do not remount it and accidentally restart playback.
  useEffect(() => {
    if (!playingSongId || playingSongId === deckASongId || playingSongId === deckBSongId) return;
    if (activeDeck === "A") {
      setDeckASongId(playingSongId);
      setCrossfade(0);
    } else {
      setDeckBSongId(playingSongId);
      setCrossfade(100);
    }
  }, [playingSongId, deckASongId, deckBSongId, activeDeck]);

  // Auto-DJ recommendation always occupies the inactive cue deck and remains
  // paused until the transition controller explicitly starts it.
  useEffect(() => {
    if (!autoDj || !automationNextSongId || automationNextSongId === activeSongId) return;
    if (activeDeck === "A") setDeckBSongId(automationNextSongId);
    else setDeckASongId(automationNextSongId);
  }, [autoDj, automationNextSongId, activeSongId, activeDeck]);

  // Manual mode retains the old profile-based "cue next" behavior, but the
  // cue deck is now genuinely paused instead of autoplaying over the live deck.
  useEffect(() => {
    if (autoDj || !playingSongId || !profileSongs.length || activeDeck !== "A") return;
    const idx = profileSongs.findIndex((song) => song.id === playingSongId);
    const next = profileSongs[idx + 1] || profileSongs[0];
    if (next && next.id !== playingSongId && next.id !== deckBSongId) setDeckBSongId(next.id);
  }, [autoDj, playingSongId, profileSongs, deckBSongId, activeDeck]);

  // Broadcast both physical decks to Club TV.
  useEffect(() => {
    const sender = getClubTVSender();
    sender.publish({
      crossfade,
      activeDeck,
      transitioning,
      deckA: deckASong ? {
        title: deckASong.title,
        artist: deckASong.artist,
        videoId: extractVideoId(deckASong.youtubeUrl),
        audioUrl: deckASong.uploadUrl || null,
      } : null,
      deckB: deckBSong ? {
        title: deckBSong.title,
        artist: deckBSong.artist,
        videoId: extractVideoId(deckBSong.youtubeUrl),
        audioUrl: deckBSong.uploadUrl || null,
      } : null,
    });
  }, [deckASong, deckBSong, crossfade, activeDeck, transitioning]);

  const deckAVolume = useMemo(() => {
    const gain = Math.min(1, (100 - crossfade) / 50);
    return deckAMuted ? 0 : deckABaseVol * gain;
  }, [crossfade, deckAMuted, deckABaseVol]);

  const deckBVolume = useMemo(() => {
    const gain = Math.min(1, crossfade / 50);
    return deckBMuted ? 0 : deckBBaseVol * gain;
  }, [crossfade, deckBMuted, deckBBaseVol]);

  const finishPromotion = useCallback((targetDeck, reason = "auto_transition") => {
    const promotedId = targetDeck === "A" ? deckASongId : deckBSongId;
    setActiveDeck(targetDeck);
    setTransitioning(false);
    transitionRef.current = false;
    if (promotedId) onActiveSongChange?.(promotedId, { reason });
  }, [deckASongId, deckBSongId, onActiveSongChange]);

  const performTransition = useCallback((targetDeck, { immediate = false, reason = "auto_transition" } = {}) => {
    if (transitionRef.current || targetDeck === activeDeck) return;
    const targetId = targetDeck === "A" ? deckASongId : deckBSongId;
    if (!targetId) return;

    transitionRef.current = true;
    setTransitioning(true);
    const fromRef = activeDeck === "A" ? deckARef : deckBRef;
    const toRef = targetDeck === "A" ? deckARef : deckBRef;
    const targetCrossfade = targetDeck === "A" ? 0 : 100;

    Promise.resolve(toRef.current?.play?.()).catch(() => {});

    if (immediate) {
      setCrossfade(targetCrossfade);
      fromRef.current?.pause?.();
      finishPromotion(targetDeck, reason);
      return;
    }

    const startCrossfade = crossfade;
    const startedAt = performance.now();
    const durationMs = Math.max(1000, Number(transitionSeconds || 6) * 1000);
    const tick = (timestamp) => {
      const progress = Math.min(1, (timestamp - startedAt) / durationMs);
      // Smoothstep gives a gentler club-style fade than a hard linear ramp.
      const eased = progress * progress * (3 - 2 * progress);
      setCrossfade(startCrossfade + (targetCrossfade - startCrossfade) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      fromRef.current?.pause?.();
      finishPromotion(targetDeck, reason);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [activeDeck, deckASongId, deckBSongId, crossfade, transitionSeconds, finishPromotion]);

  // Auto transition begins when the active track enters the configured fade
  // window. Duration=0 simply means metadata is not ready yet, so we wait.
  useEffect(() => {
    if (!autoDj) return undefined;
    const timer = setInterval(() => {
      if (transitionRef.current) return;
      const targetDeck = activeDeck === "A" ? "B" : "A";
      const targetId = activeDeck === "A" ? deckBSongId : deckASongId;
      if (!targetId) return;
      const ref = activeDeck === "A" ? deckARef.current : deckBRef.current;
      const cueRef = targetDeck === "A" ? deckARef.current : deckBRef.current;
      const duration = Number(ref?.getDuration?.() || 0);
      const current = Number(ref?.getCurrentTime?.() || 0);
      const cueDuration = Number(cueRef?.getDuration?.() || 0);
      // Never fade toward a cue source whose media metadata has not loaded.
      // A late/broken source stays cued while the live deck continues safely.
      if (!duration || current < 1 || !cueDuration) return;
      const remaining = duration - current;
      if (remaining > 0 && remaining <= Math.max(2, Number(transitionSeconds || 6))) {
        performTransition(targetDeck);
      }
    }, 400);
    return () => clearInterval(timer);
  }, [autoDj, activeDeck, deckASongId, deckBSongId, transitionSeconds, performTransition]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleDeckEnded = useCallback((deck) => {
    if (deck !== activeDeck || transitionRef.current) return;
    const targetDeck = deck === "A" ? "B" : "A";
    const targetId = targetDeck === "A" ? deckASongId : deckBSongId;
    if (autoDj && targetId) {
      performTransition(targetDeck, { immediate: true, reason: "natural_end" });
      return;
    }
    onSkip?.(activeSongId, "ended");
  }, [activeDeck, autoDj, deckASongId, deckBSongId, performTransition, onSkip, activeSongId]);

  const handleCueNext = useCallback(() => {
    if (!profileSongs.length || !activeSongId) return;
    const idx = profileSongs.findIndex((song) => song.id === activeSongId);
    const next = profileSongs[idx + 1] || profileSongs[0];
    if (!next) return;
    if (activeDeck === "A") setDeckBSongId(next.id);
    else setDeckASongId(next.id);
  }, [profileSongs, activeSongId, activeDeck]);

  const handleSwap = useCallback(() => {
    const targetDeck = activeDeck === "A" ? "B" : "A";
    const targetId = targetDeck === "A" ? deckASongId : deckBSongId;
    if (targetId) performTransition(targetDeck, { immediate: true, reason: "manual_swap" });
  }, [activeDeck, deckASongId, deckBSongId, performTransition]);

  if (collapsed) {
    return (
      <div
        className="h-10 flex-shrink-0 border-t border-slate-700/50 bg-slate-900/60 flex items-center justify-between px-4 cursor-pointer"
        onClick={onToggleCollapse}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
        onDrop={(e) => {
          e.preventDefault();
          const songId = e.dataTransfer.getData("application/mixer-song-id");
          if (songId) { onPlay?.(songId); onToggleCollapse?.(); }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {activeSong && (
            <div className="flex gap-0.5">
              <span className="w-1.5 h-3 bg-purple-400 rounded-full animate-pulse" />
              <span className="w-1.5 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          )}
          <span className="text-xs text-white font-medium truncate max-w-[300px]">
            {activeSong ? `${activeSong.title} — ${activeSong.artist}` : "No track loaded"}
          </span>
          {autoDj && <span className="text-[9px] font-mono text-emerald-400">AUTO · {activeDeck}</span>}
        </div>
        <ChevronUp className="w-4 h-4 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-900/60">
      <div className="flex items-center justify-between px-4 py-1 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">DJ Player</span>
          {autoDj && (
            <span className={`text-[9px] font-mono flex items-center gap-1 ${transitioning ? "text-amber-300" : "text-emerald-400"}`}>
              <WandSparkles className="w-3 h-3" /> {transitioning ? `CROSSFADING → ${activeDeck === "A" ? "B" : "A"}` : `LIVE DECK ${activeDeck}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1 border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10"
            onClick={() => openClubTVWindow()}
            title="Open Club TV window — drag onto the TV display or cast the tab"
          >
            <Tv className="w-3 h-3" /> Open Club TV
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-slate-400" onClick={handleCueNext}>
            Cue Next
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSwap} title="Promote cue deck">
            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onToggleCollapse}>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-2">
        <PlayerDeck
          ref={deckARef}
          song={deckASong}
          label={`Deck A${activeDeck === "A" ? " · LIVE" : " · CUE"}`}
          autoPlay={activeDeck === "A"}
          volume={deckAVolume}
          muted={deckAMuted}
          onVolumeChange={(value, isMuted) => { setDeckABaseVol(value); setDeckAMuted(isMuted); }}
          onEnded={() => handleDeckEnded("A")}
          onDropSong={(songId) => {
            setDeckASongId(songId);
            if (activeDeck === "A") onPlay?.(songId);
          }}
        />
        <PlayerDeck
          ref={deckBRef}
          song={deckBSong}
          label={`Deck B${activeDeck === "B" ? " · LIVE" : " · CUE"}`}
          autoPlay={activeDeck === "B"}
          volume={deckBVolume}
          muted={deckBMuted}
          onVolumeChange={(value, isMuted) => { setDeckBBaseVol(value); setDeckBMuted(isMuted); }}
          onEnded={() => handleDeckEnded("B")}
          onDropSong={(songId) => setDeckBSongId(songId)}
        />
      </div>

      <Crossfader value={crossfade} onChange={setCrossfade} />
    </div>
  );
}
