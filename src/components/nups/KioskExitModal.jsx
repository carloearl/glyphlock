import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import SecureNumericKeypad from "@/components/nups/kiosk/SecureNumericKeypad";
import { getNUPSTerminalId } from "@/lib/nups/terminalIdentity";

const MAX_LOCAL_ATTEMPTS = 3;

function responseData(error) {
  return error?.response?.data || error?.data || error?.body || error || {};
}

/**
 * Manager-authorized exit from the fullscreen NUPS kiosk.
 * Verification is performed by nupsClockIn against the hashed manager PIN;
 * this component never queries NUPSUser PIN fields or persists the entered PIN.
 */
export default function KioskExitModal({ onUnlock, onCancel }) {
  const [terminalId] = useState(() => getNUPSTerminalId());
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const locked = attempts >= MAX_LOCAL_ATTEMPTS;

  const handleUnlock = async () => {
    if (loading || locked || pin.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("nupsClockIn", {
        action: "verifyManagerPin",
        pin,
        terminal_id: terminalId,
      });
      if (!response?.data?.success) throw new Error("Manager verification failed.");
      setPin("");
      toast.success(`Unlocked by ${response.data.manager?.full_name || "manager"}`);
      onUnlock();
    } catch (cause) {
      const nextAttempts = attempts + 1;
      const data = responseData(cause);
      setPin("");
      setAttempts(nextAttempts);
      setShuffleKey((value) => value + 1);
      setError(
        nextAttempts >= MAX_LOCAL_ATTEMPTS
          ? "Manager verification is locked. Close this dialog and use the staff-login Manager Unlock workflow."
          : data?.error || "Manager verification failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-950 shadow-2xl">
      <div className="border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 to-cyan-950/40 px-5 py-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-cyan-300" />
          <h2 className="text-base font-bold text-white">Leave NUPS Kiosk</h2>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
          Exiting returns this terminal to the GlyphLock website. An active Dream Palace manager must authorize the exit with a 4–6 digit PIN.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {locked ? (
          <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
            <p className="text-sm font-bold text-red-300">Manager verification locked</p>
            <p className="mt-1 text-xs text-gray-500">Return to Staff Clock In and use Manager Unlock.</p>
          </div>
        ) : (
          <SecureNumericKeypad
            value={pin}
            onChange={(next) => { setPin(next); if (next) setError(""); }}
            onSubmit={handleUnlock}
            busy={loading}
            error={error}
            minLength={4}
            maxLength={6}
            submitLabel="EXIT"
            shuffleKey={shuffleKey}
            onExpired={() => setError("Manager PIN entry cleared after inactivity.")}
          />
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setPin(""); onCancel(); }}
            disabled={loading}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Stay in NUPS
          </Button>
          {!locked && (
            <Button
              onClick={handleUnlock}
              disabled={pin.length < 4 || loading}
              className="flex-1 bg-cyan-500 font-bold text-black hover:bg-cyan-400"
            >
              <KeyRound className="mr-2 h-4 w-4" /> Unlock & Exit
            </Button>
          )}
        </div>

        {isAdmin && !locked && (
          <div className="border-t border-gray-800 pt-3">
            <Button
              onClick={() => { setPin(""); onUnlock(); }}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 font-bold text-white hover:from-purple-500 hover:to-cyan-500"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Authenticated Admin Exit
            </Button>
            <p className="mt-2 text-center text-[10px] text-gray-500">
              Server-authenticated as <strong className="text-gray-400">{currentUser?.full_name || currentUser?.email}</strong>
            </p>
          </div>
        )}

        <p className="pt-1 text-center text-[10px] text-gray-600">
          Manager PINs are provisioned through Manager Console → Staff & PINs.
        </p>
      </div>
    </div>
  );
}
