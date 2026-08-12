/**
 * ArchiveSearchPanel — keyless music search (Internet Archive).
 * Returns full-length streamable MP3s; no API key needed.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Plus, Library } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ArchiveSearchPanel({ onImport }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(new Set());

  async function handleSearch(e) {
    e?.preventDefault?.();
    if (query.trim().length < 2) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await base44.functions.invoke('archiveAudioSearch', {
        query: query.trim(),
        maxResults: 10,
        kiosk_session: sessionStorage.getItem('nups_kiosk_session') || undefined,
      });
      const items = res?.data?.items || [];
      setResults(items);
      if (items.length === 0) toast.info('No playable audio found for that search.');
    } catch (err) {
      toast.error(`Archive search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(r) {
    await onImport({
      source: 'url',
      id: r.stream_url,
      title: r.title,
      artist: r.artist,
      thumbnail: '',
      embed_url: r.stream_url,
      watch_url: r.page_url,
    });
    setImported(prev => new Set([...prev, r.id]));
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white">Free Music Search</h4>
          <span className="text-[10px] text-slate-500">Internet Archive · no API key</span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search public-domain / Creative Commons audio"
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>

        <div className="grid gap-2">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 border-t border-slate-700/50 pt-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{r.title}</div>
                <div className="text-xs text-gray-400 truncate">{r.artist}</div>
              </div>
              <audio src={r.stream_url} controls preload="none" className="h-8 w-44 flex-shrink-0" />
              <Button
                type="button"
                size="sm"
                onClick={() => handleImport(r)}
                disabled={imported.has(r.id)}
                className={`min-h-[36px] flex-shrink-0 ${imported.has(r.id) ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                title="Import into Track Library"
              >
                {imported.has(r.id) ? '✓' : <Plus className="w-4 h-4 pointer-events-none" />}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}