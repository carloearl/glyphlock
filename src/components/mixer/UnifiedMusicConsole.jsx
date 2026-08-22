/**
 * UnifiedMusicConsole — NUPS AUTO-DJ
 * One merged badass interface that replaces the human DJ.
 *
 * Brings together (single cohesive shell, no mode toggles):
 *   • Mixer Pro (profiles, decks, crossfader, AI, music search)
 *   • Track Library
 *   • YouTube Search
 *   • AI DJ Personas
 *   • AI Playlist Generator
 *   • Live Crowd Metrics
 *   • Jukebox Queue (tip-weighted)
 *
 * Mounted inside NUPS Owner → DJ tab and NUPS Staff → DJ tab.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Disc3, Music, Youtube, Disc, Zap, Activity, Radio, RadioTower, Stethoscope, Sparkles, Power, MonitorPlay,
} from "lucide-react";

import MixerModuleView from "@/components/mixer/MixerModuleView";
import TracksTab from "@/components/mixer/suite/TracksTab";
import MusicSearchTab from "@/components/mixer/suite/MusicSearchTab";
import PersonasTab from "@/components/mixer/suite/PersonasTab";
import PlaylistGenTab from "@/components/mixer/suite/PlaylistGenTab";
import CrowdTab from "@/components/mixer/suite/CrowdTab";
import JukeboxTab from "@/components/mixer/suite/JukeboxTab";
import RadioTab from "@/components/mixer/suite/RadioTab";
import TrackHealthTab from "@/components/mixer/suite/TrackHealthTab";
import FableVisualizerTab from "@/components/mixer/suite/FableVisualizerTab";
import SuiteErrorBoundary from "@/components/mixer/suite/SuiteErrorBoundary";
import DJAutomationDeck from "@/components/mixer/automation/DJAutomationDeck";
import useDJOperationalState from "@/components/mixer/automation/useDJOperationalState";
import { buildAutoDJPlan } from "@/lib/djAutoEngine";
import { invokeDJGateway } from "@/components/mixer/automation/djGatewayClient";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DJSessionProvider, useDJSession, useOptionalDJSession } from "@/components/mixer/session/DJSessionProvider";
import DJDiagnosticsTimeline from "@/components/mixer/session/DJDiagnosticsTimeline";
import ProviderCapabilityMatrix from "@/components/mixer/session/ProviderCapabilityMatrix";
import useMediaQuery from "@/components/mixer/session/useMediaQuery";
import { createScopedLayoutKey, WORKBENCH_PRESETS } from "@/components/mixer/session/djLayout";

const NAV = [
  { key: "mixer",    label: "Auto-DJ Mixer",  icon: Disc3,    accent: "from-purple-500 to-fuchsia-500", ring: "border-purple-500/60 bg-purple-500/15 text-purple-200" },
  { key: "tracks",   label: "Track Library",  icon: Music,    accent: "from-indigo-500 to-purple-500",  ring: "border-indigo-500/60 bg-indigo-500/15 text-indigo-200" },
  { key: "radio",    label: "Live Radio",     icon: RadioTower, accent: "from-amber-500 to-orange-500", ring: "border-amber-500/60 bg-amber-500/15 text-amber-200" },
  { key: "search",   label: "YT Search",      icon: Youtube,  accent: "from-red-500 to-rose-500",       ring: "border-red-500/60 bg-red-500/15 text-red-200" },
  { key: "personas", label: "AI Personas",    icon: Disc,     accent: "from-pink-500 to-rose-500",      ring: "border-pink-500/60 bg-pink-500/15 text-pink-200" },
  { key: "playlist", label: "AI Playlist",    icon: Zap,      accent: "from-cyan-500 to-sky-500",       ring: "border-cyan-500/60 bg-cyan-500/15 text-cyan-200" },
  { key: "crowd",    label: "Crowd Pulse",    icon: Activity, accent: "from-emerald-500 to-green-500",  ring: "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" },
  { key: "jukebox",  label: "Jukebox Queue",  icon: Radio,    accent: "from-amber-500 to-yellow-500",   ring: "border-amber-500/60 bg-amber-500/15 text-amber-200" },
  { key: "visuals",  label: "Fable Visuals",  icon: MonitorPlay, accent: "from-fuchsia-500 to-violet-500", ring: "border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-200" },
  { key: "health",   label: "Diagnostics",    icon: Stethoscope, accent: "from-slate-500 to-slate-400", ring: "border-cyan-500/60 bg-cyan-500/15 text-cyan-200" },
];

export default function UnifiedMusicConsole() {
  const parentSession = useOptionalDJSession();
  if (!parentSession) {
    return <DJSessionProvider><UnifiedMusicConsoleInner /></DJSessionProvider>;
  }
  return <UnifiedMusicConsoleInner />;
}

function UnifiedMusicConsoleInner() {
  const { state: djSession, scope, requestDeckLoad, setAutoDjArmed, setView } = useDJSession();
  const isWide = useMediaQuery("(min-width: 1100px)");
  const performancePanelRef = useRef(null);
  const utilityPanelRef = useRef(null);
  const [active, setActive] = useState("visuals");
  // Deliberately disarmed on page load. The operator's explicit click both
  // authorizes autonomous playback and satisfies browser media gesture rules.
  const [autoDj, setAutoDj] = useState(false);
  const [playHistory, setPlayHistory] = useState([]);
  const [runtimeBlockedTrackIds, setRuntimeBlockedTrackIds] = useState([]);
  const [performerOverrideId, setPerformerOverrideId] = useState("");
  const { snapshot, loading, error, lastUpdated, refresh } = useDJOperationalState({ pollMs: 10000 });

  useEffect(() => { setAutoDjArmed(autoDj); }, [autoDj, setAutoDjArmed]);
  useEffect(() => { setView(active); }, [active, setView]);

  const activeNav = NAV.find((n) => n.key === active) || NAV[0];
  const performerChoices = useMemo(() => {
    const seen = new Set();
    return (snapshot?.active_entertainer_shifts || []).map((shift) => {
      const entertainer = snapshot?.entertainers?.find((item) => item.id === shift.entertainer_id);
      return entertainer ? { entertainer, shift } : null;
    }).filter((choice) => {
      if (!choice || seen.has(choice.entertainer.id)) return false;
      seen.add(choice.entertainer.id);
      return true;
    });
  }, [snapshot]);
  const autoShift = (snapshot?.active_entertainer_shifts || []).find((shift) => shift.location === "Stage" && shift.status !== "on_break")
    || (snapshot?.active_entertainer_shifts || []).find((shift) => shift.status !== "on_break")
    || snapshot?.active_entertainer_shifts?.[0]
    || null;
  const overrideValid = performerOverrideId && performerChoices.some((choice) => choice.entertainer.id === performerOverrideId);
  const activeEntertainerId = overrideValid ? performerOverrideId : autoShift?.entertainer_id || null;
  const activeEntertainer = activeEntertainerId
    ? snapshot?.entertainers?.find((entertainer) => entertainer.id === activeEntertainerId) || null
    : null;
  const activePersona = (activeEntertainerId
    ? snapshot?.personas?.find((persona) => persona.entertainer_id === activeEntertainerId)
    : null) || snapshot?.personas?.[0] || null;
  const activeCrowd = (activeEntertainerId
    ? snapshot?.crowd_metrics?.find((metric) => metric.entertainer_id === activeEntertainerId)
    : null) || snapshot?.crowd_metrics?.find((metric) => metric.entertainer_id === "venue_floor") || snapshot?.crowd_metrics?.[0] || { energy_score: 5 };
  const currentEntityTrackId = useMemo(() => {
    const latestEntityEvent = [...playHistory].reverse().find((event) => event?.entityTrackId);
    return latestEntityEvent?.type === "play" ? latestEntityEvent.entityTrackId : null;
  }, [playHistory]);
  const automationPlan = useMemo(() => buildAutoDJPlan({
    tracks: snapshot?.tracks || [],
    persona: activePersona,
    crowd: activeCrowd,
    jukeboxRequests: snapshot?.jukebox_requests || [],
    performanceAnalytics: snapshot?.performance_analytics || [],
    entertainerId: activeEntertainer?.id || null,
    history: playHistory,
    currentTrackId: currentEntityTrackId,
    blockedTrackIds: runtimeBlockedTrackIds,
    limit: 5,
  }), [snapshot, activePersona, activeCrowd, activeEntertainer?.id, playHistory, currentEntityTrackId, runtimeBlockedTrackIds]);

  const handleLoadToMixerDeck = useCallback((track, deck = 'A') => {
    if (!track) return;
    const sourceId = track.source_id || track.videoId || String(track.id || '').replace(/^yt-/, '');
    const youtubeUrl = track.source === 'youtube' || sourceId?.length === 11
      ? (track.watch_url || `https://www.youtube.com/watch?v=${sourceId}`)
      : '';
    const song = {
      id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: track.title || 'YouTube Track',
      artist: track.artist || 'YouTube',
      youtubeUrl,
      uploadUrl: track.source === 'youtube' ? '' : (track.audio_url || track.file_url || track.embed_url || ''),
      imageUrl: track.thumbnail || track.thumbnail_url || '',
      source: track.source || (youtubeUrl ? 'youtube' : 'url'),
      _entityTrackId: track.library_track_id || null,
    };
    requestDeckLoad({
      requestId: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetDeck: deck,
      song,
      entityTrackId: track.library_track_id || track.id || null,
    });
  }, [requestDeckLoad]);

  const handlePlaybackEvent = useCallback((event) => {
    if (!event) return;
    setPlayHistory((previous) => [...previous, event].slice(-20));

    // Only entity-backed tracks enter persistent learning analytics. Local-only
    // scratch tracks still work in the mixer but cannot poison Track analytics
    // with browser-generated IDs.
    const entityTrackId = event.entityTrackId || null;
    if (!entityTrackId) return;
    if (event.type === "source_error") {
      setRuntimeBlockedTrackIds((previous) => previous.includes(entityTrackId) ? previous : [...previous, entityTrackId]);
      return;
    }
    const analyticsEvent = event.type === "complete" ? "complete" : event.type === "skip" ? "skip" : "play";
    invokeDJGateway("recordPlayback", {
      playback: {
        track_id: entityTrackId,
        event: analyticsEvent,
        entertainer_id: activeEntertainer?.id || "venue_floor",
        crowd_energy: activeCrowd?.energy_score ?? 5,
        tips: activeCrowd?.tips_last_30min ?? 0,
      },
    }).then(() => refresh()).catch((err) => console.debug("[AutoDJ analytics]", err?.message || err));
  }, [activeEntertainer?.id, activeCrowd?.energy_score, activeCrowd?.tips_last_30min, refresh]);

  const layoutStorageId = useMemo(
    () => createScopedLayoutKey(scope),
    [scope?.venueId, scope?.operatorId, scope?.deviceId],
  );
  const applyWorkbenchPreset = useCallback((name) => {
    const preset = WORKBENCH_PRESETS[name] || WORKBENCH_PRESETS.performance;
    const performanceSize = Math.max(35, Math.min(82, preset.performance + preset.library));
    performancePanelRef.current?.resize?.(performanceSize);
    utilityPanelRef.current?.resize?.(100 - performanceSize);
  }, []);

  return (
    <div className="space-y-4">
      {/* ── AUTO-DJ Command Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(600px circle at 20% 0%, rgba(168,85,247,0.35), transparent 60%)" }}
        />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Disc3 className="w-10 h-10 text-purple-400 animate-spin" style={{ animationDuration: "4s" }} />
              <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-purple-300/80 font-bold">N.U.P.S. Autonomous DJ</div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                The Program That Replaces The DJ
              </h2>
              <div className="text-xs text-gray-400 mt-0.5">
                AI-driven mixing · crowd-reactive playlists · tip-weighted jukebox · persona-based curation
              </div>
            </div>
          </div>

          <button
            onClick={() => setAutoDj((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold transition-all ${
              autoDj
                ? "border-green-500/60 bg-green-500/15 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.35)]"
                : "border-gray-700 bg-gray-900 text-gray-400"
            }`}
          >
            <Power className={`w-4 h-4 ${autoDj ? "animate-pulse" : ""}`} />
            {autoDj ? "AUTO-DJ: ENGAGED" : "AUTO-DJ: ARM"}
          </button>
        </div>
      </div>

      <DJAutomationDeck
        autoDj={autoDj}
        loading={loading}
        error={error}
        snapshot={snapshot}
        plan={automationPlan}
        activePersona={activePersona}
        activeEntertainer={activeEntertainer}
        activeCrowd={activeCrowd}
        performerChoices={performerChoices}
        performerOverrideId={performerOverrideId}
        onPerformerOverride={setPerformerOverrideId}
        runtimeBlockedCount={runtimeBlockedTrackIds.length}
        onClearRuntimeBlocks={() => setRuntimeBlockedTrackIds([])}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {/* ── Module Rail ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 pb-3 overflow-x-auto">
        {NAV.map(({ key, label, icon: Icon, ring }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border min-h-[40px] flex-shrink-0 ${
                isActive
                  ? ring
                  : "text-gray-400 hover:text-white hover:bg-slate-800/50 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/60 p-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Workbench</span>
        {[
          ["performance", "Performance"],
          ["library", "Library Focus"],
          ["visual", "Visual Focus"],
          ["compact", "Compact"],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => applyWorkbenchPreset(key)}
            className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-violet-400">
            {label}
          </button>
        ))}
        <button type="button" onClick={() => applyWorkbenchPreset("performance")}
          className="rounded-lg border border-cyan-500/40 px-2 py-1 text-[10px] text-cyan-200">
          Reset Layout
        </button>
        <span className="ml-auto text-[10px] text-slate-500">
          One playback owner · {djSession.commandAcks.length} deck commands acknowledged
        </span>
      </div>

      {/* The playback subtree stays mounted. Layout and utility changes resize
          subscribers around it; they never create a page-local player. */}
      <ResizablePanelGroup
        direction={isWide ? "horizontal" : "vertical"}
        autoSaveId={layoutStorageId}
        className="min-h-[760px] overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-950/40"
      >
        <ResizablePanel ref={performancePanelRef} defaultSize={isWide ? 72 : 62} minSize={isWide ? 35 : 45} className="min-h-0 overflow-hidden">
          <SuiteErrorBoundary>
            <MixerModuleView
              autoDj={autoDj}
              automationPlan={automationPlan}
              onPlaybackEvent={handlePlaybackEvent}
              libraryTracks={snapshot?.tracks || []}
            />
          </SuiteErrorBoundary>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-slate-700/70 hover:bg-fuchsia-500/70" />
        <ResizablePanel ref={utilityPanelRef} defaultSize={isWide ? 28 : 38} minSize={18} collapsible collapsedSize={0} className="min-h-0 overflow-auto">
          <div className="min-h-full space-y-3 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300/80">
              {activeNav.label}
            </div>
            <SuiteErrorBoundary key={active}>
              {active === "mixer"   && <DJDiagnosticsTimeline compact />}
              {active === "tracks"  && <TracksTab />}
              {active === "radio"   && <RadioTab />}
              {active === "search"  && <MusicSearchTab onLoadToMixerDeck={handleLoadToMixerDeck} />}
              {active === "personas" && <PersonasTab />}
              {active === "playlist" && <PlaylistGenTab />}
              {active === "crowd"   && <CrowdTab entertainerId={activeEntertainer?.id || null} />}
              {active === "jukebox" && <JukeboxTab />}
              {active === "visuals" && <FableVisualizerTab />}
              {active === "health"  && (
                <div className="space-y-3">
                  <TrackHealthTab />
                  <DJDiagnosticsTimeline />
                  <ProviderCapabilityMatrix />
                </div>
              )}
            </SuiteErrorBoundary>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}