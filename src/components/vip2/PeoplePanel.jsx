import React, { useState } from 'react';
import { vip } from '@/components/vip2/vipApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User } from 'lucide-react';

const glass = "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 space-y-3 shadow-[0_8px_40px_-12px_rgba(168,85,247,0.25)]";
const field = "bg-white/[0.04] border-white/10 focus:border-purple-400/50";

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
    setMsg(`Entertainer '${r.entertainer.stage_name}' onboarded.`);
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
    <div className="grid gap-5 lg:grid-cols-2">
      <div className={glass}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-300/70" />
          <h3 className="font-semibold text-white tracking-tight">Entertainer Onboarding</h3>
        </div>
        <Input placeholder="Legal name" value={ent.legal_name} onChange={e => setEnt({ ...ent, legal_name: e.target.value })} className={field} />
        <Input placeholder="Stage name" value={ent.stage_name} onChange={e => setEnt({ ...ent, stage_name: e.target.value })} className={field} />
        <Input placeholder="Phone" value={ent.phone} onChange={e => setEnt({ ...ent, phone: e.target.value })} className={field} />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={ent.policy_acknowledged} onChange={e => setEnt({ ...ent, policy_acknowledged: e.target.checked })} />
          Venue policy acknowledged
        </label>
        <Button onClick={() => onboard(false)} disabled={busy || !ent.legal_name || !ent.stage_name} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Onboard Entertainer</Button>
        <div className="pt-2 space-y-1 max-h-48 overflow-y-auto">
          {(state.entertainers || []).map(e => (
            <div key={e.id} className="flex items-center justify-between text-sm bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5">
              <span className="text-slate-200">{e.stage_name}</span>
              <span className="flex gap-1">
                <Badge className={e.contract_status === 'VALID' ? 'bg-emerald-700' : 'bg-amber-700'}>{e.contract_status}</Badge>
                <Badge className="bg-slate-700">{e.mode}</Badge>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={glass}>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400/70" />
          <h3 className="font-semibold text-white tracking-tight">Guest Intake</h3>
        </div>
        <Input placeholder="Full name" value={guest.full_name} onChange={e => setGuest({ ...guest, full_name: e.target.value })} className={field} />
        <Input placeholder="Phone (optional)" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} className={field} />
        <Input placeholder="ID number (optional — enables dedup)" value={guest.id_number} onChange={e => setGuest({ ...guest, id_number: e.target.value })} className={field} />
        <Button onClick={() => intake(false)} disabled={busy || !guest.full_name} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Intake Guest</Button>
        <div className="pt-2 space-y-1 max-h-48 overflow-y-auto">
          {(state.guests || []).map(g => (
            <div key={g.id} className="flex items-center justify-between text-sm bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5">
              <span className="text-slate-200">{g.full_name}</span>
              <span className="text-slate-500 text-xs">visits: {g.visit_count || 1}</span>
            </div>
          ))}
        </div>
      </div>
      {msg && <p className="text-sm text-amber-300 lg:col-span-2">{msg}</p>}
    </div>
  );
}