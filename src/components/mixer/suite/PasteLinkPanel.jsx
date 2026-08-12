/**
 * PasteLinkPanel — add music without the YouTube search API.
 * Paste a YouTube share/watch link (or a direct audio file URL) and it becomes
 * a playable track: import to the library or send straight to a deck / Club TV.
 */
import React, { useState } from 'react';
import { Link2, Plus, Disc } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

function parseYouTubeId(url) {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export default function PasteLinkPanel({ onImport, onSendDeck }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [track, setTrack] = useState(null);

  function handleResolve(e) {
    e?.preventDefault?.();
    const raw = url.trim();
    if (!raw) return;

    const videoId = parseYouTubeId(raw);
    if (videoId) {
      setTrack({
        source: 'youtube',
        id: videoId,
        title: title.trim() || `YouTube ${videoId}`,
        artist: artist.trim() || 'Unknown Artist',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        embed_url: `https://www.youtube.com/embed/${videoId}`,
        watch_url: `https://www.youtube.com/watch?v=${videoId}`,
      });
      return;
    }

    if (/^https?:\/\/\S+$/i.test(raw)) {
      if (!title.trim()) {
        toast.error('Add a title for direct media links.');
        return;
      }
      setTrack({
        source: 'url',
        id: raw,
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        thumbnail: '',
        embed_url: raw,
        watch_url: raw,
      });
      return;
    }

    toast.error('Paste a YouTube link or a direct media URL (http/https).');
  }

  function reset() {
    setUrl('');
    setTitle('');
    setArtist('');
    setTrack(null);
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white">Add by Link</h4>
          <span className="text-[10px] text-slate-500">no search API needed</span>
        </div>

        <form onSubmit={handleResolve} className="space-y-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube link or direct audio/video URL (.mp3, .mp4, .m3u8…)"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist (optional)" />
          </div>
          <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500">Load Link</Button>
        </form>

        {track && (
          <div className="flex items-center gap-3 border-t border-slate-700/50 pt-2">
            {track.thumbnail
              ? <img src={track.thumbnail} alt="" className="w-16 h-11 rounded object-cover flex-shrink-0" />
              : <Disc className="w-8 h-8 text-slate-600 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{track.title}</div>
              <div className="text-xs text-gray-400 truncate">{track.artist}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button type="button" size="sm" onClick={() => onSendDeck(track, 'A')} className="min-h-[36px] bg-purple-600 hover:bg-purple-500 font-bold">A</Button>
              <Button type="button" size="sm" onClick={() => onSendDeck(track, 'B')} className="min-h-[36px] bg-cyan-600 hover:bg-cyan-500 font-bold">B</Button>
              <Button
                type="button"
                size="sm"
                onClick={async () => { await onImport(track); reset(); }}
                className="min-h-[36px] bg-slate-700 hover:bg-slate-600"
                title="Import into Track Library"
              >
                <Plus className="w-4 h-4 pointer-events-none" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}