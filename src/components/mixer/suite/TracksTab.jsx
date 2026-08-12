import React, { useState, useEffect } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Plus, Music, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MOODS = ['high-energy', 'sensual', 'chill', 'aggressive', 'neutral'];
const GENRES = ['hip-hop', 'edm', 'r&b', 'pop', 'latin', 'trap', 'house', 'reggaeton', 'top-40'];

export default function TracksTab() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', genre: '', bpm: '', mood: '', duration: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await invokeDJGateway('snapshot');
    setTracks(data.tracks || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title) return;
    await invokeDJGateway('createTrack', {
      track: {
        title: form.title,
        artist: form.artist,
        genre: form.genre || undefined,
        bpm: form.bpm ? Number(form.bpm) : undefined,
        mood: form.mood || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        source: 'manual',
        active: true,
      },
    });
    setForm({ title: '', artist: '', genre: '', bpm: '', mood: '', duration: '' });
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this track?')) return;
    await invokeDJGateway('deleteTrack', { track_id: id });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" /> Track Library ({tracks.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-500">
          <Plus className="w-4 h-4 mr-1" /> Add Track
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-900/70 border-purple-500/30">
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Artist</Label><Input value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} /></div>
              <div>
                <Label>Genre</Label>
                <Select value={form.genre} onValueChange={v => setForm({ ...form, genre: v })}>
                  <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                  <SelectContent>{GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mood</Label>
                <Select value={form.mood} onValueChange={v => setForm({ ...form, mood: v })}>
                  <SelectTrigger><SelectValue placeholder="Select mood" /></SelectTrigger>
                  <SelectContent>{MOODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>BPM</Label><Input type="number" value={form.bpm} onChange={e => setForm({ ...form, bpm: e.target.value })} /></div>
              <div><Label>Duration (sec)</Label><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
              <div className="md:col-span-2 flex gap-2 pt-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-500">Save Track</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
          No tracks yet. Add one above or import from Music Search.
        </div>
      ) : (
        <div className="grid gap-2">
          {tracks.map(t => (
            <Card key={t.id} className="bg-slate-900/50 border-slate-700/50 hover:border-purple-500/50 transition">
              <CardContent className="p-3 flex items-center gap-3">
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center"><Music className="w-5 h-5 text-slate-500" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                  <div className="text-xs text-gray-400 truncate">{t.artist || '—'}</div>
                </div>
                <div className="hidden sm:flex gap-1 flex-wrap">
                  {t.genre && <Badge variant="outline" className="text-xs">{t.genre}</Badge>}
                  {t.mood && <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">{t.mood}</Badge>}
                  {t.bpm && <Badge variant="outline" className="text-xs">{t.bpm} BPM</Badge>}
                  {t.source && t.source !== 'manual' && <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">{t.source}</Badge>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}