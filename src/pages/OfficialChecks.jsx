import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { getActiveMode } from '@/lib/nups/modeResolver';
import EmployeePayrollForm from '@/components/payroll/EmployeePayrollForm';
import EmployeeCheckRegister from '@/components/payroll/EmployeeCheckRegister';
import { listChecks } from '@/lib/payroll/payrollApi';

/**
 * Employee payroll / check preparation.
 *
 * Replaces the previous entertainer-contractor check view: no fixed tax
 * percentages, no index-derived check numbers, no fabricated YTD, no period-end
 * pay date. Reads and writes go through the employeePayrollCheck function, which
 * enforces owner/admin authorization and tenant + REAL/DEMO scope server-side.
 */
export default function OfficialChecks() {
  const venue = useActiveVenue();
  const [mode, setMode] = useState('REAL');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const scope = { venue_id: venue?.id, mode };
  const scopeKey = `${venue?.id || 'none'}:${mode}`;

  useEffect(() => {
    let cancelled = false;
    getActiveMode(venue?.id)
      .then((active) => {
        if (cancelled) return;
        if (String(active).toUpperCase() === 'DEMO') setMode('DEMO');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [venue?.id]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await listChecks({ venue_id: venue?.id, mode });
      setRecords(data.records || []);
    } catch (err) {
      setRecords([]);
      setError(
        err?.code === 'owner_or_admin_required'
          ? 'Only an owner or admin account can prepare employee checks.'
          : err?.code === 'venue_scope_required' || err?.code === 'venue_id_required'
            ? 'Select an active venue before preparing employee checks.'
            : err?.code === 'mode_scope_blocked'
              ? 'This account is not permitted to prepare checks in that mode.'
              : err?.message || 'Could not load employee check drafts.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [scopeKey]);

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-50">Employee Payroll — Check Preparation</h2>
          <p className="text-xs text-slate-400">
            W-2 employee checks on Chase preprinted stock. Nothing is signed, issued, transferred or paid from this screen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-wide text-slate-500">
            Ledger
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="ml-2 rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-200"
            >
              <option value="REAL">REAL</option>
              <option value="DEMO">DEMO</option>
            </select>
          </label>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-400"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] leading-relaxed text-amber-100/80">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Automatic withholding uses the employee’s verified 2026 W-4/A-4 settings and prior taxable wages.
          Review each calculation before printing; manual deductions remain available for payroll handled separately. Bank routing and account numbers are never collected, stored, logged or printed; the
          bank line reads Chase and the check is printed on preprinted stock. Drafts are non-negotiable until reviewed,
          and every check prints unsigned: no signature is generated.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <EmployeePayrollForm
        scope={scope}
        onCreated={() => { load(); }}
      />

      <EmployeeCheckRegister
        records={records}
        loading={loading}
        scope={scope}
        onReviewed={load}
        onError={(message) => setError(message)}
      />
    </div>
  );
}