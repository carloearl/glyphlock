/**
 * UnifiedMusicConsole — The single merged music panel for NUPS DJ Console.
 * Combines: MixerModuleView (profiles + deck + DJ player + AI + music search)
 * with the NUPS Music Suite (Tracks/YT/Personas/Playlist/Crowd/Jukebox).
 *
 * Mounted ONLY inside NUPS → DJ Console tab.
 */
import React, { useState } from "react";
import { Disc3, Sparkles } from "lucide-react";

import MixerModuleView from "@/components/mixer/MixerModuleView";
import MusicSuitePanel from "@/components/mixer/suite/MusicSuitePanel";

export default function UnifiedMusicConsole() {
  const [mode, setMode] = useState("mixer"); // "mixer" | "suite"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setMode("mixer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
            mode === "mixer"
              ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
              : "text-gray-400 hover:text-white border-transparent hover:bg-slate-800/50"
          }`}
        >
          <Disc3 className="w-4 h-4" /> DJ Mixer Pro
        </button>
        <button
          onClick={() => setMode("suite")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
            mode === "suite"
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
              : "text-gray-400 hover:text-white border-transparent hover:bg-slate-800/50"
          }`}
        >
          <Sparkles className="w-4 h-4" /> NUPS Music Suite
        </button>
      </div>

      {mode === "mixer" ? <MixerModuleView /> : <MusicSuitePanel />}
    </div>
  );
}