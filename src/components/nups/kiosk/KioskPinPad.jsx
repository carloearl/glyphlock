import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Delete } from "lucide-react";

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §11 — PIN pad for staff clock in/out.
// Client-side throttle: 5 failed attempts → 60s cooldown. PIN never persisted.
export default function KioskPinPad({ mode, onSuccess }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const locked = Date.now() < lockedUntil;

  const press = (d) => {
    if (pin.length < 6) setPin(pin + d);
    setError("");
  };

  const submit = async () => {
    if (locked) return;
    if (pin.length < 4) { setError("Enter your 4–6 digit PIN."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("nupsClockIn", { action: mode, pin });
      onSuccess(res.data);
    } catch (e) {
      const msg = e?.response?.data?.error || "Unable to process. Try again.";
      const data = e?.response?.data;
      if (data?.already_clocked_in) {
        // Already clocked in — still route to the authorized workspace.
        onSuccess(data);
        return;
      }
      const nf = fails + 1;
      setFails(nf);
      if (nf >= 5) {
        setLockedUntil(Date.now() + 60000);
        setFails(0);
        setError("Too many failed attempts. Locked for 60 seconds.");
      } else {
        setError(msg);
      }
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-center gap-3 mb-5 min-h-[24px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? "bg-cyan-400 border-cyan-400" : "border-slate-600"} ${i >= 4 && pin.length < 5 ? "opacity-40" : ""}`}
          />
        ))}
      </div>
      {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            disabled={busy || locked}
            className="h-16 rounded-xl bg-slate-800 border border-slate-700 text-2xl font-bold text-white active:bg-slate-700 disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setPin(pin.slice(0, -1))}
          disabled={busy || locked}
          className="h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 disabled:opacity-40"
        >
          <Delete className="w-6 h-6" />
        </button>
        <button
          onClick={() => press("0")}
          disabled={busy || locked}
          className="h-16 rounded-xl bg-slate-800 border border-slate-700 text-2xl font-bold text-white active:bg-slate-700 disabled:opacity-40"
        >
          0
        </button>
        <button
          onClick={submit}
          disabled={busy || locked || pin.length < 4}
          className="h-16 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : "GO"}
        </button>
      </div>
    </div>
  );
}