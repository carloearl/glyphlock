import React, { useState } from 'react';
import { vip } from '@/components/vip2/vipApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  available: 'bg-emerald-700', occupied: 'bg-red-700', cleaning: 'bg-amber-700', maintenance: 'bg-slate-600'
};

export default function RoomManager({ state, refresh }) {
  const [num, setNum] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setErr(''); setBusy(true);
    const r = await vip('createRoom', { room_number: num, room_name: name || num });
    setBusy(false);
    if (r.error) return setErr(r.error);
    setNum(''); setName('');
    refresh();
  };

  const setStatus = async (room, status) => {
    setErr('');
    const r = await vip('setRoomStatus', { room_id: room.id, status });
    if (r.error) return setErr(r.error);
    refresh();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-4 flex flex-wrap gap-2 items-end">
        <div><label className="text-xs text-slate-400">Room number</label><Input value={num} onChange={e => setNum(e.target.value)} placeholder="VIP-1" className="bg-slate-800 border-slate-700" /></div>
        <div><label className="text-xs text-slate-400">Room name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Emerald Suite" className="bg-slate-800 border-slate-700" /></div>
        <Button onClick={create} disabled={!num || busy} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Create Room</Button>
      </div>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {(state.rooms || []).map(room => (
          <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold">{room.room_name || room.room_number} <span className="text-slate-500 text-xs">({room.room_number})</span></span>
              <Badge className={`${STATUS_COLORS[room.status] || 'bg-slate-700'} text-white`}>{room.status}</Badge>
            </div>
            {room.status === 'occupied' && (
              <p className="text-xs text-slate-400 mt-1">Guest: {room.guest_name} · Entertainer: {room.entertainer_name}</p>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {['available', 'cleaning', 'maintenance'].filter(s => s !== room.status).map(s => (
                <Button key={s} size="sm" variant="outline" onClick={() => setStatus(room, s)} className="border-slate-700 text-slate-300 min-h-[44px]">{s}</Button>
              ))}
            </div>
          </div>
        ))}
        {!(state.rooms || []).length && <p className="text-slate-500 text-sm">No rooms yet — create the first VIP room above.</p>}
      </div>
    </div>
  );
}