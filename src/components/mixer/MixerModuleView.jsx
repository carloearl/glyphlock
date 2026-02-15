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

export default function MixerModuleView() {
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

  const activeProfile = useMemo(() => profiles.find((p) => p.id === uiState.activeProfileId), [profiles, uiState.activeProfileId]);

  const profileSongs = useMemo(() => {
    if (!activeProfile) return [];
    return activeProfile.songIds.map((id) => songs.find((s) => s.id === id)).filter((s) => s && !s.archivedFlag);
  }, [activeProfile, songs]);

  const archivedSongs = useMemo(() => songs.filter((s) => s.archivedFlag), [songs]);
  const selectedSong = useMemo(() => songs.find((s) => s.id === selectedSongId), [songs, selectedSongId]);

  // ─── Auto-save on mutations ───
  useEffect(() => { saveSongs(songs); }, [songs]);
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { saveState(uiState); }, [uiState]);

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

  const handlePlay = useCallback((songId) => {
    setPlayingSongId((prev) => (prev === songId ? null : songId));
    const song = songs.find((s) => s.id === songId);
    if (song) {
      setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, lastPlayed: Date.now() } : s)));
      emitTelemetry("SONG_PLAY", { songId, profileId: uiState.activeProfileId, timestamp: Date.now() });
    }
  }, [songs, uiState.activeProfileId]);

  const handleSkip = useCallback((songId) => {
    emitTelemetry("SONG_SKIP", { songId, playDuration: 0, reason: "manual" });
    if (!activeProfile) return;
    const currentIdx = profileSongs.findIndex((s) => s.id === songId);
    if (currentIdx >= 0 && currentIdx < profileSongs.length - 1) {
      handlePlay(profileSongs[currentIdx + 1].id);
    } else {
      setPlayingSongId(null);
    }
  }, [activeProfile, profileSongs, handlePlay]);

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

  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1200;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-transparent overflow-hidden rounded-xl border border-slate-700/50">
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

      {/* Main panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Profiles */}
        <div className={`${isDesktop ? "w-[280px]" : "w-[220px]"} flex-shrink-0 ${isMobile ? "hidden" : ""}`}>
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

        {/* Center: Song Deck */}
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

        {/* Right: AI panel (desktop only) */}
        {!isMobile && (
          <div className={`${isDesktop ? "w-[320px]" : "w-[260px]"} flex-shrink-0`}>
            <AISidePanel
              profile={activeProfile}
              songs={songs}
              selectedSong={selectedSong}
              profileSongs={profileSongs}
              onApplySuggestion={handleApplyAISuggestion}
            />
          </div>
        )}
      </div>

      {/* DJ Player with crossfader */}
      <DJPlayerSection
        playingSongId={playingSongId}
        songs={songs}
        profileSongs={profileSongs}
        onSkip={handleSkip}
        collapsed={playerCollapsed}
        onToggleCollapse={() => setPlayerCollapsed((c) => !c)}
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