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
import React, { useCallback, useMemo, useState } from "react";
import {
  Disc3, Music, Youtube, Disc, Zap, Activity, Radio, Sparkles, Power,
} from "lucide-react";

import MixerModuleView from "@/components/mixer/MixerModuleView";
import TracksTab from "@/components/mixer/suite/TracksTab";
import MusicSearchTab from "@/components/mixer/suite/MusicSearchTab";
import PersonasTab from "@/components/mixer/suite/PersonasTab";
import PlaylistGenTab from "@/components/mixer/suite/PlaylistGenTab";
import CrowdTab from "@/components/mixer/suite/CrowdTab";
import JukeboxTab from "@/components/mixer/suite/JukeboxTab";
import SuiteErrorBoundary from "@/components/mixer/suite/SuiteErrorBoundary";
import DJAutomationDeck from "@/components/mixer/automation/DJAutomationDeck";
import useDJOperationalState from "@/components/mixer/automation/useDJOperationalState";
import { buildAutoDJPlan } from "@/lib/djAutoEngine";
import { invokeDJGateway } from "@/components/mixer/automation/djGatewayClient";

const NAV = [
  { key: "mixer",    label: "Auto-DJ Mixer",  icon: Disc3,    accent: "from-purple-500 to-fuchsia-500", ring: "border-purple-500/60 bg-purple-500/15 text-purple-200" },
  { key: "tracks",   label: "Track Library",  icon: Music,    accent: "from-indigo-500 to-purple-500",  ring: "border-indigo-500/60 bg-indigo-500/15 text-indigo-200" },
  { key: "search",   label: "YT Search",      icon: Youtube,  accent: "from-red-500 to-rose-500",       ring: "border-red-500/60 bg-red-500/15 text-red-200" },
  { key: "personas", label: "AI Personas",    icon: Disc,     accent: "from-pink-500 to-rose-500",      ring: "border-pink-500/60 bg-pink-500/15 text-pink-200" },
  { key: "playlist", label: "AI Playlist",    icon: Zap,      accent: "from-cyan-500 to-sky-500",       ring: "border-cyan-500/60 bg-cyan-500/15 text-cyan-200" },
  { key: "crowd",    label: "Crowd Pulse",    icon: Activity, accent: "from-emerald-500 to-green-500",  ring: "border-emerald-500/60 bg-emerald-500/15 text-emerald-200" },
  { key: "jukebox",  label: "Jukebox Queue",  icon: Radio,    accent: "from-amber-500 to-yellow-500",   ring: "border-amber-500/60 bg-amber-500/15 text-amber-200" },
];

export default function UnifiedMusicConsole() {
  const [active, setActive] = useState("mixer");
  const [autoDj, setAutoDj] = useState(true);
  const [playHistory, setPlayHistory] = useState([]);
  const { snapshot, loading, error, lastUpdated, refresh } = useDJOperationalState({ pollMs: 10000 });

  const activeNav = NAV.find((n) => n.key === active) || NAV[0];
  const activeShift = snapshot?.active_entertainer_shifts?.[0] || null;
  const activeEntertainer = activeShift
    ? snapshot?.entertainers?.find((entertainer) => entertainer.id === activeShift.entertainer_id) || null
    : null;
  const activePersona = (activeShift
    ? snapshot?.personas?.find((persona) => persona.entertainer_id === activeShift.entertainer_id)
    : null) || snapshot?.personas?.[0] || null;
  const activeCrowd = (activeShift
    ? snapshot?.crowd_metrics?.find((metric) => metric.entertainer_id === activeShift.entertainer_id)
    : null) || snapshot?.crowd_metrics?.[0] || { energy_score: 5 };
  const currentEntityTrackId = useMemo(() => {
    const latestPlay = [...playHistory].reverse().find((event) => event?.type === "play" && event?.entityTrackId);
    return latestPlay?.entityTrackId || null;
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
    limit: 5,
  }), [snapshot, activePersona, activeCrowd, activeEntertainer?.id, playHistory, currentEntityTrackId]);

  const handlePlaybackEvent = useCallback((event) => {
    if (!event) return;
    setPlayHistory((previous) => [...previous, event].slice(-20));

    // Only entity-backed tracks enter persistent learning analytics. Local-only
    // scratch tracks still work in the mixer but cannot poison Track analytics
    // with browser-generated IDs.
    const entityTrackId = event.entityTrackId || null;
    if (!entityTrackId) return;
    const analyticsEvent = event.type === "complete" ? "complete" : event.type === "skip" ? "skip" : "play";
    invokeDJGateway("recordPlayback", {
      playback: {
        track_id: entityTrackId,
        event: analyticsEvent,
        entertainer_id: activeEntertainer?.id || "venue_floor",
        crowd_energy: activeCrowd?.energy_score ?? 5,
        tips: activeCrowd?.tips_last_30min ?? 0,
      },
    }).catch((err) => console.debug("[AutoDJ analytics]", err?.message || err));
  }, [activeEntertainer?.id, activeCrowd?.energy_score, activeCrowd?.tips_last_30min]);

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
            {autoDj ? "AUTO-DJ: ENGAGED" : "AUTO-DJ: STANDBY"}
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

      {/* ── Active Panel ── */}
      <SuiteErrorBoundary key={active}>
        {active === "mixer"    && (
          <MixerModuleView
            autoDj={autoDj}
            automationPlan={automationPlan}
            onPlaybackEvent={handlePlaybackEvent}
          />
        )}
        {active === "tracks"   && <TracksTab />}
        {active === "search"   && <MusicSearchTab />}
        {active === "personas" && <PersonasTab />}
        {active === "playlist" && <PlaylistGenTab />}
        {active === "crowd"    && <CrowdTab entertainerId={activeEntertainer?.id || null} />}
        {active === "jukebox"  && <JukeboxTab />}
      </SuiteErrorBoundary>
    </div>
  );
}