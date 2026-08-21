import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSignature, Upload, ShieldCheck, Loader2 } from "lucide-react";
import { writeIdentityRecord } from "@/lib/nups/identityWrites";
import { uploadProtectedEvidence } from "@/lib/nups/protectedEvidence";

const TAX_CLASSIFICATIONS = [
  { value: "individual_sole_prop", label: "Individual / Sole Proprietor" },
  { value: "single_member_llc",    label: "Single-Member LLC" },
  { value: "c_corp",               label: "C Corporation" },
  { value: "s_corp",               label: "S Corporation" },
  { value: "partnership",          label: "Partnership" },
  { value: "trust_estate",         label: "Trust / Estate" },
  { value: "llc_corp",             label: "LLC (taxed as Corp)" },
  { value: "other",                label: "Other" },
];

/**
 * ContractorOnboardingPanel
 * W-9 intake form for a single entertainer. Captures legal data, masked TIN,
 * digital signature, and optional scanned W-9 upload. Stores in ContractorTaxForm.
 *
 * IMPORTANT: full TIN/SSN is NEVER persisted in plaintext. Only last 4 retained.
 */
export default function ContractorOnboardingPanel({ entertainer, existingForm, currentUser, onSaved }) {
  const taxYear = new Date().getFullYear();
  const [form, setForm] = useState({
    legal_name:           existingForm?.legal_name           || entertainer?.legal_name || "",
    business_name:        existingForm?.business_name        || "",
    tax_classification:   existingForm?.tax_classification   || "individual_sole_prop",
    address_street:       existingForm?.address_street       || "",
    address_city:         existingForm?.address_city         || "",
    address_state:        existingForm?.address_state        || "",
    address_zip:          existingForm?.address_zip          || "",
    tin_type:             existingForm?.tin_type             || "SSN",
    tin_full:             "", // never restored — write-once
    tin_last4:            existingForm?.tin_last4            || "",
    backup_withholding_exempt: existingForm?.backup_withholding_exempt ?? true,
    signature_data:       existingForm?.signature_data       || "",
  });
  const [scannedFile, setScannedFile] = useState(null);
  const [scannedUrl, setScannedUrl] = useState(existingForm?.scanned_form_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleTinChange = (v) => {
    // Strip non-digits, store only last 4 visibly. Keep full in transient state for save.
    const digits = v.replace(/\D/g, "").slice(0, 9);
    setForm(prev => ({ ...prev, tin_full: digits, tin_last4: digits.slice(-4) }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const protectedFile = await uploadProtectedEvidence({
        file,
        venueId: entertainer?.venue_id,
        artifactType: "w9_scan",
        classification: "PRIVATE_TAX",
        subjectEntity: "Entertainer",
        subjectId: entertainer?.id,
        purpose: "contractor_w9",
        signedUrlTtl: 0,
      });
      setScannedUrl(`protected:${protectedFile.evidence_id}`);
      setScannedFile(file);
      toast.success("Scanned W-9 uploaded.");
    } catch (e) {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.legal_name.trim()) return toast.error("Legal name required.");
    if (!form.tin_last4 && !existingForm?.tin_last4) {
      return toast.error("TIN (SSN or EIN) required.");
    }
    if (!form.signature_data.trim()) {
      return toast.error("Type your full legal name as signature.");
    }
    setSaving(true);
    try {
      const payload = {
        entertainer_id:            entertainer.id,
        stage_name:                entertainer.stage_name,
        venue_id:                  entertainer.venue_id,
        tax_year:                  taxYear,
        form_type:                 "W-9",
        legal_name:                form.legal_name.trim(),
        business_name:             form.business_name.trim(),
        tax_classification:        form.tax_classification,
        address_street:            form.address_street,
        address_city:              form.address_city,
        address_state:             form.address_state,
        address_zip:               form.address_zip,
        tin_type:                  form.tin_type,
        tin_last4:                 form.tin_last4,
        backup_withholding_exempt: form.backup_withholding_exempt,
        signature_data:            form.signature_data,
        signed_at:                 new Date().toISOString(),
        scanned_form_url:          scannedUrl || undefined,
        status:                    "active",
        received_by:               currentUser?.email,
        verified_at:               new Date().toISOString(),
      };

      await writeIdentityRecord({
        entity: "ContractorTaxForm",
        operation: existingForm?.id ? "update" : "create",
        id: existingForm?.id,
        venueId: entertainer.venue_id,
        actor: currentUser,
        intent: existingForm?.id ? "contractor:w9:update" : "contractor:w9:create",
        data: payload,
      });

      // Audit trail
      await base44.entities.SystemAuditLog.create({
        event_type: "CONTRACTOR_W9_SAVED",
        description: `W-9 saved for ${entertainer.stage_name} (TY ${taxYear})`,
        actor_email: currentUser?.email,
        status: "success",
        severity: "medium",
        metadata: { entertainer_id: entertainer.id, tax_year: taxYear, has_scan: !!scannedUrl },
      }).catch(() => {});

      toast.success("W-9 saved.");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Failed to save W-9.");
    } finally {
      setSaving(false);
    }
  };

  const tinDisplay = form.tin_full
    ? `•••-••-${form.tin_last4}`
    : form.tin_last4 ? `•••-••-${form.tin_last4}` : "";

  return (
    <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.25)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <FileSignature className="w-5 h-5 text-purple-400" />
          IRS Form W-9 — {entertainer?.stage_name}
          <span className="ml-auto text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10">
            TY {taxYear}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-400 text-xs">Legal Name (Line 1)*</Label>
            <Input value={form.legal_name} onChange={e => handleField("legal_name", e.target.value)}
              className="mt-1 text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Business Name (Line 2, optional)</Label>
            <Input value={form.business_name} onChange={e => handleField("business_name", e.target.value)}
              className="mt-1 text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
          </div>
        </div>

        <div>
          <Label className="text-gray-400 text-xs">Federal Tax Classification (Line 3)*</Label>
          <select
            value={form.tax_classification}
            onChange={e => handleField("tax_classification", e.target.value)}
            className="mt-1 w-full h-9 px-3 rounded-md text-sm text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {TAX_CLASSIFICATIONS.map(t => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label className="text-gray-400 text-xs">Street Address</Label>
            <Input value={form.address_street} onChange={e => handleField("address_street", e.target.value)}
              className="mt-1 text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">City</Label>
            <Input value={form.address_city} onChange={e => handleField("address_city", e.target.value)}
              className="mt-1 text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">State</Label>
              <Input value={form.address_state} maxLength={2} onChange={e => handleField("address_state", e.target.value.toUpperCase())}
                className="mt-1 text-white uppercase" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">ZIP</Label>
              <Input value={form.address_zip} onChange={e => handleField("address_zip", e.target.value)}
                className="mt-1 text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label className="text-gray-400 text-xs">TIN Type*</Label>
            <select
              value={form.tin_type}
              onChange={e => handleField("tin_type", e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md text-sm text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <option value="SSN" className="bg-slate-900">SSN</option>
              <option value="EIN" className="bg-slate-900">EIN</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-gray-400 text-xs">
              {form.tin_type} (Part I) — only last 4 stored
            </Label>
            <Input
              value={form.tin_full || (form.tin_last4 ? `••••${form.tin_last4}` : "")}
              onChange={e => handleTinChange(e.target.value)}
              placeholder={form.tin_type === "SSN" ? "9 digits, no dashes" : "9 digits"}
              className="mt-1 text-white font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
              type="password"
              autoComplete="off"
            />
            {tinDisplay && <div className="text-[10px] text-emerald-400 mt-1 font-mono">Masked: {tinDisplay}</div>}
          </div>
        </div>

        <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input
            type="checkbox"
            checked={form.backup_withholding_exempt}
            onChange={e => handleField("backup_withholding_exempt", e.target.checked)}
            className="mt-0.5"
          />
          <div className="text-[11px] text-gray-300">
            <strong>Part II — Certification.</strong> I certify the TIN above is correct and I am NOT subject to backup withholding.
          </div>
        </label>

        <div>
          <Label className="text-gray-400 text-xs">Signature (type full legal name)*</Label>
          <Input
            value={form.signature_data}
            onChange={e => handleField("signature_data", e.target.value)}
            placeholder="Type legal name to sign"
            className="mt-1 text-white font-serif italic"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.35)" }}
          />
          <div className="text-[10px] text-gray-500 mt-1">
            By signing, you certify all info above under penalty of perjury (IRS W-9 Part II).
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.15)" }}>
          <Label className="text-gray-400 text-xs flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" /> Upload scanned signed W-9 (PDF/JPG/PNG)
          </Label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={e => handleFileUpload(e.target.files?.[0])}
            disabled={uploading}
            className="mt-2 block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-purple-500/20 file:text-purple-300 file:text-xs file:cursor-pointer"
          />
          {uploading && <div className="text-[10px] text-cyan-400 mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</div>}
          {scannedUrl && (
            <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Scan on file —
              <a href={scannedUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1">view</a>
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
          {existingForm ? "Update W-9" : "Save W-9 on File"}
        </Button>

      </CardContent>
    </Card>
  );
}