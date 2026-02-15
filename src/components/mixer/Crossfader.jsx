/**
 * Crossfader — DJ-style crossfade slider between Deck A and Deck B
 * Value range: 0 (full A) to 100 (full B). 50 = equal blend.
 */
import React from "react";
import { Slider } from "@/components/ui/slider";

export default function Crossfader({ value, onChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
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
    </div>
  );
}