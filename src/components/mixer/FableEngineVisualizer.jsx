/**
 * FableEngineVisualizer — inline Fable Engine X surface (Club TV screen).
 *
 * Shares the host logic with the DJ console tab: one button launches the stage
 * window on the 2nd screen and starts the engine in auto 4/4 mode. Full option
 * set lives in the DJ app's "Fable Visuals" tab. Produces no audio.
 */
import React from "react";
import { ExternalLink } from "lucide-react";
import FableStage from "./fable/FableStage";
import useFableHost from "./fable/useFableHost";

export default function FableEngineVisualizer({
  track,
  nextTrack,
  bpm,
  activeDeck = "A",
  className = "",
}) {
  const { settings, frameRef, launchStage, liveBpm } = useFableHost({
    track, nextTrack, bpm, deck: activeDeck, autoStart: true,
  });

  return (
    <div className={`relative h-full w-full bg-black ${className}`}>
      <FableStage
        settings={settings}
        frameRef={frameRef}
        track={track}
        nextTrack={nextTrack}
        bpm={liveBpm}
        deck={activeDeck}
      />
      <button
        type="button"
        onClick={launchStage}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-fuchsia-600/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-fuchsia-500"
      >
        <ExternalLink className="h-4 w-4" /> Stage On 2nd Screen
      </button>
    </div>
  );
}