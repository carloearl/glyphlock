import React, { useState } from 'react';
import { vip } from '@/components/vip2/vipApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function PeoplePanel({ state, refresh }) {
  const [ent, setEnt] = useState({ legal_name: '', stage_name: '', phone: '', policy_acknowledged: true });
  const [guest, setGuest] = useState({ full_name: '', phone: '', id_number: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const onboard = async (allowDup = false) => {
    setMsg(''); setBusy(true);
    const r = await vip('onboardEntertainer', { ...ent, allow_duplicate: allowDup });
    setBusy(false);
    if (r.error) return setMsg(r.error);
    setMsg(`Entertainer '${r.entertainer.stage_name}' onboarded (TEST).`);
    setEnt({ legal_name: '', stage_name: '', phone: '', policy_acknowledged: true });
    refresh();
  };

  const intake = async (allowDup = false) => {
    setMsg(''); setBusy(true);
    const r = await vip('guestIntake', { ...guest, allow_duplicate: allowDup });
    setBusy(false);
    if (r.error) return setMsg(r.error);
    setMsg(r.existing ? `Returning guest '${r.guest.full_name}' — visit #${r.guest.visit_count}.` : `Guest '${r.guest.full_name}' created.`);
    setGuest({ full_name: '', phone: '', id_number: '' });
    refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-4 space-y-2">
        <h3 className="font-bold text-purple-300">Entertainer Onboarding (fresh)</h3>
        <Input placeholder="Legal name" value={ent.legal_name} onChange={e => setEnt({ ...ent, legal_name: e.target.value })} className="bg-slate-800 border-slate-700" />
        <Input placeholder="Stage name" value={ent.stage_name} onChange={e => setEnt({ ...ent, stage_name: e.target.value })} className="bg-slate-800 border-slate-700" />
        <Input placeholder="Phone" value={ent.phone} onChange={e => setEnt({ ...ent, phone: e.target.value })} className="bg-slate-800 border-slate-700" />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={ent.policy_acknowledged} onChange={e => setEnt({ ...ent, policy_acknowledged: e.target.checked })} />
          Venue policy acknowledged
        </label>
        <Button onClick={() => onboard(false)} disabled={busy || !ent.legal_name || !ent.stage_name} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Onboard Entertainer</Button>
        <div className="pt-2 space-y-1 max-h-48 overflow-y-auto">
          {(state.entertainers || []).map(e => (
            <div key={e.id} className="flex items-center justify-between text-sm bg-slate-800/60 rounded px-2 py-1">
              <span>{e.stage_name}</span>
              <span className="flex gap-1">
                <Badge className={e.contract_status === 'VALID' ? 'bg-emerald-700' : 'bg-amber-700'}>{e.contract_status}</Badge>
                <Badge className="bg-slate-700">{e.mode}</Badge>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-4 space-y-2">
        <h3 className="font-bold text-purple-300">Guest Intake (fast)</h3>
        <Input placeholder="Full name" value={guest.full_name} onChange={e => setGuest({ ...guest, full_name: e.target.value })} className="bg-slate-800 border-slate-700" />
        <Input placeholder="Phone (optional)" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} className="bg-slate-800 border-slate-700" />
        <Input placeholder="ID number (optional — enables dedup)" value={guest.id_number} onChange={e => setGuest({ ...guest, id_number: e.target.value })} className="bg-slate-800 border-slate-700" />
        <Button onClick={() => intake(false)} disabled={busy || !guest.full_name} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Intake Guest</Button>
        <div className="pt-2 space-y-1 max-h-48 overflow-y-auto">
          {(state.guests || []).map(g => (
            <div key={g.id} className="flex items-center justify-between text-sm bg-slate-800/60 rounded px-2 py-1">
              <span>{g.full_name}</span>
              <span className="text-slate-500 text-xs">visits: {g.visit_count || 1}</span>
            </div>
          ))}
        </div>
      </div>
      {msg && <p className="text-sm text-amber-300 lg:col-span-2">{msg}</p>}
    </div>
  );
}