import React, { useState, useEffect, useCallback } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Loader2, Stethoscope, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TrackHealthRow from '@/components/mixer/suite/TrackHealthRow';

function classify(track) {
  const text = `${track.embed_url || ''} ${track.file_url || ''}`;
  const ytId = track.source === 'youtube' && track.source_id
    ? track.source_id
    : (text.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1] || null;

  if (track.file_url) {
    return { sourceType: 'file', url: track.file_url, status: 'unverified', reason: '' };
  }
  if (ytId) {
    return { sourceType: 'youtube', url: `https://www.youtube.com/watch?v=${ytId}`, status: 'ready', reason: '' };
  }
  return { sourceType: 'none', url: '', status: 'failing', reason: 'No audio or video source stored' };
}

/** Probes a direct media URL by loading its metadata in a detached element. */
function probeMedia(url) {
  return new Promise((resolve) => {
    const el = document.createElement('audio');
    const done = (ok, reason) => {
      el.src = '';
      resolve({ ok, reason });
    };
    const timer = setTimeout(() => done(false, 'Timed out loading source'), 12000);
    el.preload = 'metadata';
    el.onloadedmetadata = () => { clearTimeout(timer); done(true, ''); };
    el.onerror = () => { clearTimeout(timer); done(false, 'Source unreachable or unsupported format'); };
    el.src = url;
  });
}

export default function TrackHealthTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await invokeDJGateway('snapshot');
    setRows((data.tracks || []).map((t) => ({
      id: t.id,
      title: t.title || 'Untitled track',
      artist: t.artist || 'Unknown artist',
      ...classify(t),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const testRow = useCallback(async (row) => {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: 'testing', reason: '' } : r));
    if (row.sourceType === 'youtube') {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: 'ready', reason: '' } : r));
      return;
    }
    const { ok, reason } = await probeMedia(row.url);
    setRows((prev) => prev.map((r) => r.id === row.id
      ? { ...r, status: ok ? 'ready' : 'failing', reason: ok ? '' : reason }
      : r));
  }, []);

  async function scanAll() {
    setScanning(true);
    const targets = rows.filter((r) => r.sourceType === 'file');
    for (const row of targets) {
      // Sequential so a large library never opens dozens of parallel streams.
      await testRow(row);
    }
    setScanning(false);
  }

  const counts = {
    ready: rows.filter((r) => r.status === 'ready').length,
    failing: rows.filter((r) => r.status === 'failing').length,
    unverified: rows.filter((r) => r.status === 'unverified' || r.status === 'testing').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-cyan-400" /> Track Diagnostics ({rows.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading || scanning}>
            <RefreshCw className="w-4 h-4 mr-1 pointer-events-none" /> Reload
          </Button>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500" onClick={scanAll} disabled={loading || scanning}>
            {scanning ? <Loader2 className="w-4 h-4 mr-1 animate-spin pointer-events-none" /> : <ShieldCheck className="w-4 h-4 mr-1 pointer-events-none" />}
            {scanning ? 'Testing…' : 'Test All'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'ready', label: 'Ready to play', value: counts.ready, cls: 'border-emerald-500/40 text-emerald-300' },
          { key: 'failing', label: 'Failing', value: counts.failing, cls: 'border-red-500/40 text-red-300' },
          { key: 'unverified', label: 'Not tested', value: counts.unverified, cls: 'border-amber-500/40 text-amber-300' },
        ].map((card) => (
          <Card key={card.key} className={`bg-slate-900/60 ${card.cls}`}>
            <CardContent className="p-3">
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
          No tracks in the library yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => <TrackHealthRow key={row.id} row={row} onTest={testRow} />)}
        </div>
      )}
    </div>
  );
}