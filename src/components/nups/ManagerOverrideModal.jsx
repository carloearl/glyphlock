import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2, KeyRound, XCircle, Lock } from "lucide-react";

/**
 * ManagerOverrideModal
 * Props:
 *   open          – boolean
 *   onClose       – () => void
 *   onApproved    – (manager) => void   called when PIN verified
 *   actionLabel   – string  e.g. "Reset Batch" shown in the header
 *   description   – string  reason shown to manager
 */
export default function ManagerOverrideModal({ open, onClose, onApproved, actionLabel = "Confirm Action", description = "" }) {
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Detect if the signed-in user is an admin so we can show a session bypass button
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
      } catch { /* not signed in */ }
    })();
  }, [open]);

  const handleAdminBypass = async () => {
    if (currentUser?.role !== 'admin') return;
    try {
      await base44.entities.SystemAuditLog.create({
        event_type: "MANAGER_OVERRIDE_ADMIN_BYPASS",
        description: `Admin session bypass for: ${actionLabel}`,
        actor_email: currentUser.email || 'admin',
        status: "security_action",
        severity: "high",
        metadata: { action: actionLabel, approved_by: currentUser.full_name || currentUser.email }
      });
    } catch { /* best-effort */ }
    onApproved({
      username: currentUser.email,
      full_name: currentUser.full_name || currentUser.email,
      role: 'PLATFORM_ADMIN',
      _admin_bypass: true
    });
    setPin(""); setUsername(""); setError("");
  };

  const handleVerify = async () => {
    if (!username.trim() || pin.length < 4) {
      setError("Enter manager username and PIN (min 4 digits).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const results = await base44.entities.NUPSUser.filter({ username: username.trim() });
      const manager = results[0];
      if (!manager) { setError("Manager account not found."); return; }
      const allowedRoles = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "manager"];
      if (!allowedRoles.includes(manager.role)) {
        setError("This account does not have manager override authority.");
        return;
      }
      if (manager.pin !== pin) { setError("Incorrect PIN. Access denied."); return; }
      if (manager.status !== "active") { setError("Manager account is not active."); return; }

      // Log override usage
      await base44.entities.SystemAuditLog.create({
        event_type: "MANAGER_OVERRIDE",
        description: `Manager override by ${manager.username} for: ${actionLabel}`,
        actor_email: manager.username,
        status: "security_action",
        severity: "medium",
        metadata: { action: actionLabel, approved_by: manager.full_name || manager.username }
      });

      onApproved(manager);
      setPin("");
      setUsername("");
      setError("");
    } catch (e) {
      setError("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin(""); setUsername(""); setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-950 border-red-500/40 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            Manager Override Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            <span className="font-bold block mb-1">⚠️ Restricted Action: {actionLabel}</span>
            {description && <span className="text-gray-400">{description}</span>}
          </div>

          <div>
            <Label className="text-gray-300">Manager Username</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="manager_username"
              className="bg-black border-gray-700 text-white mt-1"
              autoComplete="off"
            />
          </div>

          <div>
            <Label className="text-gray-300">Manager PIN</Label>
            <div className="flex gap-2 mt-1">
              {[0,1,2,3,4,5].map(i => (
                <Input
                  key={i}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[i] || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "");
                    const arr = pin.split("");
                    arr[i] = val;
                    setPin(arr.join("").slice(0, 6));
                    if (val && i < 5) document.getElementById(`pin-slot-${i+1}`)?.focus();
                  }}
                  id={`pin-slot-${i}`}
                  className="bg-black border-gray-700 text-white text-center w-10 px-0"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              <XCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleClose} className="border-gray-700 text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4 mr-1" />Verify &amp; Proceed</>}
            </Button>
          </div>

          {/* Admin session bypass — app-wide, visible only when signed in as admin */}
          {currentUser?.role === 'admin' && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <Button
                onClick={handleAdminBypass}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black"
              >
                <Lock className="w-4 h-4 mr-2" />
                Admin Override — Bypass PIN
              </Button>
              <p className="text-[10px] text-red-400/80 text-center -mt-1">
                Signed in as {currentUser.full_name || currentUser.email} · logged to audit
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}