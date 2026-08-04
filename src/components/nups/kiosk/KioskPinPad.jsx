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
  const [hint, setHint] = useState(null);       // { has_hint, hint } | { error }
  const [hintBusy, setHintBusy] = useState(false);
  const [editingHint, setEditingHint] = useState(false);
  const [hintDraft, setHintDraft] = useState("");

  const fetchHint = async () => {
    setHintBusy(true);
    try {
      const res = await base44.functions.invoke("nupsClockIn", { action: "getPinHint" });
      setHint(res.data);
    } catch (e) {
      setHint({ error: e?.response?.data?.error || "Hint unavailable." });
    } finally {
      setHintBusy(false);
    }
  };

  const saveHint = async () => {
    setHintBusy(true);
    try {
      const res = await base44.functions.invoke("nupsClockIn", { action: "setPinHint", hint: hintDraft });
      setHint({ has_hint: true, hint: res.data.hint });
      setEditingHint(false);
    } catch (e) {
      setHint({ ...(hint || {}), error: e?.response?.data?.error || "Could not save hint." });
    } finally {
      setHintBusy(false);
    }
  };

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
      // The SDK surfaces non-2xx bodies differently across transports — check
      // every shape so a 409 "already clocked in" still routes the operator.
      const data = e?.response?.data || e?.data || e?.body || e;
      const msg = data?.error || "Unable to process. Try again.";
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

      {/* PIN hint — resolved from the signed-in account, never stores the PIN */}
      <div className="mt-4 text-center">
        {!hint && (
          <button
            onClick={fetchHint}
            disabled={hintBusy}
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-cyan-300 disabled:opacity-40 min-h-[44px] px-4"
          >
            {hintBusy ? "Checking…" : "Forgot PIN? Show my hint"}
          </button>
        )}
        {hint?.error && <p className="text-xs text-amber-400/80">{hint.error}</p>}
        {hint && !hint.error && !editingHint && (
          <div className="space-y-1">
            <p className="text-sm text-cyan-300">
              {hint.has_hint ? `Hint: ${hint.hint}` : "No hint set yet."}
            </p>
            <button
              onClick={() => { setHintDraft(hint.hint || ""); setEditingHint(true); }}
              className="text-xs text-slate-400 underline underline-offset-2 hover:text-cyan-300 min-h-[44px] px-4"
            >
              {hint.has_hint ? "Change hint" : "Set a hint"}
            </button>
          </div>
        )}
        {editingHint && (
          <div className="flex gap-2 items-center justify-center mt-1">
            <input
              value={hintDraft}
              onChange={(e) => setHintDraft(e.target.value)}
              maxLength={80}
              placeholder="Reminder phrase (no numbers)"
              className="flex-1 h-11 px-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500"
            />
            <button
              onClick={saveHint}
              disabled={hintBusy || !hintDraft.trim()}
              className="h-11 px-4 rounded-lg bg-cyan-600 text-white text-sm font-bold disabled:opacity-40"
            >
              {hintBusy ? "…" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}