import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Stamp, FileText, Save, CheckCircle2, AlertCircle, RotateCcw,
  Pencil, ChevronDown, ChevronUp,
} from "lucide-react";
import UnifiedContractDesk from "@/components/nups/contracts/UnifiedContractDesk";
import VIPShowVerifyPanel from "@/components/nups/vip/VIPShowVerifyPanel";
import VIPShowContracts from "@/pages/VIPShowContracts";
import { VIP_TERMS_TEXT } from "@/constants/vipShowTerms";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeEntity } from "@/lib/nups/writeEntity";

/**
 * UltimateVIPContract — ONE editable contract + the full sealing desk.
 * ───────────────────────────────────────────────────────────────────
 * Merges the former "VIP Contracts", "GlyphBucks", legacy VIP/GlyphBucks,
 * and Archive surfaces into a single workspace:
 *   1. Edit the venue's ONE VIP contract template (ContractTermsConfig, type VIP).
 *      Saving stamps a new version — the template every sealed show hashes in.
 *   2. Run the FULL unified sale flow (UnifiedContractDesk): terms clickwrap,
 *      camera ID scan + thumbprint bioscan, card reader, GlyphBucks vouchers +
 *      VIP suite line items + gratuity, and three e-signatures — sealing the
 *      GlyphBucks and VIP records together.
 *   3. Verify / search / reprint sealed records.
 */

function stampVersion() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `v-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export default function UltimateVIPContract({ canEdit = false }) {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  // Bumped after each save so the generator remounts and re-reads fresh terms.
  const [termsRev, setTermsRev] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!venueId) throw new Error("No active venue selected.");
      const rows = await base44.entities.ContractTermsConfig.filter({
        venue_id: venueId, contract_type: "VIP",
      });
      const row = rows?.[0] || null;
      setConfig(row);
      setDraft(row?.terms_text?.trim() ? row.terms_text : VIP_TERMS_TEXT);
    } catch (_) {
      setConfig(null);
      setDraft(VIP_TERMS_TEXT);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => { load(); }, [load]);

  const dirty = draft.trim() !== (config?.terms_text?.trim() || VIP_TERMS_TEXT.trim());
  const usingCustom = !!config?.terms_text?.trim();

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const version = stampVersion();
      if (!venueId) throw new Error("Select an active venue before saving VIP contract terms.");
      const payload = {
        venue_id: venueId,
        contract_type: "VIP",
        terms_text: draft.trim(),
        version,
        active: true,
        last_edited_at: new Date().toISOString(),
      };
      const me = await base44.auth.me();
      const result = await writeEntity({
        entity: "ContractTermsConfig",
        operation: config?.id ? "update" : "create",
        id: config?.id,
        data: payload,
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
        venue_id: venueId,
        intent: config?.id ? "VIP_TERMS_UPDATE" : "VIP_TERMS_CREATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "VIP contract terms write was rejected.");
      const saved = result.value;
      setConfig({ ...(saved || payload), id: config?.id || saved?.id });
      setTermsRev((r) => r + 1);
      setMsg({ kind: "ok", text: `Saved as ${version}. Every new sealed show now uses this contract.` });
    } catch (e) {
      setMsg({ kind: "err", text: e.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const resetToCanonical = () => {
    setDraft(VIP_TERMS_TEXT);
    setMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* ── The ONE editable VIP contract template ── */}
      <Card className="bg-white/[0.02] border-emerald-500/20">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">The VIP Contract — One Editable Master</h2>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
              {usingCustom ? `Custom · ${config?.version || "unversioned"}` : "Canonical v1.0"}
            </Badge>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorOpen((o) => !o)}
                className="ml-auto text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                {editorOpen ? "Hide editor" : "Edit contract"}
                {editorOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            This is the single contract used for <span className="text-emerald-300 font-semibold">every VIP show</span>.
            Edit it here and the exact text is hashed into each sealed record ({usingCustom ? "custom terms" : "canonical terms"} active now).
          </p>

          {loading ? (
            <div className="text-sm text-gray-400">Loading contract…</div>
          ) : canEdit && editorOpen ? (
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={16}
                className="bg-[#0f1526] border-[#33405f] font-mono text-[12px] leading-relaxed"
                placeholder="Full VIP contract body — one clause per paragraph…"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={save} disabled={saving || !dirty || !draft.trim()} className="bg-emerald-600 hover:bg-emerald-500">
                  <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving…" : "Save & Version"}
                </Button>
                <Button variant="outline" onClick={resetToCanonical} className="border-white/15 text-gray-300">
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Reset to canonical
                </Button>
                {dirty && <span className="text-[11px] text-amber-400">Unsaved changes</span>}
                {msg && (
                  <span className={`text-xs flex items-center gap-1 ${msg.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                    {msg.kind === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {msg.text}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0f1526] p-3">
              <pre className="whitespace-pre-wrap text-[11px] text-neutral-300 leading-relaxed font-mono">{draft}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── The FULL sale flow: bioscan + GlyphBucks + VIP, sealed together ── */}
      <Card className="bg-white/[0.02] border-emerald-500/20">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Stamp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">Sell & Seal — ID Bioscan · GlyphBucks · VIP Suite</h2>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
              Ed25519 Sealed · Bitcoin Anchored
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            One flow: clickwrap terms → camera ID scan + thumbprint → card reader →
            GlyphBucks vouchers and VIP suite line items → three e-signatures. Seals the
            GlyphBucks and VIP records together.
          </p>

          {/* key on termsRev → remounts so it re-reads freshly saved terms */}
          <UnifiedContractDesk key={termsRev} />

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-3">QR Verify</h3>
            <VIPShowVerifyPanel />
          </div>
        </CardContent>
      </Card>

      {/* ── Search / membership / reprint of every sealed contract ── */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardContent className="p-0">
          <div className="px-4 pt-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-300" />
            <h3 className="text-sm font-bold text-emerald-300">Sealed Contracts · Search · Membership · Reprint</h3>
          </div>
          <VIPShowContracts />
        </CardContent>
      </Card>
    </div>
  );
}