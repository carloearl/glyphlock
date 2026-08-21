import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { writeEntity } from "@/lib/nups/writeEntity";

/**
 * RecordEditDialog — inline admin edit for a single entity record.
 * Edits the columns shown in the table (excluding read-only built-ins like
 * created_date). Saves via entity.update; no Base44 dashboard needed.
 */
const READ_ONLY = ["created_date", "updated_date", "created_by_id", "id"];

export default function RecordEditDialog({ entityName, record, fields, open, onClose }) {
  const qc = useQueryClient();
  const editable = fields.filter((f) => !READ_ONLY.includes(f.key));
  const [form, setForm] = useState(() =>
    Object.fromEntries(editable.map((f) => [f.key, record?.[f.key] ?? ""]))
  );

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const me = await base44.auth.me();
      const venueId = record?.venue_id || payload?.venue_id || null;
      const recordMode = ["REAL", "DEMO", "SANDBOX"].includes(String(record?.mode || payload?.mode || "").toUpperCase())
        ? String(record?.mode || payload?.mode).toUpperCase()
        : undefined;
      const result = await writeEntity({
        entity: entityName,
        operation: "update",
        id: record.id,
        data: payload,
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "admin" },
        venue_id: venueId,
        requestContext: recordMode ? { mode: recordMode } : undefined,
        intent: `ADMIN_DATA_MANAGER_UPDATE:${entityName}`,
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Governed update was rejected.");
      return result.value;
    },
    onSuccess: () => {
      qc.invalidateQueries(["admin-data", entityName]);
      toast.success("Record updated");
      onClose();
    },
    onError: (e) => toast.error(`Update failed: ${e?.message || e}`),
  });

  const handleSave = () => {
    const payload = {};
    for (const f of editable) {
      const orig = record?.[f.key];
      let val = form[f.key];
      // Preserve numeric fields as numbers.
      if (typeof orig === "number") val = val === "" ? null : Number(val);
      payload[f.key] = val;
    }
    saveMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-base">
            Edit {entityName} record
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {editable.map((f) => {
            const isObj = record?.[f.key] && typeof record[f.key] === "object";
            return (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs text-slate-400">{f.label}</Label>
                <Input
                  value={isObj ? JSON.stringify(form[f.key]) : (form[f.key] ?? "")}
                  disabled={isObj}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white h-10"
                />
              </div>
            );
          })}
          {editable.length === 0 && (
            <p className="text-sm text-slate-500">No editable columns for this record.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || editable.length === 0}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}