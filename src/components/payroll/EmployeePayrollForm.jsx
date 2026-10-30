import React, { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, FilePlus2, ShieldAlert } from 'lucide-react';
import PayrollTaxCalculator from './PayrollTaxCalculator';
import HourlyEarningsCalculator from './HourlyEarningsCalculator';
import { calculateHourlyEarnings } from '../../../base44/functions/employeePayrollCheck/hourlyEarnings.js';
import { calculatePayrollTaxes } from '../../../base44/functions/employeePayrollCheck/taxes2026.js';
import { createDraft } from '@/lib/payroll/payrollApi';
import { sumDeductionCents, toCents } from '@/lib/payroll/checkFormat';

const EMPTY_FORM = {
  employee_name: '',
  pay_type: 'HOURLY',
  gross: '',
  period_start: '',
  period_end: '',
  issue_date: '',
  memo: '',
  stock_start_number: '26-395',
  ytd_status: 'UNAVAILABLE',
  ytd_gross: '',
  ytd_deductions: '',
  ytd_net: '',
};

const MESSAGES = {
  earnings_records_required: 'Verify workweek and tip records before calculating.',
  work_location_required: 'Select the applicable work location.',
  workweek_date_required: 'Enter the earning period and each employer workweek start date.',
  wage_year_unsupported: 'Hourly wage rules currently cover earning periods in 2026.',
  hourly_rate_below_minimum: 'Hourly base pay must meet the full applicable minimum. Tips do not reduce it.',
  regular_hours_over_40: 'Enter no more than 40 regular hours per workweek; enter overtime separately.',
  hours_invalid: 'Enter valid regular and overtime hours for each workweek.',
  workweek_overlap: 'Use distinct workweeks starting on the same employer workweek day.',
  workweek_outside_period: 'Each workweek must overlap the selected earning period.',
  tips_paid_exceed_reported: 'Enter valid tip amounts; already-paid tips cannot exceed reported tips.',
  insufficient_cash_for_withholding: 'Available wages cannot cover withholding on paid tips. A payroll specialist must handle collection priority and uncollected taxes before a check is prepared.',
  earnings_mismatch: 'Earnings changed during calculation. Review hours, tips and totals.',

  employee_name_required: 'Enter the employee name.',
  period_start_required: 'Enter the earning period start.',
  period_end_required: 'Enter the earning period end.',
  period_end_before_start: 'The earning period end must be on or after the start.',
  issue_date_required: 'Enter the actual check issue date.',
  gross_amount_required: 'Enter a gross amount greater than zero.',
  deduction_label_required: 'Every deduction needs a label.',
  deduction_amount_required: 'Every deduction needs an amount greater than zero.',
  duplicate_deduction_code: 'Two deductions use the same code.',
  deduction_total_mismatch: 'Deduction total does not match the listed deductions.',
  deductions_missing_or_unconfirmed: 'Enter each deduction, or confirm that none apply.',
  net_mismatch: 'Net check must equal taxable gross minus deductions minus tips already paid.',
  net_negative: 'Deductions exceed gross wages.',
  bank_details_not_accepted: 'Bank routing and account numbers are never accepted here.',
  bank_must_be_chase: 'This workflow prints on Chase preprinted stock only.',
  ytd_status_required: 'Choose a YTD status.',
  ytd_opening_figures_required: 'Enter verified opening YTD gross, deductions and net.',
  ytd_net_mismatch: 'Opening YTD net must equal gross minus deductions.',
  stock_start_number_required: 'Enter the next check number printed on the Chase stock, e.g. 26-395.',
  numbering_setup_required: 'Chase check numbering needs owner setup.',
  numbering_setup_conflict: 'Numbering configuration needs reconciliation before saving.',
  payroll_save_in_progress: 'Another payroll draft is saving. Wait briefly and retry this same draft.',
  tax_settings_invalid: 'Check the employee tax elections and prior taxable wages.',
  tax_year_mismatch: 'The 2026 calculator requires an actual issue date in 2026.',
  invalid_draft: 'Review the highlighted fields.',
  owner_or_admin_required: 'Only an owner or admin can prepare employee checks.',
  autofocus_failed: 'Could not read the form.',
};

const fieldClass = 'w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400';

export default function EmployeePayrollForm({ onCreated, scope = {}, employee = null }) {
  const [form, setForm] = useState(() => employee ? { ...EMPTY_FORM, employee_name: employee.employee_name, employee_ref: employee.employee_ref || '', pay_type: employee.pay_type, gross: (employee.base_salary_cents / 100).toFixed(2) } : EMPTY_FORM);
  const [deductions, setDeductions] = useState([]);
  const [noDeductions, setNoDeductions] = useState(false);
  const [automaticTaxes, setAutomaticTaxes] = useState(true);
  const [hourlyInput, setHourlyInput] = useState(null);
  const [taxProfile, setTaxProfile] = useState(null);
  const [calculatorKey, setCalculatorKey] = useState(0);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());

  const update = (patch) => {
    if (patch.pay_type === 'HOURLY') setAutomaticTaxes(true);
    if (patch.pay_type && patch.pay_type !== form.pay_type) { setTaxProfile(null); setCalculatorKey(key => key + 1); }
    if (patch.employee_name !== undefined && patch.employee_name !== form.employee_name) {
      setTaxProfile(null); setCalculatorKey((key) => key + 1);
    }
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const hourly = form.pay_type === 'HOURLY';
  const earnings = useMemo(() => {
    if (!hourly) return { result: null, error: '' };
    try { return { result: calculateHourlyEarnings({ ...hourlyInput, period_start: form.period_start, period_end: form.period_end }), error: '' }; }
    catch (failure) { return { result: null, error: failure.message }; }
  }, [hourly, hourlyInput, form.period_start, form.period_end]);
  const tipsPaid = hourly ? earnings.result?.tips_paid_cents || 0 : 0;
  const grossCents = hourly ? earnings.result?.gross_cents ?? NaN : toCents(form.gross);
  const taxCalculation = useMemo(() => {
    if (!automaticTaxes) return { result: null, error: '' };
    try { return { result: calculatePayrollTaxes(grossCents, taxProfile || {}), error: '' }; }
    catch (error) { return { result: null, error: error.message }; }
  }, [automaticTaxes, grossCents, taxProfile]);
  const deductionCents = (taxCalculation.result?.total_deductions_cents || 0) + useMemo(() => sumDeductionCents(deductions.map((item) => ({
    amount_cents: toCents(item.amount),
  }))), [deductions]);
  const netCents = Number.isFinite(grossCents) ? grossCents - deductionCents - tipsPaid : NaN;

  const addDeduction = () => setDeductions((prev) => [...prev, { code: '', label: '', amount: '' }]);
  const updateDeduction = (index, patch) => setDeductions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const removeDeduction = (index) => setDeductions((prev) => prev.filter((_, i) => i !== index));

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);

    if (hourly && earnings.error) { setErrors([earnings.error]); return; }
    if (netCents < 0) { setErrors(['insufficient_cash_for_withholding']); return; }
    if (automaticTaxes && taxCalculation.error) { setErrors([taxCalculation.error]); return; }
    const extraRows = deductions
      .filter((item) => item.label.trim() || item.amount.trim())
      .map((item) => ({
        code: item.code.trim() || item.label.trim(),
        label: item.label.trim(),
        amount_cents: toCents(item.amount),
      }));

    const rows = [...(taxCalculation.result?.deductions || []), ...extraRows];
    setSaving(true);
    try {
      const payload = {
        ...scope,
        employee_name: form.employee_name,
        employee_ref: employee?.employee_name === form.employee_name ? employee.employee_ref || '' : '',
        pay_type: form.pay_type,
        period_start: form.period_start,
        period_end: form.period_end,
        issue_date: form.issue_date,
        memo: form.memo,
        gross_cents: grossCents,
        deductions: rows,
        total_deductions_cents: sumDeductionCents(rows),
        net_cents: grossCents - sumDeductionCents(rows) - tipsPaid,
        tips_paid_cents: tipsPaid,
        hourly_earnings: hourly ? hourlyInput : undefined,
        no_deductions_confirmed: automaticTaxes ? rows.length === 0 : noDeductions,
        tax_profile: automaticTaxes ? taxProfile : undefined,
        ytd_status: form.ytd_status,
        ytd_gross_cents: form.ytd_status === 'VERIFIED_OPENING' ? toCents(form.ytd_gross) : null,
        ytd_deductions_cents: form.ytd_status === 'VERIFIED_OPENING' ? toCents(form.ytd_deductions) : null,
        ytd_net_cents: form.ytd_status === 'VERIFIED_OPENING' ? toCents(form.ytd_net) : null,
        stock_start_number: form.stock_start_number ? form.stock_start_number.trim() : undefined,
        idempotency_key: idempotencyKey.current,
      };
      const data = await createDraft(payload);
      idempotencyKey.current = crypto.randomUUID();
      setForm(EMPTY_FORM);
      setTaxProfile(null); setCalculatorKey((key) => key + 1);
      setDeductions([]);
      setNoDeductions(false);
      onCreated?.(data.record);
    } catch (error) {
      setErrors(error?.errors?.length ? error.errors : [error?.code || 'invalid_draft']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-100">New employee check draft</h3>
          <p className="text-xs text-slate-400">Drafts are non-negotiable until every required field is reviewed.</p>
        </div>

      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-slate-400">
          Employee name
          <input className={fieldClass} value={form.employee_name} onChange={(e) => update({ employee_name: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Pay type
          <select className={fieldClass} value={form.pay_type} onChange={(e) => update({ pay_type: e.target.value })}>
            <option value="SALARY">Salary</option>
            <option value="HOURLY">Hourly</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          {hourly ? 'Taxable gross — calculated below' : 'Gross wages (USD)'}
          <input className={fieldClass} inputMode="decimal" disabled={hourly} placeholder={hourly ? "Enter hours and tips below" : "Enter gross salary"} value={hourly ? (Number.isFinite(grossCents) ? (grossCents / 100).toFixed(2) : "") : form.gross} onChange={(e) => update({ gross: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Earning period start
          <input type="date" className={fieldClass} value={form.period_start} onChange={(e) => update({ period_start: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Earning period end
          <input type="date" className={fieldClass} value={form.period_end} onChange={(e) => update({ period_end: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Actual check issue date
          <input type="date" className={fieldClass} value={form.issue_date} onChange={(e) => update({ issue_date: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Memo (optional)
          <input className={fieldClass} value={form.memo} onChange={(e) => update({ memo: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          First check number on the Chase stock
          <input className={fieldClass} placeholder="26-395" value={form.stock_start_number} onChange={(e) => update({ stock_start_number: e.target.value })} />
        </label>
        <label className="text-xs text-slate-400">
          Year-to-date
          <select className={fieldClass} value={form.ytd_status} onChange={(e) => update({ ytd_status: e.target.value })}>
            <option value="UNAVAILABLE">Unavailable (print as unavailable)</option>
            <option value="VERIFIED_OPENING">Verified opening balance</option>
          </select>
        </label>
      </div>

      {hourly && <HourlyEarningsCalculator key={(employee?.id || 'hourly') + ':' + form.employee_name} initialRate={employee?.hourly_rate_cents || null} onChange={setHourlyInput} result={earnings.result} error={MESSAGES[earnings.error] || earnings.error}/>}

      {form.ytd_status === 'VERIFIED_OPENING' && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { key: 'ytd_gross', label: 'Opening YTD gross' },
            { key: 'ytd_deductions', label: 'Opening YTD deductions' },
            { key: 'ytd_net', label: 'Opening YTD net' },
          ].map((field) => (
            <label key={field.key} className="text-xs text-slate-400">
              {field.label}
              <input className={fieldClass} inputMode="decimal" value={form[field.key]} onChange={(e) => update({ [field.key]: e.target.value })} />
            </label>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-indigo-200"><input type="checkbox" checked={automaticTaxes} disabled={hourly} onChange={e=>setAutomaticTaxes(e.target.checked)}/>Automatically calculate 2026 payroll taxes</label>
      {automaticTaxes && <PayrollTaxCalculator key={calculatorKey} payPeriods={employee?.pay_periods || (hourly ? 26 : 12)} onChange={setTaxProfile} result={taxCalculation.result} error={taxCalculation.error}/>}
      <div className="space-y-2 rounded border border-slate-800 p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">Other deductions (post-tax, entered by you)</div>
          <button type="button" onClick={addDeduction} className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-indigo-400">
            <Plus className="h-3 w-3" /> Add deduction
          </button>
        </div>
        {deductions.length === 0 && <p className="text-[11px] text-slate-500">No deductions entered yet.</p>}
        {deductions.map((item, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]">
            <input className={fieldClass} placeholder="Code" value={item.code} onChange={(e) => updateDeduction(index, { code: e.target.value })} />
            <input className={fieldClass} placeholder="Label" value={item.label} onChange={(e) => updateDeduction(index, { label: e.target.value })} />
            <input className={fieldClass} inputMode="decimal" placeholder="0.00" value={item.amount} onChange={(e) => updateDeduction(index, { amount: e.target.value })} />
            <button type="button" onClick={() => removeDeduction(index)} className="rounded border border-slate-700 px-2 text-slate-400 hover:text-red-300" aria-label="Remove deduction">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="flex items-start gap-2 text-[11px] text-slate-400">
          <input type="checkbox" checked={noDeductions} onChange={(e) => setNoDeductions(e.target.checked)} className="mt-0.5" />
          I verified that no manual withholding applies (used only with automatic taxes off).
        </label>
      </div>

      <div className="grid gap-2 rounded border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300 sm:grid-cols-3">
        <div>Gross: <span className="font-mono text-slate-100">{Number.isFinite(grossCents) ? (grossCents / 100).toFixed(2) : '—'}</span></div>
        <div>Deductions: <span className="font-mono text-slate-100">{automaticTaxes && !taxCalculation.result ? 'Pending tax settings' : (deductionCents / 100).toFixed(2)}</span></div>
        <div>Tips already paid: <span className="font-mono text-slate-100">{(tipsPaid / 100).toFixed(2)}</span></div>
        <div>Net check: <span className="font-mono text-slate-100">{automaticTaxes && !taxCalculation.result ? 'Pending tax settings' : Number.isFinite(netCents) ? (netCents / 100).toFixed(2) : '—'}</span></div>
      </div>

      {netCents < 0 && <p role="alert" className="text-xs text-red-300">{MESSAGES.insufficient_cash_for_withholding}</p>}

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-200/80">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Bank: Chase, preprinted stock only. No routing or account numbers are collected, stored, logged or printed,
        and calculated withholding uses the selected 2026 employee settings. Tax deposits and filings are handled separately.
      </p>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded border border-red-500/40 bg-red-950/30 p-2 text-[11px] text-red-200">
          {errors.map((code) => <li key={code}>{MESSAGES[code] || code}</li>)}
        </ul>
      )}

      <button
        type="submit"
        disabled={saving || (hourly && !earnings.result) || (automaticTaxes && !taxCalculation.result) || netCents < 0}
        className="inline-flex items-center gap-2 rounded bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        <FilePlus2 className="h-4 w-4" />
        {saving ? 'Saving draft…' : 'Save draft'}
      </button>
    </form>
  );
}