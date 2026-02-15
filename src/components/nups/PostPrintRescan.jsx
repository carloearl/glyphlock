import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera, ScanLine, CheckCircle2, Loader2, Archive, FileText
} from "lucide-react";

export default function PostPrintRescan({ serialNumber, contractRecordId, onComplete }) {
  const [signedPhotoUrl, setSignedPhotoUrl] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodePhotoUrl, setBarcodePhotoUrl] = useState("");
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const signedPhotoRef = useRef(null);
  const barcodePhotoRef = useRef(null);

  const handleUpload = async (file, field) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === "signed_photo") setSignedPhotoUrl(file_url);
    else if (field === "barcode_photo") setBarcodePhotoUrl(file_url);
    setUploading(prev => ({ ...prev, [field]: false }));
  };

  const canArchive = signedPhotoUrl && (barcodeValue.trim() || barcodePhotoUrl);

  const handleArchive = async () => {
    if (!canArchive) return;
    setSaving(true);

    await base44.entities.VIPContractRecord.update(contractRecordId, {
      signed_copy_photo_url: signedPhotoUrl,
      signed_copy_barcode: barcodeValue.trim() || serialNumber,
      physical_sign_confirmed: true,
      physical_sign_at: new Date().toISOString(),
      status: "archived",
    });

    setDone(true);
    setSaving(false);
    if (onComplete) onComplete();
  };

  if (done) {
    return (
      <Card className="bg-green-500/10 border-green-500/40">
        <CardContent className="p-6 text-center space-y-3">
          <Archive className="w-12 h-12 text-green-400 mx-auto" />
          <h3 className="text-lg font-bold text-green-400">Contract Archived Successfully</h3>
          <p className="text-xs text-gray-400">
            Physical signed copy + barcode logged. Serial: <span className="font-mono text-purple-400">{serialNumber}</span>
          </p>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
            Searchable in Contract Archive
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <ScanLine className="w-5 h-5" />
          Post-Print Rescan — Archive Physical Copy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
          <p className="font-bold mb-1">📋 After printing, the guest physically signs the paper copy. Then:</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>Photograph the signed printed contract (all pages with wet ink signatures visible)</li>
            <li>Scan or type the barcode/serial number from the printed contract</li>
            <li>Click "Archive" to store and make it searchable</li>
          </ol>
        </div>

        {/* Signed Physical Copy Photo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            Photo of Signed Physical Contract *
          </Label>
          <input ref={signedPhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handleUpload(e.target.files[0], "signed_photo")} />
          {signedPhotoUrl ? (
            <div className="relative">
              <img src={signedPhotoUrl} alt="Signed Contract" className="w-full rounded-xl border-2 border-amber-500/50" />
              <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400 border-green-500/40">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Captured
              </Badge>
              <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400"
                onClick={() => signedPhotoRef.current?.click()}>
                Retake Photo
              </Button>
            </div>
          ) : (
            <Button onClick={() => signedPhotoRef.current?.click()} disabled={uploading.signed_photo}
              className="w-full h-24 bg-amber-500/10 border-2 border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/20 flex-col gap-2"
              variant="outline">
              {uploading.signed_photo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-8 h-8" />}
              {uploading.signed_photo ? "Uploading..." : "Photograph Signed Contract Pages"}
            </Button>
          )}
        </div>

        {/* Barcode / QR Scan */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-purple-400" />
            Barcode / Serial from Printed Contract *
          </Label>
          <Input
            value={barcodeValue}
            onChange={e => setBarcodeValue(e.target.value)}
            placeholder={`Scan or type barcode (default: ${serialNumber})`}
            className="font-mono"
          />
          <p className="text-[10px] text-gray-500">Scan barcode with device camera or type the serial number from the printed page.</p>

          {/* Optional: photo of barcode for extra proof */}
          <input ref={barcodePhotoRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => handleUpload(e.target.files[0], "barcode_photo")} />
          {!barcodePhotoUrl ? (
            <Button size="sm" variant="outline" onClick={() => barcodePhotoRef.current?.click()}
              disabled={uploading.barcode_photo}
              className="border-gray-700 text-gray-400 text-xs w-full">
              {uploading.barcode_photo ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Camera className="w-3 h-3 mr-1" />}
              {uploading.barcode_photo ? "Uploading..." : "Optional: Photo of Barcode"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle2 className="w-3 h-3" /> Barcode photo captured
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs space-y-1">
          <div className="text-sm font-bold text-white mb-2">Rescan Checklist:</div>
          <div className="flex justify-between">
            <span className="text-gray-400">Signed copy photo:</span>
            <span className={signedPhotoUrl ? "text-green-400 font-bold" : "text-red-400"}>
              {signedPhotoUrl ? "✓ Captured" : "✗ Required"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Barcode / Serial:</span>
            <span className={(barcodeValue.trim() || barcodePhotoUrl) ? "text-green-400 font-bold" : "text-red-400"}>
              {(barcodeValue.trim() || barcodePhotoUrl) ? "✓ Recorded" : "✗ Required"}
            </span>
          </div>
        </div>

        <Button
          onClick={handleArchive}
          disabled={!canArchive || saving}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Archiving...</>
          ) : (
            <><Archive className="w-5 h-5 mr-2" /> Archive Signed Contract to Storage</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}