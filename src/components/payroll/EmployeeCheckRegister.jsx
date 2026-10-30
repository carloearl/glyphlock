import React, { useState } from 'react';
import { Printer, CheckCircle2, Loader2 } from 'lucide-react';
import EmployeeCheckDocument from '@/components/payroll/EmployeeCheckDocument';
import { printNode, printNodes } from '@/lib/payroll/printCheck';
import { fmtCents, fmtDate, periodLabel, stampFor } from '@/lib/payroll/checkFormat';
import StockPrintSettings from './StockPrintSettings';
import { DEFAULT_STOCK_PROFILE, openStockPrint } from '@/lib/payroll/stockPrint';
import { reviewCheck } from '@/lib/payroll/payrollApi';

const STATUS_STYLES = {
  DRAFT: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  REVIEWED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  PAID: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  VOID: 'border-red-500/40 bg-red-500/10 text-red-200',
};

export default function EmployeeCheckRegister({ records = [], loading = false, scope = {}, onReviewed, onError }) {
  const [busyId, setBusyId] = useState(null);
  const [stockProfile, setStockProfile] = useState(() => structuredClone(DEFAULT_STOCK_PROFILE));
  const stockSettings = <StockPrintSettings profile={stockProfile} onChange={setStockProfile} onError={onError}/>;

  function handlePrint(record) {
    const result = printNode(`chk-${record.id}`, `Check #${record.check_number} · GlyphLock LLC`);
    if (!result.ok) {
      onError?.(result.reason === 'popup_blocked'
        ? 'Your browser blocked the print window. Allow pop-ups for this site, then print again.'
        : 'The check could not be rendered for printing.');
    }
  }

  function handlePrintAll() {
    const ids = records.map((record) => `chk-${record.id}`);
    const result = printNodes(ids, 'Employee checks · GlyphLock LLC');
    if (!result.ok) {
      onError?.(result.reason === 'popup_blocked'
        ? 'Your browser blocked the print window. Allow pop-ups for this site, then print again.'
        : 'No check could be rendered for printing.');
    }
  }

  async function handleReview(record) {
    const confirmed = window.confirm(
      `Review check #${record.check_number} for ${record.employee_name}?\n\n`
      + `Gross ${fmtCents(record.gross_cents)} · Deductions ${fmtCents(record.total_deductions_cents)} · Tips already paid ${fmtCents(record.tips_paid_cents || 0)} · Net check ${fmtCents(record.net_cents)}\n`
      + `Issue date ${fmtDate(record.issue_date)} · Period ${periodLabel(record)}\n\n`
      + 'You are confirming the deductions and totals you entered are correct. '
      + 'No check is signed, issued or paid by this action.',
    );
    if (!confirmed) return;
    setBusyId(record.id);
    try {
      await reviewCheck({ ...scope, check_id: record.id, confirm_totals: true });
      onReviewed?.();
    } catch (error) {
      onError?.(error?.message || 'Review failed.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading check drafts…
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="space-y-4">{stockSettings}<div className="rounded border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
        No employee check drafts yet. Prepare one above — nothing is issued, signed or paid automatically.
      </div></div>
    );
  }

  return (
    <div className="space-y-6">
      {stockSettings}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-400">
          {records.length} draft{records.length === 1 ? '' : 's'} in {scope.mode || 'REAL'} mode. Drafts print non-negotiable.
        </div>
        <button
          type="button"
          onClick={handlePrintAll}
          className="inline-flex items-center gap-2 rounded border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-400"
        >
          <Printer className="h-3.5 w-3.5" /> Print all copies ({records.length})
        </button>
      </div>

      {records.map((record) => {
        const stamp = stampFor(record);
        return (
          <div key={record.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 font-mono text-sm text-indigo-200">
                  #{record.check_number}
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-100">{record.employee_name}</div>
                  <div className="text-[11px] text-slate-400">
                    Period {periodLabel(record)} · Issue date {fmtDate(record.issue_date)}
                  </div>
                </div>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[record.status] || STATUS_STYLES.DRAFT}`}>
                  {record.status}
                </span>
                <span className={`text-[10px] uppercase tracking-wide ${stamp.negotiable ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {stamp.label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {record.status === "REVIEWED" && scope.mode === "REAL" && <button type="button" disabled={!stockProfile.alignment_confirmed} onClick={()=>{try{openStockPrint(record,stockProfile);}catch(e){onError?.(e.message);}}} className="rounded border border-emerald-400 px-3 py-2 text-xs disabled:opacity-40">Print on Chase stock</button>}
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Net</div>
                  <div className="font-mono text-sm font-bold text-emerald-300">{fmtCents(record.net_cents)}</div>
                </div>
                {record.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => handleReview(record)}
                    disabled={busyId === record.id}
                    className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    {busyId === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Confirm review
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePrint(record)}
                  className="inline-flex items-center gap-1.5 rounded bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-400"
                >
                  <Printer className="h-3.5 w-3.5" /> Print copy
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <EmployeeCheckDocument record={record} printId={`chk-${record.id}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}