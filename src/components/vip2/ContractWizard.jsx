import React, { useState, useMemo } from 'react';
import { vip, money } from '@/components/vip2/vipApi';
import { Button } from '@/components/ui/button';

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-[44px] text-white">
        <option value="">— select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function ContractWizard({ state, refresh, onCreated }) {
  const cfg = state.config;
  const [f, setF] = useState({ guest_id: '', entertainer_id: '', room_id: '', service_code: '', duration_minutes: '', payment_method: '' });
  const [requestId] = useState(() => crypto.randomUUID());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF(prev => ({ ...prev, [k]: v }));

  const svc = (cfg.services || []).find(s => s.code === f.service_code);
  const rate = svc?.rates?.find(r => String(r.minutes) === String(f.duration_minutes));

  const pricing = useMemo(() => {
    if (!rate) return null;
    const base = rate.amount;
    const fees = f.payment_method === 'Credit Card' ? Math.round(base * (cfg.card_fee_pct || 0)) / 100 : 0;
    const tax = Math.round(base * (cfg.tax_pct || 0)) / 100;
    return { base, fees, tax, final: base + fees + tax };
  }, [rate, f.payment_method, cfg]);

  const availableRooms = (state.rooms || []).filter(r => r.status === 'available');
  const busyEntIds = new Set((state.sessions || []).map(s => s.entertainer_id));
  const freeEnts = (state.entertainers || []).filter(e => !busyEntIds.has(e.id));

  const create = async () => {
    setErr(''); setBusy(true);
    const r = await vip('createContract', { ...f, client_request_id: requestId, mode: 'DEMO' });
    setBusy(false);
    if (r.error) return setErr(r.error);
    await refresh();
    onCreated?.(r.contract);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-4 grid gap-3 sm:grid-cols-2">
        <Select label="Guest" value={f.guest_id} onChange={set('guest_id')}
          options={(state.guests || []).filter(g => g.status !== 'banned').map(g => ({ value: g.id, label: g.full_name }))} />
        <Select label="Entertainer" value={f.entertainer_id} onChange={set('entertainer_id')}
          options={freeEnts.map(e => ({ value: e.id, label: e.stage_name }))} />
        <Select label="VIP Room (available only)" value={f.room_id} onChange={set('room_id')}
          options={availableRooms.map(r => ({ value: r.id, label: r.room_name || r.room_number }))} />
        <Select label="Service" value={f.service_code} onChange={v => setF(p => ({ ...p, service_code: v, duration_minutes: '' }))}
          options={(cfg.services || []).map(s => ({ value: s.code, label: s.name }))} />
        <Select label="Duration" value={f.duration_minutes} onChange={set('duration_minutes')}
          options={(svc?.rates || []).map(r => ({ value: String(r.minutes), label: `${r.minutes} min — ${money(r.amount)}` }))} />
        <Select label="Payment method" value={f.payment_method} onChange={set('payment_method')}
          options={(cfg.payment_methods || []).map(m => ({ value: m, label: m }))} />
      </div>

      {pricing && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm space-y-1">
          <h4 className="font-bold text-purple-300 mb-2">Itemization</h4>
          <div className="flex justify-between"><span>{svc.name} — {f.duration_minutes} min</span><span>{money(pricing.base)}</span></div>
          {pricing.fees > 0 && <div className="flex justify-between text-slate-400"><span>Card fee ({cfg.card_fee_pct}%)</span><span>{money(pricing.fees)}</span></div>}
          {pricing.tax > 0 && <div className="flex justify-between text-slate-400"><span>Tax</span><span>{money(pricing.tax)}</span></div>}
          <div className="flex justify-between font-bold border-t border-slate-700 pt-1"><span>Amount due</span><span>{money(pricing.final)}</span></div>
          <p className="text-xs text-slate-500 pt-1">Discounts and comps are applied with manager approval before signing.</p>
        </div>
      )}

      {err && <p className="text-red-400 text-sm">{err}</p>}
      <Button onClick={create} className="bg-purple-700 hover:bg-purple-600 min-h-[44px] w-full"
        disabled={busy || !f.guest_id || !f.entertainer_id || !f.room_id || !rate || !f.payment_method}>
        Create VIP Contract (DEMO)
      </Button>
    </div>
  );
}