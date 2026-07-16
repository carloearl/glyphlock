import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraScanner from "@/components/scanner/CameraScanner";
import { ScanLine, X } from "lucide-react";

/**
 * Camera QR verify — scans a GlyphBucks receipt QR (NUPS1.… signed token or
 * /v/VRF-… URL), extracts the verify ref, and routes to the verification page.
 * Decoding only — signature verification is always server-side.
 */
export default function GlyphBucksScanVerify() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleDecode = (raw) => {
    let ref = null;
    const urlMatch = String(raw).match(/\/v\/(VRF-[\dA-F-]+)/i);
    if (urlMatch) ref = urlMatch[1].toUpperCase();
    else if (String(raw).startsWith("NUPS1.")) {
      try {
        const payload = JSON.parse(atob(String(raw).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        ref = payload.verify_ref || payload.ref || null;
      } catch { /* fall through */ }
    } else if (/^VRF-\d{6}-\d{6}-[0-9A-F]{4}$/i.test(String(raw).trim())) {
      ref = String(raw).trim().toUpperCase();
    }
    if (ref) {
      setOpen(false);
      navigate(`/v/${ref}`);
    } else {
      setMsg("Not a GlyphBucks receipt QR — keep scanning.");
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="rounded-xl btn-glow-blue font-bold px-4 py-2 min-h-[44px] flex items-center gap-2 text-sm">
        <ScanLine className="w-4 h-4" /> Scan Receipt QR
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      <CameraScanner onDecode={handleDecode} formats={["qr_code"]} active={open} label="Verify receipt" />
      {msg && <p className="text-xs text-amber-300 text-center font-semibold">{msg}</p>}
      <button onClick={() => setOpen(false)}
        className="w-full rounded-xl border border-white/20 px-4 py-2 min-h-[44px] font-semibold hover:bg-white/5 flex items-center justify-center gap-2 text-sm">
        <X className="w-4 h-4" /> Close Scanner
      </button>
    </div>
  );
}