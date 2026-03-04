import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Printer, Users, Star, Music, Shield, Disc3, ChevronDown, ChevronUp, PenLine
} from "lucide-react";

// ─── Role → pool ─────────────────────────────────────────────────────
const ROLE_POOLS = {
  PLATFORM_ADMIN:  "manager",
  VENUE_OWNER:     "manager",
  VENUE_MANAGER:   "manager",
  FLOOR_HOST:      "hostess",
  BARTENDER:       "security",  // security / leftover pool
  SECURITY:        "security",
  KIOSK:           "security",
  DJ:              "dj",
  PERFORMER:       "entertainer",
};

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

// ─── Payout Calculator ────────────────────────────────────────────────
// Rules:
//  1. Each entertainer gets 37% of totalTips (individually, nightly)
//  2. Hostess pool = defined pct of remaining after entertainers; split equally (2 hostesses)
//  3. Manager = hostess per-person + $100
//  4. DJ + Asst Manager = 50% of total hostess pool, split equally between them
//  5. Security = whatever is left, split equally
function computePayouts(totalTips, byPool) {
  const entertainers = byPool.entertainer || [];
  const hostesses    = byPool.hostess     || [];
  const managers     = byPool.manager     || [];
  const djs          = byPool.dj          || [];
  const security     = byPool.security    || [];

  // 1. Entertainers — each individual gets 37% of totalTips
  const entertainerPerPerson = totalTips * 0.37;
  const entertainerTotal     = entertainerPerPerson * entertainers.length; // sum paid out

  // 2. Hostess pool — 15% of totalTips, split equally
  const hostessTotal     = totalTips * 0.15;
  const hostessPerPerson = hostesses.length > 0 ? hostessTotal / hostesses.length : 0;

  // 3. Manager — hostess per-person + $100 each
  const managerPerPerson = hostessPerPerson + 100;
  const managerTotal     = managerPerPerson * managers.length;

  // 4. DJ (and any "Asst Manager" stored as DJ role) — 50% of hostess total pool, split equally
  const djTotal     = hostessTotal * 0.5;
  const djPerPerson = djs.length > 0 ? djTotal / djs.length : 0;

  // 5. Security — everything left over
  const allocated      = entertainerTotal + hostessTotal + managerTotal + djTotal;
  const securityTotal  = Math.max(0, totalTips - allocated);
  const securityPerPerson = security.length > 0 ? securityTotal / security.length : 0;

  return {
    entertainer: { total: entertainerTotal, perPerson: entertainerPerPerson, employees: entertainers },
    hostess:     { total: hostessTotal,     perPerson: hostessPerPerson,     employees: hostesses   },
    manager:     { total: managerTotal,     perPerson: managerPerPerson,     employees: managers    },
    dj:          { total: djTotal,          perPerson: djPerPerson,          employees: djs         },
    security:    { total: securityTotal,    perPerson: securityPerPerson,    employees: security    },
  };
}

// ─── Pool display config ──────────────────────────────────────────────
const POOL_CONFIG = [
  { key: "entertainer", label: "Entertainer (37% each)", color: "#ec4899", icon: <Music  className="w-4 h-4" />, note: "37% of total — per performer" },
  { key: "hostess",     label: "Hostess / Host",         color: "#f59e0b", icon: <Star   className="w-4 h-4" />, note: "15% of total — split equally" },
  { key: "manager",     label: "Manager / Promo",        color: "#a855f7", icon: <Shield className="w-4 h-4" />, note: "Hostess share + $100 each"   },
  { key: "dj",          label: "DJ / Asst Manager",      color: "#22d3ee", icon: <Disc3  className="w-4 h-4" />, note: "50% of hostess pool, split"  },
  { key: "security",    label: "Security / Staff",       color: "#6b7280", icon: <Users  className="w-4 h-4" />, note: "Remainder — split equally"   },
];

// ─── TipLine Row ──────────────────────────────────────────────────────
function TipLine({ name, color, amount, signature, onSign }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate">{name}</div>
      </div>
      <div className="text-base font-black font-mono" style={{ color }}>{fmt(amount)}</div>
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
function PoolSection({ config, payout, tipSignatures, onSign }) {
  const [open, setOpen] = useState(true);
  const { employees, perPerson, total } = payout;
  if (employees.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${config.color}25`, background: `${config.color}08` }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-all"
        onClick={() => setOpen(v => !v)}
        style={{ background: `${config.color}10` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: config.color }}>{config.icon}</span>
          <span className="font-black text-sm text-white">{config.label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${config.color}20`, color: config.color }}>
            {employees.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-black font-mono text-base" style={{ color: config.color }}>{fmt(total)}</span>
          <span className="text-[10px] text-gray-500">{fmt(perPerson)}/ea</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3">
          <div className="text-[10px] text-gray-500 py-2">{config.note}</div>
          {employees.map(emp => (
            <TipLine
              key={emp.id}
              name={emp.full_name || emp.username || emp.id}
              color={config.color}
              amount={perPerson}
              signature={tipSignatures[emp.id]}
              onSign={() => onSign(emp.id, emp.full_name || emp.username)}
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

  const { data: nupsUsers = [] } = useQuery({
    queryKey: ['nups-users-for-tip'],
    queryFn: () => base44.entities.NUPSUser.filter({ status: "active" }),
  });

  const todayTx = transactions.filter(t => new Date(t.created_date).toDateString() === today);
  const totalTips = todayTx.reduce((s, t) => s + (t.tip || 0), 0);

  const tipsByCashier = {};
  todayTx.forEach(t => {
    if (t.tip > 0) {
      const c = t.cashier || 'Unknown';
      tipsByCashier[c] = (tipsByCashier[c] || 0) + t.tip;
    }
  });

  const byPool = useMemo(() => {
    const pools = { staff: [], hostess: [], manager: [], entertainer: [], dj: [], security: [] };
    nupsUsers.forEach(u => {
      const p = ROLE_POOLS[u.role] || "security";
      if (pools[p]) pools[p].push(u);
    });
    return pools;
  }, [nupsUsers]);

  const payouts = useMemo(() => computePayouts(totalTips, byPool), [totalTips, byPool]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.TipPayout.create(data),
    onSuccess: () => toast.success('Tip payout saved to record.'),
    onError: () => toast.error('Failed to save payout record.'),
  });

  const handleSign = (empId, name) => {
    setTipSignatures(prev => ({ ...prev, [empId]: { signed_at: new Date().toISOString(), name } }));
  };

  const signedCount = Object.keys(tipSignatures).length;
  const totalEmployees = nupsUsers.length;

  const handleSave = () => {
    const signatures = Object.entries(tipSignatures).map(([empId, sig]) => {
      const emp = nupsUsers.find(u => u.id === empId);
      const poolKey = emp ? (ROLE_POOLS[emp.role] || 'security') : 'security';
      const payout = payouts[poolKey];
      return {
        employee_id: empId,
        employee_name: sig.name,
        pool: poolKey,
        amount: parseFloat((payout?.perPerson || 0).toFixed(2)),
        signed_at: sig.signed_at,
      };
    });

    saveMutation.mutate({
      payout_date: new Date().toISOString().split('T')[0],
      total_tips: totalTips,
      split_config: { formula: "37pct-entertainer / 15pct-hostess / hostess+100-manager / 50pct-dj / leftover-security" },
      signatures,
      cashier_summary: tipsByCashier,
      manager_email: '',
      status: 'completed',
    });
  };

  const handlePrint = () => {
    const rows = POOL_CONFIG.flatMap(cfg => {
      const payout = payouts[cfg.key];
      if (!payout || payout.employees.length === 0) return [];
      return payout.employees.map(emp => `
        <tr>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;">${emp.full_name || emp.username || '—'}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;color:#666;">${cfg.label}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;font-size:10px;color:#888;">${cfg.note}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;">$${payout.perPerson.toFixed(2)}</td>
          <td style="padding:6px 4px;border-bottom:1px solid #eee;width:140px;">
            <div style="border-bottom:1px solid #000;height:24px;margin-top:8px;"></div>
          </td>
        </tr>`);
    }).join('');

    const poolSummary = POOL_CONFIG.map(cfg => {
      const p = payouts[cfg.key];
      return p && p.employees.length > 0
        ? `${cfg.label}: ${fmt(p.total)} (${fmt(p.perPerson)}/ea)` : null;
    }).filter(Boolean).join(' | ');

    const html = `<html><head><title>Tip Payout Sheet</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;font-size:12px;}
    table{width:100%;border-collapse:collapse;}th{text-align:left;padding:6px 4px;border-bottom:2px solid #000;font-size:11px;text-transform:uppercase;}
    @media print{@page{margin:12mm;size:letter;}}</style></head><body>
    <div style="text-align:center;font-size:18px;font-weight:bold;letter-spacing:2px;">NIGHTLY TIP PAYOUT SHEET</div>
    <div style="text-align:center;font-size:11px;margin-top:2px;">Dream Palace — 815 N. Scottsdale Rd, Tempe AZ 85281</div>
    <div style="text-align:center;font-size:11px;">${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
    <hr style="margin:10px 0;border-top:2px solid #000;"/>
    <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px;">
      <span><strong>TOTAL NIGHTLY TIPS:</strong></span>
      <span style="font-size:20px;font-weight:900;">$${totalTips.toFixed(2)}</span>
    </div>
    <div style="font-size:9px;color:#555;margin-bottom:10px;">Formula: Entertainers 37% each · Hostess 15% split · Manager = Hostess+$100 · DJ/AsstMgr = 50% of Hostess pool · Security = remainder</div>
    <div style="font-size:10px;color:#333;margin-bottom:10px;">${poolSummary}</div>
    <table>
      <thead><tr><th>Employee</th><th>Role</th><th>Formula</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Signature</th></tr></thead>
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" /> Nightly Tip Payout
          </h2>
          <p className="text-xs text-gray-500">{todayTx.filter(t => t.tip > 0).length} tipped transactions today</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Total */}
      <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="text-4xl font-black font-mono text-amber-400">{fmt(totalTips)}</div>
        <div className="text-xs text-gray-500 mt-1">Total Nightly Tips (Cash + Card)</div>
        {signedCount > 0 && (
          <div className="text-xs text-green-400 mt-2 font-semibold">
            {signedCount} / {totalEmployees} signed
          </div>
        )}
      </div>

      {/* Formula legend */}
      <div className="rounded-xl p-3 text-[10px] text-gray-500 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-bold text-gray-400 uppercase tracking-widest mb-2">Payout Formula</div>
        <div>🎤 <strong className="text-pink-400">Entertainer</strong> — 37% of total tips each (per performer, nightly)</div>
        <div>⭐ <strong className="text-amber-400">Hostess / Host</strong> — 15% of total, split equally</div>
        <div>🛡 <strong className="text-purple-400">Manager / Promo</strong> — Hostess share + $100 each</div>
        <div>🎧 <strong className="text-cyan-400">DJ / Asst Manager</strong> — 50% of hostess pool total, split equally</div>
        <div>👥 <strong className="text-gray-400">Security / Staff</strong> — Remaining balance, split equally</div>
      </div>

      {/* Cashier reference */}
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

      {/* Pool Sections */}
      {POOL_CONFIG.map(cfg => (
        <PoolSection
          key={cfg.key}
          config={cfg}
          payout={payouts[cfg.key]}
          tipSignatures={tipSignatures}
          onSign={handleSign}
        />
      ))}

      {nupsUsers.length === 0 && (
        <div className="text-center py-10 text-gray-600 text-sm">
          No active employees found. Add employees in the Staff tab to see payout breakdown.
        </div>
      )}

      {/* Summary */}
      {totalTips > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-3">Pool Summary</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {POOL_CONFIG.map(cfg => {
              const p = payouts[cfg.key];
              return (
                <div key={cfg.key} className="text-center">
                  <div className="text-[10px] text-gray-500">{cfg.label}</div>
                  <div className="text-base font-black font-mono" style={{ color: cfg.color }}>{fmt(p?.total || 0)}</div>
                  {p?.employees.length > 0 && <div className="text-[10px] text-gray-600">{fmt(p.perPerson)}/ea</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-600 text-right">
            Total allocated: {fmt(
              (payouts.entertainer?.total || 0) +
              (payouts.hostess?.total    || 0) +
              (payouts.manager?.total    || 0) +
              (payouts.dj?.total         || 0) +
              (payouts.security?.total   || 0)
            )}
          </div>
        </div>
      )}
    </div>
  );
}