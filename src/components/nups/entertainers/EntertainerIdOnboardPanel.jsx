import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, Upload, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import useHardwareScanner from "@/hooks/useHardwareScanner";
import { parseAAMVA } from "@/lib/nups/aamva";
import { licenseStatus } from "@/lib/nups/licenseStatus";
import { writeIdentityRecord, snapshotPersonAudited } from "@/lib/nups/identityWrites";
import ContractorAgreementBlock from "./ContractorAgreementBlock";
import { ENTERTAINER_CLICKWRAP } from "@/constants/entertainerClickwrap";
import { generateUniquePin } from "@/lib/nups/entertainerPin";

/**
 * EntertainerIdOnboardPanel — onboard an adult entertainer's credential.
 * Two capture paths, both landing on the same durable Entertainer record:
 *   1. HID barcode scan of the back of the license (auto-fills fields)
 *   2. Photo upload of the FRONT of the license (required evidence for adult ent.)
 * Only the last-4 of the ID number is stored — never the full number.
 */
const EMPTY = {
  stage_name: "",
  legal_name: "",
  phone: "",
  nups_pin: "",
  date_of_birth: "",
  id_type: "",
  license_number_last4: "",
  license_state: "",
  license_expiration: "",
};

export default function EntertainerIdOnboardPanel({ venueId, user, existing = [], onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [scanned, setScanned] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState({ agreed: false, acks: {}, signature: "" });
  const [issuedPin, setIssuedPin] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const status = licenseStatus({ license_expiration: form.license_expiration });

  useHardwareScanner((raw) => {
    const parsed = parseAAMVA(raw);
    if (!parsed) return toast.error("That scan wasn't a readable ID barcode — scan the back of the license.");
    setForm((f) => ({
      ...f,
      legal_name: parsed.full_name || f.legal_name,
      stage_name: f.stage_name || parsed.full_name || "",
      date_of_birth: parsed.date_of_birth || "",
      id_type: parsed.id_type || "Drivers License",
      license_number_last4: (parsed.id_number || "").slice(-4),
      license_state: parsed.id_state || "",
      license_expiration: parsed.id_expiration || "",
    }));
    setScanned(true);
    toast.success(`Scanned ${parsed.full_name || "ID"}`);
  });

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      toast.success("License photo attached");
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!venueId) return toast.error("No active venue resolved.");
    if (!form.stage_name.trim() || !form.legal_name.trim()) return toast.error("Stage name and legal name are required.");
    if (!form.license_expiration) return toast.error("License expiration is required — scan the ID or enter it.");
    if (!photoUrl) return toast.error("Attach a photo of the front of the license.");
    if (!contract.agreed) {
      return toast.error("The entertainer must read and accept the Independent Contractor Agreement.");
    }
    const missingAck = ENTERTAINER_CLICKWRAP.find((c) => !contract.acks?.[c.key]);
    if (missingAck) return toast.error(`Acknowledgment required: ${missingAck.title}`);
    if (!contract.signature.trim()) return toast.error("A typed digital signature is required.");

    // Every entertainer leaves onboarding with a door PIN — issued automatically
    // when the operator didn't set one.
    const pin = form.nups_pin || generateUniquePin(existing);
    if (!pin) return toast.error("Could not issue a unique PIN — set one manually.");

    setSaving(true);
    try {
      const credentials = {
        stage_name: form.stage_name.trim(),
        legal_name: form.legal_name.trim(),
        phone: form.phone || undefined,
        nups_pin: pin,
        date_of_birth: form.date_of_birth || undefined,
        id_type: form.id_type || undefined,
        license_number_last4: form.license_number_last4 || undefined,
        license_state: form.license_state || undefined,
        license_expiration: form.license_expiration,
        license_photo_url: photoUrl,
        id_verified: true,
        id_verified_by: user?.email || "manager",
        id_verified_at: new Date().toISOString(),
        id_scan_source: scanned ? "hardware_scanner" : "photo_upload",
        payout_hold: !status.can_receive_cash_payout,
        contract_signed: true,
        contract_signature: contract.signature.trim(),
        contract_signed_date: new Date().toISOString(),
        contract_status: status.can_receive_cash_payout ? "VALID" : "PENDING",
        clickwrap_acknowledgments: ENTERTAINER_CLICKWRAP.map((c) => ({
          key: c.key,
          title: c.title,
          text: c.text,
          accepted: true,
          accepted_at: new Date().toISOString(),
          witnessed_by: user?.email || "manager",
        })),
      };

      const match = existing.find(
        (e) => (e.stage_name || "").trim().toLowerCase() === form.stage_name.trim().toLowerCase()
      );

      // Step 1 (ARCH-BASELINE-01) — routes through the audit gateway.
      const saved = match
        ? await writeIdentityRecord({
            entity: "Entertainer",
            operation: "update",
            id: match.id,
            data: credentials,
            venueId,
            intent: "entertainer_onboarding:recredential",
          })
        : await writeIdentityRecord({
            entity: "Entertainer",
            operation: "create",
            venueId,
            intent: "entertainer_onboarding:create",
            data: {
              venue_id: venueId,
              status: "active",
              contract_signed: false,
              contract_status: "PENDING",
              iou_balance: 0,
              ...credentials,
            },
          });
      await snapshotPersonAudited({
        type: "entertainer",
        event: match ? "updated" : "created",
        record: saved,
      });

      toast.success(match ? "Credential updated" : "Entertainer onboarded");
      setIssuedPin(pin);
      setForm(EMPTY);
      setContract({ agreed: false, acks: {}, signature: "" });
      setPhotoUrl("");
      setScanned(false);
      onSaved?.(saved);
    } catch (e) {
      toast.error(e.message || "Onboarding failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-pink-950/20 border-pink-500/40">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-bold text-pink-300">
            <ScanLine className="w-4 h-4" /> Onboard Entertainer — Scan or Upload License
          </div>
          {scanned && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
              <ShieldCheck className="w-3 h-3 mr-1" /> Barcode captured
            </Badge>
          )}
        </div>

        {issuedPin && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-emerald-400 font-bold">Door PIN issued</p>
              <p className="text-3xl font-mono font-extrabold text-white tracking-widest">{issuedPin}</p>
              <p className="text-[11px] text-emerald-200/70">
                Give this to the entertainer — she checks in with this PIN or by scanning her license at the door.
              </p>
            </div>
            <Button variant="outline" onClick={() => setIssuedPin("")} className="border-emerald-500/40 text-emerald-300 text-xs">
              Done
            </Button>
          </div>
        )}

        {form.license_expiration && status.code !== "VALID" && (
          <div className={`flex items-center gap-2 text-xs rounded-lg p-2 border ${status.code === "EXPIRED" ? "text-red-300 bg-red-950/40 border-red-500/40" : "text-amber-300 bg-amber-950/30 border-amber-500/40"}`}>
            <AlertTriangle className="w-4 h-4 shrink-0" /> {status.label} — {status.reason}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-300 text-xs">Stage Name</Label>
            <Input value={form.stage_name} onChange={(e) => set("stage_name", e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Legal Name</Label>
            <Input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Door PIN (4 digits)</Label>
            <div className="flex gap-2">
              <Input
                value={form.nups_pin}
                onChange={(e) => set("nups_pin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                placeholder="auto-issued"
                className="bg-gray-800 border-gray-700 text-white font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const p = generateUniquePin(existing);
                  if (!p) return toast.error("No PIN available — enter one manually.");
                  set("nups_pin", p);
                }}
                className="border-pink-500/40 text-pink-300 text-xs shrink-0"
              >
                Issue
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Date of Birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">License Expiration</Label>
            <Input type="date" value={form.license_expiration} onChange={(e) => set("license_expiration", e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">License · Last 4</Label>
            <Input
              value={form.license_number_last4}
              onChange={(e) => set("license_number_last4", e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              className="bg-gray-800 border-gray-700 text-white font-mono"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Issuing State</Label>
            <Input
              value={form.license_state}
              onChange={(e) => set("license_state", e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              className="bg-gray-800 border-gray-700 text-white font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300 text-xs">Front of License — photo (required)</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-500/40 text-pink-300 text-xs cursor-pointer hover:bg-pink-500/10">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {photoUrl ? "Replace photo" : "Upload / take photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
            </label>
            {photoUrl && <img src={photoUrl} alt="License front" className="h-16 rounded border border-gray-700" />}
          </div>
        </div>

        <p className="text-[11px] text-gray-500 bg-gray-900/40 border border-gray-800 rounded p-2">
          Only the license last-4, issuing state and expiration are stored alongside the credential photo. The full ID number is never saved.
        </p>

        <ContractorAgreementBlock venueId={venueId} value={contract} onChange={setContract} />

        <Button onClick={save} disabled={saving || uploading} className="w-full bg-pink-600 hover:bg-pink-500 font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          {saving ? "Saving…" : "Save Credential"}
        </Button>
      </CardContent>
    </Card>
  );
}