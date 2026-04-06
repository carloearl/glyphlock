import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SafeDataWipeModal({ isOpen, onClose, entityType, recordCount, onConfirm }) {
  const [managerPin, setManagerPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWipe = async () => {
    if (!managerPin) {
      setError("Manager PIN required");
      return;
    }

    setLoading(true);
    try {
      // Backup data to audit log before deletion
      const recordsToDelete = await base44.entities[entityType].list("", 1000);
      
      await base44.entities.SystemAuditLog.create({
        event_type: "DATA_WIPE_BACKUP",
        description: `Backup of ${recordCount} ${entityType} records before deletion`,
        actor_email: "system",
        metadata: {
          entity: entityType,
          record_count: recordCount,
          backup_data: recordsToDelete,
          timestamp: new Date().toISOString(),
        },
        status: "success",
      });

      // Call the wipe callback
      await onConfirm();
      setManagerPin("");
      onClose();
    } catch (err) {
      setError("Backup failed: " + err.message);
    } finally {
      setLoading(false);
    }
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleWipe}
            className="bg-red-600 hover:bg-red-700"
            disabled={!managerPin || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? "Creating Backup..." : "Confirm Wipe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}