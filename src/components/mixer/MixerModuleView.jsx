/**
 * MixerModuleView - Layout orchestrator, state provider, keyboard listener
 * DJ-style dancer song management console
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Disc3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { createSongEntry, createDancerProfile, DialogMode, ViewMode } from "@/components/mixer/types/mixerTypes";
import { loadSongs, saveSongs, loadProfiles, saveProfiles, loadState, saveState } from "@/components/mixer/services/storageService";
import { emitTelemetry } from "@/components/mixer/events/mixerTelemetry";
import { parseYoutubeUrl } from "@/components/mixer/services/validation";
import { trackEntityToMixerSong } from "@/lib/djTrackAdapter";

import ProfilePanel from "@/components/mixer/ProfilePanel";
import SongDeck from "@/components/mixer/SongDeck";
import MixerControls from "@/components/mixer/MixerControls";
import AISidePanel from "@/components/mixer/AISidePanel";
import SearchBar from "@/components/mixer/SearchBar";
import DialogManager from "@/components/mixer/DialogManager";
import KeyboardShortcutsDialog from "@/components/mixer/KeyboardShortcutsDialog";
import DJPlayerSection from "@/components/mixer/DJPlayerSection";
import SongUploadDialog from "@/components/mixer/SongUploadDialog";
import AIPlaylistGenerator from "@/components/mixer/AIPlaylistGenerator";
import MusicSearchPanel from "@/components/mixer/MusicSearchPanel";
import TrackLibraryDock from "@/components/mixer/TrackLibraryDock";
import EntertainerPlaylistDock from "@/components/mixer/EntertainerPlaylistDock";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useDJSession } from "@/components/mixer/session/DJSessionProvider";
import useMediaQuery from "@/components/mixer/session/useMediaQuery";

export default function MixerModuleView({ autoDj = false, automationPlan = null, onPlaybackEvent, libraryTracks = [] }) {
  const { state: djSession, setQueue, rejectDeckLoad } = useDJSession();
  const deckLoadRequest = djSession.pendingCommand;
  // ─── State hydration ───
  const [songs, setSongs] = useState(() => loadSongs());
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [uiState, setUiState] = useState(() => loadState());

  const [playingSongId, setPlayingSongId] = useState(null);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [dialogMode, setDialogMode] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [focusZone, setFocusZone] = useState(null); // "deck" | "profile"
  const [showAIMobile, setShowAIMobile] = useState(false);
  const [playerCollapsed, setPlayerCollapsed] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAIPlaylist, setShowAIPlaylist] = useState(false);
  const [rightTab, setRightTab] = useState("library"); // "library" | "ai" | "search"

  const activeProfile = useMemo(() => profiles.find((p) => p.id === uiState.activeProfileId), [profiles, uiState.activeProfileId]);

  const profileSongs = useMemo(() => {
    if (!activeProfile) return [];
    return activeProfile.songIds.map((id) => songs.find((s) => s.id === id)).filter((s) => s && !s.archivedFlag);
  }, [activeProfile, songs]);

  // Playable library tracks mapped to mixer songs. This is the fallback cue
  // pool so the crossfader always has a next track to blend into even when the
  // active profile playlist is empty or has a single song.
  const libraryCuePool = useMemo(
    () => (libraryTracks || [])
      .map((track) => trackEntityToMixerSong(track))
      .filter((song) => song?.id && (song.youtubeUrl || song.uploadUrl)),
    [libraryTracks],
  );

  const cuePool = useMemo(
    () => (profileSongs.length > 1 ? profileSongs : libraryCuePool),
    [profileSongs, libraryCuePool],
  );

  // Library-sourced cue tracks must be resolvable by id inside the decks.
  useEffect(() => {
    if (!libraryCuePool.length) return;
    setSongs((previous) => {
      const have = new Set(previous.map((song) => song.id));
      const missing = libraryCuePool.filter((song) => !have.has(song.id));
      return missing.length ? [...previous, ...missing] : previous;
    });
  }, [libraryCuePool]);

  const archivedSongs = useMemo(() => songs.filter((s) => s.archivedFlag), [songs]);
  const selectedSong = useMemo(() => songs.find((s) => s.id === selectedSongId), [songs, selectedSongId]);
  const automationNextSong = useMemo(() => {
    if (!autoDj || !playingSongId) return null;
    const candidate = automationPlan?.next;
    if (!candidate?.playable || !candidate?.track || candidate.repeat_penalty >= 40) return null;
    const current = songs.find((song) => song.id === playingSongId);
    if (current?._entityTrackId && current._entityTrackId === candidate.track.id) return null;
    return trackEntityToMixerSong(candidate.track);
  }, [autoDj, playingSongId, automationPlan, songs]);

  useEffect(() => {
    if (!automationNextSong?.id) return;
    setSongs((previous) => previous.some((song) => song.id === automationNextSong.id)
      ? previous
      : [...previous, automationNextSong]);
  }, [automationNextSong?.id]);

  // Typed commands from search/import are registered here, then consumed by
  // the persistent deck owner. The queue/profile state is never cleared.
  useEffect(() => {
    if (!deckLoadRequest?.requestId) return;
    if (!deckLoadRequest.song?.id) {
      rejectDeckLoad(deckLoadRequest.requestId, deckLoadRequest.targetDeck, "The track did not contain a normalized playable id.");
      return;
    }
    setSongs((previous) => previous.some((song) => song.id === deckLoadRequest.song.id)
      ? previous
      : [...previous, deckLoadRequest.song]);
    setPlayerCollapsed(false);
  }, [deckLoadRequest, rejectDeckLoad]);

  useEffect(() => {
    setQueue(profileSongs.map((song) => song.id));
  }, [profileSongs, setQueue]);

  // ─── Auto-save on mutations ───
  useEffect(() => { saveSongs(songs); }, [songs]);
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { saveState(uiState); }, [uiState]);

  // ─── Autonomous idle-start ───
  // The decision engine may only take the deck when AUTO-DJ is armed, nothing
  // is currently playing, the recommendation has a real playable source, and
  // repeat protection says it is safe. Manual play always wins immediately.
  useEffect(() => {
    if (!autoDj || playingSongId) return;
    const candidate = automationPlan?.next;
    if (!candidate?.playable || !candidate?.track || candidate.repeat_penalty >= 40) return;

    const mapped = trackEntityToMixerSong(candidate.track);
    if (!mapped?.id || (!mapped.youtubeUrl && !mapped.uploadUrl)) return;

    setSongs((previous) => previous.some((song) => song.id === mapped.id) ? previous : [...previous, mapped]);

    const existingProfile = profiles.find((profile) => profile.id === uiState.activeProfileId);
    if (existingProfile) {
      if (!existingProfile.songIds.includes(mapped.id)) {
        setProfiles((previous) => previous.map((profile) =>
          profile.id === existingProfile.id ? { ...profile, songIds: [...profile.songIds, mapped.id] } : profile
        ));
      }
    } else {
      const autoProfile = createDancerProfile({
        name: "NUPS Auto-DJ",
        colorTheme: "#8b5cf6",
        songIds: [mapped.id],
        tags: ["nups", "auto-dj"],
      });
      setProfiles((previous) => [...previous, autoProfile]);
      setUiState((state) => ({ ...state, activeProfileId: autoProfile.id }));
    }

    setPlayerCollapsed(false);
    setPlayingSongId(mapped.id);
    emitTelemetry("AUTO_DJ_PLAY", {
      songId: mapped.id,
      trackId: mapped._entityTrackId,
      confidence: automationPlan?.confidence || 0,
      score: candidate.score,
    });
    onPlaybackEvent?.({
      type: "play",
      source: "auto_dj",
      track_id: mapped._entityTrackId,
      entityTrackId: mapped._entityTrackId,
      songId: mapped.id,
      title: mapped.title,
      artist: mapped.artist,
      score: candidate.score,
      at: Date.now(),
    });
  }, [autoDj, playingSongId, automationPlan, profiles, uiState.activeProfileId, onPlaybackEvent]);

  // ─── Song operations ───
  const handleSaveSong = useCallback((song, isEdit) => {
    if (isEdit) {
      setSongs((prev) => prev.map((s) => (s.id === song.id ? { ...s, ...song } : s)));
    } else {
      setSongs((prev) => [...prev, song]);
      // Attach to active profile
      if (activeProfile) {
        setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? { ...p, songIds: [...p.songIds, song.id] } : p)));
      }
    }
  }, [activeProfile]);

  // Registers a song dragged in from the Track Library / search panels so the
  // decks can resolve it by id. Returns the id to load.
  const handleRegisterSong = useCallback((dropped) => {
    if (!dropped?.id) return null;
    setSongs((previous) => previous.some((s) => s.id === dropped.id) ? previous : [...previous, dropped]);
    setPlayerCollapsed(false);
    return dropped.id;
  }, []);

  // Play a library track immediately on the live deck.
  const handleLibraryPlay = useCallback((song) => {
    if (!song?.id) return;
    setSongs((previous) => previous.some((s) => s.id === song.id) ? previous : [...previous, song]);
    setPlayerCollapsed(false);
    setPlayingSongId(song.id);
    emitTelemetry("SONG_PLAY", { songId: song.id, source: "library_dock", timestamp: Date.now() });
    onPlaybackEvent?.({
      type: "play",
      source: "manual",
      track_id: song._entityTrackId || song.id,
      entityTrackId: song._entityTrackId || null,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      at: Date.now(),
    });
  }, [onPlaybackEvent]);

  // Queue one or many library tracks into the active playlist (profile).
  // With no profile yet, a "House Playlist" is created automatically so
  // cue-next / automix has a real queue to walk.
  const handleQueueSongs = useCallback((list) => {
    const items = (Array.isArray(list) ? list : [list]).filter((s) => s?.id);
    if (!items.length) return;
    setSongs((previous) => {
      const have = new Set(previous.map((s) => s.id));
      return [...previous, ...items.filter((s) => !have.has(s.id))];
    });
    const ids = items.map((s) => s.id);
    if (activeProfile) {
      setProfiles((previous) => previous.map((p) =>
        p.id === activeProfile.id
          ? { ...p, songIds: [...p.songIds, ...ids.filter((id) => !p.songIds.includes(id))] }
          : p
      ));
    } else {
      const prof = createDancerProfile({ name: "House Playlist", colorTheme: "#8b5cf6", songIds: ids, tags: ["library"] });
      setProfiles((previous) => [...previous, prof]);
      setUiState((s) => ({ ...s, activeProfileId: prof.id }));
    }
    toast.success(`${items.length} track${items.length > 1 ? "s" : ""} added to playlist`);
  }, [activeProfile]);

  const handlePlay = useCallback((songId) => {
    setPlayingSongId((prev) => (prev === songId ? null : songId));
    const song = songs.find((s) => s.id === songId);
    if (song) {
      // Auto-expand the player when a song starts
      setPlayerCollapsed(false);
      setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, lastPlayed: Date.now() } : s)));
      emitTelemetry("SONG_PLAY", { songId, profileId: uiState.activeProfileId, timestamp: Date.now() });
      onPlaybackEvent?.({
        type: "play",
        source: "manual",
        track_id: song._entityTrackId || songId,
        entityTrackId: song._entityTrackId || null,
        songId,
        title: song.title,
        artist: song.artist,
        at: Date.now(),
      });
    }
  }, [songs, uiState.activeProfileId, onPlaybackEvent]);

  const handleAutomationTransition = useCallback((songId, meta = {}) => {
    if (!songId) {
      setPlayingSongId(null);
      return;
    }
    const previousSong = songs.find((item) => item.id === playingSongId);
    const song = songs.find((item) => item.id === songId);
    const previousEventType = meta.reason === "source_failover"
      ? null
      : meta.reason === "manual_swap"
        ? "skip"
        : "complete";
    if (previousSong && previousSong.id !== songId && previousEventType) {
      onPlaybackEvent?.({
        type: previousEventType,
        source: meta.reason || "auto_dj_transition",
        track_id: previousSong._entityTrackId || previousSong.id,
        entityTrackId: previousSong._entityTrackId || null,
        songId: previousSong.id,
        title: previousSong.title,
        artist: previousSong.artist,
        at: Date.now(),
      });
    }
    setPlayingSongId(songId);
    if (!song) return;
    setSongs((previous) => previous.map((item) => item.id === songId ? { ...item, lastPlayed: Date.now() } : item));
    emitTelemetry("AUTO_DJ_TRANSITION", {
      songId,
      trackId: song._entityTrackId || null,
      timestamp: Date.now(),
    });
    onPlaybackEvent?.({
      type: "play",
      source: "auto_dj_transition",
      track_id: song._entityTrackId || songId,
      entityTrackId: song._entityTrackId || null,
      songId,
      title: song.title,
      artist: song.artist,
      at: Date.now(),
    });
  }, [songs, playingSongId, onPlaybackEvent]);

  const handlePlaybackError = useCallback(({ songId, deck, active, fallbackReady, error }) => {
    const song = songs.find((item) => item.id === songId);
    emitTelemetry("SOURCE_ERROR", {
      songId,
      trackId: song?._entityTrackId || null,
      deck,
      active,
      fallbackReady,
      message: error?.message || String(error || "playback error"),
    });
    if (!song) return;
    onPlaybackEvent?.({
      type: "source_error",
      source: error?.source || "player",
      track_id: song._entityTrackId || song.id,
      entityTrackId: song._entityTrackId || null,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      deck,
      active,
      fallbackReady,
      error: error?.message || String(error || "playback error"),
      at: Date.now(),
    });
  }, [songs, onPlaybackEvent]);

  const handleSkip = useCallback((songId, reason = "manual") => {
    const song = songs.find((item) => item.id === songId);
    const completed = reason === "ended";
    emitTelemetry(completed ? "SONG_COMPLETE" : "SONG_SKIP", { songId, playDuration: 0, reason: completed ? "natural_end" : (autoDj ? "auto_dj_transition" : reason) });
    if (song) {
      onPlaybackEvent?.({
        type: completed ? "complete" : "skip",
        source: completed ? "natural_end" : (autoDj ? "auto_dj" : "manual"),
        track_id: song._entityTrackId || songId,
        entityTrackId: song._entityTrackId || null,
        songId,
        title: song.title,
        artist: song.artist,
        at: Date.now(),
      });
    }
    if (autoDj) {
      setPlayingSongId(null);
      return;
    }
    if (!activeProfile) return;
    const currentIdx = profileSongs.findIndex((s) => s.id === songId);
    if (currentIdx >= 0 && currentIdx < profileSongs.length - 1) {
      handlePlay(profileSongs[currentIdx + 1].id);
    } else {
      setPlayingSongId(null);
    }
  }, [songs, autoDj, onPlaybackEvent, activeProfile, profileSongs, handlePlay]);

  const handleFavorite = useCallback((songId) => {
    setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, favoriteFlag: !s.favoriteFlag } : s)));
  }, []);

  const handleArchive = useCallback((songId) => {
    setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, archivedFlag: !s.archivedFlag } : s)));
    emitTelemetry("ARCHIVE_TOGGLE", { songId, archived: !songs.find((s) => s.id === songId)?.archivedFlag });
  }, [songs]);

  const handleUnarchive = useCallback((songId) => {
    setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, archivedFlag: false } : s)));
    emitTelemetry("ARCHIVE_TOGGLE", { songId, archived: false });
  }, []);

  const handleBulkUnarchive = useCallback(() => {
    setSongs((prev) => prev.map((s) => ({ ...s, archivedFlag: false })));
    toast.success("All songs unarchived");
  }, []);

  const handleReorder = useCallback((oldIdx, newIdx, filteredSongs) => {
    if (!activeProfile) return;
    const songId = filteredSongs[oldIdx]?.id;
    const newFilteredOrder = [...filteredSongs];
    const [moved] = newFilteredOrder.splice(oldIdx, 1);
    newFilteredOrder.splice(newIdx, 0, moved);

    // Rebuild full songIds preserving non-visible songs
    const filteredIds = new Set(filteredSongs.map((s) => s.id));
    const nonFiltered = activeProfile.songIds.filter((id) => !filteredIds.has(id));
    const newSongIds = [...newFilteredOrder.map((s) => s.id), ...nonFiltered];

    setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? { ...p, songIds: newSongIds } : p)));
  }, [activeProfile]);

  // ─── Profile operations ───
  const handleSwitchProfile = useCallback((profileId) => {
    setUiState((s) => ({ ...s, activeProfileId: profileId }));
    setSelectedSongId(null);
    setPlayingSongId(null);
  }, []);

  const handleSaveProfile = useCallback((profile, isEdit) => {
    if (isEdit) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, ...profile } : p)));
    } else {
      setProfiles((prev) => [...prev, profile]);
      setUiState((s) => ({ ...s, activeProfileId: profile.id }));
    }
  }, []);

  const handleDeleteProfile = useCallback((profileId) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (uiState.activeProfileId === profileId) {
      setUiState((s) => ({ ...s, activeProfileId: profiles.find((p) => p.id !== profileId)?.id || undefined }));
    }
  }, [profiles, uiState.activeProfileId]);

  const handleDuplicateProfile = useCallback((profileId) => {
    const src = profiles.find((p) => p.id === profileId);
    if (!src) return;
    const dup = createDancerProfile({ name: `${src.name} (copy)`, colorTheme: src.colorTheme, songIds: [...src.songIds], tags: [...src.tags] });
    setProfiles((prev) => [...prev, dup]);
    toast.success(`Duplicated "${src.name}"`);
  }, [profiles]);

  // ─── Entertainer shift playlist load ───
  // Hydrates a checked-in entertainer's saved playlist into its own profile so
  // the deck, cue pool and automix all work off their tracks immediately.
  const handleLoadEntertainerPlaylist = useCallback((songDataList, entertainerName) => {
    const created = (songDataList || []).map((data) => createSongEntry(data));
    if (!created.length) return;
    setSongs((previous) => [...previous, ...created]);
    const ids = created.map((song) => song.id);

    const existing = profiles.find((profile) => profile.name === entertainerName);
    if (existing) {
      setProfiles((previous) => previous.map((profile) =>
        profile.id === existing.id ? { ...profile, songIds: ids } : profile
      ));
      setUiState((state) => ({ ...state, activeProfileId: existing.id }));
    } else {
      const profile = createDancerProfile({
        name: entertainerName || "Entertainer",
        colorTheme: "#ec4899",
        songIds: ids,
        tags: ["entertainer", "shift"],
      });
      setProfiles((previous) => [...previous, profile]);
      setUiState((state) => ({ ...state, activeProfileId: profile.id }));
    }
    setSelectedSongId(null);
    setPlayingSongId(null);
  }, [profiles]);

  // ─── Upload song handler ───
  const handleUploadedSong = useCallback((songData) => {
    const song = createSongEntry(songData);
    setSongs((prev) => [...prev, song]);
    if (activeProfile) {
      setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? { ...p, songIds: [...p.songIds, song.id] } : p)));
    }
  }, [activeProfile]);

  // ─── AI bulk add songs ───
  const handleAIBulkAddSongs = useCallback((songDataArray) => {
    const newSongs = songDataArray.map((d) => createSongEntry(d));
    setSongs((prev) => [...prev, ...newSongs]);
    if (activeProfile) {
      const newIds = newSongs.map((s) => s.id);
      setProfiles((prev) => prev.map((p) => (p.id === activeProfile.id ? { ...p, songIds: [...p.songIds, ...newIds] } : p)));
    }
  }, [activeProfile]);

  // ─── AI apply ───
  const handleApplyAISuggestion = useCallback((type, data) => {
    if (type === "classify" && selectedSongId) {
      setSongs((prev) => prev.map((s) => (s.id === selectedSongId ? { ...s, vibeTag: data.vibeTag, energyLevel: data.energyLevel } : s)));
      emitTelemetry("AI_SUGGESTION_APPLY", { suggestionType: "classify", songId: selectedSongId, accepted: true });
    }
  }, [selectedSongId]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const editable = tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;

      // Modal-only shortcuts
      if (dialogMode) {
        if (e.key === "Escape") { setDialogMode(null); e.preventDefault(); }
        return;
      }

      if (editable && e.key !== "Escape") return;

      // Global
      if (e.key === "/") { e.preventDefault(); document.querySelector("[data-mixer-search]")?.focus(); return; }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); setDialogMode(DialogMode.shortcuts); return; }
      if (e.key === "Escape") {
        setUiState((s) => ({ ...s, searchQuery: "", vibeFilter: "all" }));
        return;
      }

      // Deck shortcuts
      if (focusZone === "deck" && profileSongs.length > 0) {
        const curIdx = profileSongs.findIndex((s) => s.id === selectedSongId);
        if (e.key === " ") { e.preventDefault(); if (selectedSongId) handlePlay(selectedSongId); return; }
        if (e.key === "j" || e.key === "J") {
          e.preventDefault();
          const newIdx = Math.max(0, curIdx - 1);
          setSelectedSongId(profileSongs[newIdx]?.id);
          return;
        }
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          const newIdx = Math.min(profileSongs.length - 1, curIdx + 1);
          setSelectedSongId(profileSongs[newIdx]?.id);
          return;
        }
        if (e.key === "f" || e.key === "F") { e.preventDefault(); if (selectedSongId) handleFavorite(selectedSongId); return; }
        if (e.key === "a" || e.key === "A") { e.preventDefault(); if (selectedSongId) handleArchive(selectedSongId); return; }
        if (e.key === "Enter") {
          e.preventDefault();
          const song = songs.find((s) => s.id === selectedSongId);
          if (song) { setEditingSong(song); setDialogMode(DialogMode.editSong); }
          return;
        }
      }

      // Profile shortcuts
      if (focusZone === "profile") {
        if (e.key === "n" || e.key === "N") { e.preventDefault(); setEditingProfile(null); setDialogMode(DialogMode.profileManager); return; }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialogMode, focusZone, selectedSongId, profileSongs, songs, handlePlay, handleFavorite, handleArchive]);

  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="h-full min-h-[720px] flex flex-col bg-transparent overflow-hidden rounded-xl border border-slate-700/50">
      {/* Top bar */}
      <div className="h-14 flex-shrink-0 flex items-center gap-3 px-4 border-b border-slate-700/50 bg-slate-900/80">
        <Disc3 className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: "3s" }} />
        <span className="text-sm font-bold text-white hidden sm:block">MIXER</span>
        <SearchBar value={uiState.searchQuery || ""} onChange={(q) => setUiState((s) => ({ ...s, searchQuery: q }))} />
        <MixerControls
          viewMode={uiState.viewMode || "list"}
          vibeFilter={uiState.vibeFilter || "all"}
          onViewModeChange={(v) => setUiState((s) => ({ ...s, viewMode: v }))}
          onVibeFilterChange={(v) => setUiState((s) => ({ ...s, vibeFilter: v }))}
          onAddSong={() => { setEditingSong(null); setDialogMode(DialogMode.addSong); }}
          onUploadSong={() => setShowUploadDialog(true)}
          onAIPlaylist={() => setShowAIPlaylist(true)}
          onOpenArchive={() => setDialogMode(DialogMode.archive)}
          onOpenShortcuts={() => setDialogMode(DialogMode.shortcuts)}
        />
        {isMobile && (
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setShowAIMobile(true)}>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </Button>
        )}
      </div>

      {/* Main panels — drag the dividers to resize any window */}
      <ResizablePanelGroup direction="horizontal" autoSaveId="mixer-panels-v1" className="flex-1 overflow-hidden">
        {/* Left: Profiles + checked-in entertainer playlists */}
        {!isMobile && (
          <>
            <ResizablePanel defaultSize={22} minSize={12} maxSize={40} collapsible collapsedSize={0} className="flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ProfilePanel
                  profiles={profiles}
                  activeProfileId={uiState.activeProfileId}
                  songs={songs}
                  onSwitchProfile={handleSwitchProfile}
                  onOpenProfileManager={(p) => { setEditingProfile(p); setDialogMode(DialogMode.profileManager); }}
                  onDeleteProfile={handleDeleteProfile}
                  onDuplicateProfile={handleDuplicateProfile}
                  onFocusZone={setFocusZone}
                />
              </div>
              <EntertainerPlaylistDock
                activeProfileName={activeProfile?.name}
                profileSongs={profileSongs}
                onLoadPlaylist={handleLoadEntertainerPlaylist}
              />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-slate-700/60 hover:bg-purple-500/60 transition-colors" />
          </>
        )}

        {/* Center: Song Deck */}
        <ResizablePanel defaultSize={isMobile ? 100 : 52} minSize={25} className="flex min-h-0 overflow-hidden">
          <SongDeck
            songs={songs}
            profile={activeProfile}
            playingSongId={playingSongId}
            selectedSongId={selectedSongId}
            viewMode={uiState.viewMode || "list"}
            searchQuery={uiState.searchQuery}
            vibeFilter={uiState.vibeFilter}
            onReorder={handleReorder}
            onPlay={handlePlay}
            onSkip={handleSkip}
            onFavorite={handleFavorite}
            onArchive={handleArchive}
            onEdit={(song) => { setEditingSong(song); setDialogMode(DialogMode.editSong); }}
            onSelectSong={setSelectedSongId}
            onFocusZone={setFocusZone}
          />
        </ResizablePanel>

        {/* Right: Library / AI panel / Music Search (desktop + tablet) */}
        {!isMobile && (
          <>
            <ResizableHandle withHandle className="bg-slate-700/60 hover:bg-cyan-500/60 transition-colors" />
            <ResizablePanel defaultSize={26} minSize={14} maxSize={45} collapsible collapsedSize={0} className="flex flex-col min-h-0 border-l border-slate-700/30">
              {/* Tab toggle between Library, AI and Search */}
              <div className="flex border-b border-slate-700/30 bg-slate-900/80">
                {[
                  { key: "library", label: "🎵 Library", color: "text-emerald-400 border-emerald-400" },
                  { key: "ai", label: "AI Assistant", color: "text-purple-400 border-purple-400" },
                  { key: "search", label: "🔍 Music API", color: "text-cyan-400 border-cyan-400" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRightTab(tab.key)}
                    className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider font-bold transition-colors ${
                      rightTab === tab.key ? `${tab.color} border-b-2` : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {rightTab === "library" ? (
                <TrackLibraryDock
                  tracks={libraryTracks}
                  onPlay={handleLibraryPlay}
                  onQueue={handleQueueSongs}
                  onQueueAll={handleQueueSongs}
                />
              ) : rightTab === "search" ? (
                <MusicSearchPanel
                  onAddTrack={(trackData) => handleUploadedSong(trackData)}
                  onPreviewTrack={(track) => {
                    // Find existing or create new, then load on Deck A
                    const existing = songs.find(s => s.uploadUrl === track.audio_url);
                    if (existing) {
                      setPlayingSongId(existing.id);
                      setPlayerCollapsed(false);
                      return;
                    }
                    const tempSong = createSongEntry({
                      title: track.title || 'Unknown Track',
                      artist: track.artist || 'Unknown Artist',
                      uploadUrl: track.audio_url,
                      imageUrl: track.image_url || '',
                      album: track.album || '',
                      genre: track.genre || '',
                    });
                    setSongs(prev => [...prev, tempSong]);
                    if (activeProfile) {
                      setProfiles(prev => prev.map(p => p.id === activeProfile.id ? { ...p, songIds: [...p.songIds, tempSong.id] } : p));
                    }
                    setPlayingSongId(tempSong.id);
                    setPlayerCollapsed(false);
                  }}
                />
              ) : (
                <AISidePanel
                  profile={activeProfile}
                  songs={songs}
                  selectedSong={selectedSong}
                  profileSongs={profileSongs}
                  onApplySuggestion={handleApplyAISuggestion}
                />
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* DJ Player with crossfader */}
      <DJPlayerSection
        playingSongId={playingSongId}
        songs={songs}
        profileSongs={cuePool}
        onSkip={handleSkip}
        collapsed={playerCollapsed}
        onToggleCollapse={() => setPlayerCollapsed((c) => !c)}
        onPlay={handlePlay}
        autoDj={autoDj}
        automationNextSongId={automationNextSong?.id || null}
        onActiveSongChange={handleAutomationTransition}
        onPlaybackError={handlePlaybackError}
        onRegisterSong={handleRegisterSong}
        transitionSeconds={automationPlan?.transition?.fade_seconds || 6}
      />

      {/* Mobile profiles */}
      {isMobile && (
        <div className="h-16 flex-shrink-0 border-t border-slate-700/50 bg-slate-900/80 flex items-center gap-2 px-3 overflow-x-auto">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSwitchProfile(p.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                p.id === uiState.activeProfileId ? "border-purple-500 bg-purple-500/20 text-white" : "border-slate-700 text-slate-400"
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.colorTheme }} />
              {p.name}
            </button>
          ))}
          <button
            onClick={() => { setEditingProfile(null); setDialogMode(DialogMode.profileManager); }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border border-dashed border-slate-600 text-slate-500"
          >
            + New
          </button>
        </div>
      )}

      {/* Dialog manager */}
      <DialogManager
        mode={dialogMode === DialogMode.shortcuts ? null : dialogMode}
        onClose={() => { setDialogMode(null); setEditingSong(null); setEditingProfile(null); }}
        editingSong={editingSong}
        allSongs={songs}
        onSaveSong={handleSaveSong}
        editingProfile={editingProfile}
        allProfiles={profiles}
        onSaveProfile={handleSaveProfile}
        archivedSongs={archivedSongs}
        onUnarchive={handleUnarchive}
        onBulkUnarchive={handleBulkUnarchive}
      />

      {/* Shortcuts dialog */}
      <KeyboardShortcutsDialog
        isOpen={dialogMode === DialogMode.shortcuts}
        onClose={() => setDialogMode(null)}
      />

      {/* Upload dialog */}
      <SongUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSongCreated={handleUploadedSong}
      />

      {/* AI Playlist Generator */}
      <AIPlaylistGenerator
        isOpen={showAIPlaylist}
        onClose={() => setShowAIPlaylist(false)}
        profileName={activeProfile?.name}
        onAddSongs={handleAIBulkAddSongs}
      />

      {/* Mobile AI modal */}
      {isMobile && showAIMobile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full h-[70vh] bg-slate-900 rounded-t-2xl border-t border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <span className="text-sm font-semibold text-white">AI Assistant</span>
              <Button size="sm" variant="ghost" onClick={() => setShowAIMobile(false)}>Close</Button>
            </div>
            <AISidePanel
              profile={activeProfile}
              songs={songs}
              selectedSong={selectedSong}
              profileSongs={profileSongs}
              onApplySuggestion={handleApplyAISuggestion}
            />
          </div>
        </div>
      )}
    </div>
  );
}