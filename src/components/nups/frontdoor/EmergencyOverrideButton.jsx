import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { logActivity } from "@/lib/nups/activityLog";

/**
 * EmergencyOverrideButton — documented bypass path for failed door hardware.
 *
 * When the PIN pad, ID scanner, QR camera, or any other gate fails, a Manager
 * (or Owner / Platform Admin) can enter their PIN + reason to activate a 15-min
 * Override Window. Every activation is logged immutably to ActivityLog.
 *
 * UI surfaces:
 *   - Button (red, in the Front Door header)
 *   - Modal (PIN + reason + override type)
 *   - Persistent banner across the top of Front Door while active
 *   - "End Override" button in the banner
 *
 * State lives in sessionStorage so the override survives page reloads but
 * dies with the browser session.
 */

const STORAGE_KEY = "nups_emergency_override";
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MANAGER_ROLES = ["VENUE_MANAGER", "VENUE_OWNER", "PLATFORM_ADMIN", "SOVEREIGN"];

const OVERRIDE_TYPES = [
  { value: "PIN_PAD_DOWN",  label: "PIN pad not working" },
  { value: "ID_SCANNER_DOWN", label: "ID scanner not working" },
  { value: "QR_CAMERA_DOWN", label: "QR camera not working" },
  { value: "DEVICE_OFFLINE",  label: "Device offline / unresponsive" },
  { value: "OTHER",           label: "Other (explain in reason)" },
];

function readOverride() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expires_at || Date.now() > parsed.expires_at) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeOverride(o) { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(o)); }
function clearOverride() { sessionStorage.removeItem(STORAGE_KEY); }

export default function EmergencyOverrideButton({ venueId }) {
  const [active, setActive] = useState(readOverride());
  const [modalOpen, setModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  const [overrideType, setOverrideType] = useState("PIN_PAD_DOWN");
  const [verifying, setVerifying] = useState(false);
  const [tick, setTick] = useState(0);

  // Re-render every 10s so the countdown stays accurate + auto-expire kicks in
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const fresh = readOverride();
      if (!fresh) {
        setActive(null);
        toast.info("Override window expired");
      } else {
        setTick(t => t + 1);
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [active]);

  const handleActivate = async () => {
    if (!pin || pin.length < 3) { toast.error("Enter your Manager PIN"); return; }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("Reason is required (min 5 characters)");
      return;
    }
    setVerifying(true);
    try {
      // Look up a manager-tier user with this PIN
      const matches = await base44.entities.NUPSUser.filter({ pin, status: "active" });
      const manager = (matches || []).find(u => MANAGER_ROLES.includes((u.role || "").toUpperCase()));
      if (!manager) {
        toast.error("Invalid Manager PIN");
        setVerifying(false);
        return;
      }

      const expires_at = Date.now() + WINDOW_MS;
      const payload = {
        approved_by_email: manager.username || manager.full_name,
        approved_by_name:  manager.full_name,
        approved_by_role:  manager.role,
        override_type:     overrideType,
        reason:            reason.trim(),
        venue_id:          venueId,
        started_at:        Date.now(),
        expires_at,
      };
      writeOverride(payload);
      setActive(payload);

      // Immutable audit trail
      await logActivity({
        action_type: "CONFIG_CHANGE",
        entity_affected: "EmergencyOverride:" + new Date().toISOString(),
        after_value: {
          override_type: overrideType,
          reason: reason.trim(),
          approved_by: manager.full_name,
          approved_by_role: manager.role,
          window_minutes: 15,
        },
        venue_id: venueId,
        notes: `EMERGENCY_OVERRIDE_ACTIVATED — ${overrideType} — by ${manager.full_name}`,
      });

      toast.success(`Override active for 15 min — approved by ${manager.full_name}`);
      setModalOpen(false);
      setPin(""); setReason(""); setOverrideType("PIN_PAD_DOWN");
    } catch (e) {
      toast.error("Verification failed — try again");
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const handleEnd = async () => {
    if (!active) return;
    const usedFor = Math.round((Date.now() - active.started_at) / 1000);
    clearOverride();
    setActive(null);
    await logActivity({
      action_type: "CONFIG_CHANGE",
      entity_affected: "EmergencyOverride:" + new Date(active.started_at).toISOString(),
      before_value: { override_type: active.override_type, approved_by: active.approved_by_name },
      after_value: { ended: true, duration_seconds: usedFor },
      venue_id: venueId,
      notes: `EMERGENCY_OVERRIDE_ENDED — used for ${usedFor}s`,
    });
    toast.info("Override ended");
  };

  // Countdown text
  const remainingMs = active ? Math.max(0, active.expires_at - Date.now()) : 0;
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, "0");

  return (
    <>
      {/* Header button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className={`border-red-500/40 ${active ? "bg-red-600/20 text-red-300 animate-pulse" : "text-red-400 hover:bg-red-500/10"}`}
        title="Emergency Manual Override"
      >
        <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
        {active ? `OVERRIDE ${mins}:${secs}` : "Override"}
      </Button>

      {/* Persistent active banner — caller renders <EmergencyOverrideBanner /> below */}
      {active && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-red-700/95 border-b-2 border-red-400 backdrop-blur-md text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-bold shadow-lg">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>EMERGENCY OVERRIDE ACTIVE</span>
          <span className="opacity-80 font-normal hidden sm:inline">
            · {active.override_type.replace(/_/g, " ")} · approved by {active.approved_by_name} · expires in {mins}:{secs}
          </span>
          <button
            onClick={handleEnd}
            className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1"
          >
            <X className="w-3 h-3" /> End Override
          </button>
        </div>
      )}

      {/* Activation modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-gray-950 border-red-500/40 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              Emergency Manual Override
            </DialogTitle>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use only when door hardware fails. Every override is logged immutably with your name, the reason, and a 15-minute window.
            </p>
          </DialogHeader>

          {active ? (
            <div className="bg-red-950/40 border border-red-500/40 rounded-lg p-4 space-y-2">
              <p className="text-sm text-red-300 font-bold">An override is already active.</p>
              <p className="text-xs text-gray-400">
                Approved by <strong>{active.approved_by_name}</strong> · {active.override_type.replace(/_/g, " ")} · {mins}:{secs} remaining
              </p>
              <Button
                onClick={() => { handleEnd(); setModalOpen(false); }}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold mt-2"
              >
                End Override Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-400">Override Type</Label>
                <Select value={overrideType} onValueChange={setOverrideType}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {OVERRIDE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-400">Reason (required)</Label>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. PIN reader frozen — rebooting in 5 min"
                  className="bg-gray-900 border-gray-700 mt-1"
                  maxLength={200}
                />
              </div>

              <div>
                <Label className="text-xs text-gray-400">Manager PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="bg-gray-900 border-gray-700 mt-1 font-mono text-lg tracking-widest"
                  autoFocus
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Must belong to a Manager, Owner, or Platform Admin.
                </p>
              </div>

              <Button
                onClick={handleActivate}
                disabled={verifying}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-black h-11"
              >
                {verifying ? "Verifying..." : "Activate Override (15 min)"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}