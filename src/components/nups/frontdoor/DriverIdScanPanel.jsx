import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, IdCard, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import useHardwareScanner from "@/hooks/useHardwareScanner";
import { parseAAMVA } from "@/lib/nups/aamva";
import ScannedIdFields from "@/components/nups/frontdoor/ScannedIdFields";
import { writeIdentityRecord, snapshotPersonAudited } from "@/lib/nups/identityWrites";

/**
 * DriverIdScanPanel — onboard a driver by scanning the barcode on the back of
 * their license with the USB HID scanner. Decoded credentials land in editable
 * fields, are stored on the durable DriverProfile (last-4 only — the full ID
 * number is never persisted), and a personalized server-signed QR is issued.
 */
const EMPTY = {
  name: "",
  phone: "",
  date_of_birth: "",
  id_type: "",
  license_last4: "",
  license_state: "",
  id_expiration: "",
  address_line1: "",
  city: "",
  state: "",
  zip_code: "",
};

function makeDriverId(venueId) {
  const short = (venueId || "VENUE").toString().slice(-4).toUpperCase();
  return `DRV-${short}-${Date.now().toString(36).toUpperCase()}`;
}

export default function DriverIdScanPanel({ venueId, user, existingProfiles = [], onIssued, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [scanned, setScanned] = useState(false);
  const [expired, setExpired] = useState(false);
  const [affiliated, setAffiliated] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useHardwareScanner((raw) => {
    const parsed = parseAAMVA(raw);
    if (!parsed) {
      toast.error("That scan wasn't a readable ID barcode — scan the back of the license.");
      return;
    }
    setForm({
      name: parsed.full_name || "",
      phone: "",
      date_of_birth: parsed.date_of_birth || "",
      id_type: parsed.id_type || "Drivers License",
      license_last4: (parsed.id_number || "").slice(-4),
      license_state: parsed.id_state || "",
      id_expiration: parsed.id_expiration || "",
      address_line1: parsed.address_line1 || "",
      city: parsed.city || "",
      state: parsed.state || "",
      zip_code: parsed.zip_code || "",
    });
    setExpired(!!parsed.id_expired);
    setScanned(true);
    toast.success(`Scanned ${parsed.full_name || "driver ID"}`);
  });

  const save = async () => {
    if (!venueId) return toast.error("No active venue resolved.");
    if (!form.name.trim()) return toast.error("Driver name is required.");

    setSaving(true);
    try {
      const trimmed = form.name.trim().toLowerCase();
      const duplicate = existingProfiles.find((p) => (p.name || "").trim().toLowerCase() === trimmed);

      const credentials = {
        name: form.name.trim(),
        phone: form.phone || undefined,
        date_of_birth: form.date_of_birth || undefined,
        id_type: form.id_type || undefined,
        license_last4: form.license_last4 || undefined,
        license_state: form.license_state || undefined,
        license_expiration: form.id_expiration || undefined,
        address_line1: form.address_line1 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zip_code: form.zip_code || undefined,
        id_verified: scanned,
        id_verified_by: user?.email || "door",
        id_verified_at: new Date().toISOString(),
        id_scan_source: scanned ? "hardware_scanner" : "manual_entry",
        last_active_at: new Date().toISOString(),
      };

      // Step 1 (ARCH-BASELINE-01) — driver credentials route through the audit gateway.
      let profile;
      if (duplicate) {
        profile = await writeIdentityRecord({
          entity: "DriverProfile",
          operation: "update",
          id: duplicate.id,
          data: credentials,
          venueId,
          intent: "driver_onboarding:recredential",
        });
        profile = { ...duplicate, ...credentials, ...(profile || {}) };
      } else {
        profile = await writeIdentityRecord({
          entity: "DriverProfile",
          operation: "create",
          venueId,
          intent: "driver_onboarding:create",
          data: {
          driver_id: makeDriverId(venueId),
          venue_id: venueId,
          affiliated,
          ytd_payout_total: 0,
          ytd_year: new Date().getFullYear(),
          ten99_flag: false,
          ten99_threshold: 600,
          status: "active",
          onboarded_by: user?.email || "door",
            ...credentials,
          },
        });
      }
      await snapshotPersonAudited({ type: "driver", event: duplicate ? "updated" : "created", record: profile });

      // Personalized QR — signed server-side, key never reaches the device.
      let qrToken = profile.qr_token || null;
      const res = await base44.functions.invoke("signDriverQrToken", { driver_id: profile.driver_id });
      const data = res?.data || {};
      if (data.qr_token) {
        qrToken = data.qr_token;
      } else {
        toast.error(data.error || "Driver saved, but QR signing failed — reissue from the driver card.");
      }

      setForm(EMPTY);
      setScanned(false);
      setExpired(false);
      onIssued?.({ ...profile, qr_token: qrToken, qr_code: qrToken || profile.qr_code });
    } catch (err) {
      toast.error(err.message || "Driver onboarding failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-yellow-950/25 border-yellow-500/40">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-bold text-yellow-300">
            <ScanLine className="w-4 h-4" /> Scan Driver ID
          </div>
          {scanned && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
              <ShieldCheck className="w-3 h-3 mr-1" /> Credential captured
            </Badge>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Scan the barcode on the back of the driver's license with the door scanner. Fields fill
          automatically — correct anything, then save to issue their personalized QR pass.
        </p>

        {expired && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> This ID is expired.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-300 text-xs">Driver Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Scan ID or type name"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(480) 555-0134"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Date of Birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">License · Last 4 / State</Label>
            <div className="flex gap-2">
              <Input
                value={form.license_last4}
                onChange={(e) => set("license_last4", e.target.value.toUpperCase().slice(0, 4))}
                placeholder="4821"
                maxLength={4}
                className="bg-gray-800 border-gray-700 text-white font-mono"
              />
              <Input
                value={form.license_state}
                onChange={(e) => set("license_state", e.target.value.toUpperCase().slice(0, 2))}
                placeholder="AZ"
                maxLength={2}
                className="bg-gray-800 border-gray-700 text-white font-mono w-20"
              />
            </div>
          </div>
        </div>

        <ScannedIdFields form={form} set={set} />

        <div className="flex items-center gap-2 text-xs text-gray-300">
          <IdCard className="w-3.5 h-3.5 text-yellow-400" />
          <button
            type="button"
            onClick={() => setAffiliated((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border font-bold uppercase tracking-wide text-[10px] ${
              affiliated
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                : "bg-orange-500/15 border-orange-500/50 text-orange-300"
            }`}
          >
            {affiliated ? "Affiliated driver" : "Outside driver"}
          </button>
          <span className="text-gray-500">Tap to switch — sets the payout rate leg.</span>
        </div>

        <p className="text-[11px] text-gray-500 bg-gray-900/40 border border-gray-800 rounded p-2">
          Only the license last-4, issuing state and expiration are stored. The full ID number is never saved.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={save}
            disabled={saving || !form.name.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold flex-1"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            {saving ? "Issuing QR…" : "Save & Issue QR"}
          </Button>
          <Button variant="outline" onClick={onCancel} className="border-gray-700 text-gray-300">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}