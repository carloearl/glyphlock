import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, FlaskConical, Loader2, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadProtectedEvidence } from '@/lib/nups/protectedEvidence';

const CASES = [
  { value: 'B17_MANAGER_IDENTITY_ALLOW', label: 'Manager identity allow', evidence: 'PRIVATE_IDENTITY', expiry: false },
  { value: 'B17_MANAGER_TAX_ALLOW', label: 'Manager tax allow', evidence: 'PRIVATE_TAX', expiry: false },
  { value: 'B17_MANAGER_BIOMETRIC_ALLOW', label: 'Manager biometric allow', evidence: 'PRIVATE_BIOMETRIC', expiry: false },
  { value: 'B17_MANAGER_CONTRACT_ALLOW', label: 'Manager contract allow', evidence: 'PRIVATE_CONTRACT', expiry: false },
  { value: 'B17_DOOR_IDENTITY_ALLOW', label: 'Door identity allow', evidence: 'PRIVATE_IDENTITY', expiry: false },
  { value: 'B17_DOOR_TAX_DENY', label: 'Door tax denial', evidence: 'PRIVATE_TAX', expiry: false },
  { value: 'B17_DOOR_BIOMETRIC_DENY', label: 'Door biometric denial', evidence: 'PRIVATE_BIOMETRIC', expiry: false },
  { value: 'B17_STAFF_IDENTITY_DENY', label: 'Ordinary staff identity denial', evidence: 'PRIVATE_IDENTITY', expiry: false },
  { value: 'B17_STAFF_CONTRACT_DENY', label: 'Ordinary staff contract denial', evidence: 'PRIVATE_CONTRACT', expiry: false },
  { value: 'B17_WRONG_VENUE_DENY', label: 'Wrong-venue manager denial', evidence: 'PRIVATE_IDENTITY', expiry: false },
  { value: 'B17_GLOBAL_CROSS_VENUE_ALLOW', label: 'Global cross-venue allow', evidence: 'PRIVATE_IDENTITY', expiry: false },
  { value: 'B17_SIGNED_URL_EXPIRY', label: 'Authenticated signed URL expiry', evidence: 'PRIVATE_IDENTITY', expiry: true },
];

const EVIDENCE_TYPES = [
  ['PRIVATE_IDENTITY', 'government_id_front'],
  ['PRIVATE_TAX', 'w9_scan'],
  ['PRIVATE_BIOMETRIC', 'thumbprint'],
  ['PRIVATE_CONTRACT', 'signed_hardcopy_contract'],
];

function readVenueId() {
  try {
    const venue = JSON.parse(localStorage.getItem('nups_active_venue') || '{}');
    return venue.venue_id || venue.id || '';
  } catch {
    return '';
  }
}

async function hashText(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function responseStatus(error) {
  return Number(error?.response?.status || error?.status || 0);
}

export default function NUPSBatch17Acceptance() {
  const [identity, setIdentity] = useState(null);
  const [venueId, setVenueId] = useState(readVenueId());
  const [runId, setRunId] = useState(`B17-${Date.now()}`);
  const [caseName, setCaseName] = useState(CASES[0].value);
  const [evidenceIds, setEvidenceIds] = useState({});
  const [manualEvidenceId, setManualEvidenceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [matrix, setMatrix] = useState([]);

  const selectedCase = useMemo(() => CASES.find((item) => item.value === caseName) || CASES[0], [caseName]);
  const currentEvidenceId = manualEvidenceId.trim() || evidenceIds[selectedCase.evidence] || '';
  const isGlobal = ['admin', 'PLATFORM_ADMIN', 'SOVEREIGN'].includes(identity?.nups_role || identity?.platform_role || '');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        const rows = await base44.entities.NUPSUser.filter({ platform_email: String(user.email || '').toLowerCase(), status: 'active' }, null, 1).catch(() => []);
        if (active) setIdentity({ email: user.email, platform_role: user.role, nups_role: rows?.[0]?.role || '', venue_id: rows?.[0]?.venue_id || '' });
      } catch (error) {
        if (active) setMessage(error?.message || 'Authentication is required.');
      }
    })();
    return () => { active = false; };
  }, []);

  async function prepareSyntheticEvidence() {
    if (!venueId) throw new Error('Select or enter the SANDBOX evidence venue first.');
    setBusy(true);
    setMessage('Preparing four synthetic private artifacts…');
    try {
      const prepared = {};
      for (const [classification, artifactType] of EVIDENCE_TYPES) {
        const text = [
          'GLYPHLOCK BATCH 17 SYNTHETIC EVIDENCE',
          'NOT A REAL GOVERNMENT ID',
          'NOT A REAL TAX DOCUMENT',
          'NOT BIOMETRIC DATA',
          'NOT A REAL CONTRACT',
          classification,
          new Date().toISOString(),
        ].join('\n');
        const file = new File([text], `batch17-${classification.toLowerCase()}.txt`, { type: 'text/plain' });
        const result = await uploadProtectedEvidence({
          file,
          venueId,
          artifactType,
          classification,
          subjectEntity: 'Batch17SyntheticEvidence',
          subjectId: `${runId}:${classification}`,
          purpose: 'batch17_browser_acceptance',
          mode: 'SANDBOX',
          signedUrlTtl: 0,
        });
        prepared[classification] = result.evidence_id;
      }
      setEvidenceIds(prepared);
      setMessage('Synthetic evidence prepared. Evidence IDs are safe to copy to the other authenticated test browser profiles.');
    } finally {
      setBusy(false);
    }
  }

  async function runAcceptanceCase() {
    if (!currentEvidenceId) throw new Error('Provide the matching synthetic evidence ID.');
    setBusy(true);
    setMessage(`Running ${selectedCase.label} through the current authenticated browser session…`);
    setLastResult(null);
    const purpose = `batch17:${caseName}:${runId}:${Date.now()}`;
    let observedDecision = 'ERROR';
    let httpStatus = 0;
    let immediateFetchStatus = 0;
    let postExpiryStatus = 0;
    let expiresIn = 0;
    let signedUrlHash = '';
    let signedUrl = '';
    try {
      try {
        const response = await base44.functions.invoke('getProtectedEvidence', { evidence_id: currentEvidenceId, purpose });
        const data = response?.data || {};
        httpStatus = Number(response?.status || 200);
        observedDecision = data.success && data.signed_url ? 'ALLOW' : 'ERROR';
        signedUrl = data.signed_url || '';
        expiresIn = Number(data.expires_in || 0);
      } catch (error) {
        httpStatus = responseStatus(error);
        observedDecision = httpStatus === 403 ? 'DENY' : 'ERROR';
      }

      if (signedUrl) {
        signedUrlHash = await hashText(signedUrl);
        const immediate = await fetch(signedUrl, { credentials: 'include', cache: 'no-store' });
        immediateFetchStatus = immediate.status;
        if (selectedCase.expiry) {
          const waitSeconds = Math.max(1, expiresIn) + 4;
          setMessage(`Immediate retrieval returned HTTP ${immediate.status}. Waiting ${waitSeconds} seconds to reuse the exact URL after expiry…`);
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
          const expired = await fetch(signedUrl, { credentials: 'include', cache: 'no-store' });
          postExpiryStatus = expired.status;
        }
      }

      const recorded = await base44.functions.invoke('recordBatch17AcceptanceResult', {
        action: 'record',
        run_id: runId,
        case_name: caseName,
        evidence_id: currentEvidenceId,
        purpose,
        observed_decision: observedDecision,
        http_status: httpStatus,
        immediate_fetch_status: immediateFetchStatus,
        post_expiry_status: postExpiryStatus,
        expires_in: expiresIn,
        signed_url_hash: signedUrlHash,
      });
      setLastResult(recorded?.data?.result || null);
      setMessage(recorded?.data?.result?.result === 'PASS'
        ? 'Acceptance case passed and was reconciled against the server audit.'
        : recorded?.data?.result?.failure_reason || 'Acceptance case did not pass.');
    } finally {
      signedUrl = '';
      setBusy(false);
    }
  }

  async function loadMatrix() {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('recordBatch17AcceptanceResult', { action: 'matrix' });
      setMatrix(response?.data?.results || []);
      setMessage(`Loaded ${response?.data?.results?.length || 0} sanitized acceptance result(s).`);
    } finally {
      setBusy(false);
    }
  }

  async function copyEvidenceIds() {
    await navigator.clipboard.writeText(JSON.stringify({ run_id: runId, venue_id: venueId, evidence_ids: evidenceIds }, null, 2));
    setMessage('Safe evidence IDs copied. No token, signed URL, or private file reference was copied.');
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-blue-500/30 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300">NUPS Batch 17</p>
              <h1 className="text-2xl font-bold">Authenticated Acceptance Console</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            This console uses the currently logged-in Base44 browser session. It never asks for or displays a password, OTP, bearer token, PIN, signed URL, or private file URI.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="font-semibold">Current identity</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-slate-400">Email</dt><dd>{identity?.email || 'Loading…'}</dd></div>
              <div><dt className="text-slate-400">NUPS role</dt><dd>{identity?.nups_role || 'No active NUPS role found'}</dd></div>
              <div><dt className="text-slate-400">Venue</dt><dd>{identity?.venue_id || 'No venue assigned'}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-5">
            <div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><h2 className="font-semibold">Synthetic evidence only</h2></div>
            <p className="mt-3 text-sm text-amber-100/80">Never use a real ID, tax document, biometric, signature, contract, customer record, payment, or GlyphBucks liability here.</p>
          </div>
        </section>

        {isGlobal && (
          <section className="rounded-2xl border border-violet-500/30 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-violet-400" /><h2 className="font-semibold">Prepare synthetic evidence</h2></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">Run ID<input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={runId} onChange={(event) => setRunId(event.target.value)} /></label>
              <label className="text-sm">Evidence venue ID<input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={venueId} onChange={(event) => setVenueId(event.target.value)} /></label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button disabled={busy} onClick={() => prepareSyntheticEvidence().catch((error) => setMessage(error.message))} className="rounded-lg bg-violet-600 px-4 py-2 font-medium disabled:opacity-50">Prepare four artifacts</button>
              <button disabled={!Object.keys(evidenceIds).length} onClick={() => copyEvidenceIds().catch((error) => setMessage(error.message))} className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 disabled:opacity-50"><Clipboard className="h-4 w-4" />Copy safe IDs</button>
              <button disabled={busy} onClick={() => loadMatrix().catch((error) => setMessage(error.message))} className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2"><RefreshCw className="h-4 w-4" />Load result matrix</button>
            </div>
            {Object.entries(evidenceIds).length > 0 && <pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs">{JSON.stringify(evidenceIds, null, 2)}</pre>}
          </section>
        )}

        <section className="rounded-2xl border border-blue-500/30 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-blue-400" /><h2 className="font-semibold">Run one assigned case</h2></div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Case<select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={caseName} onChange={(event) => setCaseName(event.target.value)}>{CASES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-sm">Synthetic evidence ID<input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={manualEvidenceId} onChange={(event) => setManualEvidenceId(event.target.value)} placeholder={evidenceIds[selectedCase.evidence] || selectedCase.evidence} /></label>
          </div>
          <button disabled={busy || !identity} onClick={() => runAcceptanceCase().catch((error) => { setBusy(false); setMessage(error.message); })} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Run through this authenticated session
          </button>
          {lastResult && <div className={`rounded-lg border p-4 ${lastResult.result === 'PASS' ? 'border-emerald-500/40 bg-emerald-950/30' : 'border-amber-500/40 bg-amber-950/30'}`}><div className="flex items-center gap-2">{lastResult.result === 'PASS' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}<strong>{lastResult.result}</strong></div><pre className="mt-3 overflow-auto text-xs">{JSON.stringify(lastResult, null, 2)}</pre></div>}
        </section>

        {message && <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm">{message}</div>}

        {isGlobal && matrix.length > 0 && <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="font-semibold">Sanitized result matrix</h2><div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="text-slate-400"><tr><th className="p-2">Case</th><th className="p-2">Role</th><th className="p-2">Expected</th><th className="p-2">Observed</th><th className="p-2">Audit</th><th className="p-2">Result</th></tr></thead><tbody>{matrix.map((row) => <tr key={row.result_id} className="border-t border-slate-800"><td className="p-2">{row.case_name}</td><td className="p-2">{row.actor_role}</td><td className="p-2">{row.expected_decision}</td><td className="p-2">{row.observed_decision}</td><td className="p-2">{row.audit_event_found ? 'YES' : 'NO'}</td><td className="p-2">{row.result}</td></tr>)}</tbody></table></div></section>}
      </div>
    </main>
  );
}
