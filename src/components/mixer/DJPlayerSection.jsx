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
import DJMasterAudioControls from "@/components/mixer/DJMasterAudioControls";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ChevronUp, ChevronDown, Tv, WandSparkles } from "lucide-react";
import { getClubTVSender, openClubTVWindow } from "@/components/mixer/ClubBroadcastChannel";
import { parseYoutubeUrl } from "@/components/mixer/services/validation";
import { useDJSession } from "@/components/mixer/session/DJSessionProvider";

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
  onRegisterSong,
  transitionSeconds = 6,
}) {
  const {
    state: session,
    setDeckSong,
    setActiveDeck,
    setCrossfade,
    setDeckMuted,
    setDeckVolume,
    setMaster,
    acknowledgeDeckLoad,
    rejectDeckLoad,
    setProviderState,
  } = useDJSession();
  const crossfade = session.crossfade;
  const deckASongId = session.deckA.songId;
  const deckBSongId = session.deckB.songId;
  const activeDeck = session.activeDeck;
  const deckAMuted = session.deckAMuted;
  const deckBMuted = session.deckBMuted;
  const deckABaseVol = session.deckABaseVolume;
  const deckBBaseVol = session.deckBBaseVolume;
  const masterVolume = session.masterVolume;
  const masterMuted = session.masterMuted;
  const [transitioning, setTransitioning] = useState(false);
  // Auto Blend runs the smoothstep crossfade at track end even when AUTO-DJ is
  // disarmed, so the crossfader never has to be ridden by hand.
  const [autoBlend, setAutoBlend] = useState(true);
  // Operator-adjustable blend length, seeded from the automation plan.
  const [blendSeconds, setBlendSeconds] = useState(Math.max(2, Number(transitionSeconds) || 6));
  const blending = autoDj || autoBlend;

  const deckARef = useRef(null);
  const deckBRef = useRef(null);
  const transitionRef = useRef(false);
  const rafRef = useRef(null);

  const deckASong = useMemo(() => songs.find((song) => song.id === deckASongId), [songs, deckASongId]);
  const deckBSong = useMemo(() => songs.find((song) => song.id === deckBSongId), [songs, deckBSongId]);
  const setDeckASongId = useCallback((songId) => {
    setDeckSong("A", songId ? songs.find((song) => song.id === songId) || null : null);
  }, [songs, setDeckSong]);
  const setDeckBSongId = useCallback((songId) => {
    setDeckSong("B", songId ? songs.find((song) => song.id === songId) || null : null);
  }, [songs, setDeckSong]);
  const handledCommandIdsRef = useRef(new Set());
  const activeSongId = activeDeck === "A" ? deckASongId : deckBSongId;
  const activeSong = activeDeck === "A" ? deckASong : deckBSong;
  const inactiveSongId = activeDeck === "A" ? deckBSongId : deckASongId;

  useEffect(() => {
    const command = session.pendingCommand;
    if (!command?.requestId || handledCommandIdsRef.current.has(command.requestId)) return;
    const song = songs.find((item) => item.id === command.song?.id) || command.song;
    if (!song?.id) return;
    if (!song.youtubeUrl && !song.uploadUrl) {
      handledCommandIdsRef.current.add(command.requestId);
      rejectDeckLoad(command.requestId, command.targetDeck, "This discovery item is not matched to an authorized playable source.");
      return;
    }
    if (command.targetDeck === "B") setDeckBSongId(song.id);
    else setDeckASongId(song.id);
    handledCommandIdsRef.current.add(command.requestId);
    acknowledgeDeckLoad(command.requestId, command.targetDeck, song);
  }, [session.pendingCommand, songs, acknowledgeDeckLoad, rejectDeckLoad, setDeckASongId, setDeckBSongId]);

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
    // Only auto-fill an EMPTY cue deck. Once a track is on Deck B (dropped,
    // cued, or promoted) it stays put until the operator changes it — otherwise
    // this effect re-ran and clobbered every manual Deck B load.
    // Fill whichever deck is currently the CUE deck (not just Deck B) so a blend
    // target always exists regardless of which deck went live last.
    if (autoDj || !playingSongId || !profileSongs.length || inactiveSongId) return;
    const idx = profileSongs.findIndex((song) => song.id === activeSongId);
    const next = profileSongs[idx + 1] || profileSongs[0];
    if (!next || next.id === activeSongId) return;
    if (activeDeck === "A") setDeckBSongId(next.id);
    else setDeckASongId(next.id);
  }, [autoDj, playingSongId, profileSongs, inactiveSongId, activeSongId, activeDeck]);

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
        bpm: Number(deckASong.bpm) || null,
        videoId: extractVideoId(deckASong.youtubeUrl),
        audioUrl: deckASong.uploadUrl || null,
      } : null,
      deckB: deckBSong ? {
        title: deckBSong.title,
        artist: deckBSong.artist,
        bpm: Number(deckBSong.bpm) || null,
        videoId: extractVideoId(deckBSong.youtubeUrl),
        audioUrl: deckBSong.uploadUrl || null,
      } : null,
    });
  }, [deckASong, deckBSong, crossfade, activeDeck, transitioning]);

  // Equal-power crossfade avoids the +6 dB-ish perceived bump of two linear
  // full-volume decks meeting at center. 0 = full A, 100 = full B.
  const deckAVolume = useMemo(() => {
    const angle = (Math.max(0, Math.min(100, crossfade)) / 100) * (Math.PI / 2);
    const gain = Math.cos(angle);
    return deckAMuted || masterMuted ? 0 : deckABaseVol * gain * masterVolume;
  }, [crossfade, deckAMuted, deckABaseVol, masterMuted, masterVolume]);

  const deckBVolume = useMemo(() => {
    const angle = (Math.max(0, Math.min(100, crossfade)) / 100) * (Math.PI / 2);
    const gain = Math.sin(angle);
    return deckBMuted || masterMuted ? 0 : deckBBaseVol * gain * masterVolume;
  }, [crossfade, deckBMuted, deckBBaseVol, masterMuted, masterVolume]);

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
    const durationMs = Math.max(1000, Number(blendSeconds || 6) * 1000);
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
  }, [activeDeck, deckASongId, deckBSongId, crossfade, blendSeconds, finishPromotion]);

  const handlePlayLive = useCallback(() => {
    const liveRef = activeDeck === "A" ? deckARef.current : deckBRef.current;
    if (!liveRef || !activeSongId) return;
    setMasterMuted(false);
    if (activeDeck === "A") {
      setDeckAMuted(false);
      if (deckABaseVol === 0) setDeckABaseVol(1);
    } else {
      setDeckBMuted(false);
      if (deckBBaseVol === 0) setDeckBBaseVol(1);
    }
    Promise.resolve(liveRef.play?.()).catch((error) => handleDeckPlaybackError(activeDeck, error));
  }, [activeDeck, activeSongId, deckABaseVol, deckBBaseVol]);

  const handleDeckPlaybackError = useCallback((deck, error) => {
    const songId = deck === "A" ? deckASongId : deckBSongId;
    if (!songId) return;
    const isActive = deck === activeDeck;
    const targetDeck = deck === "A" ? "B" : "A";
    const targetId = targetDeck === "A" ? deckASongId : deckBSongId;
    const targetRef = targetDeck === "A" ? deckARef.current : deckBRef.current;
    const fallbackReady = Boolean(autoDj && isActive && targetId && Number(targetRef?.getDuration?.() || 0) > 0);

    onPlaybackError?.({ songId, deck, active: isActive, fallbackReady, error });

    if (!isActive) {
      if (deck === "A") setDeckASongId(null);
      else setDeckBSongId(null);
      return;
    }

    if (fallbackReady) {
      performTransition(targetDeck, { immediate: true, reason: "source_failover" });
      return;
    }

    if (deck === "A") setDeckASongId(null);
    else setDeckBSongId(null);
    onActiveSongChange?.(null, { reason: "source_failure", failedSongId: songId });
  }, [activeDeck, autoDj, deckASongId, deckBSongId, onPlaybackError, onActiveSongChange, performTransition]);

  // Auto transition begins when the active track enters the configured fade
  // window. Duration=0 simply means metadata is not ready yet, so we wait.
  useEffect(() => {
    if (!blending) return undefined;
    const timer = setInterval(() => {
      if (transitionRef.current) return;
      const targetDeck = activeDeck === "A" ? "B" : "A";
      const targetId = activeDeck === "A" ? deckBSongId : deckASongId;
      if (!targetId) return;
      const ref = activeDeck === "A" ? deckARef.current : deckBRef.current;
      const duration = Number(ref?.getDuration?.() || 0);
      const current = Number(ref?.getCurrentTime?.() || 0);
      if (!duration || current < 1) return;
      const remaining = duration - current;
      if (remaining > 0 && remaining <= Math.max(2, Number(blendSeconds || 6))) {
        // Start the transition even if the cue deck has not reported metadata
        // yet. YouTube frequently reports duration late; waiting for a non-zero
        // cue duration caused the visible fader to never move. performTransition
        // issues play() first and the deck's source-error path still provides
        // failover if the cue cannot actually start.
        performTransition(targetDeck);
      }
    }, 400);
    return () => clearInterval(timer);
  }, [blending, activeDeck, deckASongId, deckBSongId, blendSeconds, performTransition]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleDeckEnded = useCallback((deck) => {
    if (deck !== activeDeck || transitionRef.current) return;
    const targetDeck = deck === "A" ? "B" : "A";
    const targetId = targetDeck === "A" ? deckASongId : deckBSongId;
    if (blending && targetId) {
      // Ramp the cue deck up instead of snapping the fader across — the
      // outgoing track has finished, so the incoming one fades in cleanly.
      performTransition(targetDeck, { reason: "natural_end" });
      return;
    }
    onSkip?.(activeSongId, "ended");
  }, [activeDeck, blending, deckASongId, deckBSongId, performTransition, onSkip, activeSongId]);

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
    if (targetId) performTransition(targetDeck, { reason: "manual_swap" });
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
        <div className="flex flex-wrap items-center justify-end gap-1">
          <DJMasterAudioControls
            volume={masterVolume}
            muted={masterMuted}
            onPlay={handlePlayLive}
            onMute={() => setMasterMuted((value) => !value)}
            onVolumeChange={(value) => { setMasterVolume(value); setMasterMuted(value === 0); }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1 border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10"
            onClick={() => openClubTVWindow()}
            title="Open Fable X visualizer — drag onto the TV display or cast the tab"
          >
            <Tv className="w-3 h-3" /> Open Visualizer
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
          baseVolume={deckABaseVol}
          muted={deckAMuted}
          onVolumeChange={(value, isMuted) => { setDeckABaseVol(value); setDeckAMuted(isMuted); }}
          onEnded={() => handleDeckEnded("A")}
          onPlaybackError={(error) => handleDeckPlaybackError("A", error)}
          onDropSong={(songId) => {
            setDeckASongId(songId);
            if (activeDeck === "A") onPlay?.(songId);
          }}
          onDropExternalSong={(dropped) => {
            const id = onRegisterSong?.(dropped) || dropped?.id;
            if (!id) return;
            setDeckASongId(id);
            if (activeDeck === "A") onPlay?.(id);
          }}
        />
        <PlayerDeck
          ref={deckBRef}
          song={deckBSong}
          label={`Deck B${activeDeck === "B" ? " · LIVE" : " · CUE"}`}
          autoPlay={activeDeck === "B"}
          volume={deckBVolume}
          baseVolume={deckBBaseVol}
          muted={deckBMuted}
          onVolumeChange={(value, isMuted) => { setDeckBBaseVol(value); setDeckBMuted(isMuted); }}
          onEnded={() => handleDeckEnded("B")}
          onPlaybackError={(error) => handleDeckPlaybackError("B", error)}
          onDropSong={(songId) => setDeckBSongId(songId)}
          onDropExternalSong={(dropped) => {
            const id = onRegisterSong?.(dropped) || dropped?.id;
            if (id) setDeckBSongId(id);
          }}
        />
      </div>

      <Crossfader
        value={crossfade}
        onChange={setCrossfade}
        autoMix={autoBlend}
        onToggleAutoMix={() => setAutoBlend((value) => !value)}
        blendSeconds={blendSeconds}
        onBlendSecondsChange={(seconds) => setBlendSeconds(Math.max(2, seconds))}
        onBlendNow={handleSwap}
        transitioning={transitioning}
      />
    </div>
  );
}