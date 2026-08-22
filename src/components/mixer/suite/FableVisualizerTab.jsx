/**
 * FableVisualizerTab — Fable Engine X controller inside the Auto-DJ console.
 * Start it here on this screen, or launch the pop-out stage for the 2nd screen.
 * Reads the live mixer state so overlays and the optional video backdrop follow
 * whatever the player is on. Visual only — never any audio output.
 */
import React from "react";
import FableStage from "@/components/mixer/fable/FableStage";
import FableControlPanel from "@/components/mixer/fable/FableControlPanel";
import useFableHost from "@/components/mixer/fable/useFableHost";
import useLivePlayerTrack from "@/components/mixer/fable/useLivePlayerTrack";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MonitorPlay } from "lucide-react";

export default function FableVisualizerTab() {
  const live = useLivePlayerTrack();
  const {
    settings, setSettings, running, setRunning, startEngine, frameRef,
    launchStage, stageOpen, liveBpm, micStatus, micError, syncSource,
  } = useFableHost({
    track: live.track,
    nextTrack: live.nextTrack,
    bpm: live.track?.bpm,
    deck: live.deck,
    autoStart: false,
  });

  const liveLabel = live.track
    ? `${live.track.title || "Untitled"}${live.track.artist ? ` · ${live.track.artist}` : ""}`
    : "";

  return (
    <div className="flex h-[80vh] min-h-[440px] flex-col gap-3">
      <div className="flex-shrink-0 rounded-2xl border border-fuchsia-500/25 bg-slate-950/60 p-4">
        <div className="flex items-center gap-3">
          <MonitorPlay className="h-6 w-6 text-fuchsia-400" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300/80">
              Dream Palace Fable Engine X
            </div>
            <div className="text-sm text-slate-400">
              Start it here, or launch the stage window and drag it to the HDMI display.
              Deck {live.deck} · {liveLabel || "no track loaded yet"}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Sync: {syncSource}
            </div>
          </div>
        </div>
        {micError && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {micError} — visuals keep running on the tempo grid. Allow audio input in the
            browser (address-bar icon) for live beat-locked 4/4 sync.
          </div>
        )}
      </div>

      <ResizablePanelGroup
        direction="vertical"
        autoSaveId="fable-visuals-split"
        className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black"
      >
        <ResizablePanel defaultSize={34} minSize={16} className="min-h-0 overflow-hidden">
          <div className="h-full w-full overflow-hidden bg-black">
            <FableStage
              settings={settings}
              frameRef={frameRef}
              track={live.track}
              nextTrack={live.nextTrack}
              bpm={liveBpm}
              deck={live.deck}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-slate-700/70 hover:bg-fuchsia-500/70" />
        <ResizablePanel defaultSize={66} minSize={24} className="min-h-0 overflow-hidden bg-slate-950/40">
          <div className="h-full overflow-y-auto p-2">
            <FableControlPanel
              settings={settings}
              onChange={setSettings}
              running={running}
              onStart={startEngine}
              onStop={() => setRunning(false)}
              onLaunch={launchStage}
              stageOpen={stageOpen}
              micStatus={micStatus}
              bpm={liveBpm}
              liveTrackLabel={liveLabel}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}