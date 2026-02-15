import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera, ScanLine, CheckCircle2, Loader2, FileText, Shield, Archive
} from "lucide-react";

export default function HardcopyRescan({ serialNumber, contractId, guestName, onComplete }) {
  const [signedPhotoUrl, setSignedPhotoUrl] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [staffName, setStaffName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const photoRef = useRef(null);
  const barcodePhotoRef = useRef(null);

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSignedPhotoUrl(file_url);
    setUploading(false);
  };

  const handleBarcodeScan = async (file) => {
    if (!file) return;
    // Upload the barcode image then extract the serial via LLM
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract the barcode or serial number text from this image. Return ONLY the raw text/number, nothing else. If you cannot read it, return "UNREADABLE".`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          barcode_value: { type: "string" }
        }
      }
    });
    setBarcodeValue(result.barcode_value || "UNREADABLE");
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.VIPContractRecord.update(contractId, {
      signed_hardcopy_photo_url: signedPhotoUrl,
      hardcopy_barcode_scan: barcodeValue || serialNumber,
      hardcopy_logged_at: new Date().toISOString(),
      hardcopy_logged_by: staffName,
    });
    setSaving(false);
    setDone(true);
    if (onComplete) onComplete();
  };

  const canSave = signedPhotoUrl && staffName.trim();

  if (done) {
    return (
      <Card className="bg-gray-900/60 border-green-500/30">
        <CardContent className="p-8 text-center space-y-3">
          <Archive className="w-14 h-14 text-green-400 mx-auto" />
          <h2 className="text-xl font-bold text-green-400">Hardcopy Archived</h2>
          <p className="text-sm text-gray-400">
            Signed contract for <span className="text-white font-bold">{guestName}</span> has been 
            photographed, scanned, and logged to permanent storage.
          </p>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 font-mono">
            {serialNumber}
          </Badge>
          <div className="text-xs text-gray-600 pt-2 space-y-0.5">
            <p>✓ Signed hardcopy photo archived</p>
            <p>✓ Barcode: {barcodeValue || serialNumber}</p>
            <p>✓ Logged by: {staffName}</p>
            <p>✓ Searchable in Contract Archive</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <ScanLine className="w-5 h-5" />
          Step 6 — Rescan Signed Hardcopy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
          <p className="font-bold mb-1">📋 After printing & physical signing:</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>Guest signs the printed contract with pen (wet ink)</li>
            <li>Photograph the signed printed contract (all pages visible)</li>
            <li>Scan or photograph the barcode / serial number on the contract</li>
            <li>Enter staff name who is logging this copy</li>
            <li>Save to archive — contract becomes searchable</li>
          </ol>
        </div>

        {/* Photo of signed hardcopy */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            Photo of Signed Printed Contract *
          </Label>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handlePhotoUpload(e.target.files[0])} />
          {signedPhotoUrl ? (
            <div className="relative">
              <img src={signedPhotoUrl} alt="Signed Contract" className="w-full rounded-xl border-2 border-amber-500/50" />
              <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400 border-green-500/40">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Captured
              </Badge>
              <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400"
                onClick={() => photoRef.current?.click()}>
                Retake Photo
              </Button>
            </div>
          ) : (
            <Button onClick={() => photoRef.current?.click()} disabled={uploading}
              className="w-full h-24 bg-amber-500/10 border-2 border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/20 flex-col gap-2"
              variant="outline">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-8 h-8" />}
              {uploading ? "Uploading..." : "Photograph Signed Contract"}
            </Button>
          )}
        </div>

        {/* Barcode scan */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-purple-400" />
            Barcode / Serial Scan
          </Label>
          <input ref={barcodePhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handleBarcodeScan(e.target.files[0])} />
          
          {barcodeValue ? (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Scanned Barcode:</div>
                <div className="text-sm font-mono text-purple-400 font-bold">{barcodeValue}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => barcodePhotoRef.current?.click()}
                className="flex-1 h-16 bg-purple-500/10 border-2 border-dashed border-purple-500/40 text-purple-400 hover:bg-purple-500/20 flex-col gap-1"
                variant="outline">
                <ScanLine className="w-5 h-5" />
                Scan Barcode (Camera)
              </Button>
              <div className="flex-1">
                <Input
                  value={barcodeValue}
                  onChange={e => setBarcodeValue(e.target.value)}
                  placeholder="Or type serial manually..."
                  className="h-16 text-center font-mono"
                />
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-500">Point camera at the barcode on the printed contract, or type the serial number manually.</p>
        </div>

        {/* Staff name */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Staff Name Logging This Copy *
          </Label>
          <Input
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
            placeholder="Manager or staff member name"
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
          <div className="text-sm font-bold text-white mb-2">Rescan Summary:</div>
          <div className="flex justify-between">
            <span>Contract Serial:</span>
            <span className="text-purple-400 font-mono">{serialNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Guest:</span>
            <span className="text-white font-bold">{guestName}</span>
          </div>
          <div className="flex justify-between">
            <span>Signed Photo:</span>
            <span className={signedPhotoUrl ? "text-green-400" : "text-red-400"}>
              {signedPhotoUrl ? "✓ Captured" : "✗ Needed"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Barcode:</span>
            <span className={barcodeValue ? "text-green-400" : "text-gray-600"}>
              {barcodeValue || "— Optional (defaults to serial)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Logged By:</span>
            <span className={staffName.trim() ? "text-white" : "text-red-400"}>
              {staffName.trim() || "✗ Needed"}
            </span>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canSave || saving}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Archiving...</> : (
            <><Archive className="w-5 h-5 mr-2" /> Archive Signed Contract to Storage</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}