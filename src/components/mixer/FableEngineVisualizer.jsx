/**
 * FableEngineVisualizer — Dream Palace Fable Engine X host.
 *
 * Owns the settings, the microphone beat tracker and the broadcast bridge to a
 * popped-out stage window (drag it onto the HDMI display and keep this control
 * panel on the desktop screen). Produces NO audio output of any kind.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import FableStage from "./fable/FableStage";
import FableControlPanel from "./fable/FableControlPanel";
import useFableBeat from "./fable/useFableBeat";
import { DEFAULT_SETTINGS } from "./fable/fableThemes";
import { openFableChannel, publishFable } from "./fable/fableChannel";

const STORAGE_KEY = "nups_fable_x_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function FableEngineVisualizer({
  track,
  nextTrack,
  bpm,
  activeDeck = "A",
  className = "",
}) {
  const [settings, setSettings] = useState(loadSettings);
  const [running, setRunning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [poppedOut, setPoppedOut] = useState(false);
  const frameRef = useRef({ bass: 0, mid: 0, high: 0, energy: 0, bands: [], shape: [], beatCount: 0 });
  const channelRef = useRef(null);
  const lastPublishRef = useRef(0);
  const popupRef = useRef(null);

  useEffect(() => {
    channelRef.current = openFableChannel();
    return () => { try { channelRef.current?.close(); } catch { /* noop */ } };
  }, []);

  const handleFrame = useCallback((frame) => {
    frameRef.current = frame;
    const now = performance.now();
    if (now - lastPublishRef.current > 40) {
      lastPublishRef.current = now;
      publishFable(channelRef.current, { type: "frame", frame });
    }
  }, []);

  const { bpm: detectedBpm, error: micError, listening } = useFableBeat({
    enabled: running,
    onFrame: handleFrame,
  });

  const liveBpm = (settings.beatSync && detectedBpm) || Number(bpm) || Number(track?.bpm) || null;

  // Persist + mirror settings/track to the stage window.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* noop */ }
    publishFable(channelRef.current, { type: "settings", settings });
  }, [settings]);

  useEffect(() => {
    publishFable(channelRef.current, {
      type: "meta",
      track: track ? { title: track.title, artist: track.artist } : null,
      nextTrack: nextTrack ? { title: nextTrack.title, artist: nextTrack.artist } : null,
      bpm: liveBpm,
      deck: activeDeck,
      running,
    });
  }, [track, nextTrack, liveBpm, activeDeck, running]);

  const popOut = () => {
    const win = window.open(
      "/FableStage",
      "nups_fable_stage",
      "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no"
    );
    if (win) {
      popupRef.current = win;
      setPoppedOut(true);
      // Push current state once the window is up.
      setTimeout(() => {
        publishFable(channelRef.current, { type: "settings", settings });
        publishFable(channelRef.current, {
          type: "meta",
          track: track ? { title: track.title, artist: track.artist } : null,
          nextTrack: nextTrack ? { title: nextTrack.title, artist: nextTrack.artist } : null,
          bpm: liveBpm,
          deck: activeDeck,
          running,
        });
      }, 900);
    }
  };

  const micStatus = micError ? "error" : listening ? "listening" : "idle";

  return (
    <div className={`relative h-full w-full bg-black ${className}`}>
      {running ? (
        <FableStage
          settings={settings}
          frameRef={frameRef}
          track={track}
          nextTrack={nextTrack}
          bpm={liveBpm}
          deck={activeDeck}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40">
            Dream Palace Fable Engine X
          </div>
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="rounded-2xl bg-fuchsia-600 px-8 py-4 text-lg font-black uppercase tracking-wider text-white hover:bg-fuchsia-500"
          >
            Start Visualizer
          </button>
          <div className="max-w-md text-xs text-white/40">
            Uses the room microphone to lock onto the beat. Visuals only — this feature
            never outputs audio.
          </div>
        </div>
      )}

      {/* Controls toggle — panel can stay on this screen while the stage runs
          in the popped-out window on the HDMI display. */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="absolute right-4 top-1/2 z-20 flex h-11 items-center gap-2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/70 px-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-black/90"
      >
        {panelOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
        {panelOpen ? "Close" : "Visuals"}
      </button>

      {panelOpen && (
        <div className="absolute inset-y-4 right-4 z-20 w-[min(420px,90%)] overflow-y-auto">
          <FableControlPanel
            settings={settings}
            onChange={setSettings}
            running={running}
            onToggleRun={() => setRunning((v) => !v)}
            onPopOut={popOut}
            poppedOut={poppedOut}
            micStatus={micStatus}
            bpm={liveBpm}
          />
        </div>
      )}
    </div>
  );
}