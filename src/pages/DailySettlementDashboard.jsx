/**
 * DACO-20260610 WS-2 — Daily Settlement Dashboard
 *
 * Per-venue daily settlement view. total_sales = cash_sales + card_sales ONLY.
 * GlyphBucks shown clearly OUTSIDE the total. Driver payouts split by PROCESSED vs PENDING.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Lock, AlertCircle, CheckCircle2, Truck, Calendar, Database, Download } from 'lucide-react';
import { logActivity } from '@/lib/nups/activityLog';
import { writeEntity } from '@/lib/nups/writeEntity';
import SettlementLockGuardModal from '@/components/nups/SettlementLockGuardModal';
import { downloadSettlementCsv } from '@/lib/accounting/settlementCsv';

const STATUS_STYLES = {
  OPEN: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  RECONCILED: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  LOCKED: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
};

function MetricCard({ label, value, sub, accent = 'slate', warning = false }) {
  const tones = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-300',
    amber: 'text-amber-300',
    red: 'text-red-400',
    slate: 'text-slate-300',
  };
  return (
    <div className={`p-4 rounded-lg border ${warning ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700 bg-slate-800/40'}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tones[accent]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DailySettlementDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [businessDate, setBusinessDate] = useState(today);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [lockGuardOpen, setLockGuardOpen] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const isManager = user && (
    user.role === 'admin' ||
    ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'].includes(user._highestRole)
  );

  // Pull all venues dynamically from VenueRateConfig — NO hardcoded strings
  const { data: venues = [] } = useQuery({
    queryKey: ['venue-configs'],
    queryFn: async () => {
      try { return await base44.entities.VenueRateConfig.list('-created_date', 100); }
      catch { return []; }
    },
  });

  useEffect(() => {
    if (!selectedVenue && venues.length > 0) {
      setSelectedVenue(venues[0].venue_id);
    }
  }, [venues, selectedVenue]);

  // POSTransactions for the day
  const { data: txns = [] } = useQuery({
    queryKey: ['settlement-txns', selectedVenue, businessDate],
    queryFn: async () => {
      if (!selectedVenue) return [];
      const all = await base44.entities.POSTransaction.list('-created_date', 1000);
      // DACO-20260613-DOOR-RBAC — validation_run rows are funds-off and MUST
      // be excluded from booked revenue / settlement rollups.
      return all.filter(t => {
        const dt = (t.created_date || '').slice(0, 10);
        return t.venue_id === selectedVenue && dt === businessDate && t.validation_run !== true;
      });
    },
    enabled: !!selectedVenue,
  });

  // Z-Report for the day
  const { data: zReports = [] } = useQuery({
    queryKey: ['settlement-z', selectedVenue, businessDate],
    queryFn: async () => {
      const all = await base44.entities.POSZReport.list('-created_date', 100);
      return all.filter(z => z.venue_id === selectedVenue && z.report_date === businessDate);
    },
    enabled: !!selectedVenue,
  });

  // DriverPayouts for the day
  const { data: driverPayouts = [] } = useQuery({
    queryKey: ['settlement-drivers', selectedVenue, businessDate],
    queryFn: async () => {
      const all = await base44.entities.DriverPayout.list('-created_date', 500);
      return all.filter(d => d.venue_id === selectedVenue && d.session_date === businessDate);
    },
    enabled: !!selectedVenue,
  });

  // Existing settlement record for this day
  const { data: existingSettlement, refetch: refetchSettlement } = useQuery({
    queryKey: ['settlement-record', selectedVenue, businessDate],
    queryFn: async () => {
      const rows = await base44.entities.DailySettlement.list('-created_date', 50);
      return rows.find(s =>
        s.venue_id === selectedVenue &&
        (s.business_date === businessDate || s.settlement_date === businessDate)
      ) || null;
    },
    enabled: !!selectedVenue,
  });

  // Trend strip — last 7 days total_sales for this venue
  const { data: trend = [] } = useQuery({
    queryKey: ['settlement-trend', selectedVenue],
    queryFn: async () => {
      const rows = await base44.entities.DailySettlement.list('-created_date', 30);
      return rows
        .filter(s => s.venue_id === selectedVenue && (s.business_date || s.settlement_date))
        .slice(0, 7);
    },
    enabled: !!selectedVenue,
  });

  // Computed metrics — FROZEN RULES
  const metrics = useMemo(() => {
    const cash_sales = txns
      .filter(t => (t.payment_method || '').toLowerCase() === 'cash')
      .reduce((s, t) => s + (Number(t.cash_amount) || Number(t.total) || 0), 0);
    const card_sales = txns
      .filter(t => ['card', 'credit_card', 'debit_card'].includes((t.payment_method || '').toLowerCase()))
      .reduce((s, t) => s + (Number(t.card_amount) || Number(t.total) || 0), 0);

    // Prefer Z-Report values if present (authoritative)
    const z = zReports[0];
    const final_cash = z ? Number(z.cash_sales || 0) : cash_sales;
    const final_card = z ? Number(z.card_sales || 0) : card_sales;
    const total_sales = final_cash + final_card; // FROZEN

    const processed = driverPayouts.filter(d => (d.payout_status || 'PENDING') === 'PROCESSED');
    const pending = driverPayouts.filter(d => (d.payout_status || 'PENDING') === 'PENDING');
    const driver_payouts_total = processed.reduce((s, d) => s + (Number(d.total_payout) || 0), 0);
    const driver_payouts_outstanding = pending.reduce((s, d) => s + (Number(d.total_payout) || 0), 0);

    const gbActivity = txns.reduce((acc, t) => {
      const notes = (() => { try { return typeof t.notes === 'string' ? JSON.parse(t.notes) : (t.notes || {}); } catch { return {}; } })();
      if (notes.glyphbucks_issued) {
        acc.issued_count += 1;
        acc.issued_face_value += Number(notes.glyphbucks_issued) || 0;
      }
      if (notes.glyphbucks_redeemed) {
        acc.redeemed_count += 1;
        acc.redeemed_face_value += Number(notes.glyphbucks_redeemed) || 0;
      }
      return acc;
    }, { issued_count: 0, issued_face_value: 0, redeemed_count: 0, redeemed_face_value: 0 });

    return {
      cash_sales: final_cash,
      card_sales: final_card,
      total_sales,
      driver_payouts_total,
      driver_payouts_outstanding,
      processed_count: processed.length,
      pending_count: pending.length,
      batch_reference: z?.batch_id || z?.report_id || null,
      variance: z ? Number(z.cash_over_short || 0) : 0,
      glyphbucks_activity: gbActivity,
    };
  }, [txns, zReports, driverPayouts]);

  const handleLockClick = () => {
    if (!user || !isManager) {
      setErr('Manager role required.');
      return;
    }
    setErr(null);
    setLockGuardOpen(true);
  };

  const handleReconcileLock = async () => {
    if (!user || !isManager) {
      setErr('Manager role required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        settlement_id: existingSettlement?.settlement_id || `STL-${selectedVenue}-${businessDate}-${Date.now()}`,
        venue_id: selectedVenue,
        business_date: businessDate,
        settlement_date: businessDate,
        cash_sales: metrics.cash_sales,
        card_sales: metrics.card_sales,
        total_sales: metrics.total_sales,
        batch_reference: metrics.batch_reference,
        glyphbucks_activity: metrics.glyphbucks_activity,
        driver_payouts_total: metrics.driver_payouts_total,
        driver_payouts_outstanding: metrics.driver_payouts_outstanding,
        variance: metrics.variance,
        status: 'LOCKED',
        locked_by: user.email,
        locked_at: new Date().toISOString(),
      };

      const actor = { email: user.email, role: user._highestRole || user.role || 'External' };
      let result;
      if (existingSettlement?.id) {
        result = await writeEntity({
          entity: 'DailySettlement', operation: 'update', id: existingSettlement.id, data: payload,
          actor, intent: 'SETTLEMENT_RUN', venue_id: selectedVenue,
        });
      } else {
        result = await writeEntity({
          entity: 'DailySettlement', operation: 'create', data: payload,
          actor, intent: 'SETTLEMENT_RUN', venue_id: selectedVenue,
        });
      }

      if (!result.ok) {
        setErr(result.block_reason || 'Gateway blocked write.');
        return;
      }

      await logActivity({
        action_type: 'SETTLEMENT_RUN',
        entity_affected: `DailySettlement:${result.value?.id || payload.settlement_id}`,
        before_value: existingSettlement || null,
        after_value: payload,
        venue_id: selectedVenue,
        notes: `Reconcile & Lock — cash=${metrics.cash_sales} card=${metrics.card_sales} total=${metrics.total_sales}`,
      });

      await refetchSettlement();
      setLockGuardOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>;
  }
  if (!isManager) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-900 border-red-500/30">
          <CardContent className="p-8 text-center space-y-3">
            <Lock className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold">Manager Access Required</h2>
            <p className="text-slate-400 text-sm">Settlement dashboard is restricted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = existingSettlement?.status || 'OPEN';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Daily Settlement
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Frozen rule: <span className="text-emerald-400">total_sales = cash + card ONLY</span>. GlyphBucks tracked outside.
            </p>
          </div>
          <Badge className={`border text-xs px-3 py-1 ${STATUS_STYLES[status]}`}>
            {status === 'LOCKED' && <Lock className="w-3 h-3 mr-1 inline" />}
            {status}
          </Badge>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 flex items-center gap-1"><Database className="w-3 h-3" /> Venue</label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select venue…" /></SelectTrigger>
                  <SelectContent>
                    {venues.length === 0 && <SelectItem value="__none__" disabled>No VenueRateConfig records</SelectItem>}
                    {venues.map(v => <SelectItem key={v.id} value={v.venue_id}>{v.venue_name || v.venue_id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Business date</label>
                <Input type="date" value={businessDate} onChange={e => setBusinessDate(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800">
              <Button
                onClick={handleLockClick}
                disabled={busy || status === 'LOCKED' || !selectedVenue}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap"
              >
                {busy ? 'Working…' : status === 'LOCKED' ? <><Lock className="w-4 h-4 mr-1.5" /> Locked</> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Reconcile & Lock</>}
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedVenue) return;
                  const venueName = venues.find(v => v.venue_id === selectedVenue)?.venue_name;
                  const filename = downloadSettlementCsv({
                    venueId: selectedVenue,
                    venueName,
                    businessDate,
                    status,
                    metrics,
                    driverPayouts,
                    existingSettlement,
                    generatedBy: user?.email || '',
                  });
                  await logActivity({
                    action_type: 'EXPORT',
                    entity_affected: existingSettlement?.id ? `DailySettlement:${existingSettlement.id}` : null,
                    venue_id: selectedVenue,
                    notes: `CSV export — ${filename} — total=${metrics.total_sales}`,
                  });
                }}
                disabled={!selectedVenue}
                variant="outline"
                className="sm:w-32 border-blue-500/40 text-blue-300 hover:bg-blue-500/10 whitespace-nowrap"
                title="Download accounting CSV (cash, card, GlyphBucks, driver payouts)"
              >
                <Download className="w-4 h-4 mr-1.5" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {err && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /> {err}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Cash" value={`$${metrics.cash_sales.toFixed(2)}`} accent="emerald" />
          <MetricCard label="Card" value={`$${metrics.card_sales.toFixed(2)}`} accent="blue" />
          <MetricCard label="Total Sales" value={`$${metrics.total_sales.toFixed(2)}`} sub="cash + card ONLY" accent="purple" />
          <MetricCard label="Variance" value={`$${metrics.variance.toFixed(2)}`} sub="Z-Report over/short" accent={metrics.variance < 0 ? 'red' : 'slate'} warning={metrics.variance !== 0} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-pink-400" /> Driver Payouts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between p-3 rounded bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-sm text-emerald-300">PROCESSED · {metrics.processed_count}</span>
                <span className="font-bold text-emerald-300">${metrics.driver_payouts_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 rounded bg-amber-500/10 border border-amber-500/30">
                <span className="text-sm text-amber-300">Outstanding (PENDING) · {metrics.pending_count}</span>
                <span className="font-bold text-amber-300">${metrics.driver_payouts_outstanding.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">Only PROCESSED rolls into settlement total. Toggle status in Front Door POS.</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-300 flex items-center gap-2">
                GlyphBucks Activity
                <span className="text-[10px] font-normal text-amber-400">NOT IN TOTAL</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-amber-500/10 rounded">
                <div className="text-amber-400 text-[10px]">Issued</div>
                <div className="font-bold text-amber-200">{metrics.glyphbucks_activity.issued_count} × ${metrics.glyphbucks_activity.issued_face_value.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-amber-500/10 rounded">
                <div className="text-amber-400 text-[10px]">Redeemed</div>
                <div className="font-bold text-amber-200">{metrics.glyphbucks_activity.redeemed_count} × ${metrics.glyphbucks_activity.redeemed_face_value.toFixed(2)}</div>
              </div>
              <div className="col-span-2 text-[10px] text-amber-400/80 pt-1">
                Stored-value liability instrument. Excluded from revenue per BPAAA v3.0.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Batch & Reconciliation</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><div className="text-slate-400">Batch Ref</div><div className="font-mono text-white">{metrics.batch_reference || '—'}</div></div>
            <div><div className="text-slate-400">Txn Count</div><div className="text-white">{txns.length}</div></div>
            <div><div className="text-slate-400">Z-Reports</div><div className="text-white">{zReports.length}</div></div>
            <div><div className="text-slate-400">Driver Records</div><div className="text-white">{driverPayouts.length}</div></div>
          </CardContent>
        </Card>

        {trend.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Last 7 Settlements — {selectedVenue}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto">
                {trend.map(t => (
                  <div key={t.id} className="flex-shrink-0 p-3 bg-slate-800/50 rounded border border-slate-700 min-w-[110px]">
                    <div className="text-[10px] text-slate-400">{t.business_date || t.settlement_date}</div>
                    <div className="text-sm font-bold text-emerald-300">${Number(t.total_sales || 0).toFixed(2)}</div>
                    <Badge className={`text-[9px] mt-1 ${STATUS_STYLES[t.status || 'OPEN']}`}>{t.status || 'OPEN'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {existingSettlement?.status === 'LOCKED' && (
          <div className="text-xs text-slate-500 text-center pt-2">
            Locked by {existingSettlement.locked_by} at {new Date(existingSettlement.locked_at).toLocaleString()}
          </div>
        )}
      </div>

      <SettlementLockGuardModal
        open={lockGuardOpen}
        onClose={() => !busy && setLockGuardOpen(false)}
        onConfirm={handleReconcileLock}
        pendingCount={metrics.pending_count}
        pendingTotal={metrics.driver_payouts_outstanding}
        processedCount={metrics.processed_count}
        processedTotal={metrics.driver_payouts_total}
        businessDate={businessDate}
        busy={busy}
      />
    </div>
  );
}