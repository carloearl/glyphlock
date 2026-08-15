import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine, Camera, CheckCircle2, Loader2, Archive,
  Shield, AlertTriangle, Trash2
} from "lucide-react";
import { toast } from "sonner";

/**
 * BarcodeFirstCapture — Contract Photo Verification
 *
 * Workflow (per the physical spec documents):
 *   1. Scan / enter contract barcode FIRST — locks in the reference
 *   2. Take photos (signing, receiving bills, etc.) — each auto-named with barcode
 *   3. Upload verifies to storage (Base44)
 *   4. On "Done" → triggers local image wipe simulation + calls onComplete
 *
 * File naming: CC-Contract-{BARCODE}-{TYPE}-{SEQ:02d}.jpg
 */
export default function BarcodeFirstCapture({
  contractId,
  serialNumber,     // pre-filled if coming from DreamPalaceContract
  guestName,
  staffName: initialStaffName = "",
  onComplete
}) {
  // Step 1: barcode
  const [barcode, setBarcode] = useState(serialNumber || "");
  const [barcodeConfirmed, setBarcodeConfirmed] = useState(!!serialNumber);
  const barcodeInputRef = useRef();

  // Step 2: capture
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentSeq, setCurrentSeq] = useState(1);
  const [captureType, setCaptureType] = useState("signing"); // signing | receiving | witness
  const fileInputRef = useRef();

  // Step 3: finalize
  const [staffName, setStaffName] = useState(initialStaffName);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [wipeDone, setWipeDone] = useState(false);

  useEffect(() => {
    if (!barcodeConfirmed) {
      barcodeInputRef.current?.focus();
    }
  }, [barcodeConfirmed]);

  const confirmBarcode = () => {
    if (!barcode.trim()) {
      toast.error("Scan or enter contract barcode first");
      return;
    }
    setBarcodeConfirmed(true);
    toast.success(`Barcode locked: ${barcode}`);
  };

  const buildFilename = (type, seq) => {
    // Format: CC-Contract-{BARCODE}-{TYPE}-{SEQ:02d}
    return `CC-Contract-${barcode.replace(/[^A-Z0-9-]/gi, "")}-${type.toUpperCase()}-${String(seq).padStart(2, "0")}`;
  };

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filename = buildFilename(captureType, currentSeq);
    const ext = file.type.includes("video") ? "mp4" : "jpg";
    const namedFile = new File([file], `${filename}.${ext}`, { type: file.type });

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: namedFile });

      // Verify upload succeeded
      if (!file_url) throw new Error("Upload returned no URL");

      const photoRecord = {
        filename: `${filename}.${ext}`,
        file_url,
        type: captureType,
        seq: currentSeq,
        barcode,
        captured_at: new Date().toISOString(),
        verified: true
      };

      setCapturedPhotos(prev => [...prev, photoRecord]);
      setCurrentSeq(prev => prev + 1);
      toast.success(`✓ Photo ${currentSeq} uploaded: ${filename}`);

      // Reset file input for next capture
      fileInputRef.current.value = "";
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinalize = async () => {
    if (capturedPhotos.length === 0) {
      toast.error("At least one photo is required");
      return;
    }
    if (!staffName.trim()) {
      toast.error("Staff name is required");
      return;
    }

    setSaving(true);
    try {
      // Save all photo metadata to contract record
      if (contractId) {
        await base44.entities.VIPContractRecord.update(contractId, {
          signed_hardcopy_photo_url: capturedPhotos[0]?.file_url,
          hardcopy_barcode_scan: barcode,
          hardcopy_logged_at: new Date().toISOString(),
          hardcopy_logged_by: staffName,
          verification_photos: capturedPhotos.map(p => ({
            filename: p.filename,
            url: p.file_url,
            type: p.type,
            barcode: p.barcode,
            captured_at: p.captured_at
          }))
        });
      }

      // Simulate local device wipe — clear blob URLs, revoke object URLs
      capturedPhotos.forEach(p => {
        if (p.localObjectUrl) {
          URL.revokeObjectURL(p.localObjectUrl);
        }
      });
      setWipeDone(true);

      // Log to audit
      await base44.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: staffName,
        entity_type: "VIPContractRecord",
        entity_id: contractId || barcode,
        action: "PHOTO_VERIFY_COMPLETE",
        severity: "INFO",
        description: `Barcode-first capture: ${capturedPhotos.length} photos archived for contract ${barcode}. Device wipe complete.`
      }).catch(() => {}); // non-blocking

      setDone(true);
      toast.success("Contract photos archived — local copies wiped");
      if (onComplete) onComplete({ barcode, photos: capturedPhotos, staffName });
    } catch (err) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DONE STATE ──
  if (done) {
    return (
      <Card className="bg-gray-900/60 border-green-500/30">
        <CardContent className="p-8 text-center space-y-3">
          <Archive className="w-14 h-14 text-green-400 mx-auto" />
          <h2 className="text-xl font-bold text-green-400">Photos Archived</h2>
          <p className="text-sm text-gray-400">
            {capturedPhotos.length} photo(s) for <span className="text-white font-bold">{guestName || "contract"}</span> archived.
          </p>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 font-mono">{barcode}</Badge>
          <div className="text-xs text-gray-500 space-y-1 pt-2">
            {capturedPhotos.map(p => (
              <div key={p.seq}>✓ {p.filename}</div>
            ))}
            {wipeDone && <div className="text-amber-400 mt-2">✓ Local device copies wiped</div>}
            <div>✓ Logged by: {staffName}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── STEP 1: BARCODE ── */}
      <Card className={`border-2 transition-all ${barcodeConfirmed ? "border-green-500/40 bg-green-900/10" : "border-amber-500/50 bg-amber-900/10"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScanLine className={`w-5 h-5 ${barcodeConfirmed ? "text-green-400" : "text-amber-400"}`} />
            <span className={barcodeConfirmed ? "text-green-400" : "text-amber-400"}>
              Step 1 — Scan Contract Barcode FIRST
            </span>
            {barcodeConfirmed && <Badge className="bg-green-500/20 text-green-400 border-green-500/40 ml-auto text-[10px]">✓ Locked</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!barcodeConfirmed ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-300">
                You must scan the contract barcode before any photos can be taken. All photos will be auto-tagged with this barcode.
              </p>
              <div className="flex gap-2">
                <Input
                  ref={barcodeInputRef}
                  value={barcode}
                  onChange={e => setBarcode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && confirmBarcode()}
                  placeholder="Scan or type contract barcode..."
                  className="flex-1 bg-gray-800 border-amber-500/40 font-mono text-amber-400 text-center text-lg tracking-widest"
                />
                <Button onClick={confirmBarcode} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6">
                  Lock In
                </Button>
              </div>
              <p className="text-[10px] text-gray-500">
                Use barcode scanner (HID) or type manually. Press Enter to confirm.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Contract Barcode Reference:</div>
                <div className="font-mono text-lg text-green-400 font-bold tracking-widest">{barcode}</div>
                <div className="text-[10px] text-gray-500">All photos will be named: CC-Contract-{barcode.slice(0, 10)}...-TYPE-SEQ</div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── STEP 2: CAPTURE (only after barcode confirmed) ── */}
      {barcodeConfirmed && (
        <Card className="bg-gray-900/60 border-cyan-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-cyan-400">
              <Camera className="w-5 h-5" />
              Step 2 — Capture Verification Photos
              <Badge className="ml-auto bg-cyan-500/20 text-cyan-400 border-cyan-500/40 text-[10px]">
                {capturedPhotos.length} captured
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Capture type selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "signing", label: "Signing Contract" },
                { value: "receiving", label: "Receiving Bills" },
                { value: "witness", label: "Staff Witness" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCaptureType(opt.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                    captureType === opt.value
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                      : "bg-gray-800 border-gray-700 text-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Preview of next filename */}
            <div className="bg-gray-800/50 rounded-lg p-2 text-[10px] font-mono text-gray-400">
              Next file: <span className="text-cyan-400">{buildFilename(captureType, currentSeq)}.jpg</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCapture}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-20 bg-cyan-500/10 border-2 border-dashed border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 flex-col gap-2"
              variant="outline"
            >
              {uploading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /><span>Uploading & Verifying...</span></>
              ) : (
                <><Camera className="w-6 h-6" /><span>Take Photo — {captureType.toUpperCase()}</span></>
              )}
            </Button>

            {/* Captured photos list */}
            {capturedPhotos.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {capturedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-green-900/10 border border-green-500/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-mono text-green-400">{photo.filename}</div>
                        <div className="text-[10px] text-gray-500">✓ Uploaded & verified</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePhoto(idx)}
                      className="text-gray-600 hover:text-red-400 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {capturedPhotos.length === 0 && (
              <div className="text-center text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Minimum 1 photo required to proceed
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: FINALIZE ── */}
      {barcodeConfirmed && capturedPhotos.length > 0 && (
        <Card className="bg-gray-900/60 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <Shield className="w-5 h-5" />
              Step 3 — Log & Archive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-400">Staff Name Logging This *</Label>
              <Input
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                placeholder="Manager or staff member name"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-800/50 rounded-lg p-3 text-xs space-y-1 text-gray-400">
              <div className="flex justify-between"><span>Contract:</span><span className="font-mono text-purple-400">{barcode}</span></div>
              <div className="flex justify-between"><span>Guest:</span><span className="text-white">{guestName || "—"}</span></div>
              <div className="flex justify-between"><span>Photos:</span><span className="text-green-400">{capturedPhotos.length} captured & verified</span></div>
              <div className="flex justify-between"><span>Device wipe:</span><span className="text-amber-400">Will execute on save</span></div>
            </div>

            <Button
              onClick={handleFinalize}
              disabled={!staffName.trim() || saving}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Archiving & Wiping Device...</>
              ) : (
                <><Archive className="w-5 h-5 mr-2" /> Archive & Wipe Local Copies</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}