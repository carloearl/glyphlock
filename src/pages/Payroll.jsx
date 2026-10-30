import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NUPSAppShell from '@/components/nups/shell/NUPSAppShell';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import EmployeePayrollForm from '@/components/payroll/EmployeePayrollForm';
import EmployeeCheckRegister from '@/components/payroll/EmployeeCheckRegister';
import PayrollEmployees from '@/components/payroll/PayrollEmployees';
import { listChecks, loadPayrollWorkspace } from '@/lib/payroll/payrollApi';
import { fmtCents } from '@/lib/payroll/checkFormat';

const tabs = [['checks','Paycheck register'],['new','New paycheck'],['employees','Employees'],['activity','Payroll activity'],['history','Historical reports']];
export default function Payroll() {
  const venue = useActiveVenue();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'checks';
  const [mode, setMode] = useState('REAL');
  const scopeKey = String(venue?.id || '') + ':' + mode;
  const [data, setData] = useState({ records: [], employees: [], activity: [], key: '', hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const generation = useRef(0);
  const activeScope = useRef(scopeKey);
  activeScope.current = scopeKey;
  const navigateTab = id => setParams({ tab: id });
  const load = useCallback(async () => {
    if (activeScope.current !== scopeKey) return;
    const request = ++generation.current;
    setLoading(true); setError('');
    if (!venue?.id) { setData({ records: [], employees: [], activity: [], key: scopeKey }); setLoading(false); return; }
    try {
      const scope = { venue_id: venue.id, mode };
      const [checks, workspace] = await Promise.all([listChecks(scope), loadPayrollWorkspace(scope)]);
      if (request !== generation.current) return;
      setData({ records: checks.records || [], employees: workspace.employees || [], activity: workspace.activity || [], hasMore: checks.has_more === true, key: scopeKey });
    } catch (failure) {
      if (request !== generation.current) return;
      setData({ records: [], employees: [], activity: [], key: scopeKey });
      setError(failure.code === 'owner_or_admin_required' ? 'Payroll is available to the owner and administrators.' : failure.message || 'Could not load payroll.');
    } finally { if (request === generation.current) setLoading(false); }
  }, [venue?.id, mode, scopeKey]);
  useEffect(() => { load(); return () => { generation.current++; }; }, [load]);
  // Synchronous key guard prevents a previous ledger from flashing during a scope change.
  const current = data.key === scopeKey ? data : { records: [], employees: [], activity: [] };
  const filtered = current.records.filter(r => (status === 'ALL' || r.status === status) && (r.employee_name + ' ' + r.check_number + ' ' + (r.employee_ref || '')).toLowerCase().includes(search.toLowerCase()));
  const scope = { venue_id: venue?.id, mode };
  const selectedEmployee = employee?.scopeKey === scopeKey ? employee : null;
  async function loadOlder() {
    const request = generation.current; setLoadingMore(true);
    try {
      const page = await listChecks({ ...scope, skip: current.records.length });
      if (request !== generation.current) return;
      setData(old => ({ ...old, records: [...old.records, ...page.records.filter(r => !old.records.some(prior => prior.id === r.id))], hasMore: page.has_more === true }));
    } catch (failure) { if (request === generation.current) setError(failure.message); }
    finally { setLoadingMore(false); }
  }
  return <NUPSAppShell title="Payroll" subtitle="Employee paychecks, payroll records and activity" role="ADMIN">
    <div className="mx-auto max-w-7xl space-y-6 text-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Payroll</h1><p className="text-sm text-slate-400">{venue?.name || 'Select an active venue'} · Chase employee check desk</p></div><div className="flex items-center gap-3"><label className="text-xs">Ledger <select aria-label="Payroll ledger" className="rounded border border-slate-700 bg-slate-950 p-2" value={mode} onChange={e => { setEmployee(null); setMode(e.target.value); }}><option>REAL</option><option>DEMO</option></select></label><button onClick={load} className="rounded border border-slate-700 px-3 py-2 text-sm">Refresh</button></div></header>
      <div className="grid gap-3 sm:grid-cols-3">{[['Stored checks',current.records.length],['Gross in loaded checks',fmtCents(current.records.reduce((n,r) => n + r.gross_cents,0))],['Net in loaded checks',fmtCents(current.records.reduce((n,r) => n + r.net_cents,0))]].map(([label,value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}</div>
      <p className="text-xs text-slate-500">Totals describe loaded check records, including drafts; they do not represent money paid. Tax settings and deductions are stored with each paycheck.</p>
      <nav aria-label="Payroll sections" className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">{tabs.map(([id,label]) => <button key={id} onClick={() => navigateTab(id)} aria-current={tab === id ? 'page' : undefined} className={'rounded px-4 py-2 text-sm ' + (tab === id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white')}>{label}</button>)}</nav>
      {error && <p role="alert" className="rounded border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">{error}</p>}
      {!venue?.id && <p className="p-4 text-amber-200">Select an active venue before loading or preparing payroll.</p>}
      {loading && <p role="status" className="text-sm text-slate-400">Loading payroll records…</p>}
      {!loading && !error && venue?.id && <>
        {tab === 'checks' && <><div className="flex flex-wrap gap-3"><input aria-label="Search payroll checks" placeholder="Search employee or check number" className="min-w-64 rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Check status" className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>{['ALL','DRAFT','REVIEWED','PAID','VOID'].map(v => <option key={v}>{v}</option>)}</select><button onClick={() => { setEmployee(null); navigateTab('new'); }} className="rounded bg-indigo-600 px-4 py-2 text-sm">New paycheck</button></div><EmployeeCheckRegister records={filtered} scope={scope} onReviewed={load} onError={setError} />{current.hasMore && <button disabled={loadingMore} onClick={loadOlder} className="rounded border border-slate-700 px-4 py-2 text-sm">{loadingMore ? 'Loading…' : 'Load older paychecks'}</button>}<p className="text-xs text-slate-500">{current.records.length} checks loaded. Use Load older paychecks for earlier records.</p></>}
        {tab === 'new' && <><p className="rounded border border-indigo-800 p-3 text-xs text-slate-400">Enter the actual issue date and verify employee tax elections. Review and printing do not sign a check or mark it paid.</p>{selectedEmployee && <p className="text-sm text-indigo-200">Using saved settings for {selectedEmployee.employee_name} · usual payday {selectedEmployee.pay_day}.</p>}<EmployeePayrollForm key={scopeKey + ':' + (selectedEmployee?.id || 'new')} employee={selectedEmployee} scope={scope} onCreated={() => { if (activeScope.current !== scopeKey) return; load(); navigateTab('checks'); }} /></>}
        {tab === 'employees' && <PayrollEmployees key={scopeKey} scope={scope} employees={current.employees} onSaved={load} onPrepare={e => { setEmployee({ ...e, scopeKey }); navigateTab('new'); }} />}
        {tab === 'activity' && <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs"><caption className="p-4 text-left text-slate-400">Latest 1,000 payroll activity records. Check records also retain creator and reviewer timestamps.</caption><thead className="bg-slate-900"><tr>{['Time','Record type','Action','Actor','Changed fields / reference'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{current.activity.map(a => <tr key={a.id} className="border-t border-slate-800"><td className="p-3">{a.created_date ? new Date(a.created_date).toLocaleString() : '—'}</td><td className="p-3">{a.entity_name}</td><td className="p-3">{a.operation}</td><td className="p-3">{a.actor_id}</td><td className="p-3">{(a.fields_changed || []).join(', ')}<div className="text-slate-500">{a.notes}</div></td></tr>)}</tbody></table>{!current.activity.length && <p className="p-6 text-sm text-slate-500">No payroll activity recorded in this ledger yet.</p>}</div>}
        {tab === 'history' && <div className="rounded-xl border border-slate-800 p-6"><h2 className="font-semibold">Historical payroll and contractor reports</h2><p className="mt-2 text-sm text-slate-400">Prior PayrollRecord reports, contractor tax forms and tip breakdowns remain available without converting them into employee checks.</p><a href="/NUPSOwner?tab=payroll" className="mt-4 inline-block rounded border border-indigo-600 px-4 py-2 text-sm text-indigo-200">Open historical reports</a></div>}
      </>}
    </div>
  </NUPSAppShell>;
}
