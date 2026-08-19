/**
 * useFableHost — shared Fable Engine X host logic.
 *
 * Owns persisted settings, the microphone beat tracker (visual measurement only,
 * never played back) and the broadcast bridge to the popped-out stage window.
 * Launching the stage window starts the engine immediately in auto mode.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import useFableBeat from "./useFableBeat";
import { DEFAULT_SETTINGS } from "./fableThemes";
import { openFableChannel, publishFable } from "./fableChannel";

const STORAGE_KEY = "nups_fable_x_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const EMPTY_FRAME = {
  bass: 0, mid: 0, high: 0, energy: 0, bands: [], shape: [],
  beatCount: 0, beatInBar: 1, barCount: 0,
};

export default function useFableHost({ track, nextTrack, bpm, deck = "A" } = {}) {
  const [settings, setSettings] = useState(loadSettings);
  const [running, setRunning] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const frameRef = useRef(EMPTY_FRAME);
  const channelRef = useRef(null);
  const lastPublishRef = useRef(0);

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

  const liveBpm = detectedBpm || Number(bpm) || Number(track?.bpm) || null;

  const publishMeta = useCallback(() => {
    publishFable(channelRef.current, {
      type: "meta",
      // Include media fields so the pop-out stage can play the same video.
      track: track ? {
        title: track.title, artist: track.artist, source: track.source,
        source_id: track.source_id, embed_url: track.embed_url, file_url: track.file_url,
      } : null,
      nextTrack: nextTrack ? { title: nextTrack.title, artist: nextTrack.artist } : null,
      bpm: liveBpm,
      deck,
      running,
    });
  }, [track, nextTrack, liveBpm, deck, running]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* noop */ }
    publishFable(channelRef.current, { type: "settings", settings });
  }, [settings]);

  useEffect(() => { publishMeta(); }, [publishMeta]);

  // One click: open the stage window AND arm the engine in auto 4/4 mode.
  const launchStage = useCallback(() => {
    setRunning(true);
    const win = window.open(
      "/FableStage",
      "nups_fable_stage",
      "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no"
    );
    if (win) {
      setStageOpen(true);
      try { win.focus(); } catch { /* noop */ }
      // Re-push state once the window has mounted its channel listener.
      setTimeout(() => {
        publishFable(channelRef.current, { type: "settings", settings });
        publishMeta();
      }, 900);
    }
    return !!win;
  }, [settings, publishMeta]);

  // Start the engine on this screen without opening a window.
  const startEngine = useCallback(() => {
    setRunning(true);
    publishFable(channelRef.current, { type: "settings", settings });
    publishMeta();
  }, [settings, publishMeta]);

  return {
    settings,
    setSettings,
    running,
    setRunning,
    startEngine,
    frameRef,
    launchStage,
    stageOpen,
    liveBpm,
    micStatus: micError ? "error" : listening ? "listening" : "idle",
    micError,
  };
}