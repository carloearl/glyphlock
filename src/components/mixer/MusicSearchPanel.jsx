/**
 * MusicSearchPanel — Search free/CC-licensed music and load tracks into decks.
 * Calls the musicSearch backend function.
 */
import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Play, Loader2, Music, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function formatDuration(sec) {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MusicSearchPanel({ onAddTrack, onPreviewTrack }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await base44.functions.invoke('musicSearch', { query: query.trim(), limit: 20 });
      setResults(res.data?.tracks || []);
      if ((res.data?.tracks || []).length === 0) {
        toast.info("No tracks found — try a different search term");
      }
    } catch (err) {
      toast.error("Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-slate-700/30 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search free music..."
              className="pl-8 h-9 text-sm bg-black/30 border-slate-700"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="h-9 px-3 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <p className="text-[9px] text-slate-600">
          Free CC-licensed tracks via Jamendo API • Click + to add to your deck
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-xs text-slate-500">Searching...</span>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600">
            <Music className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs">No results found</span>
          </div>
        )}

        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600">
            <Music className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs">Search for music to get started</span>
            <span className="text-[10px] text-slate-700 mt-1">Try "chill", "electronic", "hip hop"</span>
          </div>
        )}

        {results.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors group"
          >
            {/* Album art */}
            <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700/50 overflow-hidden flex-shrink-0">
              {track.image_url ? (
                <img src={track.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{track.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 truncate">{track.artist}</span>
                {track.album && (
                  <span className="text-[10px] text-slate-600 truncate hidden sm:inline">• {track.album}</span>
                )}
                {track.genre && (
                  <span className="text-[10px] text-purple-400/60 truncate hidden sm:inline">• {track.genre}</span>
                )}
                {track.source === 'jamendo' && (
                  <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">JAMENDO</span>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-0.5 text-[10px] text-slate-600 flex-shrink-0">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(track.duration)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onPreviewTrack?.(track)}
                title="Preview"
              >
                <Play className="w-3 h-3 text-green-400" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  onAddTrack?.({
                    title: track.title || 'Unknown Track',
                    artist: track.artist || 'Unknown Artist',
                    uploadUrl: track.audio_url,
                    youtubeUrl: "",
                    imageUrl: track.image_url || "",
                    duration: track.duration,
                    license: track.license || "",
                    album: track.album || "",
                    genre: track.genre || "",
                    source: track.source || "search",
                  });
                  toast.success(`Added "${track.title}" by ${track.artist}`);
                }}
                title="Add to deck"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}