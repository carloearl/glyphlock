import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * NUPS VERIFY — OFFLINE. Full-screen mobile scanner that decodes the receipt
 * QR (jsQR, on-device) and verifies the NUPS1 Ed25519 signature entirely in
 * the browser against the PINNED published signing key. Nothing is sent
 * anywhere — works with no connectivity at the door.
 */

// Published NUPS GlyphBucks Ed25519 signing key (printed on every receipt).
const PINNED_PUBLIC_KEY_HEX = "cf6a4fc7071012075a3ccbfc65c02854079eb134b6fc117c606d92ab698ee01d";

// Known-good sealed token for the no-camera self test.
const DEMO_TOKEN = "NUPS1.eyJ2IjoidjIuMCIsInJlZiI6IlZSRi0yNjA3MTYtMDYwNDkwLTkzMkMiLCJpc3MiOiJHbHlwaExvY2sgTExDIiwiZG9jIjoiR2x5cGhCdWNrcyBQdXJjaGFzZSBBZ3JlZW1lbnQgJiBSZWNlaXB0IiwicHJvZCI6InN0b3JlZC12YWx1ZS12b3VjaGVyIiwiYW10IjoxMDAwLCJjdXIiOiJVU0QiLCJmYWNlIjoxMDAwLCJzbiI6IjIzLTI0IiwiYWNjdCI6IiIsInRoIjoiZGVkOTU4Y2MyZDg0MmFjNDJkOTkwNGFiNzViYTM4ZjgwZGM0YmE5NDc3YmNlM2FlOTAwZjIzN2JlNGNkMDA2ZSIsImNoIjoiNTE0MWI0ZDk1MzUxYmMyMTIyMzIwYTc2YTFkYzU2YWRhNTAwMTE3MDAzNzJhNzQyMmQ2NzA0NTE0ZDU3MzM5MSIsInRzIjoiMjAyNi0wNy0xNlQwOTo0Nzo1NS4zNDRaIn0.g8mI-qrErQwYHJezQvu2w7lEYmntW-w9zDc0P6aczelZCa6I-j5pyPt8x44hOa_CveEYCc8T9dk4sB4oTXfxCA";

const b64urlToBytes = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};
const hexToBytes = (hex) => Uint8Array.from(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));
const usd = (c) => `$${(Number(c || 0) / 100).toFixed(2)}`;

async function verifyToken(raw) {
  const s = String(raw || "").trim();
  if (!s.startsWith("NUPS1.")) return { pass: false, reason: "Not a NUPS sealed receipt QR." };
  const parts = s.split(".");
  if (parts.length !== 3) return { pass: false, reason: "Malformed sealed token." };
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  } catch {
    return { pass: false, reason: "Token payload is unreadable." };
  }
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(PINNED_PUBLIC_KEY_HEX).buffer, { name: "Ed25519" }, false, ["verify"]);
    const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, b64urlToBytes(parts[2]).buffer, b64urlToBytes(parts[1]).buffer);
    return ok
      ? { pass: true, payload }
      : { pass: false, payload, reason: "Signature does NOT match the NUPS signing key. This document was altered or is not genuine." };
  } catch {
    return { pass: false, reason: "This browser can't verify Ed25519 signatures. Use an updated browser, or verify online at /v/<ref>." };
  }
}

export default function OfflineVerify() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { pass, payload, reason }
  const [hint, setHint] = useState("Point the camera at the QR code on the receipt.");

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  useEffect(() => () => stopCamera(), []);

  const loop = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      if (code?.data) {
        stopCamera();
        verifyToken(code.data).then(setResult);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      setHint("Hold steady — scanning…");
      loop();
    } catch {
      setHint("Camera blocked. Allow camera access and try again, or run the test below.");
    }
  };

  const runDemo = () => { stopCamera(); verifyToken(DEMO_TOKEN).then(setResult); };
  const again = () => { setResult(null); setHint("Point the camera at the QR code on the receipt."); };

  const p = result?.payload;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f1424] text-white overflow-hidden" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif' }}>
      {/* Header */}
      <header className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#24304d] shrink-0">
        <svg className="w-[26px] h-[26px]" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="#2b3a6b" />
          <polygon points="50,16 80,33 80,67 50,84 20,67 20,33" fill="none" stroke="#6f9bff" strokeWidth="3" />
          <circle cx="50" cy="50" r="9" fill="#6f9bff" />
        </svg>
        <h1 className="text-base font-extrabold tracking-wide">NUPS Verify</h1>
        <span className="ml-auto text-[10px] font-bold tracking-widest text-[#7fe0a6] bg-[#0d2a19] border border-[#12b76a] rounded-full px-2.5 py-1">OFFLINE</span>
      </header>

      {/* Scan stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 min-h-0">
        <div className="w-full max-w-[360px] aspect-square relative rounded-[20px] overflow-hidden bg-black border-2 border-[#24304d]">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-[14%] border-[3px] border-white/85 rounded-2xl pointer-events-none" style={{ boxShadow: "0 0 0 100vmax rgba(0,0,0,.25)" }} />
          {scanning && <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />live</div>}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="mt-4 text-sm text-[#aeb6c8] text-center leading-relaxed max-w-[340px]">{hint}</p>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-4 pt-3.5 pb-6 flex flex-col gap-2.5 items-center">
        {!scanning ? (
          <button onClick={startCamera} className="w-full max-w-[360px] rounded-xl bg-[#2456d6] font-extrabold text-base py-[15px] min-h-[52px]">Start camera</button>
        ) : (
          <button onClick={stopCamera} className="w-full max-w-[360px] rounded-xl bg-[#1b2236] border border-[#33405f] font-bold text-base py-[15px] min-h-[52px] text-[#cdd5e6]">Stop camera</button>
        )}
        <button onClick={runDemo} className="w-full max-w-[360px] rounded-xl bg-[#1b2236] text-[#cdd5e6] border border-[#33405f] text-sm font-semibold py-3 min-h-[44px]">Run a test (no camera)</button>
        <p className="text-[11px] text-[#6b7690] text-center leading-relaxed px-2">Verifies the receipt&rsquo;s signature on this device. Nothing is sent anywhere.</p>
      </div>

      {/* RESULT OVERLAY */}
      {result && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
          style={{ background: result.pass ? "radial-gradient(circle at 50% 35%,#0d3a24,#0f1424 75%)" : "radial-gradient(circle at 50% 35%,#3a1210,#0f1424 75%)" }}>
          <div className={`w-[110px] h-[110px] rounded-full flex items-center justify-center text-[64px] font-black mb-4 shrink-0 ${result.pass ? "bg-[#12b76a] text-[#04331f]" : "bg-[#f04438] text-[#3a0705]"}`}>
            {result.pass ? "✓" : "✕"}
          </div>
          <div className={`text-[28px] font-black ${result.pass ? "text-[#7fe6ac]" : "text-[#ffb3ab]"}`}>
            {result.pass ? "AUTHENTIC" : "NOT VALID"}
          </div>
          <p className="text-sm text-[#cdd5e6] mt-2 leading-relaxed max-w-[360px]">
            {result.pass
              ? "Ed25519 signature verified against the published NUPS signing key on this device. The sealed record is genuine and unaltered."
              : result.reason}
          </p>
          {p && (
            <div className="mt-5 w-full max-w-[360px] bg-white/[0.06] rounded-2xl px-4 py-3.5 text-left">
              {[
                ["Verify ref", p.ref],
                ["Issuer", p.iss],
                ["Document", p.doc],
                ["Instrument", p.prod],
                ["Amount", `${usd(p.amt)} ${p.cur || ""}`],
                ["Face value", usd(p.face)],
                ["Serials", p.sn],
                ["GB account", p.acct ? `···· ${p.acct}` : "—"],
                ["Sealed at", p.ts ? new Date(p.ts).toLocaleString() : "—"],
                ["Chain seal", p.ch ? p.ch.slice(0, 16) + "…" : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-[5px] text-[13.5px] border-b border-white/10 last:border-0">
                  <span className="text-[#9aa4bd] shrink-0">{k}</span>
                  <span className="font-semibold text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={again} className="mt-6 w-full max-w-[360px] rounded-xl bg-[#2456d6] font-extrabold text-base py-[15px] min-h-[52px] shrink-0">Scan another</button>
        </div>
      )}
    </div>
  );
}