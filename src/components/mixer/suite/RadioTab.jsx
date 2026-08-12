/**
 * RadioTab — live radio / streaming-station decks.
 *
 * Any station that exposes a direct stream URL (Icecast/Shoutcast MP3 or AAC,
 * or an HLS .m3u8) plays through the same AudioEngine the decks use. Stations
 * are saved into the Track Library as `radio:<url>` sources so they survive
 * reloads and can be sent to Deck A/B and Club TV like any other source.
 */
import React, { useState, useEffect } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Radio, Plus, Loader2, Trash2, Disc, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getClubTVSender } from '@/components/mixer/ClubBroadcastChannel';
import AudioEngine from '@/components/mixer/AudioEngine';

const RADIO_PREFIX = 'radio:';

export default function RadioTab() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', url: '', genre: '' });
  const [preview, setPreview] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await invokeDJGateway('snapshot');
    setStations((data.tracks || []).filter(t => String(t.source_id || '').startsWith(RADIO_PREFIX)));
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    const url = form.url.trim();
    if (!form.name.trim() || !url) return;
    if (!/^https?:\/\/\S+$/i.test(url)) {
      toast.error('Enter a direct stream URL starting with http(s)://');
      return;
    }
    if (!/^https:/i.test(url)) {
      toast.error('Stream must be https:// — browsers block insecure audio on a secure page.');
      return;
    }
    await invokeDJGateway('createTrack', {
      track: {
        title: form.name.trim(),
        artist: 'Live Radio',
        genre: form.genre.trim() || undefined,
        source: 'manual',
        source_id: `${RADIO_PREFIX}${url}`,
        file_url: url,
        active: true,
      },
    });
    setForm({ name: '', url: '', genre: '' });
    toast.success(`Station "${form.name.trim()}" saved`);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Remove this station?')) return;
    await invokeDJGateway('deleteTrack', { track_id: id });
    load();
  }

  function sendToDeck(station, deck) {
    getClubTVSender().publish({
      [deck === 'A' ? 'deckA' : 'deckB']: {
        title: station.title,
        artist: 'Live Radio',
        audioUrl: station.file_url,
      },
    });
    toast.success(`${station.title} → Deck ${deck}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Live Radio Stations ({stations.length})</h3>
      </div>

      <Card className="bg-amber-500/5 border-amber-500/30">
        <CardContent className="p-3 flex gap-2 text-[11px] text-amber-200/90">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            Playing music publicly at the venue needs its own performance license
            (ASCAP / BMI / SESAC / GMR) no matter where the audio comes from —
            radio, satellite, or your own files. Use a stream your venue is
            licensed or subscribed to.
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/70 border-amber-500/30">
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Station Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Power 98.3" required />
            </div>
            <div className="md:col-span-2">
              <Label>Direct Stream URL *</Label>
              <Input
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://stream.example.com/hiphop.mp3  or  .aac / .m3u8"
                required
              />
            </div>
            <div>
              <Label>Format / Genre</Label>
              <Input value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} placeholder="hip-hop" />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-1" /> Save Station
              </Button>
            </div>
          </form>
          <p className="text-[11px] text-slate-500 mt-3">
            Needs the <span className="text-amber-300">stream</span> URL, not the station's website. Most
            services publish it as a .mp3/.aac/.m3u8 link, or expose one in a .pls/.m3u playlist file.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : stations.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
          No stations yet. Add one above to stream it into the booth.
        </div>
      ) : (
        <div className="grid gap-2">
          {stations.map(s => (
            <Card key={s.id} className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{s.title}</div>
                    <div className="text-[10px] font-mono text-slate-600 truncate">{s.file_url}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button type="button" size="sm" onClick={() => setPreview(preview === s.id ? null : s.id)} className="min-h-[36px] bg-slate-700 hover:bg-slate-600">
                      {preview === s.id ? 'Hide' : 'Listen'}
                    </Button>
                    <Button type="button" size="sm" onClick={() => sendToDeck(s, 'A')} className="min-h-[36px] bg-purple-600 hover:bg-purple-500 font-bold">
                      <Disc className="w-3.5 h-3.5 mr-1 pointer-events-none" /><span className="pointer-events-none">A</span>
                    </Button>
                    <Button type="button" size="sm" onClick={() => sendToDeck(s, 'B')} className="min-h-[36px] bg-cyan-600 hover:bg-cyan-500 font-bold">
                      <Disc className="w-3.5 h-3.5 mr-1 pointer-events-none" /><span className="pointer-events-none">B</span>
                    </Button>
                    <Button type="button" size="sm" onClick={() => handleDelete(s.id)} className="min-h-[36px] bg-slate-800 hover:bg-red-900/60">
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    </Button>
                  </div>
                </div>

                {preview === s.id && (
                  <div className="border-t border-slate-700/50 pt-2">
                    <AudioEngine
                      src={s.file_url}
                      title={s.title}
                      artist="Live Radio"
                      onError={() => toast.error(`${s.title}: stream refused to play. It may be offline, http-only, or blocking outside players.`)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}