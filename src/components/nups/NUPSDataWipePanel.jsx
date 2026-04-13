/**
 * NUPSDataWipePanel — Master data wipe with mandatory Google Drive backup
 * Protected credentialed records (contracts, guests, drivers, payouts, entertainers)
 * are NEVER deleted — they are backed up to Google Drive automatically.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Trash2, Loader2, CheckCircle2, ShieldAlert, HardDrive, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WIPE_ENTITIES = [
  'POSTransaction', 'POSBatch', 'POSZReport',
  'GlyphBucksTransaction', 'GlyphBucksOrder',
  'GlyphBucksBill', 'GlyphBucksBatch', 'VIPRoom',
  'EntertainerShift', 'TipPayout',
  'DailySettlement', 'VIPSessionReport',
];

const PROTECTED_ENTITIES = [
  { name: 'VenueContract', label: 'VIP & Venue Contracts' },
  { name: 'VIPContractRecord', label: 'VIP Contract Records' },
  { name: 'VIPGuest', label: 'VIP Guest Records' },
  { name: 'DriverPayout', label: 'Driver Payout Records' },
  { name: 'ContractorPayout', label: 'Contractor Payout Records' },
  { name: 'Entertainer', label: 'Entertainer Profiles' },
];

const ALWAYS_PRESERVED = [
  'NUPSUser (login accounts)',
  'POSProduct (product catalog)',
  'Venue (venue settings)',
  'SystemAuditLog (audit trail)',
];

export default function NUPSDataWipePanel({ user }) {
  const [step, setStep] = useState(1); // 1=warning, 2=confirm, 3=wiping, 4=done, 5=error
  const [confirmText, setConfirmText] = useState('');
  const [wipeResult, setWipeResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const REQUIRED_PHRASE = 'WIPE ALL NUPS DATA';

  const handleWipe = async () => {
    if (confirmText !== REQUIRED_PHRASE) return;
    setStep(3);
    try {
      const res = await base44.functions.invoke('nupsMasterWipe', {
        confirm_phrase: REQUIRED_PHRASE,
        wipe_scope: 'all',
      });
      if (res.data?.success) {
        setWipeResult(res.data);
        setStep(4);
      } else {
        setErrorMsg(res.data?.error || 'Wipe failed. Check the audit log.');
        setStep(5);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error during wipe.');
      setStep(5);
    }
  };

  const reset = () => { setStep(1); setConfirmText(''); setWipeResult(null); setErrorMsg(''); };

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === 4 && wipeResult) {
    const backup = wipeResult.backup || {};
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-black text-white">Wipe Complete</h3>
              <p className="text-sm text-green-400">{wipeResult.total_deleted} records deleted in {wipeResult.elapsed_ms}ms</p>
            </div>
          </div>

          {/* Backup Status */}
          <div className={`rounded-xl border p-4 ${backup.file_id ? 'border-blue-500/30 bg-blue-900/10' : 'border-yellow-500/30 bg-yellow-900/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className={`w-4 h-4 ${backup.file_id ? 'text-blue-400' : 'text-yellow-400'}`} />
              <span className={`text-sm font-bold ${backup.file_id ? 'text-blue-400' : 'text-yellow-400'}`}>
                Google Drive Backup — {backup.file_id ? 'SUCCESS' : 'FAILED'}
              </span>
            </div>
            {backup.file_id && (
              <p className="text-xs text-gray-400 font-mono">File ID: {backup.file_id}</p>
            )}
            {backup.error && (
              <p className="text-xs text-yellow-400 mt-1">⚠ {backup.error}</p>
            )}
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Protected Records (never deleted)</p>
              <div className="flex flex-wrap gap-1">
                {(backup.protected_entities_preserved || []).map(e => (
                  <span key={e} className="text-xs bg-green-900/30 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">{e}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Deletion Summary */}
          <div className="bg-black/40 border border-white/[0.06] rounded-xl p-4 max-h-56 overflow-y-auto">
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">Deletion Summary</div>
            <div className="space-y-1">
              {wipeResult.results?.map(r => (
                <div key={r.entity} className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">{r.entity}</span>
                  <span className={r.deleted > 0 ? 'text-red-400' : 'text-gray-600'}>{r.deleted} deleted{r.error ? ` ⚠ ${r.error}` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-600">Wiped by {wipeResult.wiped_by} at {new Date(wipeResult.wiped_at).toLocaleString()}</div>
          <Button onClick={reset} variant="outline" className="border-white/10 text-gray-400 hover:text-white text-sm">← Back</Button>
        </div>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="font-black text-red-400">Wipe Failed</h3>
        </div>
        <p className="text-sm text-gray-400">{errorMsg}</p>
        <Button onClick={reset} variant="outline" className="border-white/10 text-gray-400">Try Again</Button>
      </div>
    );
  }

  // ── WIPING ─────────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="w-7 h-7 text-blue-400 animate-pulse" />
          <span className="text-blue-400 font-bold text-base">Backing up to Google Drive…</span>
        </div>
        <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
        <div className="text-center">
          <div className="font-black text-white text-lg">Backup → Wipe in Progress</div>
          <div className="text-sm text-gray-400 mt-1">Protecting credentialed files, then clearing operational data.</div>
          <div className="text-xs text-gray-600 mt-1">Do not close this window.</div>
        </div>
      </div>
    );
  }

  // ── WARNING + CONFIRM ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Google Drive Backup Notice */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-4 flex items-start gap-3">
        <HardDrive className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-blue-400">Automatic Google Drive Backup</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Before any wipe, <strong className="text-white">all receipts, contracts, guests, drivers, entertainers, and payout records</strong> are automatically exported as a timestamped JSON backup to your connected Google Drive. The backup runs first — if it fails, you will be warned.
          </div>
        </div>
      </div>

      {/* Protected Records Notice */}
      <div className="rounded-xl border border-green-500/30 bg-green-900/10 p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-green-400">Credentialed Records — NEVER Deleted</div>
          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
            {PROTECTED_ENTITIES.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <Shield className="w-2.5 h-2.5 text-green-500/60" />
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border-2 border-red-500/60 bg-gradient-to-br from-red-950/50 to-red-900/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-black text-red-400 uppercase tracking-wide">DANGER ZONE — Master Data Wipe</h3>
            <p className="text-sm text-gray-400 mt-1">
              Permanently deletes operational/transactional NUPS data. Credentialed records (contracts, guests, drivers, entertainers, payouts) are <strong className="text-green-400">protected and never deleted</strong>. An audit record is always created.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Will Be DELETED</div>
            <div className="space-y-1">
              {WIPE_ENTITIES.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <Trash2 className="w-3 h-3 text-red-500/60 flex-shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">PROTECTED — Never Deleted</div>
            <div className="space-y-1">
              {PROTECTED_ENTITIES.map(e => (
                <div key={e.name} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <Lock className="w-3 h-3 text-green-500/60 flex-shrink-0" />
                  {e.name}
                </div>
              ))}
              {ALWAYS_PRESERVED.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-blue-500/60 flex-shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>

        {step === 1 && (
          <Button
            onClick={() => setStep(2)}
            className="w-full h-12 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 font-black text-base"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            I Understand — Proceed to Confirmation
          </Button>
        )}

        {step === 2 && (
          <div className="space-y-3 mt-4 pt-4 border-t border-red-500/30">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 mb-2">
              <p className="text-xs text-blue-300">
                <HardDrive className="w-3 h-3 inline mr-1" />
                Google Drive backup will run automatically before any data is deleted.
              </p>
            </div>
            <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4">
              <p className="text-sm text-red-300 font-bold mb-3">
                Type exactly to confirm: <code className="bg-red-950 text-red-400 px-2 py-0.5 rounded">{REQUIRED_PHRASE}</code>
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={REQUIRED_PHRASE}
                className="bg-black/60 border-red-500/50 text-white font-mono placeholder:text-gray-700 focus:border-red-400"
                autoFocus
              />
              {confirmText.length > 0 && confirmText !== REQUIRED_PHRASE && (
                <p className="text-xs text-red-400/70 mt-1">Phrase does not match.</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1 border-white/10 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWipe}
                disabled={confirmText !== REQUIRED_PHRASE}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-black disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                BACKUP → WIPE
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}