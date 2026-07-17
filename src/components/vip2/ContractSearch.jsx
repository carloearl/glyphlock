import React, { useState } from 'react';
import { vip, money } from '@/components/vip2/vipApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function ContractSearch() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [chain, setChain] = useState(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    setBusy(true); setChain(null);
    const r = await vip('search', { text: text || undefined, status: status || undefined });
    setBusy(false);
    setResults(r.results || []);
  };

  const viewChain = async (c) => {
    const r = await vip('getChain', { contract_record_id: c.id });
    if (!r.error) setChain(r);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap gap-2 items-end">
        <Input placeholder="Contract ID, guest, entertainer, room, receipt…" value={text} onChange={e => setText(e.target.value)} className="bg-slate-800 border-slate-700 max-w-sm" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 min-h-[44px] text-white">
          <option value="">Any status</option>
          {['PENDING_SIGNATURES', 'SIGNED', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELED'].map(s => <option key={s}>{s}</option>)}
        </select>
        <Button onClick={search} disabled={busy} className="bg-purple-700 min-h-[44px]">Search</Button>
      </div>

      {results && !results.length && <p className="text-slate-500">No contracts found.</p>}
      {(results || []).map(c => (
        <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold">{c.contract_id}</span>
          <Badge className="bg-slate-700">{c.status}</Badge>
          <Badge className="bg-amber-800">{c.mode}</Badge>
          <span>{c.guest_name} · {c.entertainer_stage_name} · Room {c.room_number} · {money(c.final_amount)}</span>
          <Button size="sm" variant="outline" className="ml-auto border-purple-700 text-purple-300 min-h-[44px]" onClick={() => viewChain(c)}>View Chain</Button>
        </div>
      ))}

      {chain && (
        <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-4 text-sm space-y-2">
          <h4 className="font-bold text-purple-300">Record Chain — {chain.contract.contract_id}</h4>
          <p>Guest: {chain.contract.guest_name} ({chain.contract.guest_id})</p>
          <p>Entertainer: {chain.contract.entertainer_stage_name} ({chain.contract.entertainer_id})</p>
          <p>Room: {chain.contract.room_number} ({chain.contract.room_id})</p>
          <p>Payment: {chain.payment ? `${chain.payment.record_id} · ${chain.payment.status} · ${money(chain.payment.amount)}` : '—'}</p>
          <p>POS Transaction: {chain.transaction ? `${chain.transaction.transaction_id} · ${money(chain.transaction.total)}` : '—'}</p>
          <p>Receipt: {chain.contract.receipt_id || '—'}</p>
          <p>Session: {chain.session ? `${chain.session.session_ref} · ${chain.session.status}` : '—'}</p>
          <details>
            <summary className="cursor-pointer text-purple-300">Audit trail ({(chain.contract.audit_events || []).length} events)</summary>
            <ul className="mt-1 space-y-1 text-xs text-slate-400">
              {(chain.contract.audit_events || []).map((e, i) => (
                <li key={i}>{e.timestamp} — <b>{e.action}</b> by {e.actor} {e.detail && `· ${e.detail}`}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}