import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Disc, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RISK_LEVELS = ['conservative', 'balanced', 'experimental'];
const GENRES = ['hip-hop', 'edm', 'r&b', 'pop', 'latin', 'trap', 'house', 'reggaeton', 'top-40'];

export default function PersonasTab() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', risk_tolerance: 'balanced', primary_genres: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const list = await base44.entities.AIDJPersona.list('-created_date');
    setPersonas(list);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name) return;
    const primary = form.primary_genres.split(',').map(s => s.trim()).filter(Boolean);
    await base44.entities.AIDJPersona.create({
      name: form.name,
      risk_tolerance: form.risk_tolerance,
      weighting_model: { crowd_weight: 0.4, entertainer_weight: 0.4, revenue_weight: 0.2 },
      transition_style_rules: { bpm_range: 10, mood_compatibility: [], energy_ramp: 'linear' },
      genre_bias_logic: { primary_genres: primary, secondary_genres: [], excluded_genres: [] },
    });
    setForm({ name: '', risk_tolerance: 'balanced', primary_genres: '' });
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this persona?')) return;
    await base44.entities.AIDJPersona.delete(id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Disc className="w-5 h-5 text-pink-400" /> AI DJ Personas ({personas.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-pink-600 hover:bg-pink-500">
          <Plus className="w-4 h-4 mr-1" /> New Persona
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-900/70 border-pink-500/30">
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div>
                <Label>Risk Tolerance</Label>
                <Select value={form.risk_tolerance} onValueChange={v => setForm({ ...form, risk_tolerance: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Primary Genres (comma-separated)</Label>
                <Input placeholder="hip-hop, edm, trap" value={form.primary_genres} onChange={e => setForm({ ...form, primary_genres: e.target.value })} />
                <div className="text-xs text-gray-500 mt-1">Options: {GENRES.join(', ')}</div>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-2">
                <Button type="submit" className="bg-pink-600 hover:bg-pink-500">Save Persona</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-pink-400 animate-spin" /></div>
      ) : personas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
          No personas yet. Create one to guide playlist generation.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {personas.map(p => (
            <Card key={p.id} className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                    <Badge variant="outline" className="text-xs border-pink-500/50 text-pink-300 mt-1">{p.risk_tolerance}</Badge>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {p.genre_bias_logic?.primary_genres?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {p.genre_bias_logic.primary_genres.map(g => (
                      <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                    ))}
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