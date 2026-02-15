/**
 * AISidePanel - AI suggestions, classification, optimization
 */
import React, { useState } from "react";
import { Sparkles, Zap, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { classifySong, suggestPlaylist, optimizeProfile } from "@/components/mixer/services/aiMixerAssistant";
import { VIBE_META } from "@/components/mixer/types/mixerTypes";

export default function AISidePanel({ profile, songs, selectedSong, profileSongs, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState("");

  const handleSuggest = async () => {
    if (!profile || profileSongs.length === 0) { toast.error("Need songs in deck first"); return; }
    setLoading("suggest");
    const res = await suggestPlaylist(profileSongs, profile.name);
    setLoading("");
    if (res.success) setSuggestions(res.data);
    else toast.error(res.error || "AI suggestion failed");
  };

  const handleOptimize = async () => {
    if (!profile) { toast.error("Select a profile first"); return; }
    setLoading("optimize");
    const res = await optimizeProfile(profile, profileSongs);
    setLoading("");
    if (res.success) setOptimization(res.data);
    else toast.error(res.error || "AI optimization failed");
  };

  const handleClassify = async () => {
    if (!selectedSong) { toast.error("Select a song first"); return; }
    setLoading("classify");
    const res = await classifySong({ title: selectedSong.title, artist: selectedSong.artist, notes: selectedSong.notes });
    setLoading("");
    if (res.success) {
      toast.success(`AI: ${VIBE_META[res.data.vibeTag]?.label || res.data.vibeTag}, Energy ${res.data.energyLevel}`);
      onApplySuggestion?.("classify", res.data);
    } else {
      toast.error(res.error || "Classification failed");
    }
  };

  // Energy distribution for current deck
  const energyDist = profileSongs.reduce((acc, s) => {
    const bucket = s.energyLevel <= 3 ? "cool" : s.energyLevel <= 7 ? "medium" : "hot";
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-slate-900/60 border-l border-slate-700/50">
      <div className="p-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Assistant
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Quick actions */}
        <div className="space-y-2">
          <Button size="sm" variant="outline" className="w-full h-8 border-slate-700 text-xs gap-1.5 justify-start" onClick={handleSuggest} disabled={!!loading}>
            {loading === "suggest" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-yellow-400" />}
            Suggest playlist improvements
          </Button>
          <Button size="sm" variant="outline" className="w-full h-8 border-slate-700 text-xs gap-1.5 justify-start" onClick={handleOptimize} disabled={!!loading}>
            {loading === "optimize" ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3 text-cyan-400" />}
            Optimize profile
          </Button>
          <Button size="sm" variant="outline" className="w-full h-8 border-slate-700 text-xs gap-1.5 justify-start" onClick={handleClassify} disabled={!!loading || !selectedSong}>
            {loading === "classify" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-pink-400" />}
            Classify selected song
          </Button>
        </div>

        {/* Energy pacing */}
        {profileSongs.length > 0 && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Energy Pacing</h4>
            <div className="flex gap-2 text-[10px]">
              <span className="text-cyan-400">Cool: {energyDist.cool || 0}</span>
              <span className="text-yellow-400">Medium: {energyDist.medium || 0}</span>
              <span className="text-red-400">Hot: {energyDist.hot || 0}</span>
            </div>
            <div className="flex gap-0.5 h-2">
              {profileSongs.map((s) => (
                <div
                  key={s.id}
                  className="flex-1 rounded-sm"
                  style={{ backgroundColor: s.energyLevel <= 3 ? "#06b6d4" : s.energyLevel <= 7 ? "#f59e0b" : "#ef4444" }}
                  title={`${s.title} (${s.energyLevel})`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Suggestions output */}
        {suggestions && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Suggestions</h4>
            {suggestions.overallAssessment && (
              <p className="text-[11px] text-slate-400">{suggestions.overallAssessment}</p>
            )}
            {suggestions.suggestions?.map((s, i) => (
              <div key={i} className="p-2 rounded bg-slate-800/60 border border-slate-700/30 text-[11px] text-slate-300">
                <span className="text-purple-300 font-semibold">{s.type}</span>: {s.description}
              </div>
            ))}
          </div>
        )}

        {/* Optimization output */}
        {optimization && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Optimization</h4>
            {optimization.improvements?.map((imp, i) => (
              <div key={i} className={`p-2 rounded border text-[11px] ${
                imp.priority === "high" ? "border-red-500/30 bg-red-500/5" :
                imp.priority === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                "border-slate-700/30 bg-slate-800/60"
              }`}>
                <span className="font-semibold text-slate-200">{imp.type}</span>
                <p className="text-slate-400 mt-0.5">{imp.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}