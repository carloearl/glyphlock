import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";

/**
 * Manager PIN Verification
 * Validates a 3-digit PIN against the staff directory (NUPSUser entity).
 * On success, calls onVerified({ managerId, managerName, managerEmail }).
 */
export default function ManagerPINVerifier({ onVerified, onCancel, purpose = "authorize payout" }) {
  const [pin, setPin] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [overriding, setOverriding] = useState(false);
  const refs = [useRef(), useRef(), useRef()];

  useEffect(() => {
    refs[0].current?.focus();
    // Load current session user to enable admin override
    base44.auth.me()
      .then(u => setCurrentUser(u))
      .catch(() => setCurrentUser(null));
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const handleAdminOverride = async () => {
    if (!isAdmin) return;
    setOverriding(true);
    toast.success(`Admin override: ${currentUser.full_name || currentUser.email}`);
    onVerified({
      managerId: currentUser.id,
      managerName: currentUser.full_name || currentUser.email,
      managerEmail: currentUser.email,
      managerPin: "ADMIN_OVERRIDE",
      adminOverride: true
    });
  };

  const handleDigit = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[idx] = digit;
    setPin(next);
    setFailed(false);
    if (digit && idx < 2) {
      refs[idx + 1].current?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
    if (e.key === "Enter" && pin.every(d => d)) {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const fullPin = pin.join("");
    if (fullPin.length !== 3) return;

    setLoading(true);
    setFailed(false);

    try {
      // Look up staff with matching PIN (uses existing `pin` field on NUPSUser)
      const staffList = await base44.entities.NUPSUser.filter({
        pin: fullPin,
        status: "active"
      }, null, 10);

      // Only manager-level or above can authorize payouts
      const validRoles = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "admin", "manager"];
      const match = staffList.find(s => validRoles.includes(s.role));

      if (match) {
        toast.success(`Authorized: ${match.full_name}`);
        onVerified({
          managerId: match.id,
          managerName: match.full_name || match.username,
          managerEmail: match.username,
          managerPin: fullPin
        });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setFailed(true);
        setPin(["", "", ""]);
        refs[0].current?.focus();

        if (newAttempts >= 3) {
          toast.error("Too many failed attempts. Access locked.");
        } else {
          toast.error(`Invalid PIN — ${3 - newAttempts} attempt(s) remaining`);
        }
      }
    } catch (err) {
      toast.error("Verification error: " + err.message);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const locked = attempts >= 3;

  return (
    <Card className="bg-gray-900/80 border-amber-500/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-400 text-sm">
          <Shield className="w-5 h-5" />
          Manager Authorization Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-gray-400">
          A manager or authorized staff must enter their <strong className="text-white">3-digit PIN</strong> to {purpose}.
        </p>

        {locked ? (
          <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400 font-bold">Access Locked</p>
            <p className="text-xs text-gray-500 mt-1">Too many failed attempts. Contact supervisor.</p>
          </div>
        ) : (
          <>
            {/* PIN Digits */}
            <div className="flex justify-center gap-4">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={refs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigit(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  disabled={loading || locked}
                  className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-gray-800 text-white outline-none transition-all ${
                    failed
                      ? "border-red-500 bg-red-900/20"
                      : digit
                      ? "border-amber-400"
                      : "border-gray-600 focus:border-amber-400"
                  }`}
                />
              ))}
            </div>

            {failed && (
              <div className="flex items-center justify-center gap-2 text-xs text-red-400">
                <XCircle className="w-4 h-4" />
                Invalid PIN — please try again
              </div>
            )}

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 border-gray-700 text-gray-400"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleVerify}
                disabled={pin.some(d => !d) || loading || locked}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                {loading ? "Verifying..." : "Authorize"}
              </Button>
            </div>

            {attempts > 0 && !locked && (
              <p className="text-center text-xs text-yellow-400">
                ⚠️ {attempts} failed attempt(s) — {3 - attempts} remaining
              </p>
            )}
          </>
        )}

        {/* Admin Override — only visible to logged-in admin in current session */}
        {isAdmin && !locked && (
          <div className="pt-3 border-t border-gray-800">
            <Button
              onClick={handleAdminOverride}
              disabled={overriding}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold border border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
            >
              {overriding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Admin Override ({currentUser?.full_name || currentUser?.email})
            </Button>
            <p className="text-[10px] text-red-400/80 text-center mt-2">
              <CheckCircle2 className="w-3 h-3 inline mr-1" />
              Bypasses PIN — session-scoped, admin only
            </p>
          </div>
        )}

        <div className="text-[10px] text-gray-600 text-center">
          <KeyRound className="w-3 h-3 inline mr-1" />
          Manager PIN is set in Staff Profile settings
        </div>
      </CardContent>
    </Card>
  );
}