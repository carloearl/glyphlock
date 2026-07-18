/**
 * StaffClockInOut — a familiar punch-clock UI for door / floor staff.
 *
 * Business logic preserved verbatim from the previous version:
 *  - Live identity rebind (ID-01 mitigation) via verifyLiveIdentity()
 *  - Writes through the writeEntity gateway with role + intent
 *  - ActivityLog forensic row when identity probe blocks a clock-in
 *
 * UX rewritten so a Door Girl, not a security engineer, can run it:
 *  - Big live clock
 *  - On-shift card with rolling elapsed timer
 *  - One primary button (Clock In / Clock Out)
 *  - Confirm prompt before clocking out
 *  - Identity / gateway errors translated to plain language; the technical
 *    banner is hidden until something is actually wrong
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { writeEntity } from '@/lib/nups/writeEntity';
import { verifyLiveIdentity, sessionFingerprint } from '@/lib/nups/identityVerify';
import { logActivity } from '@/lib/nups/activityLog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, ShieldAlert, AlertCircle } from 'lucide-react';

const ROLE_BADGE_STYLES = {
  DOOR_GIRL: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
  DOORMAN:   'bg-amber-500/15 border-amber-500/40 text-amber-300',
  SECURITY:  'bg-red-500/15 border-red-500/40 text-red-300',
  BARTENDER: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
};

// Translate gateway / identity errors into language a Door Girl can act on.
function friendlyError(raw) {
  if (!raw) return null;
  const s = String(raw);
  if (/ID-01|contamin|live identity|session/i.test(s)) {
    return 'Your sign-in looks off. Sign out and sign back in, then try again.';
  }
  if (/gateway|rejected|denied/i.test(s)) {
    return "Couldn't save that — try once more, or grab a manager.";
  }
  return s;
}

function elapsedLabel(sinceISO) {
  const ms = Date.now() - new Date(sinceISO).getTime();
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StaffClockInOut({ user, venueId, station = 'door' }) {
  const [busy, setBusy] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [err, setErr] = useState(null);
  const [identityOk, setIdentityOk] = useState(true); // assume healthy until probe says otherwise
  const [now, setNow] = useState(new Date());

  // Live clock tick (1s)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Identity probe on mount — silent unless it fails
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await verifyLiveIdentity(user?.email || user?.username);
      if (alive) setIdentityOk(!!r.ok);
    })();
    return () => { alive = false; };
  }, [user?.email, user?.username]);

  // Re-attach to an open shift on reload
  useEffect(() => {
    let alive = true;
    if (!user?.email) return;
    (async () => {
      try {
        const open = await base44.entities.StaffShift.filter({
          user_email: user.email,
          status: 'checked_in',
        }, '-created_date', 1);
        if (alive) setActiveShift(open?.[0] || null);
      } catch {
        // entity may not yet exist for this venue
      }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  const role = (user?.role || '').toUpperCase();
  const badgeCls = ROLE_BADGE_STYLES[role] || 'bg-slate-500/15 border-slate-500/40 text-slate-300';

  const handleClockIn = async () => {
    setBusy(true); setErr(null);
    try {
      const probe = await verifyLiveIdentity(user?.email);
      if (!probe.ok) {
        await logActivity({
          action_type: 'LOGIN',
          entity_affected: 'StaffShift:contamination_blocked',
          after_value: { attempted_email: user?.email, live_email: probe.live?.email || null, reason: probe.reason },
          venue_id: venueId || null,
          notes: `ID-01 BLOCK: ${probe.reason}`,
        });
        setIdentityOk(false);
        setErr(probe.reason);
        return;
      }
      const verifiedEmail = probe.live.email;
      const result = await writeEntity({
        entity: 'StaffShift',
        operation: 'create',
        data: {
          shift_id: `SHF-${Date.now()}`,
          user_email: verifiedEmail,
          user_full_name: user?.full_name || probe.live?.full_name || verifiedEmail,
          role,
          venue_id: venueId || null,
          station,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
          identity_verified: true,
          session_fingerprint: sessionFingerprint({ email: verifiedEmail, role, venue_id: venueId }),
        },
        actor: { email: verifiedEmail, role, id: user?.id },
        venue_id: venueId || null,
        intent: 'STAFF_CLOCK_IN',
      });
      if (!result.ok) { setErr(result.block_reason || 'rejected'); return; }
      setActiveShift(result.value);
      // Bind the kiosk operator session so the shell rescopes to THIS role
      // immediately (sidebar/admin chrome suppressed for staff). This was
      // missing — in-page punch-in never rescoped the chrome (fix 2026-07-17).
      sessionStorage.setItem('nups_kiosk_operator', JSON.stringify({
        name: user?.full_name || verifiedEmail, role, shift_id: result.value?.id,
      }));
      window.dispatchEvent(new Event('nups:operator-changed'));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    if (typeof window !== 'undefined' && !window.confirm('Clock out now? Your shift will end.')) return;
    setBusy(true); setErr(null);
    try {
      const probe = await verifyLiveIdentity(activeShift.user_email);
      if (!probe.ok) { setErr(probe.reason); return; }
      const result = await writeEntity({
        entity: 'StaffShift',
        operation: 'update',
        id: activeShift.id,
        data: { ...activeShift, check_out_time: new Date().toISOString(), status: 'checked_out' },
        actor: { email: probe.live.email, role, id: user?.id },
        venue_id: venueId || null,
        intent: 'STAFF_CLOCK_OUT',
      });
      if (!result.ok) { setErr(result.block_reason || 'rejected'); return; }
      setActiveShift(null);
      // Release the operator session — chrome rescopes back to the platform login.
      sessionStorage.removeItem('nups_kiosk_operator');
      window.dispatchEvent(new Event('nups:operator-changed'));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const friendly = friendlyError(err);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5 space-y-4">
        {/* Welcome row — who you are + the wall clock */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Signed in as</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="font-bold text-white truncate text-sm">
                {user?.full_name || user?.email || 'Operator'}
              </span>
              {role && (
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeCls}`}>
                  {role.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Current time</div>
            <div className="font-mono text-lg text-white font-bold tabular-nums">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Shift status card */}
        {activeShift ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">On Shift</div>
            <div className="text-3xl font-black text-emerald-200 mt-1 tabular-nums">
              {elapsedLabel(activeShift.check_in_time)}
            </div>
            <div className="text-xs text-emerald-300/80 mt-1">
              Clocked in at {new Date(activeShift.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Not Clocked In</div>
            <div className="text-sm text-slate-300 mt-2">Tap the button below to start your shift.</div>
          </div>
        )}

        {/* Primary action */}
        {activeShift ? (
          <Button onClick={handleClockOut} disabled={busy || !identityOk}
            className="w-full bg-red-600 hover:bg-red-500 h-14 text-base font-bold">
            <LogOut className="w-5 h-5 mr-2" /> {busy ? 'Saving…' : 'Clock Out'}
          </Button>
        ) : (
          <Button onClick={handleClockIn} disabled={busy || !identityOk}
            className="w-full bg-emerald-600 hover:bg-emerald-500 h-14 text-base font-bold">
            <LogIn className="w-5 h-5 mr-2" /> {busy ? 'Clocking in…' : 'Clock In'}
          </Button>
        )}

        {/* Identity refresh hint — only when the probe failed */}
        {!identityOk && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="text-xs text-red-200">
              <div className="font-bold">Sign-in needs a refresh</div>
              <div>Sign out and sign back in before clocking in.</div>
            </div>
          </div>
        )}

        {/* Inline error — friendly language, never raw gateway text */}
        {friendly && identityOk && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-200">{friendly}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}