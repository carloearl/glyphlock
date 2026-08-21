import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, CheckCircle2, FileUp, Keyboard, Loader2, X } from "lucide-react";
import { uploadProtectedEvidence } from "@/lib/nups/protectedEvidence";

const FIELD = "w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm min-h-[44px] text-white outline-none focus:border-cyan-400";

const EMPTY = {
  full_name: "",
  date_of_birth: "",
  id_type: "drivers_license",
  id_number: "",
  id_state: "",
  id_expiration: "",
};

function normalizeResult(data = {}) {
  return {
    full_name: String(data.full_name || "").trim(),
    date_of_birth: data.date_of_birth || "",
    id_type: data.id_type || "drivers_license",
    id_number: String(data.id_number || "").trim(),
    id_state: String(data.id_state || "").trim().toUpperCase(),
    id_expiration: data.id_expiration || "",
    identity_profile_ref: data.identity_profile_ref || data.customer_identity_id || data.person_record_id || "",
  };
}

export default function ContractIdentityScanner({ venueId, onVerified }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const stopCamera = () => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError("Camera access was blocked. Upload a photo or enter the ID manually.");
    }
  };

  const deliver = (raw, source) => {
    const data = normalizeResult(raw);
    if (!data.full_name) throw new Error("The ID result did not include a legal name.");
    setForm(data);
    onVerified?.({ ...data, identity_source: source });
  };

  const scanFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (!venueId) throw new Error("Active venue is required before scanning identity evidence.");
      const protectedFile = await uploadProtectedEvidence({
        file,
        venueId,
        artifactType: "government_id_front",
        classification: "PRIVATE_IDENTITY",
        subjectEntity: "VIPContractRecord",
        purpose: "contract_identity_scan",
        signedUrlTtl: 120,
      });
      const result = await base44.functions.invoke("scanCustomerID", {
        venue_id: venueId,
        id_scan_front_url: protectedFile.signed_url,
      });
      if (!result.data?.success) throw new Error(result.data?.error || "ID extraction failed.");
      deliver(result.data.autofill_data, "ID_SCAN");
      stopCamera();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Unable to scan the ID.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    await scanFile(blob);
  };

  const submitManual = () => {
    setError("");
    try {
      if (!form.full_name.trim()) throw new Error("Enter the legal name exactly as printed on the ID.");
      if (!form.id_number.trim()) throw new Error("Enter the ID number.");
      deliver(form, "MANUAL_ID_ENTRY");
      setManual(false);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">Identify the guest</div>
          <div className="text-[11px] text-cyan-100/60">Scan the ID, upload a clear photo, or use verified manual entry.</div>
        </div>
        {(cameraOpen || manual) && (
          <button type="button" onClick={() => { stopCamera(); setManual(false); }} className="p-2 text-white/60 hover:text-white" aria-label="Close identity capture">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!cameraOpen && !manual && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" onClick={startCamera} className="min-h-[52px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Scan ID
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="min-h-[52px] rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} Upload ID
          </button>
          <button type="button" onClick={() => setManual(true)} className="min-h-[52px] rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-2">
            <Keyboard className="w-4 h-4" /> Manual Entry
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => scanFile(e.target.files?.[0])} />
        </div>
      )}

      {cameraOpen && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-cyan-400/40 bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-x-2 bottom-2 rounded bg-black/65 p-2 text-center text-xs text-white">Keep the entire ID flat, sharp, and well lit.</div>
          </div>
          <button type="button" onClick={capture} disabled={busy} className="w-full min-h-[52px] rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} {busy ? "Reading ID…" : "Capture and Autofill"}
          </button>
        </div>
      )}

      {manual && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-white/70">Legal name exactly as printed on ID
              <input className={FIELD + " mt-1"} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter the printed legal name" autoComplete="name" />
            </label>
            <label className="text-xs text-white/70">Date of birth
              <input className={FIELD + " mt-1"} type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </label>
            <label className="text-xs text-white/70">ID number
              <input className={FIELD + " mt-1"} value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="Enter the ID number" />
            </label>
            <label className="text-xs text-white/70">Issuing state
              <input className={FIELD + " mt-1"} value={form.id_state} onChange={(e) => setForm({ ...form, id_state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="AZ" maxLength={2} />
            </label>
          </div>
          <button type="button" onClick={submitManual} className="w-full min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Use This Identity
          </button>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</div>}
    </div>
  );
}
