/**
 * GlyphBot Mixer Page
 * DJ-style dancer song management module
 * Mount path: /glyphbot/mixer (rendered as GlyphBotMixer page)
 */
import React from "react";
import MixerModuleView from "@/components/mixer/MixerModuleView";

export default function GlyphBotMixer() {
  return (
    <div className="min-h-screen px-2 md:px-4 py-4">
      <MixerModuleView />
    </div>
  );
}