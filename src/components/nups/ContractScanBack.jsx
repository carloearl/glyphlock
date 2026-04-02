import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, CheckCircle, FileText, Loader2 } from "lucide-react";

const SCAN_STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  SCANNED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  VERIFIED: "bg-green-500/20 text-green-300 border-green-500/40",
};

export default function ContractScanBack({
  contractInstance,
  operator,
  venue,
  onScanComplete,
}) {
  const [previewUrl, setPreviewUrl] = useState(contractInstance?.scanned_document_url || null);
  const [scanStatus, setScanStatus] = useState(contractInstance?.scan_status || "PENDING");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const result = await base44.functions.invoke("uploadMedia", { file: selectedFile });
      const url = result?.data?.file_url || result?.data?.url;
      setUploadedUrl(url);
      setPreviewUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    const finalUrl = uploadedUrl || previewUrl;
    if (!finalUrl || !contractInstance?.id) return;
    setConfirming(true);

    const now = new Date().toISOString();

    try {
      await base44.entities.VenueContract.update(contractInstance.id, {
        scanned_document_url: finalUrl,
        scanned_at: now,
        scanned_by: operator?.email,
        scan_status: "SCANNED",
      });

      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: "CONTRACT_SCANNED_IN",
        entity_type: "VenueContract",
        entity_id: contractInstance.id,
        actor_id: operator?.email,
        venue_id: venue?.id,
        description: `Signed contract scanned for ${contractInstance.customer_name}`,
        metadata: {
          scanned_document_url: finalUrl,
          scanned_at: now,
        },
        severity: "low",
        status: "success",
        timestamp: now,
      });

      setScanStatus("SCANNED");
      onScanComplete?.();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold">
          <FileText className="w-5 h-5 text-blue-400" />
          Scan Signed Contract
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${SCAN_STATUS_COLORS[scanStatus]}`}>
          {scanStatus}
        </span>
      </div>

      {/* Customer info */}
      {contractInstance?.customer_name && (
        <div className="text-sm text-gray-400">
          Contract: <span className="text-white font-medium">{contractInstance.customer_name}</span>
          {contractInstance.contract_id && <span className="ml-2 text-gray-500">#{contractInstance.contract_id}</span>}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" /> Upload File
        </Button>

        <Button
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 gap-2"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-4 h-4" /> Camera Capture
        </Button>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="border border-gray-600 rounded-lg overflow-hidden bg-black">
          {previewUrl.endsWith(".pdf") ? (
            <div className="flex items-center gap-3 p-4 text-gray-300 text-sm">
              <FileText className="w-8 h-8 text-blue-400" />
              <span>PDF document selected</span>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Scanned document preview"
              className="w-full max-h-80 object-contain"
            />
          )}
        </div>
      )}

      {/* Upload button (appears after file selected but before confirmed) */}
      {selectedFile && !uploadedUrl && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-blue-700 hover:bg-blue-600 text-white gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload to System"}
        </Button>
      )}

      {/* Confirm button */}
      {(uploadedUrl || (previewUrl && scanStatus !== "SCANNED")) && (
        <Button
          onClick={handleConfirm}
          disabled={confirming || !uploadedUrl}
          className="w-full bg-green-700 hover:bg-green-600 text-white gap-2"
        >
          {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {confirming ? "Confirming…" : "Confirm Scan & Save"}
        </Button>
      )}

      {/* Already scanned indicator */}
      {scanStatus === "SCANNED" && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" /> Contract scan saved successfully.
        </div>
      )}
    </div>
  );
}