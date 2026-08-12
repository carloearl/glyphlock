import React, { useState, useEffect } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Radio, Loader2, Check, X, DollarSign, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function computePriority(req) {
  // VIP boost + tip * 2 + votes
  return (req.is_vip ? 50 : 0) + (Number(req.tip_amount) || 0) * 2 + (Number(req.votes) || 0);
}

export default function JukeboxTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const data = await invokeDJGateway('snapshot');
    const sorted = (data.jukebox_requests || [])
      .map(r => ({ ...r, priority_score: computePriority(r) }))
      .sort((a, b) => b.priority_score - a.priority_score);
    setRequests(sorted);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await invokeDJGateway('setJukeboxStatus', { request_id: id, status });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-yellow-400" /> Jukebox Queue ({requests.length} pending)
        </h3>
        <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
          No pending requests. Guests can submit song requests via the jukebox form.
        </div>
      ) : (
        <div className="grid gap-2">
          {requests.map((r, i) => (
            <Card key={r.id} className="bg-slate-900/50 border-slate-700/50 hover:border-yellow-500/40 transition">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {r.track_title || `Track ${r.track_id?.slice(0, 8)}`}
                    {r.is_vip && <Crown className="w-3 h-3 text-yellow-400 inline ml-2" />}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {r.track_artist || '—'} · from {r.guest_name || 'guest'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-300 text-xs">
                    Priority {r.priority_score}
                  </Badge>
                  <div className="flex gap-2 text-xs text-gray-400">
                    {r.tip_amount > 0 && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{r.tip_amount}</span>}
                    <span>{r.votes || 1}v</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" onClick={() => updateStatus(r.id, 'played')} className="bg-green-600 hover:bg-green-500 h-8 w-8">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" onClick={() => updateStatus(r.id, 'rejected')} variant="outline" className="border-red-500/50 text-red-400 h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}