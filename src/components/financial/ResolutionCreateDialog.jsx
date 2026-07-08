import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const RESOLUTION_TYPES = [
  "compensating_ledger_entry", "adjustment_entry", "reclassification_entry",
  "replacement_bill", "replacement_batch", "void_record", "refund",
  "partial_refund", "credit_memo", "debit_memo", "write_off",
  "charge_reversal", "provider_retry", "provider_reconciliation",
  "manual_external_confirmation", "manager_override", "corporate_override", "ownership_override"
];

export default function ResolutionCreateDialog({ open, onClose, onCreated, exception, venueId }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    resolution_type: "compensating_ledger_entry",
    amount: "",
    reason: "",
    business_justification: "",
    manager_notes: "",
    linked_financial_records: ""
  });

  const handleSubmit = async () => {
    if (!exception || !venueId) return;
    setLoading(true);
    try {
      let linkedRecords = [];
      if (form.linked_financial_records.trim()) {
        linkedRecords = form.linked_financial_records.split("\n").map(line => {
          const [entity_type, entity_id] = line.split(":").map(s => s.trim());
          return { entity_type, entity_id, description: "Linked via AFRW" };
        }).filter(r => r.entity_type && r.entity_id);
      }

      const res = await base44.functions.invoke("financialResolutionWorkflow", {
        action: "create_request",
        exception_id: exception.exception_id,
        venue_id: venueId,
        resolution_type: form.resolution_type,
        amount: parseFloat(form.amount) || 0,
        reason: form.reason,
        business_justification: form.business_justification,
        manager_notes: form.manager_notes,
        linked_financial_records: linkedRecords
      });

      if (res.data?.success) {
        onCreated(res.data.resolution_id);
        setForm({ resolution_type: "compensating_ledger_entry", amount: "", reason: "", business_justification: "", manager_notes: "", linked_financial_records: "" });
      }
    } catch (e) {
      console.error("Create failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Create Resolution Request</DialogTitle>
          <DialogDescription className="text-white/50">
            Authorized Financial Resolution — the only path for financial record correction.
            Originals remain immutable — corrections create compensating entries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-white/5 rounded p-2 text-xs text-cyan-300 font-mono">
            Exception: {exception?.exception_id}
          </div>

          <div>
            <Label className="text-white/70">Resolution Type</Label>
            <Select value={form.resolution_type} onValueChange={(v) => setForm({ ...form, resolution_type: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESOLUTION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70">Amount (USD)</Label>
            <Input type="number" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="bg-white/5 border-white/10 mt-1" placeholder="0.00" />
          </div>

          <div>
            <Label className="text-white/70">Reason *</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="bg-white/5 border-white/10 mt-1" placeholder="Categorical reason for correction" />
          </div>

          <div>
            <Label className="text-white/70">Business Justification *</Label>
            <Textarea value={form.business_justification}
              onChange={(e) => setForm({ ...form, business_justification: e.target.value })}
              className="bg-white/5 border-white/10 mt-1" placeholder="Detailed justification..." />
          </div>

          <div>
            <Label className="text-white/70">Linked Records (one per line: Type:ID)</Label>
            <Textarea value={form.linked_financial_records}
              onChange={(e) => setForm({ ...form, linked_financial_records: e.target.value })}
              className="bg-white/5 border-white/10 mt-1 font-mono text-xs"
              placeholder={"PaymentRecord:PR-VEN-001\nGlyphBucksOrder:GB-ORD-001"} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 bg-white/5">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.reason || !form.business_justification}
            className="bg-cyan-600 hover:bg-cyan-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}