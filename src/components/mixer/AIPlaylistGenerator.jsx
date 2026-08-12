/**
 * AIPlaylistGenerator — AI-generated playlist via InvokeLLM
 * Asks the AI to suggest a full playlist of songs, user can accept and add them.
 */
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Plus, Music, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { VIBE_META } from "@/components/mixer/types/mixerTypes";
import { searchYouTubeMusic } from "@/lib/youtubeMusic";
import { invokeDJGateway } from "@/components/mixer/automation/djGatewayClient";

// Resolve AI-suggested track → real playable YouTube video ID (client-side).
// Returns null on failure (track is still added, just without a playable link).
async function resolveToYouTube(query) {
  try {
    const items = await searchYouTubeMusic(query, { maxResults: 1 });
    return items[0]?.id || null;
  } catch (_) {
    return null;
  }
}

export default function AIPlaylistGenerator({ isOpen, onClose, profileName, onAddSongs }) {
  const [mood, setMood] = useState("");
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveProgress, setResolveProgress] = useState({ done: 0, total: 0 });
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
        // ── Resolve each track to a real YouTube video ID so they actually play ──
        setResolving(true);
        setResolveProgress({ done: 0, total: data.playlist.length });
        const resolved = await Promise.all(
          data.playlist.map(async (s, i) => {
            const q = s.youtubeSearchQuery || `${s.title} ${s.artist}`;
            const videoId = await resolveToYouTube(q);
            setResolveProgress(p => ({ ...p, done: p.done + 1 }));
            return { ...s, resolvedVideoId: videoId };
          })
        );
        setResolving(false);
        const okCount = resolved.filter(r => r.resolvedVideoId).length;
        if (okCount < resolved.length) {
          toast.info(`Resolved ${okCount}/${resolved.length} tracks to YouTube`);
        }
        setResults({ ...data, playlist: resolved });
        // Only select tracks that resolved (those will actually play)
        setSelected(new Set(resolved.map((r, i) => r.resolvedVideoId ? i : null).filter(i => i !== null)));
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

  const handleAddSelected = async () => {
    if (!results?.playlist) return;
    const selectedSongs = results.playlist.filter((_, i) => selected.has(i));
    const songs = selectedSongs.map(s => ({
      title: s.title,
      artist: s.artist,
      vibeTag: s.vibeTag,
      energyLevel: s.energyLevel,
      // Real, playable YouTube URL — not a search results page
      youtubeUrl: s.resolvedVideoId
        ? `https://www.youtube.com/watch?v=${s.resolvedVideoId}`
        : "",
    }));

    // Persist resolved AI picks into the authoritative Track Library as well as
    // the local performance deck. The gateway de-duplicates by YouTube ID.
    const moodByVibe = {
      slow: "chill",
      seductive: "sensual",
      highEnergy: "high-energy",
      experimental: "neutral",
      crowdControl: "neutral",
      cooldown: "chill",
    };
    await Promise.all(selectedSongs
      .filter((song) => song.resolvedVideoId)
      .map((song) => invokeDJGateway("createTrack", {
        track: {
          title: song.title,
          artist: song.artist,
          source: "youtube",
          source_id: song.resolvedVideoId,
          embed_url: `https://www.youtube.com/embed/${song.resolvedVideoId}`,
          mood: moodByVibe[song.vibeTag] || "neutral",
          active: true,
        },
      }).catch(() => null)));

    onAddSongs(songs);
    toast.success(`Added ${songs.length} playable songs to deck + NUPS library`);
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
              disabled={generating || resolving}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 gap-2"
            >
              {(generating || resolving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating
                ? "Generating…"
                : resolving
                ? `Resolving tracks to YouTube… ${resolveProgress.done}/${resolveProgress.total}`
                : "Generate Playlist"}
            </Button>
            <p className="text-[10px] text-slate-500 text-center">
              Each track is resolved to a real YouTube video so it actually plays on the mixer.
            </p>
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
                      <p className="text-xs text-white truncate flex items-center gap-1.5">
                        {song.title}
                        {song.resolvedVideoId ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" title="Playable on mixer" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400/70 flex-shrink-0" title="Not found on YouTube" />
                        )}
                      </p>
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