/**
 * DACO-20260613-MOBILE-SCANNER — QrGenerator
 *
 * Staff-side: pick a driver, request a server-signed token from signQrToken,
 * render the QR via the `qrcode` library. The HMAC key never reaches the device.
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, ShieldCheck, Download, UserSearch } from 'lucide-react';
import { toast } from 'sonner';

export default function QrGenerator({ venueId }) {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [issuedAt, setIssuedAt] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    (async () => {
      try {
        const list = await base44.entities.DriverProfile.filter({ venue_id: venueId, status: 'active' }, '-created_date', 50);
        setDrivers(list || []);
      } catch (e) {
        toast.error('Failed to load drivers.');
      }
    })();
  }, [venueId]);

  const filtered = drivers.filter(
    (d) => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.driver_id?.toLowerCase().includes(search.toLowerCase())
  );

  const generate = async () => {
    if (!selected) return;
    setBusy(true);
    setQrDataUrl(null);
    try {
      const res = await base44.functions.invoke('signQrToken', {
        driver_id: selected.driver_id,
        venue_id: venueId,
      });
      const data = res?.data || {};
      if (!data.ok || !data.qr_token) {
        toast.error(data.error || 'Server refused to sign.');
        return;
      }
      const url = await QRCode.toDataURL(data.qr_token, {
        margin: 1,
        width: 360,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
      setIssuedAt(data.issued_at);
      toast.success(`QR signed for ${selected.name}`);
    } catch (e) {
      toast.error(e.message || 'Sign failed.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!qrDataUrl || !selected) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `driver-qr-${selected.driver_id}.png`;
    a.click();
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <ShieldCheck className="w-4 h-4" /> Generate Driver QR
        </div>

        <div className="relative">
          <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drivers by name or ID…"
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">No active drivers for this venue.</div>
          )}
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                selected?.id === d.id ? 'bg-emerald-500/10 text-emerald-200' : 'hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <div className="font-semibold">{d.name}</div>
              <div className="text-[10px] font-mono text-slate-500">
                {d.driver_id} · {d.affiliated ? 'NUPS' : 'outside'}
              </div>
            </button>
          ))}
        </div>

        <Button onClick={generate} disabled={!selected || busy} className="w-full bg-emerald-600 hover:bg-emerald-500">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {busy ? 'Signing…' : selected ? `Sign QR for ${selected.name}` : 'Pick a driver'}
        </Button>

        {qrDataUrl && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <img src={qrDataUrl} alt={`QR for ${selected?.name}`} className="w-56 h-56 mx-auto rounded-xl bg-white p-2" />
            <div className="text-center text-[10px] font-mono text-slate-400">
              issued {issuedAt ? new Date(issuedAt).toLocaleString() : '—'} · expires in 60 min
            </div>
            <Button onClick={download} variant="outline" className="w-full border-emerald-500/40 text-emerald-300">
              <Download className="w-4 h-4 mr-2" /> Download PNG
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}