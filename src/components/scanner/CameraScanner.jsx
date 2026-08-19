/**
 * DACO-20260613-MOBILE-SCANNER — CameraScanner
 *
 * Rear-camera capture using getUserMedia + native BarcodeDetector (Android Chrome).
 * Decoded payload is handed to the parent via onDecode(); this component NEVER
 * verifies signatures. Verification is server-only.
 *
 * Supported formats per directive: qr_code (default), pdf417 (ID barcodes).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, AlertTriangle } from 'lucide-react';

export default function CameraScanner({ onDecode, formats = ['qr_code'], active = true, label = 'Scan' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastDecodeRef = useRef({ value: null, time: 0 });

  const [status, setStatus] = useState('initializing'); // initializing | running | error | unsupported
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }

    let cancelled = false;

    (async () => {
      // Feature check
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        setStatus('unsupported');
        setError('BarcodeDetector not supported on this device/browser. Use Android Chrome.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        setError('Camera API unavailable. Requires HTTPS context.');
        return;
      }

      try {
         
        detectorRef.current = new BarcodeDetector({ formats });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('running');
        loop();
      } catch (e) {
        setStatus('error');
        setError(e.message || 'Camera permission denied.');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
     
  }, [active, formats.join(',')]);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const loop = async () => {
    if (!videoRef.current || !detectorRef.current || !streamRef.current) return;
    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      if (codes && codes.length > 0) {
        const raw = codes[0].rawValue;
        // Debounce identical decodes within 2.5s to avoid spamming the server.
        const now = Date.now();
        if (raw && (raw !== lastDecodeRef.current.value || now - lastDecodeRef.current.time > 2500)) {
          lastDecodeRef.current = { value: raw, time: now };
          onDecode(raw, codes[0]);
        }
      }
    } catch {
      // detection errors are non-fatal; keep looping
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-auto aspect-[3/4] object-cover"
        aria-label={`${label} camera feed`}
      />
      {/* Targeting reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-56 h-56 border-2 border-emerald-400/70 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)]" />
      </div>
      {/* Status pill */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs font-semibold text-white flex items-center gap-2">
          {status === 'running' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {label} — live
            </>
          ) : status === 'initializing' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Starting camera…
            </>
          ) : status === 'unsupported' ? (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Unsupported
            </>
          ) : (
            <>
              <CameraOff className="w-3 h-3 text-red-400" /> Camera error
            </>
          )}
        </div>
        <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-mono text-emerald-300">
          {formats.join(' · ')}
        </div>
      </div>
      {/* Error overlay */}
      {(status === 'error' || status === 'unsupported') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
          <div className="space-y-2">
            <Camera className="w-8 h-8 mx-auto text-red-400" />
            <div className="text-sm font-bold text-white">{status === 'unsupported' ? 'Device unsupported' : 'Camera blocked'}</div>
            <div className="text-xs text-gray-400 max-w-xs">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}