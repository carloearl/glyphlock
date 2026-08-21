/**
 * DACO-20260611 — Driver Payout History Dashboard
 *
 * Audit-grade table of every DriverPayout disbursement.
 * Filters: date range, driver, venue, status, mode.
 * Per-row expansion shows linked ActivityLog PAYOUT_TOGGLE events (before/after).
 * Export: BPAAA-compliance PDF via exportPayoutAuditPdf backend function.
 */

import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { writeEntity } from '@/lib/nups/writeEntity';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Truck, Filter, Download, RefreshCw, ChevronRight, ChevronDown,
  ShieldAlert, CheckCircle2, Clock, FileText, AlertTriangle, Trash2,
} from 'lucide-react';
import { hasOwnerPreview } from '@/lib/nups/previewBypass';
import DriverPayoutStatusToggle from '@/components/nups/DriverPayoutStatusToggle';
import BulkPayoutProcessor from '@/components/nups/BulkPayoutProcessor';
import { Checkbox } from '@/components/ui/checkbox';

const MANAGER_ROLES = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

// Pull the POS Batch reference out of the payout's notes blob.
// DriverDropOffTracker stamps "Batch ABC123" (or "batch_id=...") on disbursement.
function extractBatchRef(payout) {
  const src = `${payout?.notes || ''} ${payout?.payment_reference || ''}`;
  const m = src.match(/batch(?:[\s_:=#-]+)([A-Za-z0-9-]{4,})/i);
  return m ? m[1].toUpperCase() : null;
}

function fmtShort(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return '—'; }
}

function PayoutRow({ payout, logs, currentUser, onUpdated, onDelete, deleting, expanded, onToggleExpand, isSelected, onToggleSelect, runningTotal }) {
  const status = payout.payout_status || 'PENDING';
  const linked = logs.filter(l => l.entity_affected === `DriverPayout:${payout.id}`);
  const isPending = status === 'PENDING';
  const batchRef = extractBatchRef(payout);
  const handshakeTs = payout.paid_at || payout.processed_at;

  return (
    <>
      <tr className={`border-t border-slate-800 hover:bg-slate-800/30 ${isSelected ? 'bg-violet-500/5' : ''}`}>
        <td className="p-3">
          {isPending ? (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="border-violet-500/50 data-[state=checked]:bg-violet-500"
              aria-label={`Select payout for ${payout.driver_name}`}
            />
          ) : (
            <span className="inline-block w-4" />
          )}
        </td>
        <td className="p-3">
          <button onClick={onToggleExpand} className="text-slate-400 hover:text-white">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="p-3 text-xs text-slate-400 font-mono">{payout.session_date || '—'}</td>
        <td className="p-3 text-white font-medium">{payout.driver_name || '—'}</td>
        <td className="p-3 text-xs text-slate-400">{payout.driver_number || '—'}</td>
        <td className="p-3 text-xs text-slate-400">{payout.venue_id || '—'}</td>
        <td className="p-3 text-center text-slate-300">{payout.total_drops || 0}</td>
        <td className="p-3 text-center text-purple-300">{payout.vip_count || 0}</td>
        <td className="p-3 text-right font-bold text-emerald-300">{money(payout.total_payout)}</td>
        <td className="p-3 text-right text-cyan-300 font-mono text-xs">{money(runningTotal)}</td>
        <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
          {handshakeTs ? fmtShort(handshakeTs) : <span className="text-slate-600">—</span>}
        </td>
        <td className="p-3 text-xs">
          {batchRef
            ? <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-300 font-mono">{batchRef}</Badge>
            : <span className="text-slate-600">—</span>}
        </td>
        <td className="p-3">
          <DriverPayoutStatusToggle payout={payout} currentUser={currentUser} onUpdated={onUpdated} />
        </td>
        <td className="p-3 text-xs text-slate-500">
          {linked.length > 0 ? <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{linked.length} event{linked.length !== 1 ? 's' : ''}</Badge> : '—'}
        </td>
        <td className="p-3">
          <button
            onClick={() => onDelete(payout)}
            disabled={deleting}
            title="Delete this payout record"
            className="text-slate-600 hover:text-red-400 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-900/50">
          <td colSpan={15} className="p-4 border-t border-slate-800">
            {/* Handshake block — Doorman headcount lock → Door Girl cash disbursement */}
            <div className="mb-4 grid sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="text-[10px] text-amber-400 uppercase tracking-wide font-bold mb-1">① Headcount Confirmed</div>
                <div className="text-white font-medium">{payout.paid_by || payout.processed_by || '—'}</div>
                <div className="text-slate-400 mt-1">{payout.paid_at ? new Date(payout.paid_at).toLocaleString() : '—'}</div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wide font-bold mb-1">② Cash Disbursed</div>
                <div className="text-white font-medium">{payout.processed_by || '—'}</div>
                <div className="text-slate-400 mt-1">{payout.processed_at ? new Date(payout.processed_at).toLocaleString() : '—'}</div>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                <div className="text-[10px] text-cyan-400 uppercase tracking-wide font-bold mb-1">③ POS Batch Link</div>
                <div className="text-white font-mono">{batchRef || 'Unlinked'}</div>
                <div className="text-slate-400 mt-1">{batchRef ? 'Reconciles with door register batch' : 'Pre-batch-linkage record'}</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-300 uppercase tracking-wide">Payout breakdown</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
                  <span>Base payout</span><span className="text-white">{money(payout.base_payout)}</span>
                  <span>Incentive bonus</span><span className="text-white">{money(payout.incentive_bonus)}</span>
                  <span>VIP kickback</span><span className="text-white">{money(payout.vip_kickback)}</span>
                  <span>Total</span><span className="text-emerald-300 font-bold">{money(payout.total_payout)}</span>
                  <span>Pass count</span><span className="text-white">{payout.pass_count || 0}</span>
                  <span>Driver code</span><span className="text-white font-mono">{payout.driver_code || '—'}</span>
                  <span>Processed by</span><span className="text-white">{payout.processed_by || '—'}</span>
                  <span>Processed at</span><span className="text-white">{payout.processed_at ? new Date(payout.processed_at).toLocaleString() : '—'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-slate-300 uppercase tracking-wide">Audit trail (PAYOUT_TOGGLE)</div>
                {linked.length === 0 && <div className="text-slate-500 italic">No toggle events recorded.</div>}
                {linked.map(ev => (
                  <div key={ev.id} className="bg-slate-800/50 rounded p-2 border border-slate-700/50 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}</span>
                      <span className="text-cyan-300">{ev.user_email}</span>
                    </div>
                    <div className="font-mono text-[10px] text-amber-300">BEFORE: {JSON.stringify(ev.before_value || {})}</div>
                    <div className="font-mono text-[10px] text-emerald-300">AFTER:  {JSON.stringify(ev.after_value || {})}</div>
                    {ev.notes && <div className="text-[10px] text-slate-500">{ev.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
            {payout.drop_offs && payout.drop_offs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="font-bold text-slate-300 uppercase tracking-wide text-xs mb-2">Drop-offs ({payout.drop_offs.length})</div>
                <div className="flex flex-wrap gap-2">
                  {payout.drop_offs.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                      {d.guest_name || `Guest #${i + 1}`}{d.went_vip ? ' · VIP' : ''}{d.has_pass ? ' · PASS' : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function DriverPayoutHistory({ embedded = false }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    date_from: monthAgo,
    date_to: today,
    driver: '',
    venue_id: 'ALL',
    status: 'ALL',
  });
  const [expanded, setExpanded] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: user, isError: meError } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const role = user?._highestRole || user?.role || 'External';
  // Honor the same owner preview the route guards honor — otherwise the
  // history panel silently vanished for preview sessions (audit 2026-07-20).
  const preview = hasOwnerPreview();
  const isManager = preview || (user && MANAGER_ROLES.includes(role));

  const { data: payouts = [], isLoading, refetch } = useQuery({
    queryKey: ['payout-history'],
    queryFn: () => base44.entities.DriverPayout.list('-session_date', 1000),
    enabled: !!isManager,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['payout-history-logs'],
    queryFn: async () => {
      const all = await base44.entities.ActivityLog.list('-timestamp', 1000);
      return all.filter(l => l.action_type === 'PAYOUT_TOGGLE');
    },
    enabled: !!isManager,
  });

  const venueOptions = useMemo(() => {
    const set = new Set(payouts.map(p => p.venue_id).filter(Boolean));
    return Array.from(set);
  }, [payouts]);

  const filtered = useMemo(() => {
    return payouts.filter(p => {
      if (filters.date_from && (p.session_date || '') < filters.date_from) return false;
      if (filters.date_to && (p.session_date || '') > filters.date_to) return false;
      if (filters.driver && !(p.driver_name || '').toLowerCase().includes(filters.driver.toLowerCase()) && !(p.driver_number || '').includes(filters.driver)) return false;
      if (filters.venue_id !== 'ALL' && p.venue_id !== filters.venue_id) return false;
      if (filters.status !== 'ALL' && (p.payout_status || 'PENDING') !== filters.status) return false;
      return true;
    });
  }, [payouts, filters]);

  const totals = useMemo(() => {
    const processed = filtered.filter(p => (p.payout_status || 'PENDING') === 'PROCESSED');
    const pending = filtered.filter(p => (p.payout_status || 'PENDING') === 'PENDING');
    return {
      count: filtered.length,
      processed_count: processed.length,
      processed_amt: processed.reduce((s, p) => s + (Number(p.total_payout) || 0), 0),
      pending_count: pending.length,
      pending_amt: pending.reduce((s, p) => s + (Number(p.total_payout) || 0), 0),
      drops: filtered.reduce((s, p) => s + (Number(p.total_drops) || 0), 0),
      vip: filtered.reduce((s, p) => s + (Number(p.vip_count) || 0), 0),
    };
  }, [filtered]);

  // Compute a running disbursement total per row (oldest → newest within current filter).
  // Map keyed by payout id so display can stay sorted newest-first without re-sorting.
  const runningById = useMemo(() => {
    const asc = [...filtered].sort((a, b) => {
      const da = (a.session_date || '') + (a.processed_at || a.paid_at || a.created_date || '');
      const db = (b.session_date || '') + (b.processed_at || b.paid_at || b.created_date || '');
      return da.localeCompare(db);
    });
    const map = {};
    let run = 0;
    asc.forEach(p => { run += Number(p.total_payout) || 0; map[p.id] = run; });
    return map;
  }, [filtered]);

  const handleDelete = async (payout) => {
    const label = `${payout.driver_name || 'this driver'} · ${money(payout.total_payout)} · ${payout.session_date || 'no date'}`;
    if (!window.confirm(`Permanently delete this payout record?\n\n${label}\n\nThis cannot be undone.`)) return;
    setDeletingId(payout.id);
    try {
      const write = await writeEntity({
        entity: 'DriverPayout',
        operation: 'delete',
        id: payout.id,
        data: { venue_id: payout.venue_id || null },
        actor: { email: user?.email, id: user?.id, role },
        venue_id: payout.venue_id || null,
        intent: 'DRIVER_PAYOUT_HISTORY_DELETE',
      });
      if (!write?.ok) throw new Error(write?.block_reason || 'Driver payout delete was rejected.');
      setSelectedIds(prev => { const next = new Set(prev); next.delete(payout.id); return next; });
      await refetch();
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    setExportErr(null);
    try {
      const res = await base44.functions.invoke('exportPayoutAuditPdf', {
        payout_ids: filtered.map(p => p.id),
        filters,
        venue_id: filters.venue_id === 'ALL' ? null : filters.venue_id,
      }, { responseType: 'blob' });

      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payout-audit-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportErr(e?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (!user && !preview) {
    // Kiosk operators have no platform login — hide the manager-only
    // history section instead of spinning forever.
    if (embedded && meError) return null;
    return (
      <div className={`${embedded ? "py-10" : "min-h-screen p-6"} bg-slate-950 text-white flex items-center justify-center`}>
        <RefreshCw className="w-5 h-5 text-slate-500 animate-spin mr-2" /> Loading history…
      </div>
    );
  }

  if (!isManager) {
    // Embedded on a page the operator can already see — hide silently
    // instead of stacking a second full-screen access wall.
    if (embedded) return null;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-900 border-red-500/30">
          <CardContent className="p-8 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold">Manager Access Required</h2>
            <p className="text-slate-400 text-sm">Payout history is restricted to Manager-tier roles. Your role: <b>{role}</b></p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${embedded ? "" : "min-h-screen p-6"} bg-slate-950 text-white`}>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-6 h-6 text-pink-400" />
              Driver Payout History
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Disbursement ledger · {totals.count} records · BPAAA v3.0 audit-grade
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm" className="border-slate-700">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button onClick={handleExportPdf} disabled={exporting || filtered.length === 0} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
              <FileText className="w-4 h-4 mr-1" /> {exporting ? 'Generating…' : 'Export PDF'}
            </Button>
          </div>
        </div>

        {exportErr && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {exportErr}
          </div>
        )}

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Records</p>
            <p className="text-xl font-bold text-white mt-1">{totals.count}</p>
            <p className="text-[10px] text-slate-500">{totals.drops} drops · {totals.vip} VIP</p>
          </div>
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-[10px] text-emerald-400 uppercase tracking-wide flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Processed</p>
            <p className="text-xl font-bold text-emerald-300 mt-1">{money(totals.processed_amt)}</p>
            <p className="text-[10px] text-emerald-400/70">{totals.processed_count} payout{totals.processed_count !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <p className="text-[10px] text-amber-400 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</p>
            <p className="text-xl font-bold text-amber-300 mt-1">{money(totals.pending_amt)}</p>
            <p className="text-[10px] text-amber-400/70">{totals.pending_count} payout{totals.pending_count !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/40">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total disbursed</p>
            <p className="text-xl font-bold text-purple-300 mt-1">{money(totals.processed_amt + totals.pending_amt)}</p>
            <p className="text-[10px] text-slate-500">All statuses combined</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-400">From</label>
              <Input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400">To</label>
              <Input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Driver</label>
              <Input placeholder="name or #" value={filters.driver} onChange={e => setFilters(f => ({ ...f, driver: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Venue</label>
              <Select value={filters.venue_id} onValueChange={v => setFilters(f => ({ ...f, venue_id: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All venues</SelectItem>
                  {venueOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Status</label>
              <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="w-8 p-3">
                    <Checkbox
                      checked={
                        filtered.filter(p => (p.payout_status || 'PENDING') === 'PENDING').length > 0 &&
                        filtered.filter(p => (p.payout_status || 'PENDING') === 'PENDING').every(p => selectedIds.has(p.id))
                      }
                      onCheckedChange={(checked) => {
                        const pendingIds = filtered.filter(p => (p.payout_status || 'PENDING') === 'PENDING').map(p => p.id);
                        if (checked) setSelectedIds(prev => new Set([...prev, ...pendingIds]));
                        else setSelectedIds(prev => {
                          const next = new Set(prev);
                          pendingIds.forEach(id => next.delete(id));
                          return next;
                        });
                      }}
                      className="border-violet-500/50 data-[state=checked]:bg-violet-500"
                      aria-label="Select all pending"
                    />
                  </th>
                  <th className="w-8 p-3"></th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Driver</th>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Venue</th>
                  <th className="text-center p-3">Drops</th>
                  <th className="text-center p-3">VIP</th>
                  <th className="text-right p-3">Payout</th>
                  <th className="text-right p-3" title="Cumulative disbursed across rows in this filter, oldest → newest">Running</th>
                  <th className="text-left p-3" title="Handshake timestamp: Doorman confirms headcount → Door Girl disburses cash">Paid</th>
                  <th className="text-left p-3" title="POS Batch the payout is reconciled against">Batch</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Audit</th>
                  <th className="w-8 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={15} className="p-8 text-center text-slate-500">Loading…</td></tr>}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={15} className="p-8 text-center text-slate-500">No matching records.</td></tr>
                )}
                {filtered.map(p => (
                  <PayoutRow
                    key={p.id}
                    payout={p}
                    logs={logs}
                    currentUser={user}
                    expanded={!!expanded[p.id]}
                    onToggleExpand={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))}
                    onUpdated={() => refetch()}
                    onDelete={handleDelete}
                    deleting={deletingId === p.id}
                    runningTotal={runningById[p.id] || 0}
                    isSelected={selectedIds.has(p.id)}
                    onToggleSelect={(checked) => {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        if (checked) next.add(p.id); else next.delete(p.id);
                        return next;
                      });
                    }}
                  />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-[10px] text-slate-600 text-center pb-2">
          Disbursement ledger · Driver payouts are money OUT — never deducted from <code>total_sales</code>. BPAAA v3.0.
        </p>
      </div>

      {/* Pinned bottom summary — disbursement totals always visible.
          Not sticky when embedded — a floating bar inside another page overlaps content. */}
      <div className={`${embedded ? "" : "sticky bottom-0 z-30 backdrop-blur-md"} border-t border-slate-800 bg-slate-950/95 px-6 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Records</span>
              <p className="font-mono font-bold text-white">{totals.count}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Processed</span>
              <p className="font-mono font-bold text-emerald-300">{money(totals.processed_amt)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Pending</span>
              <p className="font-mono font-bold text-amber-300">{money(totals.pending_amt)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Disbursed</span>
            <p className="font-mono font-black text-lg text-purple-300">{money(totals.processed_amt + totals.pending_amt)}</p>
          </div>
        </div>
      </div>

      <BulkPayoutProcessor
        selectedPayouts={filtered.filter(p => selectedIds.has(p.id))}
        currentUser={user}
        onClear={() => setSelectedIds(new Set())}
        onComplete={() => { setSelectedIds(new Set()); refetch(); }}
      />
    </div>
  );
}