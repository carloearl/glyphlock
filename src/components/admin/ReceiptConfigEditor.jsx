/**
 * ReceiptConfigEditor — back-office panel for everything that prints on a
 * receipt: processing fee, service fee, tax id, footer text, and toggles
 * for each optional line.
 *
 * Tiered access (matches other admin editors):
 *   • PLATFORM_ADMIN, VENUE_OWNER, SOVEREIGN, admin → full read/write
 *   • VENUE_MANAGER                                → read-only preview
 *   • anyone else                                  → panel is not mounted
 *
 * Persists to VenueRateConfig. Cache invalidated on save so the register
 * and receipt printer pick up new values immediately.
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Lock, Eye, Receipt, CreditCard, Gift, Hotel, Printer } from "lucide-react";
import { toast } from "sonner";
import { invalidateRateCache, ensureVenueRateConfig } from "@/lib/nups/venueRateConfig";
import { writeEntity } from "@/lib/nups/writeEntity";

const EDIT_ROLES = new Set(["PLATFORM_ADMIN", "VENUE_OWNER", "SOVEREIGN"]);

export default function ReceiptConfigEditor({ venueId, user }) {
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const role = String(user?._highestRole || user?.role || "").toUpperCase();
  const isBase44Admin = user?.role === "admin";
  const canEdit = isBase44Admin || EDIT_ROLES.has(role);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!venueId) return;
      try {
        const [row] = await base44.entities.VenueRateConfig.filter(
          { venue_id: venueId, active: true }, "-created_date", 1
        );
        if (!alive) return;
        setRecord(row || null);
        setDraft({
          cc_processing_fee_rate: row?.cc_processing_fee_rate ?? 0.05,
          service_fee_pct: row?.service_fee_pct ?? 0,
          service_fee_label: row?.service_fee_label ?? "Service Fee",
          show_processing_fee: row?.show_processing_fee ?? true,
          show_service_fee: row?.show_service_fee ?? false,
          payment_terminal_enabled: row?.payment_terminal_enabled ?? false,
          gift_card_enabled: row?.gift_card_enabled ?? false,
          room_tab_enabled: row?.room_tab_enabled ?? false,
          receipt_auto_prompt: row?.receipt_auto_prompt ?? true,
          receipt_print_copies: row?.receipt_print_copies ?? 1,
          receipt_legal_name: row?.receipt_legal_name ?? "",
          receipt_footer_text: row?.receipt_footer_text ?? "",
          receipt_tax_id: row?.receipt_tax_id ?? "",
        });
      } catch (e) {
        toast.error("Couldn't load receipt config: " + (e?.message || "unknown"));
      }
    })();
    return () => { alive = false; };
  }, [venueId]);

  const handleSave = async () => {
    if (!venueId) {
      toast.error("Select a venue before saving receipt settings.");
      return;
    }
    setSaving(true);
    try {
      const target = record?.id
        ? record
        : await ensureVenueRateConfig(venueId, "", user?.email || "admin");
      if (!target?.id) throw new Error("Venue configuration could not be created.");
      const result = await writeEntity({
        entity: "VenueRateConfig",
        operation: "update",
        id: target.id,
        data: {
          ...draft,
          venue_id: venueId,
          last_edited_by: user?.email || "admin",
          last_edited_at: new Date().toISOString(),
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || "External" },
        venue_id: venueId,
        intent: "RECEIPT_CONFIG_UPDATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Receipt configuration write was rejected.");
      setRecord(target);
      invalidateRateCache(venueId);
      toast.success("Receipt and tender settings saved. New transactions use these controls immediately.");
    } catch (e) {
      toast.error("Save failed: " + (e?.message || "unknown"));
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 text-center text-slate-400 text-sm">Loading receipt settings…</CardContent>
      </Card>
    );
  }

  const readOnly = !canEdit;
  const procPct  = ((Number(draft.cc_processing_fee_rate) || 0) * 100).toFixed(2);
  const svcPct   = ((Number(draft.service_fee_pct) || 0) * 100).toFixed(2);

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
          <Eye className="w-4 h-4" />
          Read-only — Venue Owners and Platform Admins can edit receipt settings. You're viewing as{" "}
          <span className="font-mono">{role || "guest"}</span>.
        </div>
      )}

      {/* Fees */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <div className="text-sm font-bold text-white">Receipt Line Items</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-400">Card Processing Fee (rate)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number" step="0.001" min="0" max="0.15"
                  disabled={readOnly}
                  value={draft.cc_processing_fee_rate}
                  onChange={(e) => setDraft({ ...draft, cc_processing_fee_rate: Number(e.target.value) })}
                  className="bg-black/40 border-slate-700 text-white"
                />
                <span className="font-mono text-xs text-emerald-300 whitespace-nowrap">= {procPct}%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label className="text-xs text-slate-400">Print this line on receipts</Label>
                <Switch
                  disabled={readOnly}
                  checked={!!draft.show_processing_fee}
                  onCheckedChange={(v) => setDraft({ ...draft, show_processing_fee: v })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-400">Service Fee (rate)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number" step="0.001" min="0" max="0.30"
                  disabled={readOnly}
                  value={draft.service_fee_pct}
                  onChange={(e) => setDraft({ ...draft, service_fee_pct: Number(e.target.value) })}
                  className="bg-black/40 border-slate-700 text-white"
                />
                <span className="font-mono text-xs text-emerald-300 whitespace-nowrap">= {svcPct}%</span>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-slate-400">Line label</Label>
                <Input
                  disabled={readOnly}
                  value={draft.service_fee_label}
                  onChange={(e) => setDraft({ ...draft, service_fee_label: e.target.value })}
                  className="bg-black/40 border-slate-700 text-white mt-1"
                  placeholder="Service Fee"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label className="text-xs text-slate-400">Print this line on receipts</Label>
                <Switch
                  disabled={readOnly}
                  checked={!!draft.show_service_fee}
                  onCheckedChange={(v) => setDraft({ ...draft, show_service_fee: v })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live tender and print controls */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-sm font-bold text-white">Live Tender & Print Controls</div>
              <div className="text-[10px] text-slate-500">Disabled workflows stay hidden in LIVE mode but remain available for TRAINING.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: "payment_terminal_enabled",
                label: "Payment terminal configured",
                detail: "Operators may record an approval returned by the physical terminal. NUPS never fabricates live authorization codes.",
                icon: CreditCard,
              },
              {
                key: "gift_card_enabled",
                label: "Gift card tender enabled",
                detail: "Show Gift Card in LIVE only after a supported balance and authorization workflow exists.",
                icon: Gift,
              },
              {
                key: "room_tab_enabled",
                label: "Room / VIP tab enabled",
                detail: "Show Room Tab in LIVE only after the venue has a supported tab ledger and reference workflow.",
                icon: Hotel,
              },
              {
                key: "receipt_auto_prompt",
                label: "Prompt for receipt after sale",
                detail: "Open the receipt confirmation immediately after a successful transaction.",
                icon: Printer,
              },
            ].map(({ key, label, detail, icon: Icon }) => (
              <div key={key} className="rounded-xl border border-white/[.07] bg-black/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div>
                      <Label className="text-xs font-bold text-slate-200">{label}</Label>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{detail}</p>
                    </div>
                  </div>
                  <Switch
                    disabled={readOnly}
                    checked={!!draft[key]}
                    onCheckedChange={(value) => setDraft({ ...draft, [key]: value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-xs">
            <Label className="text-xs text-slate-400">Default receipt copies</Label>
            <Input
              type="number"
              min="1"
              max="3"
              step="1"
              disabled={readOnly}
              value={draft.receipt_print_copies}
              onChange={(event) => setDraft({
                ...draft,
                receipt_print_copies: Math.max(1, Math.min(3, Number(event.target.value) || 1)),
              })}
              className="mt-1 bg-black/40 border-slate-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Header + footer text */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-5 space-y-4">
          <div className="text-sm font-bold text-white">Receipt Header & Footer</div>

          <div>
            <Label className="text-xs text-slate-400">Legal Entity Name (printed as receipt header)</Label>
            <Input
              disabled={readOnly}
              value={draft.receipt_legal_name}
              onChange={(e) => setDraft({ ...draft, receipt_legal_name: e.target.value })}
              className="bg-black/40 border-slate-700 text-white mt-1"
              placeholder="RAS Liberty Holding LLC"
            />
            <div className="text-[10px] text-slate-500 mt-1">This is the legal entity name on the receipt — NOT the venue brand name. Required for tax compliance.</div>
          </div>

          <div>
            <Label className="text-xs text-slate-400">Legal / Tax ID (printed in header)</Label>
            <Input
              disabled={readOnly}
              value={draft.receipt_tax_id}
              onChange={(e) => setDraft({ ...draft, receipt_tax_id: e.target.value })}
              className="bg-black/40 border-slate-700 text-white mt-1"
              placeholder="EIN 12-3456789 · TPT 123456789"
            />
          </div>

          <div>
            <Label className="text-xs text-slate-400">Footer paragraph (return policy, event, promotion)</Label>
            <Textarea
              disabled={readOnly}
              rows={3}
              value={draft.receipt_footer_text}
              onChange={(e) => setDraft({ ...draft, receipt_footer_text: e.target.value })}
              className="bg-black/40 border-slate-700 text-white mt-1 resize-none"
              placeholder="All sales are final. Refunds require manager approval within 24 hours with valid receipt."
            />
            <div className="text-[10px] text-slate-500 mt-1">Leave blank to use the default footer.</div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt fingerprint notice */}
      <Card className="bg-slate-900 border-emerald-500/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-bold text-emerald-300">SHA-256 Receipt Fingerprint · Always On</div>
              <div>
                Every completed transaction can carry a deterministic SHA-256 receipt fingerprint covering its id, totals, items, and timestamp. It supports tamper checks against the stored ledger; it is not represented as a blockchain transaction or third-party notarization.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving…" : "Save Receipt Settings"}
          </Button>
        </div>
      )}
    </div>
  );
}