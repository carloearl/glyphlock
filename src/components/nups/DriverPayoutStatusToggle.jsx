/**
 * DACO-20260610 WS-3 — Driver Payout Status Toggle
 *
 * Tap-to-toggle PENDING ⇄ PROCESSED with confirm dialog.
 *
 * Hard rules:
 *  - Toggle changes STATUS ONLY, never amount.
 *  - PROCESSED → PENDING reversal requires Manager role.
 *  - All transitions log to ActivityLog as PAYOUT_TOGGLE with before/after values.
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { logActivity } from '@/lib/nups/activityLog';

const MANAGER_ROLES = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

export default function DriverPayoutStatusToggle({ payout, currentUser, onUpdated }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const currentStatus = payout.payout_status || 'PENDING';
  const nextStatus = currentStatus === 'PENDING' ? 'PROCESSED' : 'PENDING';
  const isReversal = currentStatus === 'PROCESSED' && nextStatus === 'PENDING';

  const userRole = currentUser?._highestRole || currentUser?.role || 'External';
  const isManager = MANAGER_ROLES.includes(userRole);
  const canToggle = !isReversal || isManager;

  const handleConfirm = async () => {
    if (!canToggle) {
      setError('Manager role required for reversal.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const before = {
        payout_status: currentStatus,
        processed_by: payout.processed_by || null,
        processed_at: payout.processed_at || null,
      };
      const updates = {
        payout_status: nextStatus,
      };
      if (nextStatus === 'PROCESSED') {
        updates.processed_by = currentUser?.email || 'unknown';
        updates.processed_at = new Date().toISOString();
      } else {
        // Reversal: clear processed fields
        updates.processed_by = null;
        updates.processed_at = null;
      }

      await base44.entities.DriverPayout.update(payout.id, updates);

      await logActivity({
        action_type: 'PAYOUT_TOGGLE',
        entity_affected: `DriverPayout:${payout.id}`,
        before_value: before,
        after_value: { ...before, ...updates },
        venue_id: payout.venue_id || null,
        notes: `driver=${payout.driver_name} amount=${payout.total_payout} ${currentStatus}→${nextStatus}${isReversal ? ' [REVERSAL]' : ''}`,
      });

      setConfirmOpen(false);
      onUpdated && onUpdated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pillClass = currentStatus === 'PROCESSED'
    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
    : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30';

  const Icon = currentStatus === 'PROCESSED' ? CheckCircle2 : Clock;

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-colors ${pillClass}`}
        title={`Tap to mark ${nextStatus}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {currentStatus}
      </button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isReversal ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isReversal ? 'Reverse to PENDING?' : 'Mark as PROCESSED?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Driver</span><span className="font-bold">{payout.driver_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-bold text-emerald-400">${Number(payout.total_payout || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Drops</span><span>{payout.total_drops || 0} ({payout.vip_count || 0} VIP)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Transition</span><span className="font-mono">{currentStatus} → {nextStatus}</span></div>
            </div>
            {isReversal && !isManager && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Reversal requires Manager role. Your current role: <b>{userRole}</b></span>
              </div>
            )}
            {error && <div className="text-red-400 text-xs">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={busy || !canToggle}
              className={isReversal ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}
            >
              {busy ? 'Saving…' : `Confirm ${nextStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}