/**
 * NUPSDataWipePanel — Master data wipe with double confirmation
 * Wires to backend function nupsMasterWipe
 * Only accessible in admin module, admin-role users only
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Trash2, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WIPE_ENTITIES = [
  'POSTransaction', 'POSBatch', 'POSZReport',
  'VenueContract', 'GlyphBucksTransaction', 'GlyphBucksOrder',
  'GlyphBucksBill', 'GlyphBucksBatch', 'VIPRoom', 'VIPGuest',
  'EntertainerShift', 'DriverPayout', 'TipPayout',
  'ContractorPayout', 'DailySettlement', 'VIPContractRecord', 'VIPSessionReport',
];

const PRESERVED_ENTITIES = [
  'Entertainer (staff records)', 'NUPSUser (login accounts)',
  'POSProduct (catalog)', 'Venue (settings)', 'SystemAuditLog (audit trail)',
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

  if (step === 4 && wipeResult) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-black text-white">Wipe Complete</h3>
            <p className="text-sm text-green-400">{wipeResult.total_deleted} records deleted in {wipeResult.elapsed_ms}ms</p>
          </div>
        </div>
        <div className="bg-black/40 border border-white/[0.06] rounded-xl p-4 max-h-64 overflow-y-auto">
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
    );
  }

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

  if (step === 3) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
        <div className="text-center">
          <div className="font-black text-white text-lg">Wiping All Data...</div>
          <div className="text-sm text-gray-400 mt-1">Do not close this window. Deleting {WIPE_ENTITIES.length} entity types.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Master warning banner */}
      <div className="rounded-2xl border-2 border-red-500/60 bg-gradient-to-br from-red-950/50 to-red-900/20 p-5">
        <div className="flex items-start gap-3 mb-4">
          <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-black text-red-400 uppercase tracking-wide">DANGER ZONE — Master Data Wipe</h3>
            <p className="text-sm text-gray-400 mt-1">
              This operation permanently deletes ALL operational NUPS data. This action is <strong className="text-red-400">irreversible</strong>. 
              An audit record is created automatically before deletion begins.
            </p>
          </div>
        </div>

        {/* What gets wiped */}
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
            <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Will Be PRESERVED</div>
            <div className="space-y-1">
              {PRESERVED_ENTITIES.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-green-500/60 flex-shrink-0" />
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
                EXECUTE WIPE
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}