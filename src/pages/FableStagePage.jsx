/**
 * FableStagePage — the pop-out Fable Engine X stage.
 * Drag this window onto the HDMI/second display and fullscreen it; all controls
 * stay in the DJ console window. Output is visual only — never audio.
 */
import React, { useEffect, useRef, useState } from "react";
import FableStage from "@/components/mixer/fable/FableStage";
import FableControlPanel from "@/components/mixer/fable/FableControlPanel";
import { DEFAULT_SETTINGS } from "@/components/mixer/fable/fableThemes";
import { openFableChannel } from "@/components/mixer/fable/fableChannel";
import useFableSyntheticBeat from "@/components/mixer/fable/useFableSyntheticBeat";
import { Maximize2, EyeOff } from "lucide-react";

export default function FableStagePage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [meta, setMeta] = useState({ track: null, nextTrack: null, bpm: null, deck: "A", syncSource: "synthetic-grid" });
  const stageIdRef = useRef(globalThis.crypto?.randomUUID?.() || `stage-${Date.now()}`);
  const frameRef = useRef({ bass: 0, mid: 0, high: 0, energy: 0, bands: [], shape: [], beatCount: 0 });
  const rootRef = useRef(null);
  const lastFrameAtRef = useRef(0);
  const [live, setLive] = useState(false);
  const [running, setRunning] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const liveTrackLabel = meta.track
    ? `${meta.track.title || "Untitled"}${meta.track.artist ? ` · ${meta.track.artist}` : ""}`
    : "";
  const micStatus = !running
    ? "idle"
    : meta.syncSource === "deck-audio" ? "deck"
    : meta.syncSource === "room-mic" ? "listening"
    : "auto";

  // Whenever the console stops feeding measured frames, keep the stage moving on
  // its own tempo grid so a second-screen display is never a dead black panel.
  useFableSyntheticBeat({
    enabled: running && !live,
    bpm: meta.bpm || 124,
    onFrame: (frame) => { frameRef.current = frame; },
  });

  useEffect(() => {
    const id = setInterval(() => {
      setLive(performance.now() - lastFrameAtRef.current < 1200);
    }, 600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = "NUPS · Fable Engine X Stage";
    const channel = openFableChannel();
    if (!channel) return;
    channel.onmessage = (event) => {
      const msg = event.data || {};
      if (msg.targetStageId && msg.targetStageId !== stageIdRef.current) return;
      if (msg.type === "snapshot") {
        setSettings({ ...DEFAULT_SETTINGS, ...msg.settings });
        setMeta({
          track: msg.track, nextTrack: msg.nextTrack, bpm: msg.bpm,
          deck: msg.deck || "A", syncSource: msg.syncSource || "synthetic-grid",
        });
      }
      else if (msg.type === "frame") {
        frameRef.current = msg.frame;
        lastFrameAtRef.current = performance.now();
      }
      else if (msg.type === "settings") setSettings({ ...DEFAULT_SETTINGS, ...msg.settings });
      else if (msg.type === "meta") setMeta((previous) => ({
        ...previous, track: msg.track, nextTrack: msg.nextTrack, bpm: msg.bpm, deck: msg.deck || "A",
      }));
    };
    channel.postMessage({ type: "stage-ready", stageId: stageIdRef.current, at: Date.now() });
    return () => { try { channel.close(); } catch { /* noop */ } };
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 bg-black overflow-hidden">
      <FableStage
        settings={settings}
        frameRef={frameRef}
        track={meta.track}
        nextTrack={meta.nextTrack}
        bpm={meta.bpm || 124}
        deck={meta.deck}
      />

      <div className="absolute left-4 top-4 z-20 rounded-lg border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
        Visual only · {meta.syncSource}
      </div>

      <button
        type="button"
        onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen?.();
          else rootRef.current?.requestFullscreen?.();
        }}
        className="absolute bottom-4 right-4 z-20 flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-black/60 px-3 text-xs font-bold uppercase tracking-wider text-white/70 hover:bg-black/90"
      >
        <Maximize2 className="h-4 w-4" /> Fullscreen
      </button>

      {showControls ? (
        <div className="absolute right-0 top-0 z-30 flex h-full w-[380px] max-w-[92vw] flex-col border-l border-white/10 bg-slate-950/85 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Stage Controls</span>
            <button
              type="button"
              onClick={() => setShowControls(false)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:bg-black/80"
            >
              <EyeOff className="h-3.5 w-3.5" /> Hide
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <FableControlPanel
              settings={settings}
              onChange={setSettings}
              running={running}
              onStart={() => setRunning(true)}
              onStop={() => setRunning(false)}
              onLaunch={() => {}}
              hideLaunch
              stageOpen
              micStatus={micStatus}
              bpm={meta.bpm}
              liveTrackLabel={liveTrackLabel}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Show controls"
          onClick={() => setShowControls(true)}
          className="absolute right-3 top-1/2 z-30 h-4 w-4 -translate-y-1/2 rounded-full bg-white/20 transition-colors hover:bg-white/60"
        />
      )}
    </div>
  );
}