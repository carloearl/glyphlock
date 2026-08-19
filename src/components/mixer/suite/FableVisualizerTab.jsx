/**
 * FableVisualizerTab — Fable Engine X controller inside the Auto-DJ console.
 * One click launches the stage window on the 2nd screen (auto 4/4 mode) while
 * every option — themes, backgrounds, visualizer, font, marquee copy, overlays
 * and effects — stays here on the operator's screen. Visual only, no audio.
 */
import React from "react";
import FableStage from "@/components/mixer/fable/FableStage";
import FableControlPanel from "@/components/mixer/fable/FableControlPanel";
import useFableHost from "@/components/mixer/fable/useFableHost";
import { MonitorPlay } from "lucide-react";

export default function FableVisualizerTab() {
  const {
    settings, setSettings, running, setRunning, frameRef,
    launchStage, stageOpen, liveBpm, micStatus, micError,
  } = useFableHost({});

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-fuchsia-500/25 bg-slate-950/60 p-4">
        <div className="flex items-center gap-3">
          <MonitorPlay className="h-6 w-6 text-fuchsia-400" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300/80">
              Dream Palace Fable Engine X
            </div>
            <div className="text-sm text-slate-400">
              Launch the stage window, drag it to the HDMI display, then fullscreen it.
              Auto mode beat-matches the room on a 4/4 count.
            </div>
          </div>
        </div>
        {micError && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {micError} — allow microphone access so the visuals can lock to the beat.
          </div>
        )}
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        {running ? (
          <FableStage settings={settings} frameRef={frameRef} bpm={liveBpm} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-bold uppercase tracking-[0.3em] text-white/30">
            Stage Idle
          </div>
        )}
      </div>

      <FableControlPanel
        settings={settings}
        onChange={setSettings}
        running={running}
        onStop={() => setRunning(false)}
        onLaunch={launchStage}
        stageOpen={stageOpen}
        micStatus={micStatus}
        bpm={liveBpm}
      />
    </div>
  );
}