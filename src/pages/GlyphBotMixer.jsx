/**
 * GlyphBot Mixer Page
 * DJ-style dancer song management module + NUPS Music Suite
 * Mount path: /GlyphBotMixer
 */
import React, { useState } from "react";
import { Disc3, Sparkles } from "lucide-react";
import MixerModuleView from "@/components/mixer/MixerModuleView";
import MusicSuitePanel from "@/components/mixer/suite/MusicSuitePanel";

export default function GlyphBotMixer() {
  const [view, setView] = useState("mixer"); // "mixer" | "suite"

  return (
    <div className="min-h-screen px-2 md:px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView("mixer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
            view === "mixer"
              ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
              : "text-gray-400 hover:text-white border-transparent hover:bg-slate-800/50"
          }`}
        >
          <Disc3 className="w-4 h-4" /> DJ Mixer Pro
        </button>
        <button
          onClick={() => setView("suite")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
            view === "suite"
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
              : "text-gray-400 hover:text-white border-transparent hover:bg-slate-800/50"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Music Suite
        </button>
      </div>

      {view === "mixer" ? <MixerModuleView /> : <MusicSuitePanel />}
    </div>
  );
}