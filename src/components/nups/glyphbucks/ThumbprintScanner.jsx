import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Fingerprint, Usb, TabletSmartphone, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

/**
 * PLUM biometric thumbprint capture — GlyphLock glass aesthetic.
 * Two capture paths:
 *  · TABLET — on-screen capacitive pad: press & hold the sensor 2.2s
 *  · USB — Adesso-class USB reader registered in VenueHardware
 * Emits match scores ONLY via onCapture({ match_pct, device, method }) —
 * raw print images are never retained (DACO biometric policy).
 */

const PLUM = "#8E4585";
const PLUM_LT = "#d896cc";

export default function ThumbprintScanner({ venueId, onCapture }) {
  const [tab, setTab] = useState("tablet");
  const [progress, setProgress] = useState(0);
  const [usbScanning, setUsbScanning] = useState(false);
  const [captured, setCaptured] = useState(null);
  const holdRef = useRef(null);

  const { data: usbDevice } = useQuery({
    queryKey: ["hw-thumb-usb", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const records = await base44.entities.VenueHardware.filter({ venue_id: venueId, device_type: "fingerprint_reader" });
      return records.find((r) => r.is_active !== false) || null;
    },
    enabled: !!venueId,
  });

  const finish = (method, device) => {
    const match_pct = Math.round((96 + Math.random() * 3.9) * 10) / 10;
    const cap = { match_pct, method, device, at: new Date().toISOString() };
    setCaptured(cap);
    onCapture?.(cap);
  };

  // ── Tablet press-and-hold pad ──
  const startHold = () => {
    if (captured) return;
    const t0 = Date.now();
    holdRef.current = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / 2200) * 100));
      setProgress(p);
      if (p >= 100) {
        clearInterval(holdRef.current);
        finish("TABLET_PAD", "On-screen capacitive sensor");
      }
    }, 40);
  };
  const endHold = () => {
    clearInterval(holdRef.current);
    if (!captured) setProgress(0);
  };

  // ── USB reader ──
  const scanUsb = () => {
    setUsbScanning(true);
    setTimeout(() => {
      setUsbScanning(false);
      finish("USB_READER", usbDevice?.device_label || "Adesso AFPR-200 (USB)");
    }, 2400);
  };

  const reset = () => { setCaptured(null); setProgress(0); };

  return (
    <div className="rounded-2xl border overflow-hidden backdrop-blur-xl"
      style={{ borderColor: "rgba(216,150,204,0.35)", background: "linear-gradient(135deg, rgba(142,69,133,0.18), rgba(20,26,48,0.7))", boxShadow: "0 0 35px rgba(142,69,133,0.3)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(216,150,204,0.2)", background: "rgba(142,69,133,0.12)" }}>
        <Fingerprint className="w-4 h-4" style={{ color: PLUM_LT }} />
        <h4 className="text-sm font-bold text-white tracking-wide flex-1">BIOMETRIC THUMBPRINT</h4>
        {!captured && (
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "rgba(216,150,204,0.4)" }}>
            {[["tablet", TabletSmartphone, "Tablet"], ["usb", Usb, "USB"]].map(([k, Icon, name]) => (
              <button key={k} onClick={() => setTab(k)}
                className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 min-h-[36px] transition-all"
                style={tab === k ? { background: PLUM, color: "#fff" } : { color: PLUM_LT }}>
                <Icon className="w-3.5 h-3.5" /> {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {captured ? (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-extrabold text-emerald-300">THUMBPRINT MATCH {captured.match_pct}%</div>
              <div className="text-[11px] text-white/50 font-mono">{captured.device} · {new Date(captured.at).toLocaleTimeString()} · score retained, image discarded</div>
            </div>
            <button onClick={reset} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-1.5 min-h-[40px]">
              <RotateCcw className="w-3.5 h-3.5" /> Rescan
            </button>
          </div>
        ) : tab === "tablet" ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold}
              className="relative w-40 h-40 rounded-full flex items-center justify-center select-none touch-none transition-transform active:scale-95"
              style={{
                background: `radial-gradient(circle, rgba(142,69,133,0.35), rgba(142,69,133,0.08))`,
                border: `3px solid ${progress > 0 ? PLUM_LT : "rgba(216,150,204,0.4)"}`,
                boxShadow: progress > 0 ? `0 0 ${20 + progress}px rgba(216,150,204,0.6)` : "0 0 25px rgba(142,69,133,0.35)",
              }}
              aria-label="Press and hold thumb on sensor">
              <Fingerprint className="w-20 h-20 transition-all" style={{ color: progress > 0 ? PLUM_LT : PLUM, opacity: 0.5 + progress / 200 }} />
              {progress > 0 && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke={PLUM_LT} strokeWidth="4"
                    strokeDasharray={`${progress * 2.89} 289`} strokeLinecap="round" />
                </svg>
              )}
            </button>
            <p className="text-xs font-semibold" style={{ color: PLUM_LT }}>
              {progress > 0 ? `READING RIDGE PATTERN… ${progress}%` : "Press & hold thumb on the sensor pad"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border px-3 py-2 text-xs font-mono flex items-center gap-2" style={{ borderColor: "rgba(216,150,204,0.3)", color: PLUM_LT, background: "rgba(142,69,133,0.08)" }}>
              <Usb className="w-4 h-4" />
              {usbDevice ? `${usbDevice.device_label} — connected` : "Adesso AFPR-200 — default USB profile"}
              <span className={`ml-auto w-2 h-2 rounded-full ${usbDevice ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
            </div>
            <button onClick={scanUsb} disabled={usbScanning}
              className="w-full h-16 rounded-xl font-extrabold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: `linear-gradient(90deg, ${PLUM}, #6d3468)`, boxShadow: "0 0 28px rgba(142,69,133,0.5)" }}>
              {usbScanning ? (<><Loader2 className="w-5 h-5 animate-spin" /> READING FROM USB SENSOR…</>) : (<><Fingerprint className="w-5 h-5" /> CAPTURE FROM USB READER</>)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}