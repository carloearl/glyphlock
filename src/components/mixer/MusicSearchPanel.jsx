/**
 * MusicSearchPanel — multi-source music search INSIDE the mixer panel.
 * Surfaces YouTube (Data API v3, server-keyed), Jamendo, Internet Archive,
 * and the NUPS Track Library through the nupsMusicDiscovery backend function.
 * The browser never sees the YouTube API key — search is proxied server-side.
 */
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Play, Loader2, Music, Clock, ExternalLink, Youtube } from "lucide-react";
import { toast } from "sonner";
import { searchMusicSources, providerLabel } from "@/lib/musicDiscovery";

function formatDuration(sec) {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SOURCE_BADGE = {
  youtube: "bg-red-500/20 text-red-300",
  jamendo: "bg-green-500/20 text-green-300",
  internet_archive: "bg-amber-500/20 text-amber-300",
  nups_library: "bg-cyan-500/20 text-cyan-300",
};

export default function MusicSearchPanel({ onAddTrack, onPreviewTrack }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const discovery = await searchMusicSources(query.trim(), { limit: 20 });
      setResults(discovery.results || []);
      setProviders(discovery.providers || []);
      if ((discovery.results || []).length === 0) {
        toast.info("No tracks found — try a different search term");
      }
    } catch (err) {
      toast.error(`Search failed: ${err?.message || "unknown error"}`);
      setResults([]);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const toSongData = (r) => ({
    title: r.title || "Unknown Track",
    artist: r.artist || "Unknown Artist",
    youtubeUrl: r.source === "youtube" ? (r.watch_url || r.embed_url || "") : "",
    uploadUrl: r.source === "youtube" ? "" : (r.audio_url || r.embed_url || ""),
    imageUrl: r.thumbnail || r.image_url || "",
    duration: r.duration || 0,
    license: r.license || "",
    album: r.album || "",
    genre: r.genre || "",
    source: r.source || "search",
    sourceId: r.source_id || r.id,
  });

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
              placeholder="Search YouTube, Jamendo, Archive…"
              className="pl-8 h-9 text-sm bg-black/30 border-slate-700"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="h-9 px-3 bg-red-600 hover:bg-red-500"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <p className="text-[9px] text-slate-600">
          YouTube · Jamendo · Internet Archive · NUPS Library — click + to add to the active playlist
        </p>
        {providers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {providers.map((p) => (
              <span
                key={p.provider}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  p.status === "ok"
                    ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/5"
                    : p.status === "not_configured"
                    ? "border-amber-500/30 text-amber-300 bg-amber-500/5"
                    : "border-rose-500/30 text-rose-300 bg-rose-500/5"
                }`}
              >
                {providerLabel(p.provider)} · {p.status}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
            <span className="text-xs text-slate-500">Searching…</span>
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
            <Youtube className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs">Search YouTube and free music sources</span>
            <span className="text-[10px] text-slate-700 mt-1">Try "Daft Punk", "chill", "hip hop"</span>
          </div>
        )}

        {results.map((track) => {
          const isYt = track.source === "youtube";
          return (
            <div
              key={track.id}
              className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors group"
            >
              {/* Album art */}
              <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700/50 overflow-hidden flex-shrink-0">
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
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
                  {track.genre && (
                    <span className="text-[10px] text-purple-400/60 truncate hidden sm:inline">• {track.genre}</span>
                  )}
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${SOURCE_BADGE[track.source] || "bg-slate-700/40 text-slate-300"}`}>
                    {providerLabel(track.source).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-0.5 text-[10px] text-slate-600 flex-shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {formatDuration(track.duration)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                {isYt && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      const url = track.watch_url || track.embed_url;
                      if (url) window.open(url, "_blank", "noopener");
                    }}
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onPreviewTrack?.(track)}
                  title="Preview / load on Deck A"
                >
                  <Play className="w-3.5 h-3.5 text-green-400" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    onAddTrack?.(toSongData(track));
                    toast.success(`Added "${track.title}" by ${track.artist}`);
                  }}
                  title="Add to active playlist"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}