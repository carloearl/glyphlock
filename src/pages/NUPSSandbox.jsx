import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FlaskConical, Shield, DollarSign, Users, Clock, FileText,
  CreditCard, BarChart3, CheckCircle2, ArrowLeft, Play, Banknote,
  UserCheck, Music, Crown, AlertTriangle, RefreshCw, Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "sb-u1", name: "Alex Rivera", role: "Manager", email: "alex@demo.nups", status: "active" },
  { id: "sb-u2", name: "Jamie Chen", role: "Bartender", email: "jamie@demo.nups", status: "active" },
  { id: "sb-u3", name: "Casey Williams", role: "DJ", email: "casey@demo.nups", status: "active" },
];

const MOCK_ENTERTAINERS = [
  { id: "sb-e1", name: "Destiny", legal: "Tanya Moore", status: "checked_in", earnings: 840.00, vip: 3 },
  { id: "sb-e2", name: "Luna", legal: "Brianna Reyes", status: "active", earnings: 620.00, vip: 2 },
  { id: "sb-e3", name: "Scarlett", legal: "Mia Torres", status: "checked_in", earnings: 1120.00, vip: 5 },
];

const MOCK_SHIFTS = [
  { id: "sb-s1", name: "Jamie Chen", in: "7:00 PM", out: null, duration: "3h 42m", status: "active" },
  { id: "sb-s2", name: "Casey Williams", in: "6:30 PM", out: null, duration: "4h 12m", status: "active" },
  { id: "sb-s3", name: "Destiny", in: "8:00 PM", out: null, duration: "2h 55m", status: "active" },
];

const MOCK_TRANSACTIONS = [
  { id: "sb-t1", items: "VIP Package", amount: 450.00, method: "Credit Card", time: "9:42 PM" },
  { id: "sb-t2", items: "Bottle Service", amount: 320.00, method: "Cash", time: "9:15 PM" },
  { id: "sb-t3", items: "Dream Dollars × $500", amount: 650.00, method: "Credit Card", time: "8:58 PM" },
  { id: "sb-t4", items: "Cover Charge × 4", amount: 80.00, method: "Cash", time: "8:30 PM" },
];

const MOCK_CONTRACTS = [
  { id: "sb-c1", entertainer: "Destiny", event: "VIP Suite B — 3hr", status: "signed", value: 450.00 },
  { id: "sb-c2", entertainer: "Luna", event: "Main Stage Show", status: "issued", value: 200.00 },
  { id: "sb-c3", entertainer: "Scarlett", event: "VIP Suite A — 5hr", status: "draft", value: 750.00 },
];

const MOCK_PAYROLL = [
  { name: "Destiny", period: "Mar 1–15", gross: 840.00, deductions: 201.60, net: 638.40, status: "approved" },
  { name: "Luna", period: "Mar 1–15", gross: 620.00, deductions: 148.80, net: 471.20, status: "draft" },
  { name: "Scarlett", period: "Mar 1–15", gross: 1120.00, deductions: 268.80, net: 851.20, status: "paid" },
];

const STATUS_BADGE = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  checked_in: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  issued: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  signed: "bg-green-500/10 text-green-400 border-green-500/20",
  approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const SECTIONS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "pos", label: "POS Register", icon: CreditCard },
  { key: "staff", label: "Staff & Clock-In", icon: Clock },
  { key: "entertainers", label: "Entertainers", icon: Music },
  { key: "contracts", label: "Contracts", icon: FileText },
  { key: "payroll", label: "Payroll", icon: DollarSign },
];

export default function NUPSSandbox() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [cart, setCart] = useState([]);
  const [lastTx, setLastTx] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleResetDemo = async () => {
    setResetting(true);
    setResetDone(false);
    try {
      // Seed test DB with demo entertainers
      await Promise.all([
        base44.entities.Entertainer.bulkCreate([
          { stage_name: "Destiny", legal_name: "Tanya Moore", status: "active", contract_signed: true, commission_rate: 0.5, total_earnings: 840 },
          { stage_name: "Luna",    legal_name: "Brianna Reyes", status: "active", contract_signed: true, commission_rate: 0.5, total_earnings: 620 },
          { stage_name: "Scarlett",legal_name: "Mia Torres",   status: "active", contract_signed: true, commission_rate: 0.5, total_earnings: 1120 },
        ], { data_env: "dev" }).catch(() => {}),
        base44.entities.POSTransaction.bulkCreate([
          { transaction_id: `DEMO-${Date.now()}-1`, total: 450, payment_method: "Credit Card", cashier: "demo@nups.local", status: "completed" },
          { transaction_id: `DEMO-${Date.now()}-2`, total: 320, payment_method: "Cash",        cashier: "demo@nups.local", status: "completed" },
          { transaction_id: `DEMO-${Date.now()}-3`, total: 650, payment_method: "Credit Card", cashier: "demo@nups.local", status: "completed" },
        ], { data_env: "dev" }).catch(() => {}),
      ]);
      setResetDone(true);
    } catch (e) {
      setResetDone(false);
    }
    setResetting(false);
  };

  const fmt = (n) => `$${Number(n).toFixed(2)}`;
  const total = cart.reduce((s, i) => s + i.price, 0);

  const addItem = (item) => setCart(c => [...c, { ...item, id: Date.now() }]);
  const completeSale = () => {
    if (cart.length === 0) return;
    setLastTx({ items: cart.map(i => i.label).join(", "), total, time: new Date().toLocaleTimeString() });
    setCart([]);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-4">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-400/80">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Sandbox Mode — All data is mock/demo only. No real transactions, contracts, or payroll records are created.</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Active Staff", value: "3", color: "text-cyan-400", icon: Users },
                { label: "Tonight Revenue", value: "$1,500", color: "text-green-400", icon: DollarSign },
                { label: "VIP Rooms Active", value: "2/4", color: "text-pink-400", icon: Crown },
                { label: "On Clock", value: "5", color: "text-violet-400", icon: Clock },
              ].map(({ label, value, color, icon: Icon }) => (
                <Card key={label} className="bg-gray-900/50 border-white/[0.06]">
                  <CardContent className="p-4">
                    <Icon className={`w-5 h-5 ${color} mb-1`} />
                    <div className={`text-xl font-black ${color}`}>{value}</div>
                    <div className="text-[11px] text-gray-500">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gray-900/50 border-white/[0.06]">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Sandbox Workflows Available</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: "POS Transaction", section: "pos" },
                  { label: "Staff Clock-In", section: "staff" },
                  { label: "Entertainer Check-In", section: "entertainers" },
                  { label: "VIP Contract", section: "contracts" },
                  { label: "Manager Approval", section: "contracts" },
                  { label: "Payroll Review", section: "payroll" },
                ].map(w => (
                  <button
                    key={w.label}
                    onClick={() => setActiveSection(w.section)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 text-left transition-all"
                  >
                    <Play className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300">{w.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case "pos":
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Demo POS — Tap items to add to cart, then complete the sale.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Cover Charge", price: 20 },
                { label: "Bottle Service", price: 320 },
                { label: "VIP Package", price: 450 },
                { label: "Dream Dollars $100", price: 130 },
                { label: "Cocktail", price: 18 },
                { label: "Champagne", price: 85 },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => addItem(item)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 active:scale-95 transition-all text-center"
                >
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className="text-green-400 font-black text-lg">{fmt(item.price)}</div>
                </button>
              ))}
            </div>
            <div className="bg-black/40 border border-white/[0.08] rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2">Cart ({cart.length} items)</div>
              {cart.length === 0 ? <p className="text-gray-600 text-sm">Empty</p> : (
                <div className="space-y-1 mb-3">
                  {cart.map(i => <div key={i.id} className="flex justify-between text-sm"><span className="text-gray-300">{i.label}</span><span className="text-green-400 font-mono">{fmt(i.price)}</span></div>)}
                  <div className="border-t border-white/[0.08] pt-2 flex justify-between font-black"><span className="text-white">Total</span><span className="text-green-400 text-xl font-mono">{fmt(total)}</span></div>
                </div>
              )}
              <Button onClick={completeSale} disabled={cart.length === 0} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-black h-12">
                Complete Sale
              </Button>
              {lastTx && (
                <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-green-400 inline mr-1" />
                  Sale complete: <span className="text-green-400 font-bold">{fmt(lastTx.total)}</span> — {lastTx.time}
                </div>
              )}
            </div>
            {MOCK_TRANSACTIONS.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-sm">
                <div><div className="text-white font-medium">{t.items}</div><div className="text-gray-600 text-xs">{t.time} · {t.method}</div></div>
                <div className="text-green-400 font-black font-mono">{fmt(t.amount)}</div>
              </div>
            ))}
          </div>
        );

      case "staff":
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Demo staff and clock-in status. In production, staff enter a PIN to clock in/out.</p>
            {MOCK_USERS.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white">{u.name[0]}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{u.role}</Badge>
              </div>
            ))}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Active Shifts</p>
              {MOCK_SHIFTS.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 mb-2 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div><div className="font-bold text-white text-sm">{s.name}</div><div className="text-xs text-gray-500">In since {s.in}</div></div>
                  <div className="text-green-400 font-mono text-sm font-bold">{s.duration}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "entertainers":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Demo entertainer dashboard. Shows check-in status, earnings, and VIP sessions.</p>
            {MOCK_ENTERTAINERS.map(e => (
              <div key={e.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-white text-base">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.legal}</div>
                  </div>
                  <Badge className={STATUS_BADGE[e.status]}>{e.status.replace("_", " ")}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-black/30 rounded-lg p-2 text-center"><div className="text-green-400 font-black">{fmt(e.earnings)}</div><div className="text-[10px] text-gray-600">Earnings</div></div>
                  <div className="bg-black/30 rounded-lg p-2 text-center"><div className="text-pink-400 font-black">{e.vip}</div><div className="text-[10px] text-gray-600">VIP Sessions</div></div>
                </div>
              </div>
            ))}
          </div>
        );

      case "contracts":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Demo VIP contract lifecycle. Contracts move: Draft → Issued → Signed → Archived.</p>
            {MOCK_CONTRACTS.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">{c.entertainer}</div>
                  <Badge className={STATUS_BADGE[c.status]}>{c.status}</Badge>
                </div>
                <div className="text-xs text-gray-400">{c.event}</div>
                <div className="text-green-400 font-black mt-1">{fmt(c.value)}</div>
                <div className="flex gap-2 mt-3">
                  {c.status === "draft" && <Button size="sm" className="text-xs h-7 bg-blue-600/20 border border-blue-500/30 text-blue-400">Issue Contract</Button>}
                  {c.status === "issued" && <Button size="sm" className="text-xs h-7 bg-green-600/20 border border-green-500/30 text-green-400">Sign Contract</Button>}
                  {c.status === "signed" && <Button size="sm" className="text-xs h-7 bg-gray-600/20 border border-gray-500/30 text-gray-400">Archive</Button>}
                </div>
              </div>
            ))}
          </div>
        );

      case "payroll":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Demo payroll records. Manager can approve and mark as paid.</p>
            {MOCK_PAYROLL.map(p => (
              <div key={p.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="flex items-center justify-between mb-2">
                  <div><div className="font-bold text-white">{p.name}</div><div className="text-xs text-gray-500">{p.period}</div></div>
                  <Badge className={STATUS_BADGE[p.status]}>{p.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center"><div className="text-cyan-400 font-black text-sm">{fmt(p.gross)}</div><div className="text-[10px] text-gray-600">Gross</div></div>
                  <div className="text-center"><div className="text-red-400 font-black text-sm">-{fmt(p.deductions)}</div><div className="text-[10px] text-gray-600">Deductions</div></div>
                  <div className="text-center"><div className="text-green-400 font-black text-sm">{fmt(p.net)}</div><div className="text-[10px] text-gray-600">Net Pay</div></div>
                </div>
                {p.status === "draft" && (
                  <Button size="sm" className="mt-3 text-xs h-7 w-full bg-blue-600/20 border border-blue-500/30 text-blue-400">Approve Payroll</Button>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] p-4 bg-black/95 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/NUPSGateway")} className="text-gray-600 hover:text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-white text-sm">N.U.P.S. Sandbox</div>
              <div className="text-[10px] text-emerald-400">Demo Mode — No real data</div>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">SANDBOX</Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 flex gap-4">
        {/* Sidebar nav */}
        <div className="w-36 flex-shrink-0">
          <div className="space-y-1 sticky top-20">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-medium ${
                    activeSection === s.key
                      ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-1">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}