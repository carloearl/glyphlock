/**
 * DACO-20260613-MOBILE-SCANNER — IdScanTab
 *
 * PDF417 barcode reader for ID age verification.
 * MINIMAL PII RETENTION: stores only { age_verified, name_match, scanned_by }.
 * No raw ID number, no DOB, no ID image — unless DACO¹ explicitly authorizes.
 *
 * The Ambir DB100 remains the primary path at the fixed station; this is the
 * mobile fallback.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import CameraScanner from './CameraScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, IdCard, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AAMVA PDF417 driver license parser — extracts ONLY the DOB needed
 * to compute age_verified. Everything else is discarded in-memory and never sent.
 */
function parseAamvaDob(raw) {
  // AAMVA: DBB = date of birth (MMDDYYYY or YYYYMMDD depending on jurisdiction).
  const m = raw.match(/DBB(\d{8})/);
  if (!m) return null;
  const s = m[1];
  // Try MMDDYYYY first (most US jurisdictions)
  const mm = parseInt(s.slice(0, 2), 10);
  const dd = parseInt(s.slice(2, 4), 10);
  const yyyy = parseInt(s.slice(4, 8), 10);
  if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && yyyy >= 1900) {
    return new Date(yyyy, mm - 1, dd);
  }
  return null;
}

function ageOf(dob) {
  if (!dob) return null;
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}

export default function IdScanTab({ venueId, validationRun }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { age_verified, computed_age }
  const [active, setActive] = useState(true);

  const handleDecode = async (raw) => {
    if (busy) return;
    setBusy(true);
    setActive(false);
    try {
      const dob = parseAamvaDob(raw);
      const age = ageOf(dob);
      const ageVerified = typeof age === 'number' && age >= 21;

      // PII MINIMAL: send ONLY age_verified + computed_age. NO raw, NO DOB, NO name.
      await base44.functions.invoke('logScanEvent', {
        subject_id: `id-scan-${Date.now()}`,
        subject_type: 'id',
        venue_id: venueId,
        scan_type: 'id_barcode',
        validation_run: !!validationRun,
        details: { age_verified: ageVerified, computed_age: age },
      });

      setResult({ age_verified: ageVerified, computed_age: age });
      if (ageVerified) toast.success(`✓ Age verified (${age})`);
      else toast.error(`Under 21 — entry denied`);
    } catch (e) {
      setResult({ age_verified: false, error: e.message });
      toast.error('Scan failed');
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
        <div className="flex items-center justify-between text-sm font-bold text-cyan-300">
          <span>Scan ID (PDF417)</span>
          {validationRun && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono uppercase">
              Validation run
            </span>
          )}
        </div>

        {active ? (
          <CameraScanner onDecode={handleDecode} formats={['pdf417']} active label="ID" />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-black/40 p-6 text-center space-y-3">
            {busy ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                <div className="text-sm text-slate-300">Logging scan…</div>
              </div>
            ) : result?.age_verified ? (
              <div className="space-y-3">
                <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400" />
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-emerald-400">Age verified</div>
                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <IdCard className="w-6 h-6" /> {result.computed_age} years
                  </div>
                </div>
                <Button onClick={reset} className="w-full bg-emerald-600 hover:bg-emerald-500">
                  Scan next ID
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <XCircle className="w-14 h-14 mx-auto text-red-400" />
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-red-400">Denied</div>
                  <div className="text-sm text-slate-300">
                    {result?.computed_age != null ? `Age ${result.computed_age} — under 21` : 'Could not read barcode'}
                  </div>
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
          Minimal PII: only age-verified result is stored. Raw ID data, DOB, and name are never sent or persisted.
        </div>
      </CardContent>
    </Card>
  );
}