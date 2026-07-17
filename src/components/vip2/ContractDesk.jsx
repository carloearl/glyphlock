import React, { useState, useEffect } from 'react';
import { vip, money } from '@/components/vip2/vipApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STATUS_COLORS = {
  PENDING_SIGNATURES: 'bg-amber-700', SIGNED: 'bg-blue-700', PAID: 'bg-cyan-700',
  ACTIVE: 'bg-emerald-700', COMPLETED: 'bg-slate-600', CANCELED: 'bg-red-800'
};

function Countdown({ end }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const ms = new Date(end).getTime() - Date.now();
  const neg = ms < 0;
  const abs = Math.abs(ms);
  const m = Math.floor(abs / 60000), s = Math.floor((abs % 60000) / 1000);
  return <span className={neg ? 'text-red-400 font-bold' : m < 5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{neg ? 'OVER ' : ''}{m}:{String(s).padStart(2, '0')}</span>;
}

function Prompt({ fields, onSubmit, onCancel, label }) {
  const [v, setV] = useState({});
  return (
    <div className="mt-2 p-2 bg-slate-800 rounded-lg space-y-2">
      {fields.map(f => <Input key={f.key} placeholder={f.label} value={v[f.key] || ''} onChange={e => setV({ ...v, [f.key]: e.target.value })} className="bg-slate-900 border-slate-700" />)}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSubmit(v)} className="bg-purple-700 min-h-[44px]">{label}</Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="border-slate-700 text-slate-300 min-h-[44px]">Cancel</Button>
      </div>
    </div>
  );
}

export default function ContractDesk({ state, refresh }) {
  const [prompt, setPrompt] = useState(null); // { contractId, kind }
  const [msg, setMsg] = useState('');
  const open = (state.contracts || []).filter(c => !['COMPLETED', 'CANCELED'].includes(c.status));
  const sessionByContract = Object.fromEntries((state.sessions || []).map(s => [s.contract_id, s]));

  const act = async (action, payload) => {
    setMsg('');
    const r = await vip(action, payload);
    if (r.error) setMsg(r.error);
    setPrompt(null);
    refresh();
    return r;
  };

  return (
    <div className="space-y-3">
      {msg && <p className="text-red-400 text-sm bg-red-950/50 rounded p-2">{msg}</p>}
      {!open.length && <p className="text-slate-500">No open contracts. Create one in the New Contract tab.</p>}
      {open.map(c => {
        const session = sessionByContract[c.id];
        const sigs = c.signatures || {};
        const id = c.id;
        return (
          <div key={id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold">{c.contract_id}</span>
              <Badge className={`${STATUS_COLORS[c.status]} text-white`}>{c.status}</Badge>
              <Badge className="bg-slate-700">{c.payment_status}</Badge>
              <Badge className="bg-amber-800">{c.mode}</Badge>
              {session && <span className="ml-auto text-sm">⏱ <Countdown end={session.planned_end} /></span>}
            </div>
            <p className="text-sm text-slate-300 mt-1">
              {c.guest_name} · {c.entertainer_stage_name} · Room {c.room_number} · {c.service_name} {c.duration_minutes}min ·
              Due {money(c.final_amount)} · Collected {money(c.amount_collected)}
              {c.receipt_id && <> · Receipt <span className="font-mono">{c.receipt_id}</span></>}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Signatures: {['guest', 'entertainer', 'staff', 'manager'].map(r => sigs[r] ? `✅${r}` : `▫${r}`).join(' ')}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {c.status === 'PENDING_SIGNATURES' && <>
                {['guest', 'entertainer', 'staff', 'manager'].filter(r => !sigs[r]).map(r => (
                  <Button key={r} size="sm" variant="outline" className="border-blue-700 text-blue-300 min-h-[44px]"
                    onClick={() => setPrompt({ id, kind: 'sign-' + r })}>Sign: {r}</Button>
                ))}
                <Button size="sm" variant="outline" className="border-amber-700 text-amber-300 min-h-[44px]"
                  onClick={() => setPrompt({ id, kind: 'discount' })}>Discount / Comp</Button>
              </>}
              {c.status === 'SIGNED' && <>
                <Button size="sm" className="bg-cyan-700 min-h-[44px]" onClick={() => act('pay', { contract_record_id: id })}>Collect Payment</Button>
                <Button size="sm" variant="outline" className="border-red-800 text-red-400 min-h-[44px]" onClick={() => act('pay', { contract_record_id: id, simulate: 'decline' })}>Simulate Decline</Button>
              </>}
              {c.status === 'PAID' && <Button size="sm" className="bg-emerald-700 min-h-[44px]" onClick={() => act('activate', { contract_record_id: id })}>Activate Session</Button>}
              {c.status === 'ACTIVE' && <>
                <Button size="sm" className="bg-purple-700 min-h-[44px]" onClick={() => act('extend', { contract_record_id: id, blocks: 1 })}>Extend +1 block</Button>
                <Button size="sm" className="bg-slate-700 min-h-[44px]" onClick={() => act('closeSession', { contract_record_id: id })}>Close Session</Button>
              </>}
              {['PENDING_SIGNATURES', 'SIGNED', 'PAID'].includes(c.status) &&
                <Button size="sm" variant="outline" className="border-red-900 text-red-400 min-h-[44px]" onClick={() => setPrompt({ id, kind: 'cancel' })}>Cancel</Button>}
            </div>

            {prompt?.id === id && prompt.kind.startsWith('sign-') && (
              <Prompt label="Capture signature" fields={[{ key: 'name', label: 'Signer full name' }]}
                onSubmit={v => act('sign', { contract_record_id: id, role: prompt.kind.slice(5), name: v.name })}
                onCancel={() => setPrompt(null)} />
            )}
            {prompt?.id === id && prompt.kind === 'discount' && (
              <Prompt label="Apply with manager approval" fields={[
                { key: 'amount', label: 'Discount amount ($) — leave blank for full comp' },
                { key: 'manager_name', label: 'Approving manager (must differ from you)' },
                { key: 'reason', label: 'Reason' }]}
                onSubmit={v => act('applyAdjustment', { contract_record_id: id, type: v.amount ? 'discount' : 'comp', amount: Number(v.amount || 0), manager_name: v.manager_name, reason: v.reason })}
                onCancel={() => setPrompt(null)} />
            )}
            {prompt?.id === id && prompt.kind === 'cancel' && (
              <Prompt label="Cancel contract" fields={[
                { key: 'reason', label: 'Reason' },
                { key: 'manager_name', label: 'Manager (required if signed)' }]}
                onSubmit={v => act('cancelContract', { contract_record_id: id, ...v })}
                onCancel={() => setPrompt(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}