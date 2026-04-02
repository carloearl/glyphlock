import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  FlaskConical, Plus, Trash2, Copy, RefreshCw, Shield, ArrowLeft,
  Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Calendar, User, Tag,
  Database, FileText, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OWNER_EMAIL = 'carloearl@glyphlock.com';

const DEMO_TIERS = [
  { value: "full_demo", label: "Full Demo", desc: "All modules — full system view" },
  { value: "owner_view", label: "Owner View", desc: "Analytics, reports, payroll" },
  { value: "staff_view", label: "Staff View", desc: "POS, clock-in, transactions" },
  { value: "entertainer_view", label: "Entertainer View", desc: "Check-in, contracts, earnings" },
];

export default function NUPSDemoManager() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showPins, setShowPins] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    pin: "",
    demo_tier: "full_demo",
    demo_label: "",
    demo_expires_at: "",
    created_note: "",
  });

  // Gate: Carlo only
  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { navigate("/NUPSGateway"); return; }
        const u = await base44.auth.me();
        if (u?.email?.toLowerCase() !== OWNER_EMAIL) { navigate("/NUPSGateway"); return; }
        setUser(u);
        await loadDemoUsers();
      } catch {
        navigate("/NUPSGateway");
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  const loadDemoUsers = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.NUPSUser.filter({ is_demo: true });
      setDemoUsers(all || []);
    } catch {
      setDemoUsers([]);
    }
    setLoading(false);
  };

  const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();
  const generateUsername = (name) => name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "") + "." + Math.floor(1000 + Math.random() * 9000);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.username || !form.pin) {
      setFeedback({ type: "error", msg: "Name, username, and PIN are required." });
      return;
    }
    setLoading(true);
    try {
      await base44.entities.NUPSUser.create({
        username: form.username.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        pin: form.pin.trim(),
        role: "DEMO",
        status: "active",
        is_demo: true,
        demo_tier: form.demo_tier,
        demo_label: form.demo_label.trim() || null,
        demo_expires_at: form.demo_expires_at || null,
        created_note: form.created_note.trim() || null,
        venue_id: "demo-venue",
        employee_id: `DEMO-${Date.now()}`,
        permissions: [],
      });
      setFeedback({ type: "success", msg: `Demo account created for ${form.full_name}` });
      setForm({ full_name: "", username: "", pin: "", demo_tier: "full_demo", demo_label: "", demo_expires_at: "", created_note: "" });
      setShowForm(false);
      await loadDemoUsers();
    } catch (err) {
      setFeedback({ type: "error", msg: err.message || "Failed to create account." });
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete demo account for ${name}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await base44.entities.NUPSUser.delete(id);
      setFeedback({ type: "success", msg: `Deleted ${name}'s demo access.` });
      await loadDemoUsers();
    } catch (err) {
      setFeedback({ type: "error", msg: "Delete failed." });
    }
    setLoading(false);
  };

  const handleSuspend = async (u) => {
    const newStatus = u.status === "active" ? "suspended" : "active";
    await base44.entities.NUPSUser.update(u.id, { status: newStatus });
    setFeedback({ type: "success", msg: `${u.full_name} ${newStatus === "active" ? "reactivated" : "suspended"}.` });
    await loadDemoUsers();
  };

  const handleSeedContracts = async (clearExisting = false) => {
    if (clearExisting && !confirm('This will DELETE all existing demo contracts for Dream Palace and re-seed fresh data. Continue?')) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await base44.functions.invoke('seedDemoContracts', { clear_existing: clearExisting });
      setSeedResult({ success: true, count: res.data.seeded, contracts: res.data.contracts });
      setFeedback({ type: 'success', msg: `✅ Seeded ${res.data.seeded} Dream Palace demo contracts successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Seed failed: ' + (err.message || 'Unknown error') });
      setSeedResult({ success: false });
    }
    setSeeding(false);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const togglePin = (id) => setShowPins(p => ({ ...p, [id]: !p[id] }));

  if (authChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.07] sticky top-0 z-40 bg-black/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/NUPSGateway")} className="text-gray-600 hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-black text-sm text-white">Demo Account Manager</div>
              <div className="text-[10px] text-emerald-400 tracking-wider">OWNER ONLY · {user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/NUPSSandbox")}
              className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/20 rounded-lg px-3 py-1.5 transition-colors"
            >
              Preview Sandbox
            </button>
            <Button
              onClick={() => setShowForm(f => !f)}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-xs h-8 px-4 font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Demo Account
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
            feedback.type === "success"
              ? "bg-green-500/8 border-green-500/25 text-green-400"
              : "bg-red-500/8 border-red-500/25 text-red-400"
          }`}>
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {feedback.msg}
            <button onClick={() => setFeedback(null)} className="ml-auto text-current opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Demo Data Seeder */}
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h2 className="font-black text-blue-400 text-sm uppercase tracking-widest">Dream Palace — Contract Workflow Demo Data</h2>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Seeds 4 realistic Dream Palace contract records showing the full workflow:
            <span className="text-gray-300"> Draft → Signed → Printed → Scan-Back → Fulfilled.</span>
            <br/>Each record is tagged <code className="text-blue-300 bg-blue-500/10 px-1 rounded">is_demo: true</code> and uses the real Dream Palace venue ID.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Draft', desc: 'Not yet signed', color: 'text-gray-400 border-gray-700' },
              { label: 'Signed → Print', desc: 'Needs printing', color: 'text-yellow-400 border-yellow-700' },
              { label: 'Printed → Scan', desc: 'Awaiting scan-back', color: 'text-blue-400 border-blue-700' },
              { label: 'Fulfilled', desc: 'Complete cycle', color: 'text-green-400 border-green-700' },
            ].map(s => (
              <div key={s.label} className={`border rounded-lg p-2 text-center ${s.color}`}>
                <div className="font-bold text-[10px] uppercase tracking-wide">{s.label}</div>
                <div className="text-[9px] opacity-70 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => handleSeedContracts(false)}
              disabled={seeding}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-xs h-9 px-5 font-bold gap-1.5"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Seed Demo Contracts
            </Button>
            <Button
              onClick={() => handleSeedContracts(true)}
              disabled={seeding}
              variant="outline"
              className="border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs h-9 px-5 font-bold gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear & Re-seed
            </Button>
          </div>

          {seedResult?.success && seedResult.contracts && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-600">Seeded Records</div>
              {seedResult.contracts.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs">
                  <div>
                    <span className="text-white font-semibold">{c.customer_name}</span>
                    <span className="text-gray-600 ml-2 font-mono text-[10px]">{c.contract_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                      c.status === 'fulfilled' ? 'text-green-400 border-green-700' :
                      c.status === 'active' ? 'text-blue-400 border-blue-700' :
                      'text-gray-400 border-gray-700'
                    }`}>{c.status.toUpperCase()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      c.scan_status === 'SCANNED' ? 'text-green-400 border-green-700' : 'text-yellow-400 border-yellow-700'
                    }`}>{c.scan_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-400/80">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <strong className="text-amber-400">Owner-Only Panel.</strong> Demo accounts you create here grant real access to the N.U.P.S. Sandbox for underwriters, licensees, and partners. Accounts are scoped to demo mode only — no production data is accessible. Credentials are stored securely. Share login details directly and securely with each recipient.
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/4 p-5 space-y-4">
            <h2 className="font-black text-emerald-400 text-sm uppercase tracking-widest">Create Demo Account</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => {
                      const name = e.target.value;
                      setForm(f => ({ ...f, full_name: name, username: f.username || generateUsername(name) }));
                    }}
                    placeholder="Jane Smith"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Username *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="jane.smith.4821"
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">PIN (6 digits) *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.pin}
                      onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                      placeholder="••••••"
                      maxLength={8}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, pin: generatePin() }))}
                      className="px-2.5 rounded-lg border border-white/10 text-gray-500 hover:text-white text-[10px] whitespace-nowrap transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Demo Tier</label>
                  <select
                    value={form.demo_tier}
                    onChange={e => setForm(f => ({ ...f, demo_tier: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    {DEMO_TIERS.map(t => (
                      <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Label (who is this for?)</label>
                  <input
                    type="text"
                    value={form.demo_label}
                    onChange={e => setForm(f => ({ ...f, demo_label: e.target.value }))}
                    placeholder="Underwriter — ABC Capital Partners"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Expires (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.demo_expires_at}
                    onChange={e => setForm(f => ({ ...f, demo_expires_at: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Admin Note</label>
                <input
                  type="text"
                  value={form.created_note}
                  onChange={e => setForm(f => ({ ...f, created_note: e.target.value }))}
                  placeholder="e.g. Sent to Jane for licensing review call on 3/20"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-600 to-green-600 font-bold h-10 px-6">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  Create Account
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-gray-400 h-10">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Demo Accounts List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">
              Active Demo Accounts <span className="text-gray-600 font-normal normal-case">({demoUsers.length})</span>
            </h2>
            <button onClick={loadDemoUsers} disabled={loading} className="text-gray-600 hover:text-gray-400 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading && demoUsers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
          ) : demoUsers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/[0.06] rounded-2xl">
              <FlaskConical className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No demo accounts yet.</p>
              <p className="text-gray-700 text-xs mt-1">Create one to share sandbox access with underwriters or partners.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {demoUsers.map(u => {
                const isExpired = u.demo_expires_at && new Date(u.demo_expires_at) < new Date();
                const tier = DEMO_TIERS.find(t => t.value === u.demo_tier);
                return (
                  <div key={u.id} className={`rounded-xl border p-4 transition-all ${
                    u.status === "suspended" || isExpired
                      ? "border-red-500/15 bg-red-500/3 opacity-60"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white">{u.full_name}</span>
                          {isExpired && <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">EXPIRED</span>}
                          {u.status === "suspended" && <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5">SUSPENDED</span>}
                          {tier && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">{tier.label}</span>}
                        </div>

                        {u.demo_label && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Tag className="w-3 h-3" />
                            {u.demo_label}
                          </div>
                        )}

                        {/* Credentials box */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="flex items-center gap-1.5 bg-black/50 border border-white/[0.07] rounded-lg px-3 py-1.5">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-mono text-gray-300">{u.username}</span>
                            <button onClick={() => copyToClipboard(u.username, `un-${u.id}`)} className="text-gray-600 hover:text-violet-400 transition-colors ml-1">
                              {copied === `un-${u.id}` ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/50 border border-white/[0.07] rounded-lg px-3 py-1.5">
                            <span className="text-xs font-mono text-gray-300">
                              {showPins[u.id] ? u.pin : "••••••"}
                            </span>
                            <button onClick={() => togglePin(u.id)} className="text-gray-600 hover:text-gray-400 ml-1">
                              {showPins[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            {showPins[u.id] && (
                              <button onClick={() => copyToClipboard(u.pin, `pin-${u.id}`)} className="text-gray-600 hover:text-violet-400 transition-colors">
                                {copied === `pin-${u.id}` ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {u.demo_expires_at && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <Calendar className="w-3 h-3" />
                            Expires: {new Date(u.demo_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                        {u.last_login && (
                          <div className="text-[11px] text-gray-700">Last login: {new Date(u.last_login).toLocaleString()}</div>
                        )}
                        {u.created_note && (
                          <div className="text-[11px] text-gray-600 italic">{u.created_note}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSuspend(u)}
                          className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                            u.status === "active"
                              ? "border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                              : "border-green-500/20 text-green-400 hover:bg-green-500/10"
                          }`}
                        >
                          {u.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.full_name)}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-800 tracking-widest pb-6">
          DEMO MANAGER · OWNER ACCESS ONLY · GLYPHLOCK FINANCIAL LLC
        </p>
      </div>
    </div>
  );
}