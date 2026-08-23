import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { uploadProtectedEvidence } from '@/lib/nups/protectedEvidence';
import { AlertTriangle, CheckCircle2, ClipboardCopy, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

const EVIDENCE_TYPES = {
  identity: { classification: 'PRIVATE_IDENTITY', artifactType: 'government_id_front' },
  tax: { classification: 'PRIVATE_TAX', artifactType: 'w9_scan' },
  biometric: { classification: 'PRIVATE_BIOMETRIC', artifactType: 'thumbprint' },
  contract: { classification: 'PRIVATE_CONTRACT', artifactType: 'signed_hardcopy_contract' },
};

function StatusBadge({ value }) {
  const pass = value === 'PASS' || value === 'PASSED' || value === 'READY';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pass ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200'}`}>{value || 'PENDING'}</span>;
}

export default function Batch17Acceptance() {
  const [user, setUser] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [runId, setRunId] = useState('');
  const [runState, setRunState] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const invoke = useCallback(async (payload) => {
    const response = await base44.functions.invoke('batch17Acceptance', payload);
    const data = response?.data || {};
    if (!data.success) throw new Error(data.error || 'Batch 17 acceptance action failed.');
    return data;
  }, []);

  const claimIdentity = async () => {
    setBusy('claim'); setError(''); setMessage('');
    try {
      const data = await invoke({ action: 'claim_test_identity' });
      setIdentity(data.identity);
      setMessage(`Verified Batch 17 role claimed: ${data.identity.role} / ${data.identity.venue_id || 'global'}.`);
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const refresh = useCallback(async () => {
    if (!runId.trim()) return;
    setBusy('refresh'); setError('');
    try {
      const data = await invoke({ action: 'status', run_id: runId.trim() });
      setRunState({ ...data.run, assignment: data.assignment });
      setIdentity((current) => current || { role: data.assignment, venue_id: '' });
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  }, [invoke, runId]);

  const createRun = async () => {
    setBusy('create'); setError(''); setMessage('');
    try {
      const data = await invoke({ action: 'create_run', venue_a_id: 'dream_palace', venue_b_id: 'B17_SANDBOX_VENUE' });
      setRunId(data.run.run_id);
      setRunState({ ...data.run, assignment: 'GLOBAL_ADMIN', evidence_ready: false, completed_assignments: [] });
      setMessage('Acceptance run created. Copy the run ID to the other four authenticated browser profiles.');
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const createEvidence = async () => {
    if (!runId || !runState?.venue_a_id) return;
    setBusy('evidence'); setError(''); setMessage('');
    try {
      const evidenceIds = {};
      for (const [key, spec] of Object.entries(EVIDENCE_TYPES)) {
        const text = [
          'GLYPHLOCK BATCH 17 SYNTHETIC EVIDENCE',
          'NOT A REAL GOVERNMENT ID',
          'NOT A REAL TAX DOCUMENT',
          'NOT BIOMETRIC DATA',
          'NOT A REAL CONTRACT',
          `RUN=${runId}`,
          `CLASSIFICATION=${spec.classification}`,
          new Date().toISOString(),
        ].join('\n');
        const file = new File([text], `batch17-${key}.txt`, { type: 'text/plain' });
        const uploaded = await uploadProtectedEvidence({
          file,
          venueId: runState.venue_a_id,
          artifactType: spec.artifactType,
          classification: spec.classification,
          subjectEntity: 'Batch17SyntheticEvidence',
          subjectId: `${runId}:${key}`,
          purpose: 'batch17_authenticated_browser_acceptance',
          mode: 'SANDBOX',
          signedUrlTtl: 0,
        });
        evidenceIds[key] = uploaded.evidence_id;
      }
      await invoke({ action: 'register_evidence', run_id: runId, evidence_ids: evidenceIds });
      setRunState((current) => ({ ...current, status: 'READY', evidence_ready: true }));
      setMessage('Four synthetic protected-evidence records are ready. No real identity, tax, biometric, or contract data was used.');
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const executeAssignment = async () => {
    setBusy('execute'); setError(''); setMessage('');
    try {
      const started = Date.now();
      const data = await invoke({ action: 'execute_assignment', run_id: runId });
      if (data.expiry_probe?.signed_url) {
        const signedUrl = data.expiry_probe.signed_url;
        const expiresIn = Number(data.expiry_probe.expires_in || 10);
        const immediate = await fetch(signedUrl, { credentials: 'include', cache: 'no-store', redirect: 'manual' });
        await new Promise((resolve) => setTimeout(resolve, (expiresIn + 3) * 1000));
        const expired = await fetch(signedUrl, { credentials: 'include', cache: 'no-store', redirect: 'manual' });
        const elapsed = Math.floor((Date.now() - started) / 1000);
        await invoke({
          action: 'record_expiry', run_id: runId,
          immediate_status: immediate.status,
          post_expiry_status: expired.status,
          elapsed_seconds: elapsed,
        });
      }
      setMessage(`${data.assignment} acceptance checks passed.`);
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const finalize = async () => {
    setBusy('finalize'); setError(''); setMessage('');
    try {
      const data = await invoke({ action: 'finalize', run_id: runId });
      setMessage(`Authenticated acceptance result: ${data.status}.`);
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const assignment = runState?.assignment || '';
  const canCreateRun = identity?.role === 'PLATFORM_ADMIN' || identity?.role === 'SOVEREIGN' || assignment === 'GLOBAL_ADMIN';
  const canCreateEvidence = assignment === 'VENUE_A_MANAGER' || assignment === 'GLOBAL_ADMIN';
  const completed = useMemo(() => new Set(runState?.completed_assignments || []), [runState?.completed_assignments]);

  if (!user) {
    return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8"><LockKeyhole className="mb-4 h-8 w-8 text-amber-300"/><h1 className="text-2xl font-bold">Batch 17 authenticated acceptance</h1><p className="mt-3 text-slate-300">Sign in using one of the five verified disposable Base44 test accounts. This page never asks you to copy a bearer token.</p><button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="mt-6 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950">Sign in</button></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-emerald-300"/><div><h1 className="text-2xl font-bold">Batch 17 authenticated acceptance</h1><p className="text-sm text-slate-300">Five real browser sessions, synthetic evidence only, no raw token handling.</p></div></div>
          <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2"><span>Base44 user: {user.email}</span><span>Claimed role: {identity?.role || 'not claimed'}</span></div>
          {!identity && <button disabled={Boolean(busy)} onClick={claimIdentity} className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950">{busy === 'claim' ? 'Claiming…' : 'Claim my pre-approved test role'}</button>}
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Acceptance run</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={runId} onChange={(e) => setRunId(e.target.value)} placeholder="B17 run ID" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2"/><button onClick={refresh} disabled={!runId || Boolean(busy)} className="rounded-lg border border-white/15 px-4 py-2">Check run</button>{canCreateRun && <button onClick={createRun} disabled={Boolean(busy)} className="rounded-lg bg-blue-400 px-4 py-2 font-semibold text-slate-950">Create run</button>}</div>
          {runId && <button onClick={() => navigator.clipboard.writeText(runId)} className="mt-3 inline-flex items-center gap-2 text-sm text-blue-300"><ClipboardCopy className="h-4 w-4"/>Copy run ID</button>}
          {runState && <div className="mt-4 grid gap-3 rounded-xl bg-slate-900/70 p-4 text-sm sm:grid-cols-2"><div>Status: <StatusBadge value={runState.status}/></div><div>Assignment: <strong>{assignment}</strong></div><div>Evidence: {runState.evidence_ready ? 'ready' : 'not ready'}</div><div>Expires: {runState.expires_at ? new Date(runState.expires_at).toLocaleString() : 'unknown'}</div></div>}
        </section>

        {runState && <section className="rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="text-lg font-semibold">Assigned work</h2><div className="mt-4 flex flex-wrap gap-3">{canCreateEvidence && !runState.evidence_ready && <button onClick={createEvidence} disabled={Boolean(busy)} className="rounded-lg bg-purple-400 px-4 py-2 font-semibold text-slate-950">Create synthetic evidence</button>}<button onClick={executeAssignment} disabled={!runState.evidence_ready || completed.has(assignment) || Boolean(busy)} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950">Run {assignment || 'assigned'} checks</button>{assignment === 'GLOBAL_ADMIN' && <button onClick={finalize} disabled={Boolean(busy)} className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950">Finalize five-session run</button>}</div><div className="mt-4 flex flex-wrap gap-2">{(runState.completed_assignments || []).map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5"/>{item}</span>)}</div></section>}

        {busy && <div className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-blue-200"><Loader2 className="h-5 w-5 animate-spin"/>Running {busy}…</div>}
        {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">{message}</div>}
        {error && <div className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0"/><span>{error}</span></div>}

        <footer className="text-xs leading-5 text-slate-500">This acceptance page stores no password, OTP, bearer token, signed URL, private file URI, or protected document content. A result is valid only when five distinct verified Base44 sessions complete their assigned roles.</footer>
      </div>
    </main>
  );
}
