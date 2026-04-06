import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Users, DoorOpen, AlertTriangle, ShoppingCart,
  TrendingUp, FileText, Banknote, CheckCircle, Package
} from "lucide-react";
import AuditFixReport from './AuditFixReport';

export default function NUPSManagerDashboard({
  user,
  // Props passed from NUPSOwner (already-fetched data)
  transactions: propTransactions,
  activeShifts: propActiveShifts,
  vipRooms: propVipRooms,
  vipGuests: propVipGuests,
  todayRevenue: propTodayRevenue,
  totalRevenue: propTotalRevenue,
  occupiedRooms: propOccupiedRooms,
  activeGuestsCount: propActiveGuestsCount,
}) {
  const today = new Date().toDateString();

  // Only fetch what the parent doesn't provide
  const { data: activeBatch } = useQuery({
    queryKey: ['mgr-active-batch'],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.list('-created_date', 10);
      return batches.find(b => b.status === 'open') || null;
    },
    refetchInterval: 30000,
  });

  const { data: zReports = [] } = useQuery({
    queryKey: ['mgr-z-reports'],
    queryFn: () => base44.entities.POSZReport.list('-created_date', 5),
  });

  const { data: auditAlerts = [] } = useQuery({
    queryKey: ['mgr-audit-alerts'],
    queryFn: async () => {
      const all = await base44.entities.SystemAuditLog.list('-created_date', 20);
      return all.filter(a => a.severity === 'critical' || a.severity === 'high');
    },
    refetchInterval: 60000,
  });

  // Use parent-provided data; fall back to computing locally if not provided
  const vipRooms = propVipRooms ?? [];
  const activeShifts = propActiveShifts ?? [];

  const MGR_CARD_WHITELIST = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];
  const todayTx = (propTransactions ?? []).filter(t => new Date(t.created_date).toDateString() === today);
  const cashSales = todayTx.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
  const cardSales = todayTx.filter(t => MGR_CARD_WHITELIST.includes(t.payment_method)).reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
  const todayRevenue = propTodayRevenue ?? todayTx.reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0);
  const occupiedRooms = propOccupiedRooms != null ? [] : vipRooms.filter(r => r.status === 'occupied');
  const occupiedCount = propOccupiedRooms ?? occupiedRooms.length;

  const lastReport = zReports[0];
  const hasDiscrepancy = lastReport?.requires_review;

  // Build audit issues list
  const auditIssues = [];
  if (!activeBatch) {
    auditIssues.push({
      id: 'no-batch',
      title: 'No Open Batch',
      code: 'BATCH-001',
      severity: 'warning',
      description: 'No cash batch is currently open. Transactions cannot be processed.',
      actions: [
        { id: 'openBatch', label: 'Open Batch Now', type: 'primary' }
      ]
    });
  }
  if (hasDiscrepancy) {
    auditIssues.push({
      id: 'cash-discrepancy',
      title: 'Cash Discrepancy Flagged',
      code: `ZRPT-${lastReport?.report_id?.slice(-3)}`,
      severity: 'critical',
      description: `Over/Short: $${(lastReport?.cash_over_short || 0).toFixed(2)} — Requires manager review`,
      details: `Report ID: ${lastReport?.report_id} | Date: ${lastReport?.report_date} | Cashier: ${lastReport?.cashier_name}`,
      actions: [
        { id: 'reviewDiscrepancy', label: 'Review Report', type: 'primary' }
      ]
    });
  }

  return (
    <div className="p-4 space-y-5 text-white">

      {/* AUDIT FIX REPORT */}
      <AuditFixReport issues={auditIssues} />

      {/* ALERTS */}
      <div className="space-y-2" style={{display: 'none'}}>
        {hasDiscrepancy && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-red-400 font-bold text-sm">Cash Discrepancy Flagged</div>
              <div className="text-red-300/70 text-xs mt-0.5">
                Report {lastReport?.report_id} — Over/Short: ${(lastReport?.cash_over_short || 0).toFixed(2)} — Requires manager review
              </div>
            </div>
          </div>
        )}
        {!activeBatch && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-yellow-400 font-bold text-sm">No Open Batch</div>
              <div className="text-yellow-300/70 text-xs mt-0.5">No cash batch is currently open. Go to Z Report screen to open one.</div>
            </div>
          </div>
        )}
        {activeBatch && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-green-400 font-semibold text-sm">Batch Active: </span>
            <span className="text-green-300/80 text-sm font-mono">{activeBatch.batch_id}</span>
            <span className="text-green-300/50 text-xs ml-auto">Opening: ${(activeBatch.opening_cash || 0).toFixed(2)}</span>
          </div>
        )}
        {auditAlerts.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-orange-400 font-semibold text-sm">{auditAlerts.length} Security Alert{auditAlerts.length > 1 ? 's' : ''}</div>
              <div className="text-orange-300/60 text-xs mt-0.5">{auditAlerts[0]?.description}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* ACTIVE VIP ROOMS */}
        <Card className="bg-gray-900/60 border border-pink-500/20">
          <CardContent className="p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
              <DoorOpen className="w-4 h-4 text-pink-400" />
              VIP Rooms ({vipRooms.length})
            </h3>
            <div className="space-y-1.5">
              {vipRooms.length === 0 ? (
                <p className="text-gray-600 text-xs">No rooms configured</p>
              ) : vipRooms.map(room => (
                <div key={room.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-white">{room.room_name || `Room ${room.room_number}`}</span>
                    {room.entertainer_name && (
                      <span className="text-[10px] text-gray-500 ml-2 truncate">{room.entertainer_name}</span>
                    )}
                  </div>
                  <Badge className={
                    room.status === 'occupied' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 text-[10px]' :
                    room.status === 'cleaning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]' :
                    room.status === 'available' ? 'bg-green-500/20 text-green-400 border-green-500/30 text-[10px]' :
                    'bg-gray-700 text-gray-400 border-gray-600 text-[10px]'
                  }>
                    {room.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ACTIVE STAFF ON FLOOR */}
        <Card className="bg-gray-900/60 border border-amber-500/20">
          <CardContent className="p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-amber-400" />
              Staff On Floor ({activeShifts.length})
            </h3>
            <div className="space-y-1.5">
              {activeShifts.length === 0 ? (
                <p className="text-gray-600 text-xs">No staff currently checked in</p>
              ) : activeShifts.slice(0, 8).map(shift => (
                <div key={shift.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs text-white font-medium">{shift.stage_name || shift.entertainer_name || shift.entertainer_id}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{shift.location || 'Floor'}</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                    {shift.status || 'active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT Z REPORTS */}
      {zReports.length > 0 && (
        <Card className="bg-gray-900/60 border border-gray-700">
          <CardContent className="p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              Recent Z-Reports
            </h3>
            <div className="space-y-1.5">
              {zReports.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs font-mono text-white">{r.report_id}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{r.report_date} · {r.cashier_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-cyan-400">${(r.total_sales || 0).toFixed(2)}</span>
                    {r.requires_review && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Review</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}