import React, { useState, useEffect } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Plus, Music, Loader2 } from 'lucide-react';
import TrackLibraryRow from '@/components/mixer/suite/TrackLibraryRow';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TrackCsvImport from '@/components/mixer/suite/TrackCsvImport';

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
        <div className="flex items-center gap-2">
          <TrackCsvImport onImported={load} />
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-500">
            <Plus className="w-4 h-4 mr-1" /> Add Track
          </Button>
        </div>
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
        <>
          <div className="text-[11px] text-slate-500">
            <span className="text-fuchsia-300 font-semibold">Drag</span> any track onto Deck A/B in the player below to load it.
            Tracks marked <span className="text-amber-300 font-semibold">No audio</span> have no playable source and can't be loaded.
          </div>
          <div className="grid gap-2">
            {tracks.map(t => (
              <TrackLibraryRow key={t.id} track={t} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}