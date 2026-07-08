import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertOctagon, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const TYPE_LABELS = {
  orphaned_payment_record: 'Orphaned Payment Record',
  orphaned_glyphbucks_order: 'Orphaned GB Order',
  orphaned_glyphbucks_batch: 'Orphaned GB Batch',
  amount_mismatch_payment_to_order: 'Amount: Payment→Order',
  amount_mismatch_order_to_batch: 'Amount: Order→Batch',
  bill_count_mismatch: 'Bill Count Mismatch',
  bill_face_value_mismatch: 'Bill Face Value Mismatch',
  duplicate_processor_reference: 'Duplicate Processor Ref',
  payment_record_stuck_pending: 'Payment Stuck Pending',
  unconfirmed_payment_record_with_bills: 'Unconfirmed Payment + Bills'
};

const SEV_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
};

const STATUS_STYLES = {
  open: 'bg-red-500/20 text-red-400',
  investigating: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-green-500/20 text-green-400',
  false_positive: 'bg-gray-500/20 text-gray-400'
};

export default function PaymentReconciliation() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runSummary, setRunSummary] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || '')).catch(() => {});
  }, []);

  const loadExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const query = {};
      if (filterStatus !== 'all') query.status = filterStatus;
      if (filterSeverity !== 'all') query.severity = filterSeverity;
      const data = await base44.entities.ReconciliationException.filter(query, '-detected_at', 200);
      setExceptions(data);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity]);

  useEffect(() => { loadExceptions(); }, [loadExceptions]);

  const runReconciliation = async () => {
    setRunning(true);
    setRunSummary(null);
    try {
      const res = await base44.functions.invoke('paymentReconciliationEngine', {});
      if (res?.data?.success) {
        setRunSummary(res.data);
        await loadExceptions();
      } else {
        setRunSummary({ error: res?.data?.error || 'Run failed' });
      }
    } catch (err) {
      setRunSummary({ error: err.message });
    } finally {
      setRunning(false);
    }
  };

  const resolveException = async (id, status) => {
    try {
      await base44.entities.ReconciliationException.update(id, {
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: userEmail || 'manual'
      });
      await loadExceptions();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const stats = {
    total: exceptions.length,
    critical: exceptions.filter(e => e.severity === 'critical').length,
    open: exceptions.filter(e => e.status === 'open').length,
    resolved: exceptions.filter(e => e.status === 'resolved' || e.status === 'false_positive').length
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payment Reconciliation</h1>
            <p className="text-sm text-white/60 mt-1">Exception detection across the payment chain</p>
          </div>
          <Button onClick={runReconciliation} disabled={running} size="lg" className="min-h-[44px]">
            <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running...' : 'Run Reconciliation'}
          </Button>
        </div>

        {runSummary && (
          <Card className="p-4 bg-white/5 border-white/10">
            {runSummary.error ? (
              <p className="text-red-400">Error: {runSummary.error}</p>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Venues: <strong>{runSummary.venues_checked}</strong></span>
                <span>Records: <strong>{Object.values(runSummary.records_checked || {}).reduce((a, b) => a + b, 0)}</strong></span>
                <span className="text-red-400">Exceptions: <strong>{runSummary.exceptions_created}</strong></span>
              </div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-white/60" />
              <div><p className="text-xs text-white/50">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-red-500/5 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div><p className="text-xs text-white/50">Critical</p><p className="text-xl font-bold text-red-400">{stats.critical}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-400" />
              <div><p className="text-xs text-white/50">Open</p><p className="text-xl font-bold text-yellow-400">{stats.open}</p></div>
            </div>
          </Card>
          <Card className="p-4 bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div><p className="text-xs text-white/50">Resolved</p><p className="text-xl font-bold text-green-400">{stats.resolved}</p></div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] min-h-[44px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[160px] min-h-[44px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/50">Loading exceptions...</div>
        ) : exceptions.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-medium">No exceptions found</p>
            <p className="text-sm text-white/50 mt-1">The payment chain is clean.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Severity</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Expected</th>
                  <th className="text-left p-3">Actual</th>
                  <th className="text-left p-3">Detected</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map(e => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-medium">{TYPE_LABELS[e.exception_type] || e.exception_type}</td>
                    <td className="p-3"><Badge className={SEV_STYLES[e.severity] || ''}>{e.severity}</Badge></td>
                    <td className="p-3 max-w-xs truncate">{e.description}</td>
                    <td className="p-3 text-white/70">{e.expected_value || '—'}</td>
                    <td className="p-3 text-white/70">{e.actual_value || '—'}</td>
                    <td className="p-3 text-white/50 text-xs">{e.detected_at ? new Date(e.detected_at).toLocaleString() : '—'}</td>
                    <td className="p-3"><Badge className={STATUS_STYLES[e.status] || ''}>{e.status}</Badge></td>
                    <td className="p-3">
                      {e.status === 'open' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => resolveException(e.id, 'resolved')} className="text-green-400 hover:text-green-300 min-h-[36px]">Resolve</Button>
                          <Button size="sm" variant="ghost" onClick={() => resolveException(e.id, 'false_positive')} className="text-white/50 hover:text-white/40 min-h-[36px]">False+</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}