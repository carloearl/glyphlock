/**
 * FableStagePage — the pop-out Fable Engine X stage.
 * Drag this window onto the HDMI/second display and fullscreen it; all controls
 * stay in the DJ console window. Output is visual only — never audio.
 */
import React, { useEffect, useRef, useState } from "react";
import FableStage from "@/components/mixer/fable/FableStage";
import { DEFAULT_SETTINGS } from "@/components/mixer/fable/fableThemes";
import { openFableChannel } from "@/components/mixer/fable/fableChannel";
import useFableSyntheticBeat from "@/components/mixer/fable/useFableSyntheticBeat";
import { Maximize2 } from "lucide-react";

export default function FableStagePage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [meta, setMeta] = useState({ track: null, nextTrack: null, bpm: null, deck: "A" });
  const frameRef = useRef({ bass: 0, mid: 0, high: 0, energy: 0, bands: [], shape: [], beatCount: 0 });
  const rootRef = useRef(null);
  const lastFrameAtRef = useRef(0);
  const [live, setLive] = useState(false);

  // Whenever the console stops feeding measured frames, keep the stage moving on
  // its own tempo grid so a second-screen display is never a dead black panel.
  useFableSyntheticBeat({
    enabled: !live,
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
      if (msg.type === "frame") {
        frameRef.current = msg.frame;
        lastFrameAtRef.current = performance.now();
      }
      else if (msg.type === "settings") setSettings({ ...DEFAULT_SETTINGS, ...msg.settings });
      else if (msg.type === "meta") setMeta({
        track: msg.track, nextTrack: msg.nextTrack, bpm: msg.bpm, deck: msg.deck || "A",
      });
    };
    return () => { try { channel.close(); } catch { /* noop */ } };
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 bg-black">
      <FableStage
        settings={settings}
        frameRef={frameRef}
        track={meta.track}
        nextTrack={meta.nextTrack}
        bpm={meta.bpm || 124}
        deck={meta.deck}
      />
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
    </div>
  );
}