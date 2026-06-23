import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, XCircle, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";

/**
 * KioskExitModal
 *
 * Dedicated, purpose-clear unlock screen for leaving NUPS kiosk mode.
 * Separate from ManagerPINVerifier (which is built for authorizing payouts/voids)
 * because that copy/CTA was confusing operators trying to simply leave the system.
 *
 * Flow:
 *  - Operator enters 3-digit Manager PIN.
 *  - Matches against active NUPSUser with manager-tier role.
 *  - Admin (current logged-in admin session) gets a one-tap override.
 *  - 3 failed attempts locks the modal — operator must close and retry.
 */
export default function KioskExitModal({ onUnlock, onCancel }) {
  const [pin, setPin] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const refs = [useRef(), useRef(), useRef()];

  useEffect(() => {
    refs[0].current?.focus();
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const locked = attempts >= 3;

  const handleDigit = (idx, val) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[idx] = d;
    setPin(next);
    setFailed(false);
    if (d && idx < 2) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) refs[idx - 1].current?.focus();
    if (e.key === "Enter" && pin.every((d) => d)) handleUnlock();
  };

  const handleUnlock = async () => {
    const fullPin = pin.join("");
    if (fullPin.length !== 3) return;
    setLoading(true);
    setFailed(false);
    try {
      const staffList = await base44.entities.NUPSUser.filter(
        { pin: fullPin, status: "active" },
        null,
        10
      );
      const validRoles = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "admin", "manager"];
      const match = staffList.find((s) => validRoles.includes(s.role));
      if (match) {
        toast.success(`Unlocked by ${match.full_name || match.username}`);
        onUnlock();
      } else {
        const n = attempts + 1;
        setAttempts(n);
        setFailed(true);
        setPin(["", "", ""]);
        refs[0].current?.focus();
        toast.error(n >= 3 ? "Locked — close and try again." : `Wrong PIN — ${3 - n} left`);
      }
    } catch (err) {
      toast.error("Verification error: " + err.message);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-950 border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-cyan-950/40 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-300" />
          <h2 className="text-white font-bold text-base">Leave NUPS Kiosk</h2>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          You're about to <strong className="text-cyan-300">exit the NUPS operator system</strong> and
          return to the GlyphLock website. A manager must enter their PIN to unlock the screen.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {locked ? (
          <div className="bg-red-950/30 border border-red-500/40 rounded-lg p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-300 font-bold">Locked</p>
            <p className="text-xs text-gray-500 mt-1">Too many failed attempts — cancel and try again.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={refs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                  className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-gray-900 text-white outline-none transition-all ${
                    failed
                      ? "border-red-500 bg-red-950/30"
                      : digit
                      ? "border-cyan-400"
                      : "border-gray-700 focus:border-cyan-400"
                  }`}
                />
              ))}
            </div>

            {failed && (
              <p className="flex items-center justify-center gap-2 text-xs text-red-400">
                <XCircle className="w-4 h-4" /> Wrong PIN — try again
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Stay in NUPS
              </Button>
              <Button
                onClick={handleUnlock}
                disabled={pin.some((d) => !d) || loading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                {loading ? "Unlocking…" : "Unlock & Exit"}
              </Button>
            </div>

            {attempts > 0 && !locked && (
              <p className="text-center text-xs text-yellow-400">
                {attempts} wrong — {3 - attempts} attempt{3 - attempts === 1 ? "" : "s"} left
              </p>
            )}
          </>
        )}

        {isAdmin && !locked && (
          <div className="pt-3 border-t border-gray-800">
            <Button
              onClick={onUnlock}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Admin Override — Unlock Now
            </Button>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              Signed in as <strong className="text-gray-400">{currentUser?.full_name || currentUser?.email}</strong>
            </p>
          </div>
        )}

        <p className="text-[10px] text-gray-600 text-center pt-1">
          Manager PINs are set in Staff Profile → Credentials
        </p>
      </div>
    </div>
  );
}