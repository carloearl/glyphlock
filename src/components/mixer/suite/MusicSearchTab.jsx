import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Youtube, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Public embed API key - safe for frontend (per user instruction; restricted key)
const YOUTUBE_API_KEY = 'AIzaSyDKesmHJytX_1MjfbVdcysMsTOa-GVcFjs';

export default function MusicSearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(new Set());

  async function handleSearch(e) {
    e?.preventDefault?.();
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        toast.error(`YouTube API: ${data.error.message}`);
        setResults([]);
      } else {
        setResults((data.items || []).map(item => ({
          source: 'youtube',
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url || '',
          embed_url: `https://www.youtube.com/embed/${item.id.videoId}`,
          watch_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        })));
      }
    } catch (err) {
      toast.error(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function importTrack(r) {
    await base44.entities.Track.create({
      title: r.title,
      artist: r.artist,
      source: 'youtube',
      source_id: r.id,
      thumbnail_url: r.thumbnail,
      embed_url: r.embed_url,
      active: true,
    });
    setImported(prev => new Set([...prev, r.id]));
    toast.success(`Imported "${r.title.slice(0, 40)}…"`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Youtube className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-bold text-white">YouTube Music Search</h3>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tracks (e.g. 'Daft Punk One More Time')"
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </form>

      {results.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
          Enter a search query to find tracks from YouTube.
        </div>
      )}

      <div className="grid gap-2">
        {results.map(r => (
          <Card key={r.id} className="bg-slate-900/50 border-slate-700/50 hover:border-red-500/40 transition">
            <CardContent className="p-3 flex items-center gap-3">
              <img src={r.thumbnail} alt="" className="w-20 h-14 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{r.title}</div>
                <div className="text-xs text-gray-400 truncate">{r.artist}</div>
              </div>
              <Button
                size="sm"
                onClick={() => importTrack(r)}
                disabled={imported.has(r.id)}
                className={imported.has(r.id) ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'}
              >
                {imported.has(r.id) ? '✓ Imported' : <><Plus className="w-4 h-4 mr-1" /> Import</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}