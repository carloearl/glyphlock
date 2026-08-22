import React from "react";
import UnifiedMusicConsole from "@/components/mixer/UnifiedMusicConsole";

export default function GlyphBotMixer() {
  return (
    <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 flex flex-col h-[calc(100dvh-8rem)] min-h-[600px]">
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-black text-white">DJ Pro Mixer</h1>
        <p className="text-sm text-gray-400 mt-1">
          AI-driven dual-deck mixing, crowd-reactive playlists and tip-weighted jukebox.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <UnifiedMusicConsole />
      </div>
    </div>
  );
}