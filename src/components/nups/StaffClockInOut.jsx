/**
 * DACO-20260613-DOOR-RBAC — StaffClockInOut
 *
 * Identity-bound clock-in for door/staff roles (Door Girl, Doorman, etc.).
 * Distinct from the entertainer ShiftClockInOut so we don't perturb the
 * entertainer flow.
 *
 * Identity binding (ID-01 mitigation):
 *   On every clock-in click, we call base44.auth.me() LIVE and verify the
 *   returned email matches the user identity provided by the parent (which
 *   came from sessionStorage). If they diverge -> contaminated_blocked,
 *   no shift is created, the rejection is shown on screen, and an
 *   ActivityLog row is written for forensic trace.
 */
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { writeEntity } from '@/lib/nups/writeEntity';
import { verifyLiveIdentity, sessionFingerprint } from '@/lib/nups/identityVerify';
import { logActivity } from '@/lib/nups/activityLog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, ShieldCheck, ShieldAlert, User, Info } from 'lucide-react';

const ROLE_BADGE_STYLES = {
  DOOR_GIRL: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
  DOORMAN:   'bg-amber-500/15 border-amber-500/40 text-amber-300',
  SECURITY:  'bg-red-500/15 border-red-500/40 text-red-300',
  BARTENDER: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
};

export default function StaffClockInOut({ user, venueId, station = 'door' }) {
  const [busy, setBusy] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [err, setErr] = useState(null);
  const [identityState, setIdentityState] = useState({ checking: true, ok: false, liveEmail: null });

  // On mount: live identity probe so the operator sees up-front whether the
  // session is healthy. This is the visible part of the ID-01 mitigation.
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await verifyLiveIdentity(user?.email || user?.username);
      if (!alive) return;
      setIdentityState({ checking: false, ok: r.ok, liveEmail: r.live?.email || null, reason: r.reason });
    })();
    return () => { alive = false; };
  }, [user?.email, user?.username]);

  // Look up any open shift for this user (so refreshes don't re-clock-in).
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
        // entity may not yet exist on first load
      }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  const role = (user?.role || '').toUpperCase();

  const handleClockIn = async () => {
    setBusy(true);
    setErr(null);
    try {
      // ID-01 rebind: refuse to stamp a record under any identity but the
      // one the live auth session claims right now.
      const probe = await verifyLiveIdentity(user?.email);
      if (!probe.ok) {
        // Forensic trace — non-financial entity, write directly.
        await logActivity({
          action_type: 'LOGIN',
          entity_affected: 'StaffShift:contamination_blocked',
          after_value: { attempted_email: user?.email, live_email: probe.live?.email || null, reason: probe.reason },
          venue_id: venueId || null,
          notes: `ID-01 BLOCK: ${probe.reason}`,
        });
        setErr(`Clock-in blocked — ${probe.reason}. Sign out and sign back in.`);
        return;
      }

      const verifiedEmail = probe.live.email;
      const result = await writeEntity({
        entity: 'StaffShift',
        operation: 'create',
        data: {
          shift_id: `SHF-${Date.now()}`,
          user_email: verifiedEmail,                     // FROM LIVE PROBE, not from props
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

      if (!result.ok) {
        setErr(result.block_reason || 'Gateway rejected clock-in.');
        return;
      }
      setActiveShift(result.value);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    setBusy(true);
    setErr(null);
    try {
      const probe = await verifyLiveIdentity(activeShift.user_email);
      if (!probe.ok) {
        setErr(`Clock-out blocked — ${probe.reason}. The user who clocked in must clock out.`);
        return;
      }
      const result = await writeEntity({
        entity: 'StaffShift',
        operation: 'update',
        id: activeShift.id,
        data: {
          ...activeShift,
          check_out_time: new Date().toISOString(),
          status: 'checked_out',
        },
        actor: { email: probe.live.email, role, id: user?.id },
        venue_id: venueId || null,
        intent: 'STAFF_CLOCK_OUT',
      });
      if (!result.ok) {
        setErr(result.block_reason || 'Gateway rejected clock-out.');
        return;
      }
      setActiveShift(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const badgeCls = ROLE_BADGE_STYLES[role] || 'bg-slate-500/15 border-slate-500/40 text-slate-300';

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5 space-y-4">
        {/* WHO'S CLOCKING IN — friendly identity card */}
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          identityState.checking ? 'border-slate-700 bg-slate-800/40' :
          identityState.ok ? 'border-emerald-500/40 bg-emerald-500/5' :
          'border-red-500/50 bg-red-500/10'
        }`}>
          {identityState.checking ? (
            <Clock className="w-6 h-6 text-slate-400 animate-pulse" />
          ) : identityState.ok ? (
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-red-400" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-bold text-white truncate text-base">
                {user?.full_name || identityState.liveEmail || user?.email || 'Unknown'}
              </span>
              {role && (
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeCls}`}>
                  {role.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {identityState.checking ? 'Checking your sign-in…' :
               identityState.ok ? "You're signed in and ready" :
               "Your sign-in doesn't match this account"}
            </div>
            {!identityState.checking && !identityState.ok && (
              <div className="text-[11px] text-red-300 mt-1">
                Please sign out and sign back in to continue.
              </div>
            )}
          </div>
        </div>

        {/* SHIFT CONTROLS */}
        {activeShift ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">You're On Shift</div>
              <div className="text-2xl font-black text-emerald-200">
                Since {new Date(activeShift.check_in_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="text-xs text-emerald-400/80 mt-1">
                Tap Clock Out when you're done for the night.
              </div>
            </div>
            <Button
              onClick={handleClockOut}
              disabled={busy || !identityState.ok}
              className="w-full bg-red-600 hover:bg-red-500 h-12 text-base font-bold"
            >
              <LogOut className="w-5 h-5 mr-2" /> {busy ? 'Clocking Out…' : 'Clock Out'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 text-center">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">Ready to start your shift?</div>
              <div className="text-xs text-slate-400 mt-1">
                Tap Clock In below. You'll stay clocked in until you tap Clock Out.
              </div>
            </div>
            <Button
              onClick={handleClockIn}
              disabled={busy || !identityState.ok}
              className="w-full bg-emerald-600 hover:bg-emerald-500 h-12 text-base font-bold"
            >
              <LogIn className="w-5 h-5 mr-2" /> {busy ? 'Clocking In…' : 'Clock In'}
            </Button>
          </div>
        )}

        {err && (
          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3">
            <span className="font-bold block mb-1">Couldn't complete that:</span>
            {err}
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Your shift is stamped under <strong className="text-slate-400">{user?.full_name || user?.email || 'your account'}</strong>.
            Only you can clock yourself out — so nobody can punch your timecard for you.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}