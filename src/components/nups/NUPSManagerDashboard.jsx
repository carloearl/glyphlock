import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Users, DoorOpen, AlertTriangle, ShoppingCart,
  TrendingUp, FileText, Banknote, CheckCircle, Package, ClipboardList, Clock3, UserPlus, ArrowRight, ShieldAlert
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
  const navigate = useNavigate();
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

  const { data: staffApplications = [] } = useQuery({
    queryKey: ['mgr-staff-applications'],
    queryFn: () => base44.entities.StaffApplication.list('-created_date', 100),
    refetchInterval: 30000,
  });

  const { data: staffShifts = [] } = useQuery({
    queryKey: ['mgr-staff-shifts'],
    queryFn: () => base44.entities.StaffShift.list('-created_date', 100),
    refetchInterval: 30000,
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

      {/* TONIGHT — action-first operating picture */}
      <div>
        <div className="flex items-end justify-between mb-3"><div><h2 className="text-xl font-black">Tonight</h2><p className="text-xs text-gray-400">What needs attention before and during service</p></div><span className="text-xs text-gray-500">{new Date().toLocaleString()}</span></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Clocked in', staffShifts.filter(s => s.status === 'checked_in').length, 'text-green-400'],
            ['Applications waiting', staffApplications.filter(a => ['SUBMITTED','MANAGER_REVIEW'].includes(a.status)).length, 'text-blue-400'],
            ['Onboarding blockers', staffApplications.filter(a => !['DRAFT','ACTIVE','REJECTED','WITHDRAWN'].includes(a.status) && (a.completion_percent || 0) < 100).length, 'text-amber-400'],
            ['Critical alerts', auditAlerts.length + (hasDiscrepancy ? 1 : 0), 'text-red-400'],
          ].map(([label,value,color]) => <Card key={label} className="bg-gray-900/70 border-gray-700"><CardContent className="p-4"><div className={`text-2xl font-black ${color}`}>{value}</div><div className="text-xs text-gray-400">{label}</div></CardContent></Card>)}
        </div>
      </div>

      {/* APPLICATION / ONBOARDING PIPELINE */}
      <Card className="bg-gray-900/60 border border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between gap-2 items-center mb-3"><h3 className="font-bold flex gap-2 items-center"><ClipboardList className="w-4 h-4 text-purple-400"/>Applications & Onboarding</h3><button onClick={() => navigate('/NUPSOwner?tab=staff')} className="text-xs text-purple-300 hover:text-white">Open staff workspace <ArrowRight className="inline w-3 h-3"/></button></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              ['New', staffApplications.filter(a=>['DRAFT','SUBMITTED'].includes(a.status)).length],
              ['Review', staffApplications.filter(a=>['MANAGER_REVIEW','NEEDS_INFORMATION'].includes(a.status)).length],
              ['Forms', staffApplications.filter(a=>['CONDITIONALLY_APPROVED','EMPLOYEE_FORMS','IDENTITY_REVIEW'].includes(a.status)).length],
              ['Policies/training', staffApplications.filter(a=>['POLICIES_TRAINING','FINAL_REVIEW'].includes(a.status)).length],
              ['Active', staffApplications.filter(a=>a.status==='ACTIVE').length],
            ].map(([label,value])=><div key={label} className="bg-black/40 rounded p-3"><div className="text-xl font-bold">{value}</div><div className="text-[11px] text-gray-400">{label}</div></div>)}
          </div>
          <div className="mt-3 space-y-1">{staffApplications.filter(a=>!['ACTIVE','REJECTED','WITHDRAWN'].includes(a.status)).slice(0,4).map(a=><div key={a.id} className="flex justify-between bg-gray-800/50 rounded px-3 py-2 text-xs"><span className="text-white">{a.full_legal_name || 'Unnamed draft'} · {a.position || 'position pending'}</span><span className={(a.completion_percent||0)<100?'text-amber-300':'text-green-300'}>{a.status} · {a.completion_percent||0}%</span></div>)}</div>
        </CardContent>
      </Card>

      {/* QUICK ACTIONS */}
      <div className="grid sm:grid-cols-3 gap-2">
        <Button onClick={()=>navigate('/NUPSOwner?tab=staff')} className="bg-purple-700 min-h-12"><UserPlus className="w-4 h-4 mr-2"/>Start employee application</Button>
        <Button onClick={()=>navigate('/ManagerConsole')} variant="outline" className="border-green-600 text-green-300 min-h-12"><Clock3 className="w-4 h-4 mr-2"/>Review live staff</Button>
        <Button onClick={()=>navigate('/NUPSOwner?tab=audit')} variant="outline" className="border-amber-600 text-amber-300 min-h-12"><ShieldAlert className="w-4 h-4 mr-2"/>Review approvals & alerts</Button>
      </div>

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