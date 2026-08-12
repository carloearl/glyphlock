import React, { useState } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Search, Youtube, Plus, Loader2, GripVertical, Disc } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getClubTVSender } from '@/components/mixer/ClubBroadcastChannel';
import { searchYouTubeMusic } from '@/lib/youtubeMusic';
import PasteLinkPanel from '@/components/mixer/suite/PasteLinkPanel';

export default function MusicSearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(new Set());

  async function handleSearch(e) {
    e?.preventDefault?.();
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setResults([]);
    try {
      const items = await searchYouTubeMusic(query, { maxResults: 12 });
      setResults(items.map(item => ({ source: 'youtube', ...item })));
    } catch (err) {
      console.error('[MusicSearch] search failed', err);
      toast.error(`YouTube search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function importTrack(r) {
    await invokeDJGateway('createTrack', {
      track: {
        title: r.title,
        artist: r.artist,
        source: r.source || 'youtube',
        source_id: r.id,
        thumbnail_url: r.thumbnail,
        embed_url: r.embed_url,
        active: true,
      },
    });
    setImported(prev => new Set([...prev, r.id]));
    toast.success(`Imported "${r.title.slice(0, 40)}…"`);
  }

  // Send a YouTube result straight to a deck — broadcasts to the ClubTV window
  // so staff can preview on the TV without needing to import first.
  function loadToDeck(r, deck) {
    const payload = {
      [deck === 'A' ? 'deckA' : 'deckB']: {
        title: r.title,
        artist: r.artist,
        videoId: r.id,
      },
    };
    getClubTVSender().publish(payload);
    toast.success(`Sent to Deck ${deck} · Club TV`);
  }

  function handleDragStart(e, r) {
    // Match PlayerDeck's existing drop protocol but also include a direct
    // YouTube payload fallback for TV broadcasting.
    try {
      const yt = JSON.stringify({ videoId: r.id, title: r.title, artist: r.artist });
      e.dataTransfer.setData('application/mixer-youtube', yt);
      e.dataTransfer.setData('text/plain', r.watch_url);
      e.dataTransfer.effectAllowed = 'copy';
    } catch (_) { /* noop */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Youtube className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-bold text-white">YouTube Music Search</h3>
      </div>
      <PasteLinkPanel onImport={importTrack} onSendDeck={loadToDeck} />

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

      {results.length > 0 && (
        <div className="text-[11px] text-slate-500 -mt-1 mb-1">
          <span className="text-fuchsia-300 font-semibold">Drag</span> a result onto Deck A/B in the mixer — or use the
          <span className="text-purple-300 font-semibold"> A</span> / <span className="text-cyan-300 font-semibold">B</span> buttons to send it straight to the Club TV.
        </div>
      )}

      <div className="grid gap-2">
        {results.map(r => (
          <Card
            key={r.id}
            className="bg-slate-900/50 border-slate-700/50 hover:border-red-500/40 transition cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(e, r)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <img src={r.thumbnail} alt="" className="w-20 h-14 rounded object-cover flex-shrink-0 pointer-events-none" />
              <div className="flex-1 min-w-0 pointer-events-none">
                <div className="text-sm font-semibold text-white truncate">{r.title}</div>
                <div className="text-xs text-gray-400 truncate">{r.artist}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); loadToDeck(r, 'A'); }}
                  className="min-h-[36px] min-w-[36px] bg-purple-600 hover:bg-purple-500 font-bold"
                  title="Send to Deck A (Club TV)"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Disc className="w-3.5 h-3.5 mr-1 pointer-events-none" />
                  <span className="pointer-events-none">A</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); loadToDeck(r, 'B'); }}
                  className="min-h-[36px] min-w-[36px] bg-cyan-600 hover:bg-cyan-500 font-bold"
                  title="Send to Deck B (Club TV)"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Disc className="w-3.5 h-3.5 mr-1 pointer-events-none" />
                  <span className="pointer-events-none">B</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); importTrack(r); }}
                  disabled={imported.has(r.id)}
                  className={`min-h-[36px] ${imported.has(r.id) ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                  title="Import into Track Library"
                  style={{ touchAction: 'manipulation' }}
                >
                  {imported.has(r.id) ? '✓' : <Plus className="w-4 h-4 pointer-events-none" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}