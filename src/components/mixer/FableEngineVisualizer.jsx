/**
 * FableEngineVisualizer — inline Fable Engine X surface (Club TV screen).
 *
 * Shares the host logic with the DJ console tab: one button launches the stage
 * window on the 2nd screen and starts the engine in auto 4/4 mode. Full option
 * set lives in the DJ app's "Fable Visuals" tab. Produces no audio.
 */
import React from "react";
import { ExternalLink, Play } from "lucide-react";
import FableStage from "./fable/FableStage";
import useFableHost from "./fable/useFableHost";

export default function FableEngineVisualizer({
  track,
  nextTrack,
  bpm,
  activeDeck = "A",
  className = "",
}) {
  const { settings, running, setRunning, frameRef, launchStage, liveBpm } = useFableHost({
    track, nextTrack, bpm, deck: activeDeck,
  });

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
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={launchStage}
              className="flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-6 py-4 text-base font-black uppercase tracking-wider text-white hover:bg-fuchsia-500"
            >
              <ExternalLink className="h-5 w-5" /> Launch Stage On 2nd Screen
            </button>
            <button
              type="button"
              onClick={() => setRunning(true)}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-sm font-bold text-slate-200 hover:bg-white/5"
            >
              <Play className="h-4 w-4" /> Run Here
            </button>
          </div>
          <div className="max-w-md text-xs text-white/40">
            Auto mode beat-matches the room mic on a 4/4 count. All styling options live in
            the DJ console → Fable Visuals tab. Visuals only — never any audio output.
          </div>
        </div>
      )}
    </div>
  );
}