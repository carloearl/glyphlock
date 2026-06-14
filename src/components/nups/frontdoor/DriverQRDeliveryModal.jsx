import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Copy, Check, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * DriverQRDeliveryModal — shown immediately after a new driver is onboarded.
 * The driver photographs / prints / copies their QR token before leaving the
 * door. Without this step, the driver cannot scan in on future shifts.
 */
export default function DriverQRDeliveryModal({ open, onOpenChange, driver, venueName }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Render QR to canvas whenever modal opens with a driver
  useEffect(() => {
    if (!open || !driver?.qr_code || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, driver.qr_code, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).catch(() => {
      toast.error("QR render failed");
    });
  }, [open, driver?.qr_code]);

  if (!driver) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(driver.qr_code);
      setCopied(true);
      toast.success("Token copied — text it to the driver");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Copy failed — read it to them aloud");
    }
  };

  const handlePrint = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(driver.qr_code, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "H",
      });
      const w = window.open("", "_blank", "width=400,height=600");
      if (!w) {
        toast.error("Popup blocked — allow popups to print");
        return;
      }
      w.document.write(`
        <html><head><title>Driver QR — ${driver.name}</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; text-align: center; padding: 24px; }
          .name { font-size: 22px; font-weight: 800; margin-top: 16px; }
          .meta { color: #555; font-size: 12px; margin-top: 4px; }
          .token { font-family: monospace; font-size: 11px; margin-top: 16px; word-break: break-all; }
          .footer { font-size: 10px; color: #888; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; }
          img { width: 320px; height: 320px; }
        </style></head><body>
          <h2 style="margin:0">${venueName || "Venue"} — Driver Pass</h2>
          <p style="font-size:11px;color:#666;margin:4px 0">Keep this slip. Scan to clock in.</p>
          <img src="${dataUrl}" />
          <div class="name">${driver.name}</div>
          <div class="meta">${driver.driver_id} · ${driver.affiliated ? "Affiliated" : "Outside"}${driver.phone ? " · " + driver.phone : ""}</div>
          <div class="token">${driver.qr_code}</div>
          <div class="footer">Issued ${new Date().toLocaleString()}</div>
        </body></html>
      `);
      w.document.close();
      setTimeout(() => { w.print(); }, 250);
    } catch {
      toast.error("Print failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-950 border-yellow-500/40 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            Driver Onboarded — Deliver QR
          </DialogTitle>
          <p className="text-xs text-gray-400">
            The driver MUST save this code before leaving. Without it they can't scan in next shift.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Driver identity */}
          <div className="text-center">
            <p className="text-2xl font-black text-white">{driver.name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge className={`text-xs border ${driver.affiliated ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-orange-500/20 text-orange-300 border-orange-500/40"}`}>
                {driver.affiliated ? "Affiliated" : "Outside"}
              </Badge>
              <span className="text-[11px] text-gray-500 font-mono">{driver.driver_id}</span>
            </div>
          </div>

          {/* QR Canvas */}
          <div className="bg-white p-4 rounded-xl flex justify-center">
            <canvas ref={canvasRef} className="block" />
          </div>

          {/* Token text */}
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Manual entry token</p>
            <p className="font-mono text-xs text-cyan-300 break-all select-all">{driver.qr_code}</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 h-11"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Slip
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 h-11"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy Token"}
            </Button>
          </div>

          <div className="text-[11px] text-gray-500 bg-gray-900/40 border border-gray-800 rounded p-2 leading-relaxed">
            💡 <strong className="text-yellow-400">Tip:</strong> Have the driver photograph the QR with their phone, or text them the token at {driver.phone || "their number on file"}.
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold h-11"
          >
            <QrCode className="w-4 h-4 mr-2" /> Driver Has the Code — Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}