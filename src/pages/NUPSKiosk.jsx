import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import KioskPinPad from "@/components/nups/kiosk/KioskPinPad";
import OwnerAdminSignIn from "@/components/nups/kiosk/OwnerAdminSignIn";
import AccessRequestForm from "@/components/nups/kiosk/AccessRequestForm";
import { Clock, LogOut, ShieldCheck, UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §3 — Public kiosk entry.
// Shows ONLY: Staff Clock In, Staff Clock Out, Owner/Admin Sign In, Request Owner/Admin Access.
// No dashboards, menus, revenue, staff lists, contracts, or configuration before authentication.

const PANELS = [
  { key: "clockIn", label: "Staff Clock In", icon: Clock, color: "from-cyan-700 to-cyan-900" },
  { key: "clockOut", label: "Staff Clock Out", icon: LogOut, color: "from-slate-700 to-slate-900" },
  { key: "admin", label: "Owner / Admin Sign In", icon: ShieldCheck, color: "from-violet-700 to-violet-900" },
  { key: "request", label: "Request Owner / Admin Access", icon: UserPlus, color: "from-indigo-700 to-indigo-900" },
];

export default function NUPSKiosk() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("panel");
    if (p && PANELS.some((x) => x.key === p)) setPanel(p);
  }, []);

  const onClockIn = (data) => {
    if (data?.user) {
      sessionStorage.setItem("nups_kiosk_operator", JSON.stringify({
        name: data.user.full_name, role: data.user.role, workspace: data.workspace, shift_id: data.shift_id,
      }));
    }
    if (data?.kiosk_session) sessionStorage.setItem("nups_kiosk_session", data.kiosk_session);
    if (data?.destination && data.destination !== "/NUPSKiosk") {
      navigate(data.destination);
    } else {
      setResult({ type: "in", name: data?.user?.full_name, workspace: data?.workspace });
    }
  };

  const onClockOut = (data) => {
    sessionStorage.removeItem("nups_kiosk_operator");
    sessionStorage.removeItem("nups_kiosk_session");
    setResult({ type: "out", name: data?.user?.full_name });
  };

  const active = PANELS.find((p) => p.key === panel);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient glow backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <div className="w-32 h-32 mx-auto mb-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_60px_-15px_rgba(139,92,246,0.5)] flex items-center justify-center">
            <img src="https://media.base44.com/images/public/697a087fb354faebb72df54b/ac7def988_d8c1c28f-21e9-47c1-99ac-394132e7c9ce.png"
              alt="NUPS" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-4xl font-black tracking-[0.3em] bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">NUPS</h1>
          <p className="text-slate-500 text-sm mt-2 tracking-wide">Staff Entry & Clock Station</p>
        </div>

        {result ? (
          <div className="text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400" />
            <p className="text-xl font-semibold">
              {result.type === "in" ? `Clocked in — ${result.name}` : `Clocked out — ${result.name}`}
            </p>
            {result.type === "in" && result.workspace && (
              <p className="text-slate-400 text-sm">Workspace: {result.workspace}</p>
            )}
            <button onClick={() => { setResult(null); setPanel(null); }}
              className="w-full h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              Done
            </button>
          </div>
        ) : !panel ? (
          <div className="grid gap-4">
            {PANELS.map((p) => (
              <button key={p.key} onClick={() => setPanel(p.key)}
                className={`h-20 rounded-2xl bg-gradient-to-br ${p.color} backdrop-blur-xl bg-opacity-40 border border-white/15 flex items-center gap-4 px-6 text-left shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] hover:border-white/30 transition-all active:scale-[0.99]`}>
                <span className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <p.icon className="w-6 h-6" />
                </span>
                <span className="text-lg font-semibold">{p.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPanel(null)} className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold">{active.label}</h2>
            </div>
            {panel === "clockIn" && <KioskPinPad mode="clockIn" onSuccess={onClockIn} />}
            {panel === "clockOut" && <KioskPinPad mode="clockOut" onSuccess={onClockOut} />}
            {panel === "admin" && <OwnerAdminSignIn />}
            {panel === "request" && <AccessRequestForm />}
          </div>
        )}
      </div>
    </div>
  );
}