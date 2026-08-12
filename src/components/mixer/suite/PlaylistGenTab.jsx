import React, { useState, useEffect } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { generatePlaylist } from '@/lib/playlistEngine';
import { Zap, Loader2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PlaylistGenTab() {
  const [tracks, setTracks] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [entertainers, setEntertainers] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedEntertainer, setSelectedEntertainer] = useState('');
  const [energy, setEnergy] = useState(5);
  const [generated, setGenerated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await invokeDJGateway('snapshot');
    setTracks(data.tracks || []);
    setPersonas(data.personas || []);
    setEntertainers(data.entertainers || []);
    setLoading(false);
  }

  function handleGenerate() {
    const persona = personas.find(p => p.id === selectedPersona);
    const ordered = generatePlaylist({
      tracks,
      persona,
      crowd: { energy_score: energy },
      limit: 20,
    });
    setGenerated(ordered);
    toast.success(`Generated playlist with ${ordered.length} tracks`);
  }

  async function handleSave() {
    if (!generated.length) return;
    setSaving(true);
    try {
      await invokeDJGateway('savePlaylist', {
        playlist: {
          name: `Playlist ${new Date().toLocaleString()}`,
          entertainer_id: selectedEntertainer || 'unassigned',
          persona_id: selectedPersona || undefined,
          ordered_tracks: generated,
          crowd_energy_score: energy,
          generation_timestamp: new Date().toISOString(),
          status: 'active',
        },
      });
      toast.success('Playlist saved');
    } catch (error) {
      console.error('[PlaylistGen] save failed', error);
      toast.error(`Playlist save failed: ${error?.response?.data?.message || error?.message || 'permission or network error'}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Zap className="w-5 h-5 text-cyan-400" /> AI Playlist Generator
      </h3>

      <Card className="bg-slate-900/70 border-cyan-500/30">
        <CardContent className="p-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Persona</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger><SelectValue placeholder="Optional - select persona" /></SelectTrigger>
                <SelectContent>
                  {personas.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entertainer</Label>
              <Select value={selectedEntertainer} onValueChange={setSelectedEntertainer}>
                <SelectTrigger><SelectValue placeholder="Optional - select entertainer" /></SelectTrigger>
                <SelectContent>
                  {entertainers.map(e => <SelectItem key={e.id} value={e.id}>{e.stage_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="flex justify-between">Crowd Energy <span className="text-cyan-400 font-bold">{energy}/10</span></Label>
            <Slider value={[energy]} onValueChange={v => setEnergy(v[0])} min={0} max={10} step={1} className="mt-2" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={tracks.length === 0} className="bg-cyan-600 hover:bg-cyan-500 flex-1">
              <Zap className="w-4 h-4 mr-1" /> Generate ({tracks.length} tracks available)
            </Button>
            {generated.length > 0 && (
              <Button onClick={handleSave} disabled={saving} variant="outline" className="border-green-500/50 text-green-400">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generated.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Generated Queue</div>
          {generated.map((t, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm flex-shrink-0">{t.position}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                  <div className="text-xs text-gray-400 truncate">{t.artist || '—'} · {t.reason}</div>
                </div>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">{t.score}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}