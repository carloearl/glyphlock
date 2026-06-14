/**
 * DailyChecklistEditor — admin UI for DailyChecklistConfig.
 * Manages the per-venue entertainer compliance checklist.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, AlertCircle, CheckCircle2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

function uid() {
  return `q_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_ITEMS = [
  { id: uid(), label: 'I am physically fit and able to perform tonight.', required: true, order: 0 },
  { id: uid(), label: 'I have read and agree to the venue conduct policy.', required: true, order: 1 },
  { id: uid(), label: 'I confirm my contact information on file is current.', required: true, order: 2 },
];

export default function DailyChecklistEditor({ venueId, user }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!venueId) return;
    setLoading(true);
    setMsg(null);
    (async () => {
      const rows = await base44.entities.DailyChecklistConfig.filter({ venue_id: venueId });
      if (!alive) return;
      setConfig(rows[0] || { venue_id: venueId, items: DEFAULT_ITEMS, active: true });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [venueId]);

  const updateItem = (i, key, val) => setConfig(c => {
    const items = [...(c.items || [])];
    items[i] = { ...items[i], [key]: val };
    return { ...c, items };
  });

  const addItem = () => setConfig(c => ({
    ...c,
    items: [...(c.items || []), { id: uid(), label: '', required: true, order: (c.items || []).length }],
  }));

  const removeItem = (i) => setConfig(c => ({
    ...c,
    items: (c.items || []).filter((_, idx) => idx !== i),
  }));

  const move = (i, dir) => setConfig(c => {
    const items = [...(c.items || [])];
    const j = i + dir;
    if (j < 0 || j >= items.length) return c;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...c, items: items.map((it, idx) => ({ ...it, order: idx })) };
  });

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const items = (config.items || []).map((it, idx) => ({ ...it, order: idx, id: it.id || uid() }));
      const payload = {
        ...config,
        items,
        venue_id: venueId,
        last_edited_by: user.email,
        last_edited_at: new Date().toISOString(),
      };
      if (config.id) {
        await base44.entities.DailyChecklistConfig.update(config.id, payload);
      } else {
        const created = await base44.entities.DailyChecklistConfig.create(payload);
        setConfig(c => ({ ...c, id: created.id }));
      }
      setMsg({ kind: 'ok', text: 'Checklist saved.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="text-slate-400 text-sm p-6">Loading checklist…</div>;
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-base">Daily Compliance Checklist</CardTitle>
        <p className="text-xs text-slate-500">Questions entertainers acknowledge at check-in. All required items must be checked to proceed.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {(config.items || []).map((item, i) => (
          <div key={item.id || i} className="flex items-start gap-2 p-3 rounded border border-slate-800 bg-slate-800/30">
            <div className="flex flex-col gap-1">
              <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} className="h-6 w-6 text-slate-400">
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === config.items.length - 1} className="h-6 w-6 text-slate-400">
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={item.label}
                onChange={e => updateItem(i, 'label', e.target.value)}
                placeholder="Checklist question / statement"
                className="bg-slate-800 border-slate-700"
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!item.required}
                  onCheckedChange={v => updateItem(i, 'required', v)}
                />
                <Label className="text-xs text-slate-400">Required to check in</Label>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => removeItem(i)} className="text-red-400">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" onClick={addItem} className="border-slate-700 text-slate-200">
          <Plus className="w-3 h-3 mr-1" /> Add Question
        </Button>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
          <Switch
            checked={!!config.active}
            onCheckedChange={v => setConfig(c => ({ ...c, active: v }))}
          />
          <span className="text-xs text-slate-400">Active</span>
          <div className="ml-auto flex items-center gap-3">
            {msg && (
              <span className={`text-xs flex items-center gap-1 ${msg.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {msg.kind === 'ok' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {msg.text}
              </span>
            )}
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save Checklist'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}