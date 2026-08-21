/**
 * RateFeeEditor — admin UI for VenueRateConfig.
 * Every numeric field that drives door/driver/POS math is editable here.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { writeEntity } from '@/lib/nups/writeEntity';

const NUMERIC_FIELDS = [
  { key: 'cover_charge', label: 'Cover Charge ($)' },
  { key: 'reentry_charge', label: 'Re-Entry Fee ($)' },
  { key: 'card_discount', label: 'Card Discount ($)' },
  { key: 'vip_entry', label: 'VIP Entry ($)' },
  { key: 'bottle_service_base', label: 'Bottle Service Base ($)' },
  { key: 'two_drink_min', label: 'Two-Drink Min ($)' },
  { key: 'late_night_fee', label: 'Late-Night Fee ($)' },
  { key: 'friends_military', label: 'Friends / Military ($)' },
  { key: 'driver_payout_affiliated', label: 'Driver Payout — Affiliated ($/guest)' },
  { key: 'driver_payout_outside', label: 'Driver Payout — Outside ($/guest)' },
  { key: 'tax_rate', label: 'Tax Rate (0.08 = 8%)' },
  { key: 'house_commission_rate', label: 'House Commission Rate (0.40 = 40%)' },
];

export default function RateFeeEditor({ venueId, user }) {
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
      const rows = await base44.entities.VenueRateConfig.filter({ venue_id: venueId });
      if (!alive) return;
      setConfig(rows[0] || { venue_id: venueId, driver_bonus_tiers: [] });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [venueId]);

  const updateField = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const addBonusTier = () => setConfig(c => ({
    ...c,
    driver_bonus_tiers: [...(c.driver_bonus_tiers || []), { label: '', applies_when: '', bonus_amount: 0 }],
  }));

  const updateBonusTier = (i, key, val) => setConfig(c => {
    const tiers = [...(c.driver_bonus_tiers || [])];
    tiers[i] = { ...tiers[i], [key]: val };
    return { ...c, driver_bonus_tiers: tiers };
  });

  const removeBonusTier = (i) => setConfig(c => ({
    ...c,
    driver_bonus_tiers: (c.driver_bonus_tiers || []).filter((_, idx) => idx !== i),
  }));

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...config,
        venue_id: venueId,
        last_edited_by: user.email,
        last_edited_at: new Date().toISOString(),
      };
      const result = await writeEntity({
        entity: 'VenueRateConfig',
        operation: config.id ? 'update' : 'create',
        id: config.id,
        data: payload,
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || 'External' },
        venue_id: venueId,
        intent: config.id ? 'RATE_FEE_CONFIG_UPDATE' : 'RATE_FEE_CONFIG_CREATE',
      });
      if (!result?.ok) throw new Error(result?.block_reason || 'Rate configuration write was rejected.');
      if (!config.id && result?.value?.id) setConfig(c => ({ ...c, id: result.value.id }));
      setMsg({ kind: 'ok', text: 'Rates saved.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="text-slate-400 text-sm p-6">Loading rate config…</div>;
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-base">Rates & Fees — {config.venue_name || venueId}</CardTitle>
        <p className="text-xs text-slate-500">All door / driver / POS math reads from these values. No hardcoded numbers.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-slate-400">Venue Display Name</Label>
          <Input
            value={config.venue_name || ''}
            onChange={e => updateField('venue_name', e.target.value)}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NUMERIC_FIELDS.map(f => (
            <div key={f.key}>
              <Label className="text-xs text-slate-400">{f.label}</Label>
              <Input
                type="number"
                step="0.01"
                value={config[f.key] ?? ''}
                onChange={e => updateField(f.key, e.target.value === '' ? null : Number(e.target.value))}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Driver Bonus Tiers</Label>
            <Button size="sm" variant="outline" onClick={addBonusTier} className="border-slate-700 text-slate-200">
              <Plus className="w-3 h-3 mr-1" /> Add Tier
            </Button>
          </div>
          {(config.driver_bonus_tiers || []).length === 0 && (
            <p className="text-xs text-slate-500 italic">No bonus tiers configured.</p>
          )}
          {(config.driver_bonus_tiers || []).map((t, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2">
              <Input
                placeholder="Label (e.g. Weekend)"
                value={t.label || ''}
                onChange={e => updateBonusTier(i, 'label', e.target.value)}
                className="col-span-4 bg-slate-800 border-slate-700"
              />
              <Input
                placeholder="Applies when (e.g. Fri,Sat)"
                value={t.applies_when || ''}
                onChange={e => updateBonusTier(i, 'applies_when', e.target.value)}
                className="col-span-5 bg-slate-800 border-slate-700"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Bonus $"
                value={t.bonus_amount ?? ''}
                onChange={e => updateBonusTier(i, 'bonus_amount', Number(e.target.value))}
                className="col-span-2 bg-slate-800 border-slate-700"
              />
              <Button size="icon" variant="ghost" onClick={() => removeBonusTier(i)} className="col-span-1 text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800">
          <Label className="text-xs text-slate-400">Notes (internal)</Label>
          <Textarea
            value={config.notes || ''}
            onChange={e => updateField('notes', e.target.value)}
            className="bg-slate-800 border-slate-700"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Switch
            checked={!!config.active}
            onCheckedChange={v => updateField('active', v)}
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
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save Rates'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}