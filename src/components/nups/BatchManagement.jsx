import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, XCircle, CheckCircle2, AlertCircle, RefreshCw, Save, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import ManagerOverrideModal from "./ManagerOverrideModal";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode, stampOperationalRecord, markTrainingStep } from "@/lib/nups/operatingMode";
import { writeEntity } from "@/lib/nups/writeEntity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BatchManagement({ user, onBatchClosed }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState("");
  const [isOpeningBatch, setIsOpeningBatch] = useState(false);
  const [isClosingBatch, setIsClosingBatch] = useState(false);

  // Manager Override state
  const [overrideAction, setOverrideAction] = useState(null); // null | 'reset' | 'backup' | 'restore'
  const [pendingRestore, setPendingRestore] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmBackup, setConfirmBackup] = useState(false);
  const [showRestoreList, setShowRestoreList] = useState(false);

  const cashierKey = user?.email || user?.id || 'unknown';
  const modeQueryKey = [modeState.ledgerMode, modeState.operatingMode, modeState.trainingSession?.id || null];

  const { data: activeBatch } = useQuery({
    queryKey: ['active-batch', venueId, ...modeQueryKey],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.filter({ status: 'open' }, '-created_date', 100);
      const scoped = scopeRowsToOperatingMode(batches, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: 'transactional',
      });
      return scoped[0] ?? null;
    },
  });

  // Backups stored in SystemAuditLog with event_type BATCH_BACKUP
  const { data: batchBackups = [], refetch: refetchBackups } = useQuery({
    queryKey: ['batch-backups', activeBatch?.id],
    queryFn: () => base44.entities.SystemAuditLog.filter({ event_type: 'BATCH_BACKUP' }),
    enabled: !!activeBatch,
    staleTime: 30000,
  });

  const relevantBackups = batchBackups
    .filter(b => b.metadata?.batch_id === activeBatch?.id)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const { data: batchTransactions = [] } = useQuery({
    queryKey: ['batch-transactions', activeBatch?.id, ...modeQueryKey],
    queryFn: async () => {
      if (!activeBatch) return [];
      const allTransactions = await base44.entities.POSTransaction.list('-created_date', 2000);
      const scoped = scopeRowsToOperatingMode(allTransactions, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: 'transactional',
      });
      return scoped.filter(t => {
        if (t.status === 'refunded' || t.status === 'void') return false;
        if (t.batch_id) return t.batch_id === activeBatch.id;
        const start = new Date(activeBatch.start_time);
        const end = activeBatch.end_time ? new Date(activeBatch.end_time) : new Date();
        return new Date(t.created_date) >= start && new Date(t.created_date) <= end;
      });
    },
    enabled: !!activeBatch,
  });

  // ✅ REAL-TIME SYNC: Subscribe to transaction changes
  useEffect(() => {
    if (!activeBatch) return;
    const unsubscribe = base44.entities.POSTransaction.subscribe((event) => {
      // When any transaction is created/updated, refresh batch transactions
      queryClient.invalidateQueries({ queryKey: ['batch-transactions', activeBatch.id] });
    });
    return unsubscribe;
  }, [activeBatch?.id, queryClient]);

  const writeBatch = async ({ operation, id = null, data }) => {
    let liveActor = null;
    try { liveActor = await base44.auth.me(); } catch (_) { /* kiosk/admin shell may carry user */ }
    const result = await writeEntity({
      entity: 'POSBatch',
      operation,
      recordId: id,
      data,
      actor: {
        email: liveActor?.email || user?.email,
        id: liveActor?.id || user?.id,
        role: user?._highestRole || user?.role || liveActor?._highestRole || liveActor?.role || 'External',
      },
      venue_id: venueId,
      intent: `${modeState.operatingMode}_BATCH_${operation.toUpperCase()}`,
      requestContext: {
        mode: modeState.ledgerMode,
        validation_run: modeState.isNonLive,
        session_id: modeState.trainingSession?.id || null,
      },
    });
    if (!result?.ok) throw new Error(result?.block_reason || `Batch ${operation} rejected.`);
    return result.value || data;
  };

  const openBatchMutation = useMutation({
    mutationFn: (data) => writeBatch({ operation: 'create', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-batch'] });
      setOpeningCash('');
      setNotes("");
      if (modeState.isTraining) markTrainingStep(venueId, 'batch-opened');
    },
  });

  const closeBatchMutation = useMutation({
    mutationFn: ({ id, data }) => writeBatch({ operation: 'update', id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-batch'] });
      queryClient.invalidateQueries({ queryKey: ['batch-transactions'] });
      setShowCloseDialog(false);
      setClosingCash('');
      setNotes("");
      if (modeState.isTraining) markTrainingStep(venueId, 'batch-closed');
      onBatchClosed?.();
    },
  });

  // ─── RESET (manager override required) ───────────────────────────────────────
  const handleResetConfirmed = async (manager) => {
    if (!activeBatch) return;
    if (modeState.isLive) {
      setOverrideAction(null);
      setConfirmReset(false);
      toast({
        title: 'Live reset blocked',
        description: 'Live financial records are append-only. Close and reconcile the batch, then issue documented refunds or corrections.',
        variant: 'destructive',
      });
      return;
    }

    const BATCH_CARD_WHITELIST = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];
    const currentTxns = batchTransactions;
    const cashTotal = currentTxns.filter(t => t.payment_method === 'Cash').reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
    const cardTotal = currentTxns.filter(t => BATCH_CARD_WHITELIST.includes(t.payment_method)).reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
    const batchTotal = cashTotal + cardTotal;
    const managerName = manager.full_name || manager.username || 'manager';
    const resetAt = new Date().toISOString();

    setOverrideAction(null);
    setConfirmReset(false);
    setOpeningCash('');
    setClosingCash('');
    setNotes('');

    await base44.entities.SystemAuditLog.create({
      event_type: 'BATCH_BACKUP',
      description: `AUTO-BACKUP before non-live reset by ${managerName}`,
      actor_email: manager.username || user?.email || 'unknown',
      venue_id: venueId,
      status: 'success',
      severity: 'medium',
      metadata: {
        mode: modeState.ledgerMode,
        operating_mode: modeState.operatingMode,
        batch_id: activeBatch.id,
        backed_up_at: resetAt,
        backed_up_by: managerName,
        auto_backup: true,
        snapshot: {
          opening_cash: activeBatch.opening_cash,
          total_sales: activeBatch.total_sales,
          transaction_count: activeBatch.transaction_count,
          discrepancy: activeBatch.discrepancy,
          cashTotal,
          cardTotal,
          batchTotal,
          notes: activeBatch.notes,
          start_time: activeBatch.start_time,
          status: activeBatch.status,
          transaction_ids: currentTxns.map(t => t.id),
        },
      },
    });

    // Non-live resets preserve history. Rows are voided instead of deleted so
    // training and demo actions remain auditable and recoverable.
    for (const transaction of currentTxns) {
      const result = await writeEntity({
        entity: 'POSTransaction',
        operation: 'update',
        recordId: transaction.id,
        data: {
          ...transaction,
          status: 'void',
          funds_settled: false,
          notes: `${transaction.notes || ''}${transaction.notes ? ' · ' : ''}VOIDED by ${managerName} during ${modeState.operatingMode} batch reset at ${resetAt}`,
        },
        actor: {
          email: user?.email || manager.username,
          id: user?.id || manager.id,
          role: user?._highestRole || user?.role || manager.role || 'VENUE_MANAGER',
        },
        venue_id: venueId,
        intent: `${modeState.operatingMode}_BATCH_RESET_VOID`,
        requestContext: { mode: modeState.ledgerMode, validation_run: true, session_id: modeState.trainingSession?.id || null },
      });
      if (!result?.ok) throw new Error(result?.block_reason || `Could not void ${transaction.transaction_id || transaction.id}`);
    }

    await writeBatch({
      operation: 'update',
      id: activeBatch.id,
      data: {
        ...activeBatch,
        total_sales: 0,
        transaction_count: 0,
        discrepancy: 0,
        opening_cash: 0,
        notes: `NON-LIVE RESET by ${managerName} at ${resetAt}`,
      },
    });

    await base44.entities.SystemAuditLog.create({
      event_type: 'BATCH_RESET',
      description: `${modeState.operatingMode} batch ${activeBatch.batch_id} reset. ${currentTxns.length} transactions preserved as void records.`,
      actor_email: manager.username || user?.email || 'unknown',
      venue_id: venueId,
      status: 'security_action',
      severity: 'medium',
      metadata: {
        mode: modeState.ledgerMode,
        operating_mode: modeState.operatingMode,
        batch_id: activeBatch.id,
        voided_tx_count: currentTxns.length,
      },
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['active-batch'] }),
      queryClient.invalidateQueries({ queryKey: ['batch-transactions'] }),
    ]);
    toast({ title: 'Non-live batch reset', description: `${currentTxns.length} transactions were voided and preserved. No live records were touched.` });
  };

  // ─── BACKUP ───────────────────────────────────────────────────────────────────
  const handleBackupConfirmed = async (manager) => {
    setOverrideAction(null);
    setConfirmBackup(false);
    if (!activeBatch) return;
    const BATCH_CARD_WHITELIST = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];
    const cashTotal = batchTransactions.filter(t => t.payment_method === 'Cash').reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
    const cardTotal = batchTransactions.filter(t => BATCH_CARD_WHITELIST.includes(t.payment_method)).reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
    const backedUpAt = new Date().toISOString();
    const managerName = manager.full_name || manager.username || 'manager';

    await base44.entities.SystemAuditLog.create({
      event_type: 'BATCH_BACKUP',
      description: `${modeState.operatingMode} batch snapshot created by ${managerName}`,
      actor_email: manager.username || user?.email || 'unknown',
      venue_id: venueId,
      status: 'success',
      severity: 'low',
      metadata: {
        mode: modeState.ledgerMode,
        operating_mode: modeState.operatingMode,
        batch_id: activeBatch.id,
        backed_up_at: backedUpAt,
        backed_up_by: managerName,
        auto_backup: false,
        snapshot: {
          opening_cash: activeBatch.opening_cash,
          total_sales: activeBatch.total_sales,
          transaction_count: activeBatch.transaction_count,
          discrepancy: activeBatch.discrepancy,
          cashTotal,
          cardTotal,
          batchTotal: cashTotal + cardTotal,
          notes: activeBatch.notes,
          start_time: activeBatch.start_time,
          status: activeBatch.status,
          transaction_ids: batchTransactions.map(t => t.id),
        },
      },
    });
    await refetchBackups();
    toast({ title: 'Batch snapshot saved', description: `${batchTransactions.length} transaction references captured at ${new Date(backedUpAt).toLocaleTimeString()}.` });
  };

  // ─── RESTORE ─────────────────────────────────────────────────────────────────
  const handleRestoreConfirmed = async (manager) => {
    setOverrideAction(null);
    if (!pendingRestore || !activeBatch) return;
    const snap = pendingRestore.metadata?.snapshot || {};
    await base44.entities.POSBatch.update(activeBatch.id, {
      opening_cash: snap.opening_cash ?? activeBatch.opening_cash,
      total_sales: snap.total_sales ?? 0,
      transaction_count: snap.transaction_count ?? 0,
      discrepancy: snap.discrepancy ?? 0,
      notes: `RESTORED from backup ${new Date(pendingRestore.created_date).toLocaleString()} by ${manager.full_name || manager.username}`
    });
    queryClient.invalidateQueries(['active-batch']);
    queryClient.invalidateQueries(['batch-transactions']);
    setPendingRestore(null);
    setShowRestoreList(false);
    toast({ title: 'Batch Restored', description: `Snapshot from ${new Date(pendingRestore.created_date).toLocaleString()} restored.` });
  };

  const handleOpenBatch = async () => {
    if (isOpeningBatch) return;

    const parsed = parseFloat(openingCash || '0') || 0;
    if (isNaN(parsed) || parsed < 0) {
      alert('Please enter a valid opening cash amount.');
      return;
    }
    if (parsed > 50000) {
      const confirmed = window.confirm(`Opening cash of $${parsed.toLocaleString()} is unusually high. Are you sure?`);
      if (!confirmed) return;
    }

    const venueId = activeVenue?.id || activeVenue?.venue_id;
    if (!venueId) {
      alert('No active venue selected. Please select a venue before opening a batch.');
      return;
    }

    setIsOpeningBatch(true);
    try {
      const cashierEmail = user?.email || user?.id || 'unknown';
      const newBatch = await openBatchMutation.mutateAsync({
        batch_id: `BATCH-${Date.now()}`,
        start_time: new Date().toISOString(),
        opening_cash: parsed,
        cashier: cashierEmail,
        cashier_email: cashierEmail,
        cashier_name: user?.full_name || user?.name || user?.email,
        venue_id: venueId,
        status: 'open',
        total_sales: 0,
        transaction_count: 0
      });
      const resolvedVenueId = newBatch?.venue_id || venueId;
      if (newBatch && resolvedVenueId) {
        await base44.entities.SystemAuditLog.create({
          event_type: 'BATCH_OPENED',
          entity_type: 'POSBatch',
          entity_id: newBatch?.id || null,
          actor_id: cashierEmail,
          venue_id: resolvedVenueId,
          description: `Batch ${newBatch?.batch_id || newBatch?.id} opened by ${cashierEmail}`,
          metadata: { batch_id: newBatch?.batch_id || newBatch?.id, opened_at: new Date().toISOString(), opening_cash: parsed },
          severity: 'low',
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Batch open failed:', error);
      toast({ title: 'Batch Open Failed', description: error.message || 'Unable to open batch. Please try again.', variant: 'destructive' });
    } finally {
      setIsOpeningBatch(false);
    }
  };

  const handleCloseBatch = async () => {
    if (isClosingBatch) return; // B1

    // B3 — cash validation
    const parsed = parseFloat(closingCash || '0');
    if (isNaN(parsed) || parsed < 0) {
      alert('Please enter a valid closing cash amount.');
      return;
    }
    if (parsed > 50000) {
      const confirmed = window.confirm(`Closing cash of $${parsed.toLocaleString()} is unusually high. Are you sure?`);
      if (!confirmed) return;
    }

    // Section 3 — filter REAL only for financial totals
    // F-5: Card whitelist + F-1: Tips excluded — BPAAA v3.0
    const BATCH_CARD_WHITELIST = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];
    const realTxns = batchTransactions.filter(t => !t.mode || t.mode === 'REAL');
    const cashTx = realTxns.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const cardTx = realTxns.filter(t => BATCH_CARD_WHITELIST.includes(t.payment_method)).reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
    const totalSales = cashTx + cardTx;
    const expectedCash = (activeBatch?.opening_cash || 0) + cashTx;
    const discrepancy = parsed - expectedCash;
    const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

    // Section 3 — require discrepancy_note when REQUIRES_REVIEW
    if (hasDiscrepancy && !notes.trim()) {
      alert('A discrepancy exists. You must enter a closing note explaining the discrepancy before closing.');
      return;
    }

    const cashierEmail = user?.email || user?.id || 'unknown';
    const batchBeingClosed = activeBatch;
    setIsClosingBatch(true);
    try {
      await closeBatchMutation.mutateAsync({
        id: activeBatch.id,
        data: {
          end_time: new Date().toISOString(),
          closing_cash: parsed,
          original_closing_cash: parsed,
          closing_cash_entered_by: user?.email || 'unknown',
          closing_cash_entered_at: new Date().toISOString(),
          total_sales: totalSales,
          transaction_count: batchTransactions.length,
          status: hasDiscrepancy ? 'REQUIRES_REVIEW' : 'closed',
          discrepancy,
          discrepancy_note: hasDiscrepancy ? notes : null,
          notes
        }
      });
      const resolvedVenueId = batchBeingClosed?.venue_id || activeVenue?.id;
      if (!resolvedVenueId) {
        throw new Error('BATCH_AUDIT_FAILED: venue_id unavailable on close');
      }
      await base44.entities.SystemAuditLog.create({
        event_type:  'BATCH_CLOSED',
        entity_type: 'POSBatch',
        entity_id:   batchBeingClosed?.id || null,
        actor_id:    cashierEmail,
        venue_id:    resolvedVenueId,
        description: `Batch ${batchBeingClosed?.id} closed by ${cashierEmail}`,
        metadata: {
          batch_id:                batchBeingClosed?.id,
          closed_at:               new Date().toISOString(),
          total_cash:              cashTx,
          total_card:              cardTx,
          total_glyphbucks_issued: 0
        },
        severity: hasDiscrepancy ? 'medium' : 'low',
        status:   hasDiscrepancy ? 'alert' : 'success'
      });
    } catch (error) {
      console.error('Batch close failed:', error);
      toast({
        title: 'Batch Close Failed',
        description: error.message || 'Unable to close batch. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsClosingBatch(false);
    }
  };

  const BATCH_CARD_WHITELIST_DISPLAY = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];
  const realTxns = batchTransactions.filter(t => !t.mode || t.mode === 'REAL');
  const cashTotal = realTxns.filter(t => t.payment_method === 'Cash').reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
  const cardTotal = realTxns.filter(t => BATCH_CARD_WHITELIST_DISPLAY.includes(t.payment_method)).reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);
  const batchTotal = cashTotal + cardTotal;

  const expectedCashPreview = (activeBatch?.opening_cash || 0) + cashTotal;
  const batchAgeHours = activeBatch ? (Date.now() - new Date(activeBatch.start_time).getTime()) / 3600000 : 0;
  const parsedClosing = parseFloat(closingCash) || 0;
  const discrepancyPreview = parsedClosing - expectedCashPreview;
  const hasDiscrepancyPreview = Math.abs(discrepancyPreview) > 0.01;

  return (
    <div className="space-y-4">

      {/* ── Manager Override Modal ── */}
      <ManagerOverrideModal
        open={!!overrideAction}
        onClose={() => { setOverrideAction(null); setPendingRestore(null); }}
        actionLabel={
          overrideAction === 'reset' ? 'Reset Batch to Zero' :
          overrideAction === 'backup' ? 'Create Batch Backup Snapshot' :
          overrideAction === 'restore' ? 'Restore Batch from Snapshot' : ''
        }
        description={
          overrideAction === 'reset' ? 'This will zero out all batch totals and form fields. Transactions remain intact.' :
          overrideAction === 'backup' ? 'A snapshot of the current batch state will be saved.' :
          overrideAction === 'restore' ? `Restore snapshot from ${pendingRestore ? new Date(pendingRestore.created_date).toLocaleString() : ''}.` : ''
        }
        onApproved={
          overrideAction === 'reset' ? handleResetConfirmed :
          overrideAction === 'backup' ? handleBackupConfirmed :
          overrideAction === 'restore' ? handleRestoreConfirmed : () => {}
        }
      />

      {/* ── Restore List Dialog ── */}
      <Dialog open={showRestoreList} onOpenChange={setShowRestoreList}>
        <DialogContent className="bg-gray-950 border-blue-500/30 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <RotateCcw className="w-4 h-4" /> Restore from Backup
            </DialogTitle>
          </DialogHeader>
          {relevantBackups.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No backups found for this batch.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {relevantBackups.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">{new Date(b.created_date).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">By {b.metadata?.backed_up_by} · Sales: ${b.metadata?.snapshot?.batchTotal?.toFixed(2) ?? '—'}</div>
                  </div>
                  <Button size="sm" onClick={() => { setPendingRestore(b); setShowRestoreList(false); setOverrideAction('restore'); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* D10 — Stale batch warning */}
      {activeBatch && batchAgeHours > 24 && (
        <div className="bg-orange-500/10 border border-orange-500/40 rounded-xl p-3 flex items-center justify-between">
          <div className="text-sm text-orange-400">
            ⚠️ Batch <span className="font-mono font-bold">{activeBatch.batch_id}</span> has been open for{' '}
            <span className="font-bold">{Math.floor(batchAgeHours)}h</span> since{' '}
            {new Date(activeBatch.start_time).toLocaleDateString()}. Please close it to generate accurate reports.
          </div>
          <Button size="sm" onClick={() => setShowCloseDialog(true)} className="ml-3 bg-orange-500 hover:bg-orange-600 text-white text-xs">
            Close Batch
          </Button>
        </div>
      )}

      {activeBatch ? (
        <Card className="glass-card-dark border-green-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Active Batch
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">Started {new Date(activeBatch.start_time).toLocaleString()}</p>
              </div>
              <Button
                onClick={() => setShowCloseDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Close Batch
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Opening Cash</div>
                <div className="text-2xl font-bold text-cyan-400">${activeBatch.opening_cash?.toFixed(2)}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Transactions</div>
                <div className="text-2xl font-bold text-blue-400">{batchTransactions.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Cash Sales</div>
                <div className="text-2xl font-bold text-green-400">${cashTotal.toFixed(2)}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Card Sales</div>
                <div className="text-2xl font-bold text-purple-400">${cardTotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="glass-card p-4 mt-4 border-green-500/30">
              <div className="text-sm text-gray-400 mb-1">Total Batch Sales (Real Tender)</div>
              <div className="text-3xl font-bold text-green-400">${batchTotal.toFixed(2)}</div>
              <div className="text-sm text-gray-400 mt-2">Expected Cash: ${expectedCashPreview.toFixed(2)}</div>
            </div>

            {/* ── Shift Controls: Refresh / Reset / Backup / Restore ── */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
              <Button size="sm" variant="outline"
                onClick={() => {
                  queryClient.removeQueries(['active-batch']);
                  queryClient.removeQueries(['batch-transactions']);
                  queryClient.invalidateQueries();
                  toast({ title: 'Refreshed', description: 'Batch data reloaded.' });
                }}
                className="border-gray-500/40 text-gray-400 hover:bg-gray-500/10">
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
              <Button size="sm" variant="outline"
                onClick={() => setOverrideAction('reset')}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-3 h-3 mr-1" /> Reset to Zero
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card-dark border-green-500/30">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <div className="text-5xl mb-3">☀️</div>
              <h3 className="text-2xl font-bold text-white">Start Your Shift</h3>
              <p className="text-gray-400 mt-1 text-sm">Count your drawer, then tap the button below</p>
            </div>
            <div className="max-w-xs mx-auto">
              <Label className="text-gray-400 text-sm block mb-2">Opening Cash in Drawer</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="glass-input text-white text-3xl text-center pl-10 h-16"
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button
              onClick={handleOpenBatch}
              disabled={isOpeningBatch}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold px-10 py-6 h-auto rounded-2xl w-full max-w-xs mx-auto block"
            >
              {isOpeningBatch ? '⏳ Starting...' : '✅ Start Shift'}
            </Button>
            <p className="text-xs text-gray-600">Opening cash defaults to $0 if left blank</p>
          </CardContent>
        </Card>
      )}

      {/* Close Batch Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="glass-card-dark border-orange-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Close Batch — Cash Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Transactions</div>
                <div className="text-xl font-bold text-blue-400">{batchTransactions.length}</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-gray-400 mb-1">Cash Sales (Real)</div>
                <div className="text-xl font-bold text-green-400">${cashTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="glass-card p-4 border-green-500/30">
              <div className="text-sm text-gray-400 mb-1">Expected Cash in Drawer</div>
              <div className="text-2xl font-bold text-green-400">
                ${expectedCashPreview.toFixed(2)}
              </div>
            </div>

            <div>
              <Label>Actual Closing Cash Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="glass-input text-white text-2xl text-center"
                placeholder="0.00"
              />
            </div>

            {parsedClosing > 0 && (
              <div className={`glass-card p-4 ${hasDiscrepancyPreview ? 'border-red-500/30' : 'border-green-500/30'}`}>
                <div className="text-sm text-gray-400 mb-1">
                  Discrepancy {hasDiscrepancyPreview && <span className="text-red-400 font-bold ml-1">— NOTE REQUIRED</span>}
                </div>
                <div className={`text-2xl font-bold ${discrepancyPreview < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ${discrepancyPreview.toFixed(2)}
                </div>
                {hasDiscrepancyPreview && (
                  <div className="text-xs text-orange-400 mt-1">Status will be set to REQUIRES_REVIEW</div>
                )}
              </div>
            )}

            <div>
              <Label>
                Closing Notes {hasDiscrepancyPreview && <span className="text-red-400">*Required (discrepancy detected)</span>}
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-white"
                placeholder="Explain any discrepancies or issues..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseBatch}
                disabled={isClosingBatch}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isClosingBatch ? 'Closing...' : 'Close Batch'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}