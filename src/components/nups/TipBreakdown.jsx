import React, { useState, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign, Printer, Users, Star, Music, Shield,
  ChevronDown, ChevronUp, PenLine
} from "lucide-react";

// ─── Role → payout pool ─────────────────────────────────────────────
const ROLE_POOLS = {
  PLATFORM_ADMIN:  "manager",
  VENUE_OWNER:     "manager",
  VENUE_MANAGER:   "manager",
  FLOOR_HOST:      "hostess",
  BARTENDER:       "staff",
  SECURITY:        "staff",
  DJ:              "staff",
  KIOSK:           "staff",
  PERFORMER:       "entertainer",
};

const POOLS = [
  { key: "staff",      label: "Staff",         color: "#06b6d4", icon: <Users  className="w-4 h-4" />, pct: 0.70 },
  { key: "hostess",    label: "Hostess / Host", color: "#f59e0b", icon: <Star   className="w-4 h-4" />, pct: 0.15 },
  { key: "manager",    label: "Manager / Promo",color: "#a855f7", icon: <Shield className="w-4 h-4" />, pct: 0.10 },
  { key: "entertainer",label: "Entertainer",    color: "#ec4899", icon: <Music  className="w-4 h-4" />, pct: 0.05 },
];

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

// ─── TipLine Row (printable signature line) ──────────────────────────
function TipLine({ name, pool, amount, signature, onSign }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate">{name}</div>
        <div className="text-[10px]" style={{ color: pool.color }}>{pool.label}</div>
      </div>
      <div className="text-base font-black font-mono" style={{ color: pool.color }}>{fmt(amount)}</div>
      <div className="flex items-center gap-1.5 shrink-0">
        {signature ? (
          <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400 font-semibold">✓ Signed</span>
        ) : (
          <button
            onClick={() => onSign && onSign()}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-bold transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            <PenLine className="w-3 h-3" /> Sign
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Pool Section ─────────────────────────────────────────────────────
function PoolSection({ pool, employees, poolTotal, tipSignatures, onSign }) {
  const [open, setOpen] = useState(true);
  if (employees.length === 0) return null;
  const perPerson = employees.length > 0 ? poolTotal / employees.length : 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${pool.color}25`, background: `${pool.color}08` }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-all"
        onClick={() => setOpen(v => !v)}
        style={{ background: `${pool.color}10` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: pool.color }}>{pool.icon}</span>
          <span className="font-black text-sm text-white">{pool.label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${pool.color}20`, color: pool.color }}>
            {employees.length} staff
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-black font-mono text-base" style={{ color: pool.color }}>{fmt(poolTotal)}</span>
          <span className="text-[10px] text-gray-500">{(pool.pct * 100).toFixed(0)}% pool</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {/* Rows */}
      {open && (
        <div className="px-4 pb-3">
          {/* Per-person callout */}
          <div className="text-[10px] text-gray-500 py-2 flex items-center justify-between">
            <span>Equal split — {fmt(perPerson)} per person</span>
            <span className="text-gray-600">({pool.pct * 100}% of total tips)</span>
          </div>
          {employees.map(emp => (
            <TipLine
              key={emp.id}
              name={emp.full_name || emp.username || emp.id}
              pool={pool}
              amount={perPerson}
              signature={tipSignatures[emp.id]}
              onSign={() => onSign(emp.id, emp.full_name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function TipBreakdown({ transactions = [] }) {
  const today = new Date().toDateString();
  const [tipSignatures, setTipSignatures] = useState({});
  const [customSplit, setCustomSplit] = useState({ staff: 70, hostess: 15, manager: 10, entertainer: 5 });
  const [showSplitEditor, setShowSplitEditor] = useState(false);

  // Load NUPS employees
  const { data: nupsUsers = [] } = useQuery({
    queryKey: ['nups-users-for-tip'],
    queryFn: () => base44.entities.NUPSUser.filter({ status: "active" }),
  });

  // Today's tip total
  const todayTx = transactions.filter(t => new Date(t.created_date).toDateString() === today);
  const totalTips = todayTx.reduce((s, t) => s + (t.tip || 0), 0);

  // By cashier for reference
  const tipsByCashier = {};
  todayTx.forEach(t => {
    if (t.tip > 0) {
      const c = t.cashier || 'Unknown';
      tipsByCashier[c] = (tipsByCashier[c] || 0) + t.tip;
    }
  });

  // Compute splits from customSplit
  const splitPcts = {
    staff:       customSplit.staff / 100,
    hostess:     customSplit.hostess / 100,
    manager:     customSplit.manager / 100,
    entertainer: customSplit.entertainer / 100,
  };

  // Group employees by pool
  const byPool = useMemo(() => {
    const pools = { staff: [], hostess: [], manager: [], entertainer: [] };
    nupsUsers.forEach(u => {
      const p = ROLE_POOLS[u.role] || "staff";
      if (pools[p]) pools[p].push(u);
    });
    return pools;
  }, [nupsUsers]);

  const poolTotals = {
    staff:       totalTips * splitPcts.staff,
    hostess:     totalTips * splitPcts.hostess,
    manager:     totalTips * splitPcts.manager,
    entertainer: totalTips * splitPcts.entertainer,
  };

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.TipPayout.create(data),
    onSuccess: () => toast.success('Tip payout saved to record.'),
    onError: () => toast.error('Failed to save payout record.'),
  });

  const handleSign = (empId, name) => {
    setTipSignatures(prev => ({ ...prev, [empId]: { signed_at: new Date().toISOString(), name } }));
  };

  const handleSave = () => {
    const signatures = Object.entries(tipSignatures).map(([empId, sig]) => {
      const emp = nupsUsers.find(u => u.id === empId);
      const poolKey = emp ? (ROLE_POOLS[emp.role] || 'staff') : 'staff';
      const pool = POOLS.find(p => p.key === poolKey);
      const empsInPool = byPool[poolKey] || [];
      const perPerson = empsInPool.length > 0 ? poolTotals[poolKey] / empsInPool.length : 0;
      return {
        employee_id: empId,
        employee_name: sig.name,
        pool: poolKey,
        amount: parseFloat(perPerson.toFixed(2)),
        signed_at: sig.signed_at,
      };
    });

    saveMutation.mutate({
      payout_date: new Date().toISOString().split('T')[0],
      total_tips: totalTips,
      split_config: customSplit,
      signatures,
      cashier_summary: tipsByCashier,
      manager_email: '',
      status: 'completed',
    });
  };

  const signedCount = Object.keys(tipSignatures).length;
  const totalEmployees = nupsUsers.length;

  // Print tip sheet
  const handlePrint = () => {
    const rows = POOLS.flatMap(pool => {
      const emps = byPool[pool.key] || [];
      const perPerson = emps.length > 0 ? (totalTips * (customSplit[pool.key] / 100)) / emps.length : 0;
      return emps.map(emp => `
        <tr>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;">${emp.full_name || emp.username || '—'}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;color:#666;">${pool.label}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;">$${perPerson.toFixed(2)}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;width:140px;">
            <div style="border-bottom:1px solid #000;height:24px;margin-top:8px;"></div>
          </td>
        </tr>`);
    }).join('');

    const splitSummary = POOLS.map(p =>
      `${p.label}: ${customSplit[p.key]}% = $${(totalTips * customSplit[p.key] / 100).toFixed(2)}`
    ).join(' &nbsp;|&nbsp; ');

    const html = `<html><head><title>Tip Payout Sheet</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;font-size:12px;}
    table{width:100%;border-collapse:collapse;}th{text-align:left;padding:6px 4px;border-bottom:2px solid #000;font-size:11px;text-transform:uppercase;}
    @media print{@page{margin:12mm;size:letter;}}</style></head><body>
    <div style="text-align:center;font-size:18px;font-weight:bold;letter-spacing:2px;">TIP PAYOUT SHEET</div>
    <div style="text-align:center;font-size:11px;margin-top:2px;">Dream Palace — 815 N. Scottsdale Rd, Tempe AZ 85281</div>
    <div style="text-align:center;font-size:11px;">${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
    <hr style="margin:10px 0;border-top:2px solid #000;"/>
    <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;">
      <span><strong>TOTAL TIPS COLLECTED:</strong></span>
      <span style="font-size:20px;font-weight:900;">$${totalTips.toFixed(2)}</span>
    </div>
    <div style="font-size:10px;color:#555;margin-bottom:10px;">${splitSummary}</div>
    <table>
      <thead><tr><th>Employee</th><th>Role/Pool</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Signature</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <hr style="margin:16px 0;border-top:2px solid #000;"/>
    <div style="display:flex;gap:40px;margin-top:8px;">
      <div style="flex:1;"><div style="font-size:10px;font-weight:bold;margin-bottom:4px;">MANAGER SIGNATURE</div><div style="border-bottom:1px solid #000;height:28px;"></div></div>
      <div style="flex:1;"><div style="font-size:10px;font-weight:bold;margin-bottom:4px;">DATE / TIME</div><div style="border-bottom:1px solid #000;height:28px;"></div></div>
    </div>
    <div style="text-align:center;font-size:9px;color:#888;margin-top:16px;">N.U.P.S. POS v2.0 | Printed: ${new Date().toLocaleString()}</div>
    </body></html>`;
    const w = window.open('', '_blank', 'width=800,height=900');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const splitTotal = Object.values(customSplit).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" /> Tip Payout Breakdown
          </h2>
          <p className="text-xs text-gray-500">{todayTx.filter(t => t.tip > 0).length} tipped transactions today</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSplitEditor(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}
          >
            Split %
          </button>
          {signedCount > 0 && (
            <button onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}>
              {saveMutation.isPending ? 'Saving...' : '💾 Save Record'}
            </button>
          )}
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}>
            <Printer className="w-3.5 h-3.5" /> Print Sheet
          </button>
        </div>
      </div>

      {/* ── Total Tip Display ── */}
      <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="text-4xl font-black font-mono text-amber-400">{fmt(totalTips)}</div>
        <div className="text-xs text-gray-500 mt-1">Total Tips to Distribute</div>
        {signedCount > 0 && (
          <div className="text-xs text-green-400 mt-2 font-semibold">
            {signedCount} / {totalEmployees} employees signed
          </div>
        )}
      </div>

      {/* ── Split Editor ── */}
      {showSplitEditor && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
            <span>Customize Tip Split %</span>
            <span className={`text-xs font-black ${splitTotal !== 100 ? 'text-red-400' : 'text-green-400'}`}>
              Total: {splitTotal}% {splitTotal !== 100 ? '⚠ must equal 100' : '✓'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POOLS.map(pool => (
              <div key={pool.key}>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: pool.color }}>
                  {pool.label}
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min={0} max={100}
                    value={customSplit[pool.key]}
                    onChange={e => setCustomSplit(prev => ({ ...prev, [pool.key]: parseInt(e.target.value) || 0 }))}
                    className="h-8 w-16 bg-black/40 border-white/15 text-white font-mono text-sm"
                  />
                  <span className="text-gray-500 text-sm">%</span>
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">{fmt(totalTips * customSplit[pool.key] / 100)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cashier Reference (who ran tips) ── */}
      {Object.keys(tipsByCashier).length > 0 && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2">Tips Collected By Cashier</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tipsByCashier).sort((a, b) => b[1] - a[1]).map(([name, amt]) => (
              <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-sm text-gray-300">{name.split('@')[0]}</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono text-xs">{fmt(amt)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pool Sections ── */}
      {POOLS.map(pool => (
        <PoolSection
          key={pool.key}
          pool={pool}
          employees={byPool[pool.key] || []}
          poolTotal={poolTotals[pool.key]}
          tipSignatures={tipSignatures}
          onSign={handleSign}
        />
      ))}

      {nupsUsers.length === 0 && (
        <div className="text-center py-10 text-gray-600 text-sm">
          No active employees found. Add employees in the Staff tab to see payout breakdown.
        </div>
      )}

      {/* ── Summary Row ── */}
      {totalTips > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-3">Pool Summary</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POOLS.map(pool => {
              const emps = byPool[pool.key] || [];
              const poolTotal = totalTips * (customSplit[pool.key] / 100);
              const perPerson = emps.length > 0 ? poolTotal / emps.length : 0;
              return (
                <div key={pool.key} className="text-center">
                  <div className="text-[10px] text-gray-500">{pool.label}</div>
                  <div className="text-base font-black font-mono" style={{ color: pool.color }}>{fmt(poolTotal)}</div>
                  {emps.length > 0 && <div className="text-[10px] text-gray-600">{fmt(perPerson)}/person</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}