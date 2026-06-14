/**
 * ContractTermsEditor — admin UI for ContractTermsConfig.
 * Edits per-venue contract text for each contract type.
 * Auto-stamps version on every save (date-based: v-YYYYMMDD-HHmm).
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

const CONTRACT_TYPES = [
  { value: 'GLYPHBUCKS', label: 'GlyphBucks Order' },
  { value: 'VIP', label: 'VIP Session' },
  { value: 'ENTERTAINER', label: 'Entertainer Agreement' },
  { value: 'VENUE_GENERAL', label: 'Venue General' },
];

function stampVersion() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `v-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export default function ContractTermsEditor({ venueId, user }) {
  const [contractType, setContractType] = useState('GLYPHBUCKS');
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
      const rows = await base44.entities.ContractTermsConfig.filter({ venue_id: venueId, contract_type: contractType });
      if (!alive) return;
      setConfig(rows[0] || {
        venue_id: venueId,
        contract_type: contractType,
        terms_text: '',
        version: '',
        active: true,
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [venueId, contractType]);

  const updateField = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const newVersion = stampVersion();
      const payload = {
        ...config,
        venue_id: venueId,
        contract_type: contractType,
        version: newVersion,
        last_edited_by: user.email,
        last_edited_at: new Date().toISOString(),
      };
      if (config.id) {
        await base44.entities.ContractTermsConfig.update(config.id, payload);
      } else {
        const created = await base44.entities.ContractTermsConfig.create(payload);
        setConfig(c => ({ ...c, id: created.id }));
      }
      setConfig(c => ({ ...c, version: newVersion }));
      setMsg({ kind: 'ok', text: `Saved as ${newVersion}.` });
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Contract Terms
        </CardTitle>
        <p className="text-xs text-slate-500">Edit the legal text customers / entertainers see. Saving stamps a new version.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-400">Contract Type</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Effective Date</Label>
            <Input
              type="date"
              value={config?.effective_date || ''}
              onChange={e => updateField('effective_date', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        {loading || !config ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Terms Text (Markdown supported)</Label>
                {config.version && (
                  <span className="text-[10px] text-slate-500 font-mono">Current: {config.version}</span>
                )}
              </div>
              <Textarea
                value={config.terms_text || ''}
                onChange={e => updateField('terms_text', e.target.value)}
                placeholder="Enter the full contract body…"
                className="bg-slate-800 border-slate-700 font-mono text-sm"
                rows={20}
              />
            </div>

            <div>
              <Label className="text-xs text-slate-400">Internal Notes</Label>
              <Textarea
                value={config.notes || ''}
                onChange={e => updateField('notes', e.target.value)}
                className="bg-slate-800 border-slate-700"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="ml-auto flex items-center gap-3">
                {msg && (
                  <span className={`text-xs flex items-center gap-1 ${msg.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {msg.kind === 'ok' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {msg.text}
                  </span>
                )}
                <Button onClick={handleSave} disabled={saving || !config.terms_text} className="bg-emerald-600 hover:bg-emerald-500">
                  <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save & Version'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}