import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import ExceptionMetrics from '@/components/reconciliation/ExceptionMetrics';
import ExceptionFilters from '@/components/reconciliation/ExceptionFilters';
import ExceptionTable from '@/components/reconciliation/ExceptionTable';
import ExceptionDetailDrawer from '@/components/reconciliation/ExceptionDetailDrawer';

export default function PaymentReconciliation() {
  const [exceptions, setExceptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [runSummary, setRunSummary] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', severity: 'all', type: 'all', venue: 'all', mode: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [venues, setVenues] = useState([]);

  const loadMetrics = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('reconciliationExceptionWorkflow', { action: 'get_metrics' });
      if (res?.data?.success) setMetrics(res.data.metrics);
    } catch (err) { console.error('Metrics failed:', err); }
  }, []);

  const loadExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const query = {};
      if (filters.status !== 'all') query.status = filters.status;
      if (filters.severity !== 'all') query.severity = filters.severity;
      if (filters.type !== 'all') query.exception_type = filters.type;
      if (filters.venue !== 'all') query.venue_id = filters.venue;
      if (filters.mode !== 'all') query.mode = filters.mode;
      const data = await base44.entities.ReconciliationException.filter(query, '-detected_at', 200);
      setExceptions(data);
    } catch (err) { console.error('Load failed:', err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    (async () => {
      try { const v = await base44.entities.Venue.list(null, 50); setVenues((v || []).map(x => x.venue_id).filter(Boolean)); } catch (_) { /* Intentionally ignored: best-effort operation. */ }
    })();
    loadExceptions();
    loadMetrics();
  }, []);

  useEffect(() => { loadExceptions(); }, [loadExceptions]);

  const filteredExceptions = exceptions.filter(e => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return [e.exception_id, e.entity_id, e.description, e.venue_id, e.expected_value, e.actual_value, e.assigned_to]
      .filter(Boolean).some(v => v.toLowerCase().includes(s));
  });

  const runReconciliation = async () => {
    setRunning(true); setRunSummary(null);
    try {
      const res = await base44.functions.invoke('paymentReconciliationEngine', {});
      if (res?.data?.success) {
        setRunSummary(res.data);
        await loadExceptions();
        await loadMetrics();
      } else { setRunSummary({ error: res?.data?.error || 'Run failed' }); }
    } catch (err) { setRunSummary({ error: err.message }); }
    finally { setRunning(false); }
  };

  const autoEscalate = async () => {
    setEscalating(true);
    try {
      const res = await base44.functions.invoke('reconciliationExceptionWorkflow', { action: 'auto_escalate' });
      if (res?.data?.success) {
        await loadExceptions();
        await loadMetrics();
        setRunSummary(prev => ({ ...prev, escalated: res.data.escalated, notified: res.data.notified }));
      }
    } catch (err) { console.error('Escalate failed:', err); }
    finally { setEscalating(false); }
  };

  const handleRowClick = (exc) => { setSelected(exc); setDrawerOpen(true); };

  const handleDrawerUpdate = async () => {
    await loadExceptions();
    await loadMetrics();
    if (selected) {
      const updated = (await base44.entities.ReconciliationException.filter({ id: selected.id }, null, 1))[0];
      if (updated) setSelected(updated);
    }
  };

  const exportCSV = () => {
    const headers = ['Exception ID', 'Venue', 'Type', 'Severity', 'Status', 'Detected', 'Assigned To', 'Mode', 'Description'];
    const rows = filteredExceptions.map(e => [e.exception_id, e.venue_id, e.exception_type, e.severity, e.status, e.detected_at, e.assigned_to || '', e.mode, (e.description || '').replace(/"/g, '""')]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reconciliation_exceptions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payment Reconciliation</h1>
            <p className="text-sm text-white/60 mt-1">W3-010 Exception Queue · Read-only detection · No financial mutation</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={autoEscalate} disabled={escalating} variant="outline" size="lg" className="min-h-[44px] border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <ShieldAlert className={`w-4 h-4 mr-2 ${escalating ? 'animate-pulse' : ''}`} />
              {escalating ? 'Escalating...' : 'Auto-Escalate'}
            </Button>
            <Button onClick={runReconciliation} disabled={running} size="lg" className="min-h-[44px]">
              <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Running...' : 'Run Reconciliation'}
            </Button>
          </div>
        </div>

        {runSummary && !runSummary.error && (
          <div className="flex flex-wrap gap-4 text-sm p-3 rounded-lg bg-white/5 border border-white/10">
            {runSummary.venues_checked != null && <span>Venues: <strong>{runSummary.venues_checked}</strong></span>}
            {runSummary.exceptions_created != null && <span className="text-red-400">New Exceptions: <strong>{runSummary.exceptions_created}</strong></span>}
            {runSummary.escalated != null && <span className="text-orange-400">Auto-Escalated: <strong>{runSummary.escalated}</strong></span>}
            {runSummary.notified != null && <span className="text-blue-400">Notified: <strong>{runSummary.notified}</strong></span>}
          </div>
        )}
        {runSummary?.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">Error: {runSummary.error}</div>
        )}

        <ExceptionMetrics metrics={metrics || {
          total: exceptions.length,
          open: exceptions.filter(e => !['RESOLVED','FALSE_POSITIVE','ARCHIVED'].includes(e.status)).length,
          critical: exceptions.filter(e => e.severity === 'critical' && !['RESOLVED','FALSE_POSITIVE','ARCHIVED'].includes(e.status)).length,
          escalated: exceptions.filter(e => e.escalated).length,
          by_venue: {}, by_type: {}
        }} />

        <ExceptionFilters
          filters={filters} setFilters={setFilters}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          onExport={exportCSV} venues={venues}
        />

        <ExceptionTable
          exceptions={filteredExceptions} loading={loading}
          onRowClick={handleRowClick}
        />

        <ExceptionDetailDrawer
          exception={selected}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onUpdate={handleDrawerUpdate}
        />
      </div>
    </div>
  );
}