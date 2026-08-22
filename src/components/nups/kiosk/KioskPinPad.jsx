import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, X } from "lucide-react";
import SecureNumericKeypad from "@/components/nups/kiosk/SecureNumericKeypad";
import { getNUPSTerminalId } from "@/lib/nups/terminalIdentity";

const CLIENT_MAX_FAILS = 5;
const CLIENT_LOCK_MS = 60_000;

function responseData(error) {
  return error?.response?.data || error?.data || error?.body || error || {};
}

/**
 * Public staff clock-in/out keypad.
 *
 * The PIN exists only in transient React state. It is never written to browser
 * storage, logs, analytics, URLs, query strings, or entity records.
 */
export default function KioskPinPad({ mode, onSuccess }) {
  const [terminalId] = useState(() => getNUPSTerminalId());
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [serverLocked, setServerLocked] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [temporaryPin, setTemporaryPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinChangeRequired, setPinChangeRequired] = useState(false);

  const [showManagerUnlock, setShowManagerUnlock] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [managerBusy, setManagerBusy] = useState(false);
  const [managerError, setManagerError] = useState("");
  const [managerShuffleKey, setManagerShuffleKey] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  useEffect(() => {
    if (lockedUntil && clock >= lockedUntil) {
      setLockedUntil(0);
      setFails(0);
      setError("");
      setShuffleKey((value) => value + 1);
    }
  }, [clock, lockedUntil]);

  const clientLocked = lockedUntil > clock;
  const locked = clientLocked || serverLocked;
  const secondsRemaining = clientLocked ? Math.max(1, Math.ceil((lockedUntil - clock) / 1000)) : null;

  const failAttempt = (message, forceServerLock = false) => {
    const nextFails = fails + 1;
    setPin("");
    setShuffleKey((value) => value + 1);
    setFails(nextFails);

    if (forceServerLock) {
      setServerLocked(true);
      setError(message || "This terminal is temporarily locked. Ask a manager to unlock it.");
      return;
    }

    if (nextFails >= CLIENT_MAX_FAILS) {
      setLockedUntil(Date.now() + CLIENT_LOCK_MS);
      setFails(0);
      setError("Too many failed attempts. The keypad is locked for 60 seconds or until a manager unlocks it.");
    } else {
      setError(message || "Unable to authenticate. Check your credentials or contact a manager.");
    }
  };

  const submit = async () => {
    if (locked || busy || pin.length < 4) return;
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("nupsClockInV2", {
        action: mode,
        pin,
        terminal_id: terminalId,
      });
      setPin("");
      setFails(0);
      onSuccess(response.data);
    } catch (cause) {
      const data = responseData(cause);
      if (data?.already_clocked_in) {
        setPin("");
        onSuccess(data);
        return;
      }
      if (data?.code === "PIN_CHANGE_REQUIRED") {
        setTemporaryPin(pin);
        setPin("");
        setPinChangeRequired(true);
        setError("");
        return;
      }
      const isServerLock = data?.code === "TERMINAL_LOCKED" || cause?.response?.status === 429;
      failAttempt(data?.error, isServerLock);
    } finally {
      setBusy(false);
    }
  };

  const changeTemporaryPin = async () => {
    if (busy || !/^\d{4,6}$/.test(newPin) || newPin !== confirmPin || newPin === temporaryPin) {
      setError("Choose a different 4–6 digit PIN and enter it twice."); return;
    }
    setBusy(true); setError("");
    try {
      const response = await base44.functions.invoke("nupsClockInV2", { action:"changeTemporaryPin", current_pin:temporaryPin, new_pin:newPin, terminal_id:terminalId });
      if (!response?.data?.success) throw new Error("PIN change failed.");
      setPinChangeRequired(false); setTemporaryPin(""); setNewPin(""); setConfirmPin(""); setError("PIN changed. Enter your new PIN to clock in.");
    } catch (cause) { setError(responseData(cause)?.error || cause.message || "PIN change failed."); }
    finally { setBusy(false); }
  };

  const unlockTerminal = async () => {
    if (managerBusy || managerPin.length < 4) return;
    setManagerBusy(true);
    setManagerError("");
    try {
      const response = await base44.functions.invoke("nupsClockInV2", {
        action: "managerUnlockTerminal",
        pin: managerPin,
        terminal_id: terminalId,
      });
      if (!response?.data?.success) throw new Error("Manager verification failed.");
      setPin("");
      setManagerPin("");
      setFails(0);
      setLockedUntil(0);
      setServerLocked(false);
      setShowManagerUnlock(false);
      setError("");
      setShuffleKey((value) => value + 1);
    } catch (cause) {
      const data = responseData(cause);
      setManagerPin("");
      setManagerShuffleKey((value) => value + 1);
      setManagerError(data?.error || "Manager verification failed.");
    } finally {
      setManagerBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xs">
      {pinChangeRequired ? (
        <section className="rounded-2xl border border-amber-400/40 bg-amber-950/20 p-4">
          <h3 className="font-black text-white">Change temporary PIN</h3>
          <p className="mt-1 text-xs text-amber-200">Your first clock-in is blocked until you choose a private PIN.</p>
          <input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,""))} placeholder="New 4–6 digit PIN" className="mt-4 w-full rounded-xl border border-slate-700 bg-black p-3 text-white"/>
          <input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,""))} placeholder="Confirm new PIN" className="mt-2 w-full rounded-xl border border-slate-700 bg-black p-3 text-white"/>
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          <button type="button" disabled={busy} onClick={changeTemporaryPin} className="mt-3 min-h-12 w-full rounded-xl bg-amber-500 font-black text-black disabled:opacity-50">{busy?"Changing…":"Change PIN"}</button>
        </section>
      ) : !showManagerUnlock ? (
        <>
          <SecureNumericKeypad
            value={pin}
            onChange={(next) => { setPin(next); if (next) setError(""); }}
            onSubmit={submit}
            busy={busy}
            disabled={locked}
            error={error}
            minLength={4}
            maxLength={6}
            submitLabel={mode === "clockOut" ? "OUT" : "GO"}
            shuffleKey={shuffleKey}
            onExpired={() => setError("PIN entry cleared after inactivity.")}
          />

          {clientLocked && (
            <p className="mt-3 text-center font-mono text-xs text-amber-300">
              Automatic retry in {secondsRemaining}s
            </p>
          )}

          {locked && (
            <button
              type="button"
              onClick={() => { setShowManagerUnlock(true); setManagerError(""); setManagerPin(""); }}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 text-sm font-black text-violet-100 transition hover:bg-violet-500/20"
            >
              <ShieldCheck className="h-4 w-4" /> Manager Unlock
            </button>
          )}
        </>
      ) : (
        <section className="rounded-2xl border border-violet-400/30 bg-violet-950/20 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-white">Manager Terminal Unlock</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Enter an active Dream Palace manager PIN. Verification is server-side and the PIN is never stored.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowManagerUnlock(false); setManagerPin(""); setManagerError(""); }}
              className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              aria-label="Cancel manager unlock"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SecureNumericKeypad
            value={managerPin}
            onChange={(next) => { setManagerPin(next); if (next) setManagerError(""); }}
            onSubmit={unlockTerminal}
            busy={managerBusy}
            error={managerError}
            minLength={4}
            maxLength={6}
            submitLabel="UNLOCK"
            shuffleKey={managerShuffleKey}
            onExpired={() => setManagerError("Manager PIN entry cleared after inactivity.")}
          />
        </section>
      )}
    </div>
  );
}
