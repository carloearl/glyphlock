import { useState } from 'react';
import { savePayrollEmployee } from '@/lib/payroll/payrollApi';
import { fmtCents, toCents } from '@/lib/payroll/checkFormat';

const empty = { employee_name: '', employee_ref: '', salary: '', pay_type: 'HOURLY', pay_periods: 26, pay_day: 15, status: 'ACTIVE', notes: '' };
const cls = 'w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white';
export default function PayrollEmployees({ employees, scope, onSaved, onPrepare }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await savePayrollEmployee(scope, { id: form.id, employee_name: form.employee_name, employee_ref: form.employee_ref, base_salary_cents: form.pay_type === 'SALARY' ? toCents(form.salary) : 0, hourly_rate_cents: form.pay_type === 'HOURLY' ? toCents(form.salary) : 0, pay_type: form.pay_type, pay_periods: Number(form.pay_periods), pay_day: Number(form.pay_day), status: form.status, notes: form.notes });
      setForm(empty); onSaved();
    } catch (failure) { setError(failure.code === 'invalid_employee_settings' ? 'Enter a name, positive amount, valid pay frequency and day from 1–28.' : failure.message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <p className="text-sm text-slate-400">Salary and schedule settings are saved for this venue and ledger. Each paycheck retains its own tax elections and wage calculation. Changes here never rewrite old checks.</p>
    <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="font-semibold">{form.id ? 'Edit employee payroll settings' : 'Add employee payroll settings'}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs">Employee name<input required maxLength={120} className={cls} value={form.employee_name} onChange={e => update('employee_name', e.target.value)} /></label>
        <label className="text-xs">Internal employee reference<input maxLength={80} className={cls} value={form.employee_ref} placeholder="Internal ID — never SSN" onChange={e => update('employee_ref', e.target.value)} /></label>
        <label className="text-xs">{form.pay_type === 'HOURLY' ? 'Full hourly cash wage ($)' : 'Default gross per paycheck ($)'}<input required className={cls} inputMode="decimal" value={form.salary} onChange={e => update('salary', e.target.value)} /></label>
        <label className="text-xs">Pay type<select className={cls} value={form.pay_type} onChange={e => update('pay_type', e.target.value)}><option value="SALARY">Salary</option><option value="HOURLY">Hourly gross, entered per period</option></select></label>
        <label className="text-xs">Pay frequency<select className={cls} value={form.pay_periods} onChange={e => update('pay_periods', Number(e.target.value))}>{[[12,'Monthly'],[24,'Twice monthly'],[26,'Every two weeks'],[52,'Weekly'],[4,'Quarterly'],[2,'Twice yearly']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="text-xs">Usual monthly payday (1–28)<input required type="number" min="1" max="28" className={cls} value={form.pay_day} onChange={e => update('pay_day', Number(e.target.value))} /></label>
        <label className="text-xs">Status<select className={cls} value={form.status} onChange={e => update('status', e.target.value)}><option>ACTIVE</option><option>INACTIVE</option></select></label>
      </div>
      <label className="block text-xs">Payroll notes<textarea maxLength={500} className={cls} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Schedule or processing notes. Keep bank details and SSNs out of notes." /></label>
      <p className="text-xs text-slate-500">The schedule is a reference. Enter the actual issue date when preparing each check.</p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-3"><button disabled={busy} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save employee'}</button>{form.id && <button type="button" onClick={() => setForm(empty)} className="px-4 py-2 text-sm">Cancel edit</button>}</div>
    </form>
    {employees.length >= 1000 && <p className="text-xs text-amber-200">First 1,000 employee profiles shown.</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Saved employees ({employees.length})</caption><thead className="bg-slate-900 text-slate-400"><tr>{['Employee','Default pay','Schedule','Status','Actions'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{employees.map(e => <tr key={e.id} className="border-t border-slate-800"><td className="p-3">{e.employee_name}<div className="text-xs text-slate-500">{e.employee_ref}</div></td><td className="p-3">{e.pay_type === 'HOURLY' ? fmtCents(e.hourly_rate_cents || 0) + '/hr' : fmtCents(e.base_salary_cents)}</td><td className="p-3">{e.pay_periods} periods/year · day {e.pay_day}</td><td className="p-3">{e.status}</td><td className="flex gap-3 p-3"><button className="text-indigo-300" onClick={() => setForm({...e, salary:((e.pay_type === 'HOURLY' ? e.hourly_rate_cents || 0 : e.base_salary_cents)/100).toFixed(2)})}>Edit</button>{e.status === 'ACTIVE' && <button className="text-emerald-300" onClick={() => onPrepare(e)}>Prepare paycheck</button>}</td></tr>)}</tbody></table>{!employees.length && <p className="p-6 text-sm text-slate-500">No employee settings saved in this ledger yet.</p>}</div>
  </div>;
}
