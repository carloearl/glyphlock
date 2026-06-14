/**
 * DACO-20260613-MOBILE-SCANNER — QrScanTab
 *
 * Wires the camera scanner to verifyQrToken + logScanEvent.
 * Device sends raw payload to the server; server verifies HMAC and returns identity.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import CameraScanner from './CameraScanner';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function QrScanTab({ venueId, validationRun }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, driver_id, driver_name, reason }
  const [active, setActive] = useState(true);

  const handleDecode = async (raw) => {
    if (busy) return;
    setBusy(true);
    setActive(false);
    try {
      const verifyRes = await base44.functions.invoke('verifyQrToken', { qr_token: raw, venue_id: venueId });
      const data = verifyRes?.data || {};
      if (!data.ok) {
        setResult({ ok: false, reason: data.reason || 'Verification failed' });
        toast.error(data.reason || 'Invalid QR');
        return;
      }
      // Server says good — log the scan event.
      await base44.functions.invoke('logScanEvent', {
        subject_id: data.driver_id,
        subject_type: 'driver',
        venue_id: venueId,
        scan_type: 'qr',
        validation_run: !!validationRun,
        details: { driver_name: data.driver_name, verified_at: data.verified_at },
      });
      setResult({ ok: true, driver_id: data.driver_id, driver_name: data.driver_name });
      toast.success(`✓ ${data.driver_name}`);
    } catch (e) {
      setResult({ ok: false, reason: e.message || 'Network error' });
      toast.error(e.message || 'Verify failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setActive(true);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm font-bold text-emerald-300">
          <span>Scan Driver QR</span>
          {validationRun && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono uppercase">
              Validation run
            </span>
          )}
        </div>

        {active ? (
          <CameraScanner onDecode={handleDecode} formats={['qr_code']} active label="QR" />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-black/40 p-6 text-center space-y-3">
            {busy ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-400" />
                <div className="text-sm text-slate-300">Verifying with server…</div>
              </div>
            ) : result?.ok ? (
              <div className="space-y-3">
                <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400" />
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-emerald-400">Verified</div>
                  <div className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <User className="w-5 h-5" /> {result.driver_name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">{result.driver_id}</div>
                </div>
                <Button onClick={reset} className="w-full bg-emerald-600 hover:bg-emerald-500">
                  Scan next driver
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <XCircle className="w-14 h-14 mx-auto text-red-400" />
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-red-400">Rejected</div>
                  <div className="text-sm text-slate-300">{result?.reason || 'Unknown'}</div>
                </div>
                <Button onClick={reset} variant="outline" className="w-full border-slate-700">
                  Try again
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0" />
          Signature verification runs on the server. This device never holds the HMAC key.
        </div>
      </CardContent>
    </Card>
  );
}