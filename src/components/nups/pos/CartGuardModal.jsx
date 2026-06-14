import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, ShieldAlert } from "lucide-react";

/**
 * Cart Guard Modal — closes the add-then-delete loophole at the door.
 *
 * Door Girl can ADD items freely (rings up the gross), but she cannot
 * remove, decrement, or clear without a manager picking themselves and
 * entering their PIN. Every approved deletion is logged.
 */
const VALID_MGR_ROLES = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "admin", "manager"];

const REASONS = [
  "Mis-keyed item",
  "Guest changed mind",
  "Wrong price",
  "Duplicate ring-up",
  "Manager comp instead",
  "Other",
];

export default function CartGuardModal({ open, onOpenChange, action, onConfirm }) {
  const [managerId, setManagerId] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const { data: managers = [] } = useQuery({
    queryKey: ["cartguard-mgrs"],
    queryFn: async () => {
      const rows = await base44.entities.NUPSUser.filter({ status: "active" }, null, 50);
      return rows.filter((m) => VALID_MGR_ROLES.includes(m.role));
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setManagerId(""); setReason(REASONS[0]); setPin(""); setError(""); setVerifying(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    setError("");
    if (!managerId) { setError("Pick the manager approving this change."); return; }
    if (!pin || pin.length < 4) { setError("Enter the manager's 4-digit PIN."); return; }
    setVerifying(true);
    try {
      const live = await base44.entities.NUPSUser.filter({ id: managerId }, null, 1);
      const row = live?.[0];
      if (!row || row.pin !== pin || row.status !== "active") {
        setError("PIN does not match the selected manager.");
        setVerifying(false); setPin("");
        return;
      }
      onConfirm({
        authorized_by_id: row.id,
        authorized_by_name: row.full_name,
        authorized_by_email: row.username || row.full_name,
        reason,
      });
      onOpenChange(false);
    } catch (e) {
      setError("Could not verify manager PIN. Try again.");
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-red-500/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-300">
            <ShieldAlert className="w-5 h-5" /> Manager Approval Required
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-200">
          <div className="font-bold mb-1">Door Girl cannot remove items unattended.</div>
          <div className="text-red-200/80">
            Pending action: <b className="text-white">{action?.label || "Modify cart"}</b>
          </div>
          <div className="text-red-200/60 mt-1">This will be written to the activity log.</div>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <Label className="text-xs text-gray-400">Manager approving</Label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full h-10 mt-1 rounded-lg bg-black/40 border border-white/15 text-white text-sm px-3"
            >
              <option value="">— Select manager —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs text-gray-400">Reason</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 mt-1 rounded-lg bg-black/40 border border-white/15 text-white text-sm px-3"
            >
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-xs text-gray-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Manager PIN
            </Label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              maxLength={4}
              placeholder="••••"
              className="mt-1 bg-black/40 border-white/15 text-white text-center text-2xl font-mono h-14 tracking-[0.5em]"
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-white/15 text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={verifying || !managerId || pin.length < 4}
            className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold"
          >
            {verifying ? "Verifying…" : "Approve"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}