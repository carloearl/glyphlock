/**
 * AIPlaylistGenerator — AI-generated playlist via InvokeLLM
 * Asks the AI to suggest a full playlist of songs, user can accept and add them.
 */
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Plus, Music } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { VIBE_META } from "@/components/mixer/types/mixerTypes";

export default function AIPlaylistGenerator({ isOpen, onClose, profileName, onAddSongs }) {
  const [mood, setMood] = useState("");
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const handleGenerate = async () => {
    setGenerating(true);
    setResults(null);
    setSelected(new Set());
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert DJ music curator for adult entertainment venues. Generate a playlist of ${count} real songs.
${profileName ? `This is for dancer "${profileName}".` : ""}
${mood ? `Mood/theme: ${mood}` : "General mix of vibes."}

For each song, provide:
- title: the real song title
- artist: the real artist name  
- vibeTag: one of: slow, seductive, highEnergy, experimental, crowdControl, cooldown
- energyLevel: integer 1-10
- youtubeSearchQuery: a YouTube search query to find this song

Return REAL songs that actually exist. Mix energy levels for good flow.`,
        response_json_schema: {
          type: "object",
          properties: {
            playlist: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  artist: { type: "string" },
                  vibeTag: { type: "string" },
                  energyLevel: { type: "integer" },
                  youtubeSearchQuery: { type: "string" },
                },
                required: ["title", "artist", "vibeTag", "energyLevel"],
              },
            },
            description: { type: "string" },
          },
          required: ["playlist"],
        },
      });

      if (data?.playlist?.length) {
        setResults(data);
        // Select all by default
        setSelected(new Set(data.playlist.map((_, i) => i)));
      } else {
        toast.error("AI returned empty playlist");
      }
    } catch (err) {
      toast.error("AI generation failed: " + (err.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddSelected = () => {
    if (!results?.playlist) return;
    const songs = results.playlist
      .filter((_, i) => selected.has(i))
      .map(s => ({
        title: s.title,
        artist: s.artist,
        vibeTag: s.vibeTag,
        energyLevel: s.energyLevel,
        youtubeUrl: s.youtubeSearchQuery ? `https://www.youtube.com/results?search_query=${encodeURIComponent(s.youtubeSearchQuery)}` : "",
      }));
    onAddSongs(songs);
    toast.success(`Added ${songs.length} songs to deck`);
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Playlist Generator
          </DialogTitle>
        </DialogHeader>

        {/* Configuration */}
        {!results && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-300">Mood / Theme (optional)</Label>
              <Input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. Late night seductive, high energy peak hour, chill R&B"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Number of songs</Label>
              <Input
                type="number" min={3} max={20}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generating…" : "Generate Playlist"}
            </Button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {results.description && (
              <p className="text-xs text-slate-400 mb-2">{results.description}</p>
            )}
            <div className="flex-1 overflow-y-auto space-y-1">
              {results.playlist.map((song, idx) => {
                const vibeMeta = VIBE_META[song.vibeTag];
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                      selected.has(idx)
                        ? "border-purple-500/40 bg-purple-500/10"
                        : "border-slate-700/30 bg-slate-800/30 hover:bg-slate-800/50"
                    }`}
                    onClick={() => toggleSelect(idx)}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0 ${
                      selected.has(idx) ? "bg-purple-500 text-white" : "bg-slate-700 text-slate-400"
                    }`}>
                      {selected.has(idx) ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{song.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{song.artist}</p>
                    </div>
                    {vibeMeta && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0"
                        style={{ color: vibeMeta.color, borderColor: `${vibeMeta.color}50`, backgroundColor: `${vibeMeta.color}15` }}>
                        {vibeMeta.label}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">E{song.energyLevel}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
              <Button variant="outline" className="flex-1 border-slate-700" onClick={() => setResults(null)}>
                Regenerate
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 gap-1.5"
                onClick={handleAddSelected}
                disabled={selected.size === 0}
              >
                <Plus className="w-4 h-4" /> Add {selected.size} Songs
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}