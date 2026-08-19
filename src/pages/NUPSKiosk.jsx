import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import KioskPinPad from "@/components/nups/kiosk/KioskPinPad";
import OwnerAdminSignIn from "@/components/nups/kiosk/OwnerAdminSignIn";
import AccessRequestForm from "@/components/nups/kiosk/AccessRequestForm";
import KioskLocalClock from "@/components/nups/kiosk/KioskLocalClock";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Expand,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  isEmbeddedPreview,
  isSecureDisplayActive,
  requestSecureDisplay,
} from "@/lib/nups/secureDisplay";

// Public kiosk entry. Operational controls remain hidden until NUPS is running
// in fullscreen, an installed standalone window, or the Base44 editor preview.
const PANELS = [
  {
    key: "clockIn",
    label: "Check In",
    hint: "Entertainers & staff — enter your 4-digit PIN",
    icon: Clock,
    color: "from-cyan-600 to-cyan-900",
  },
  {
    key: "clockOut",
    label: "Check Out",
    hint: "End your shift",
    icon: LogOut,
    color: "from-slate-700 to-slate-900",
  },
  {
    key: "admin",
    label: "Owner / Admin Sign In",
    hint: "Back office and management",
    icon: ShieldCheck,
    color: "from-violet-700 to-violet-900",
  },
  {
    key: "testRequest",
    label: "Request Test Access",
    hint: "New account — reviewed by the owner",
    icon: UserPlus,
    color: "from-indigo-700 to-indigo-900",
  },
  {
    key: "trainingRequest",
    label: "Request Training Access",
    hint: "Practice mode — reviewed by the owner",
    icon: UserPlus,
    color: "from-emerald-700 to-emerald-900",
  },
];

export default function NUPSKiosk() {
  const navigate = useNavigate();
  const preview = isEmbeddedPreview();
  const [panel, setPanel] = useState(null);
  const [result, setResult] = useState(null);
  const [secureDisplay, setSecureDisplay] = useState(preview || isSecureDisplayActive());
  const [entering, setEntering] = useState(false);
  const [displayError, setDisplayError] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("panel");
    if (p && PANELS.some((x) => x.key === p)) setPanel(p);
  }, []);

  useEffect(() => {
    if (preview) return undefined;
    const sync = () => setSecureDisplay(isSecureDisplayActive());
    document.addEventListener("fullscreenchange", sync);
    window.addEventListener("focus", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [preview]);

  const enterSecureNUPS = async () => {
    setEntering(true);
    setDisplayError("");
    const ok = await requestSecureDisplay();
    setSecureDisplay(ok || isSecureDisplayActive());
    if (!ok && !isSecureDisplayActive()) {
      setDisplayError(
        "Fullscreen was blocked. Open the published NUPS app directly or launch the installed NUPS app."
      );
    }
    setEntering(false);
  };

  const onClockIn = (data) => {
    if (data?.user) {
      sessionStorage.setItem("nups_kiosk_operator", JSON.stringify({
        name: data.user.full_name,
        role: data.user.role,
        workspace: data.workspace,
        shift_id: data.shift_id,
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <div className="w-32 h-32 mx-auto mb-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_60px_-15px_rgba(139,92,246,0.5)] flex items-center justify-center">
            <img
              src="https://media.base44.com/images/public/697a087fb354faebb72df54b/ac7def988_d8c1c28f-21e9-47c1-99ac-394132e7c9ce.png"
              alt="NUPS"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-4xl font-black tracking-[0.3em] bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">NUPS</h1>
        </div>

        {!secureDisplay ? (
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-7 text-center shadow-2xl">
            <LockKeyhole className="w-12 h-12 mx-auto text-cyan-300 mb-4" />
            <h2 className="text-2xl font-black">Enter Secure NUPS</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              NUPS opens in fullscreen so staff and entertainers work inside the venue system without the browser controls covering the station.
            </p>
            <button
              onClick={enterSecureNUPS}
              disabled={entering}
              className="mt-6 w-full min-h-[58px] rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Expand className="w-5 h-5" />
              {entering ? "Opening…" : "Enter Secure NUPS"}
            </button>
            {displayError && (
              <p className="mt-4 text-sm text-amber-300 bg-amber-950/30 border border-amber-700/40 rounded-lg p-3">
                {displayError}
              </p>
            )}
            <button
              onClick={() => navigate("/")}
              className="mt-4 text-sm text-slate-500 hover:text-white"
            >
              Return to GlyphLock
            </button>
          </div>
        ) : result ? (
          <div className="text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400" />
            <p className="text-xl font-semibold">
              {result.type === "in" ? `Clocked in — ${result.name}` : `Clocked out — ${result.name}`}
            </p>
            {result.type === "in" && result.workspace && (
              <p className="text-slate-400 text-sm">Workspace: {result.workspace}</p>
            )}
            <button
              onClick={() => { setResult(null); setPanel(null); }}
              className="w-full h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300"
            >
              Done
            </button>
          </div>
        ) : !panel ? (
          <>
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 py-4">
              <KioskLocalClock />
            </div>

            <p className="mb-4 text-center text-sm text-slate-400">
              Already onboarded? Just check in — no sign-up needed.
            </p>

            <div className="grid gap-4">
              {PANELS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPanel(p.key)}
                  className={`h-20 rounded-2xl bg-gradient-to-br ${p.color} backdrop-blur-xl bg-opacity-40 border border-white/15 flex items-center gap-4 px-6 text-left shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] hover:border-white/30 transition-all active:scale-[0.99]`}
                >
                  <span className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <p.icon className="w-6 h-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold">{p.label}</span>
                    <span className="block text-xs text-white/60">{p.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setPanel(null)}
                className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold">{active.label}</h2>
            </div>
            {panel === "clockIn" && <KioskPinPad mode="clockIn" onSuccess={onClockIn} />}
            {panel === "clockOut" && <KioskPinPad mode="clockOut" onSuccess={onClockOut} />}
            {panel === "admin" && <OwnerAdminSignIn />}
            {panel === "testRequest" && <AccessRequestForm requestedMode="TEST" />}
            {panel === "trainingRequest" && <AccessRequestForm requestedMode="DEMO" />}
          </div>
        )}
      </div>
    </div>
  );
}