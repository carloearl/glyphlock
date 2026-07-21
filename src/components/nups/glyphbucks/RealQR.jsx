import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

/**
 * RealQR — a genuinely scannable QR code drawn to canvas via the `qrcode`
 * library (unlike the decorative MiniQR placeholder). Encodes the verification
 * URL / token so a phone camera resolves it at redemption.
 */
export default function RealQR({ value, size = 120, level = "M", className, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, String(value), {
      width: size,
      margin: 1,
      errorCorrectionLevel: level,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => {});
  }, [value, size, level]);

  return <canvas ref={canvasRef} className={className} style={style} aria-label={`QR ${value}`} />;
}