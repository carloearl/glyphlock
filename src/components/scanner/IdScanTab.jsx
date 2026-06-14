/**
 * DACO-20260613-MOBILE-SCANNER — IdScanTab
 *
 * PDF417 barcode reader for door entry.
 * Creates or updates a GuestProfile (dedup via SHA-256(license#) hash —
 * raw license number NEVER stored), runs age verification, increments
 * visit count, logs the scan event with quarantine flag propagation.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import CameraScanner from './CameraScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, IdCard, ShieldAlert, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AAMVA PDF417 parser — extracts the fields we need for a guest profile.
 * Returns null if the barcode isn't a valid AAMVA driver license.
 */
function parseAamva(raw) {
  if (!raw || !raw.includes('DAQ')) return null; // DAQ (license#) is mandatory in AAMVA
  const get = (tag) => {
    const m = raw.match(new RegExp(tag + '([^\\n\\r]+)'));
    return m ? m[1].trim() : null;
  };
  const dobRaw = get('DBB'); // MMDDYYYY
  let dob = null;
  if (dobRaw && /^\d{8}$/.test(dobRaw)) {
    const mm = dobRaw.slice(0, 2);
    const dd = dobRaw.slice(2, 4);
    const yyyy = dobRaw.slice(4, 8);
    dob = `${yyyy}-${mm}-${dd}`;
  }
  return {
    license_number: get('DAQ'),
    first_name: get('DAC') || get('DCT') || '',
    last_name: get('DCS') || '',
    dob, // ISO YYYY-MM-DD
    license_state: get('DAJ') || '',
  };
}

function ageFromDob(dobIso) {
  if (!dobIso) return null;
  const [y, m, d] = dobIso.split('-').map(Number);
  const dob = new Date(y, m - 1, d);
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const md = now.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}

/** SHA-256 → hex → first 24 chars. One-way, deterministic per license#. */
async function hashLicense(licenseNumber) {
  const buf = new TextEncoder().encode(licenseNumber);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 24);
}

export default function IdScanTab({ venueId, validationRun }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [active, setActive] = useState(true);

  const handleDecode = async (raw) => {
    if (busy) return;
    setBusy(true);
    setActive(false);
    try {
      const parsed = parseAamva(raw);
      if (!parsed || !parsed.license_number || !parsed.dob) {
        setResult({ ok: false, reason: 'Not a readable driver license barcode' });
        toast.error('Could not read ID');
        return;
      }

      const computed_age = ageFromDob(parsed.dob);
      const age_verified = typeof computed_age === 'number' && computed_age >= 21;
      const guest_id = await hashLicense(parsed.license_number);
      const nowIso = new Date().toISOString();

      // Dedup: look up existing profile by guest_id + venue_id
      const existing = await base44.entities.GuestProfile.filter({ guest_id, venue_id: venueId });
      let profile;
      let isNew = false;

      if (existing && existing.length > 0) {
        profile = existing[0];
        await base44.entities.GuestProfile.update(profile.id, {
          age_verified,
          visit_count: (profile.visit_count || 0) + 1,
          last_visit_at: nowIso,
          // Refresh name/DOB in case the prior record had stale/missing data
          first_name: profile.first_name || parsed.first_name,
          last_name: profile.last_name || parsed.last_name,
          dob: profile.dob || parsed.dob,
          license_state: profile.license_state || parsed.license_state,
        });
      } else {
        profile = await base44.entities.GuestProfile.create({
          guest_id,
          venue_id: venueId,
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          dob: parsed.dob,
          license_state: parsed.license_state,
          age_verified,
          visit_count: 1,
          first_visit_at: nowIso,
          last_visit_at: nowIso,
          status: 'active',
        });
        isNew = true;
      }

      // Log the scan event (quarantine flag propagated)
      await base44.functions.invoke('logScanEvent', {
        subject_id: guest_id,
        subject_type: 'guest',
        venue_id: venueId,
        scan_type: 'id_barcode',
        validation_run: !!validationRun,
        details: {
          age_verified,
          computed_age,
          is_new: isNew,
          visit_count: profile.visit_count || 1,
          status: profile.status || 'active',
        },
      });

      setResult({
        ok: true,
        age_verified,
        computed_age,
        is_new: isNew,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        visit_count: isNew ? 1 : (profile.visit_count || 0) + 1,
        status: profile.status || 'active',
      });

      if (!age_verified) toast.error(`Under 21 — entry denied`);
      else if (profile.status === 'banned') toast.error(`Banned guest — deny entry`);
      else if (isNew) toast.success(`✓ New guest profile created`);
      else toast.success(`✓ Welcome back, ${parsed.first_name}`);
    } catch (e) {
      setResult({ ok: false, reason: e.message || 'Scan failed' });
      toast.error('Scan failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setActive(true);
  };

  const denied = result && (!result.age_verified || result.status === 'banned');

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
                <div className="text-sm text-slate-300">Creating profile…</div>
              </div>
            ) : result?.ok && !denied ? (
              <div className="space-y-3">
                {result.is_new ? (
                  <UserPlus className="w-14 h-14 mx-auto text-emerald-400" />
                ) : (
                  <UserCheck className="w-14 h-14 mx-auto text-emerald-400" />
                )}
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-emerald-400">
                    {result.is_new ? 'New guest — profile created' : `Welcome back · visit #${result.visit_count}`}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {result.first_name} {result.last_name}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
                    <IdCard className="w-3.5 h-3.5" /> Age {result.computed_age}
                    {result.status === 'vip' && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">VIP</span>
                    )}
                  </div>
                </div>
                <Button onClick={reset} className="w-full bg-emerald-600 hover:bg-emerald-500">
                  Scan next guest
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <XCircle className="w-14 h-14 mx-auto text-red-400" />
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-red-400">Denied</div>
                  <div className="text-sm text-slate-300">
                    {result?.status === 'banned'
                      ? 'Banned guest — do not admit'
                      : result?.computed_age != null
                      ? `Age ${result.computed_age} — under 21`
                      : result?.reason || 'Could not read barcode'}
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
          Guest profile deduplicated by one-way hash of license number. Raw license# never stored.
        </div>
      </CardContent>
    </Card>
  );
}