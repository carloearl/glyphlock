import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SafeDataWipeModal({ isOpen, onClose, entityType, recordCount, onConfirm }) {
  const [managerPin, setManagerPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, [isOpen]);

  const runWipe = async (actor) => {
    setLoading(true);
    try {
      const recordsToDelete = await base44.entities[entityType].list("", 1000);
      await base44.entities.SystemAuditLog.create({
        event_type: "DATA_WIPE_BACKUP",
        description: `Backup of ${recordCount} ${entityType} records before deletion (authorized by ${actor})`,
        actor_email: actor,
        metadata: {
          entity: entityType,
          record_count: recordCount,
          backup_data: recordsToDelete,
          timestamp: new Date().toISOString(),
        },
        status: "success",
      });
      await onConfirm();
      setManagerPin("");
      onClose();
    } catch (err) {
      setError("Backup failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWipe = () => {
    if (!managerPin) {
      setError("Manager PIN required");
      return;
    }
    runWipe(`manager-pin:${managerPin.slice(0, 1)}***`);
  };

  const handleAdminBypass = () => {
    if (currentUser?.role !== 'admin') return;
    runWipe(`admin:${currentUser.email}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-red-500/50">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Confirm Data Wipe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
            <p className="text-sm text-red-300">
              <strong>Warning:</strong> You are about to delete {recordCount} {entityType} records. A backup will be created automatically.
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">Manager PIN (required)</label>
            <Input
              type="password"
              placeholder="Enter manager PIN"
              value={managerPin}
              onChange={(e) => {
                setManagerPin(e.target.value);
                setError("");
              }}
              className="bg-gray-800 border-gray-700"
              disabled={loading}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <p className="text-xs text-gray-400">
            Backup saved to SystemAuditLog with event_type="DATA_WIPE_BACKUP"
          </p>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleWipe}
              className="bg-red-600 hover:bg-red-700 flex-1"
              disabled={!managerPin || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Creating Backup..." : "Confirm Wipe"}
            </Button>
          </div>

          {currentUser?.role === 'admin' && (
            <>
              <div className="flex items-center gap-2 w-full pt-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <Button
                onClick={handleAdminBypass}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black"
              >
                <Lock className="w-4 h-4 mr-2" />
                Admin Override — Bypass PIN
              </Button>
              <p className="text-[10px] text-red-400/80 text-center">
                Signed in as {currentUser.full_name || currentUser.email} · logged to audit
              </p>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}