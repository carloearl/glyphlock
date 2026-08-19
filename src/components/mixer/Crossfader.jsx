/**
 * Crossfader — DJ-style crossfade slider between Deck A and Deck B
 * Value range: 0 (full A) to 100 (full B). 50 = equal blend.
 */
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { WandSparkles, Shuffle } from "lucide-react";

export default function Crossfader({
  value,
  onChange,
  autoMix = false,
  onToggleAutoMix,
  blendSeconds = 6,
  onBlendSecondsChange,
  onBlendNow,
  transitioning = false,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2">
      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${value < 50 ? 'text-cyan-400' : 'text-slate-600'}`}>
        A
      </span>
      <div className="flex-1 relative">
        {/* Track background with gradient */}
        <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full overflow-hidden pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30" />
        </div>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={100}
          step={1}
        />
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${value > 50 ? 'text-pink-400' : 'text-slate-600'}`}>
        B
      </span>

      {/* Auto Mix — smooth blend controls live right on the fader */}
      <div className="flex items-center gap-2 border-l border-slate-700/50 pl-3">
        <Button
          size="sm"
          variant="outline"
          className={`h-7 text-[10px] gap-1 ${autoMix
            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
            : "border-slate-600 text-slate-400"}`}
          onClick={onToggleAutoMix}
          title="Automatically blend into the cue deck before each track ends"
        >
          <WandSparkles className="w-3 h-3" />
          Auto Mix {autoMix ? "ON" : "OFF"}
        </Button>

        <label className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
          BLEND
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={blendSeconds}
            onChange={(e) => onBlendSecondsChange?.(Number(e.target.value))}
            className="w-20 accent-emerald-500"
          />
          <span className="text-slate-300 w-6">{blendSeconds}s</span>
        </label>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px] gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
          onClick={onBlendNow}
          disabled={transitioning}
          title="Blend into the cue deck now over the blend time"
        >
          <Shuffle className="w-3 h-3" />
          {transitioning ? "Blending…" : "Blend Now"}
        </Button>
      </div>
    </div>
  );
}