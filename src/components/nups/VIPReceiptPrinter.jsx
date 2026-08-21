import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Star } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function VIPReceiptPrinter({ room, guestName, contractNumber, dreamDollarValue = 0, grandTotal = 0 }) {
  const activeVenue = useActiveVenue();
  const BIZ_NAME = activeVenue?.name || "Active Venue";
  const BIZ_LEGAL = activeVenue?.legal_name || activeVenue?.name || "Active Venue";
  const BIZ_ADDRESS = [activeVenue?.address, activeVenue?.city, activeVenue?.state].filter(Boolean).join(", ");
  const BIZ_PHONE = activeVenue?.phone || "";
  const printVIPReceipt = () => {
    const now = new Date();
    const html = `<html><head><title>VIP Receipt - ${contractNumber || 'N/A'}</title>
    <style>
      @media print { @page { margin: 0; size: 80mm auto; } body { width: 80mm; } }
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; width:302px; padding:16px 12px; font-size:11px; color:#000; line-height:1.4; }
      .center { text-align:center; }
      .bold { font-weight:bold; }
      .divider { border-top:1px dashed #000; margin:8px 0; }
      .double { border-top:2px solid #000; margin:8px 0; }
      table { width:100%; border-collapse:collapse; }
      td { padding:3px 0; }
      .vip-box { border:2px solid #000; padding:8px; margin:8px 0; }
      .audit { border:1px solid #000; padding:6px; margin:6px 0; font-size:9px; }
    </style></head><body>
      <div class="center">
        <div style="font-size:20px;font-weight:900;letter-spacing:2px;">${BIZ_NAME}</div>
        <div style="font-size:9px;">N.U.P.S. — NEXUS UNIVERSAL POINT-OF-SALE</div>
        <div style="font-size:9px;margin-top:2px;">${BIZ_LEGAL}</div>
        <div style="font-size:10px;font-weight:bold;margin-top:2px;">${BIZ_ADDRESS}</div>
        ${BIZ_PHONE ? `<div style="font-size:10px;">Tel: ${BIZ_PHONE}</div>` : ''}
      </div>
      <div class="double"></div>
      
      <div class="vip-box">
        <div class="center bold" style="font-size:14px;">★ VIP SHOW RECEIPT ★</div>
        <div class="divider"></div>
        <table>
          <tr><td>Guest:</td><td style="text-align:right;font-weight:bold;">${guestName || 'N/A'}</td></tr>
          <tr><td>Room:</td><td style="text-align:right;">${room?.room_name || room?.room_number || 'N/A'}</td></tr>
          <tr><td>Entertainer:</td><td style="text-align:right;">${room?.entertainer_name || 'N/A'}</td></tr>
          <tr><td>Duration:</td><td style="text-align:right;">${room?.duration_minutes || 60} minutes</td></tr>
          <tr><td>Rate:</td><td style="text-align:right;">$${(room?.rate_per_hour || 300).toFixed(2)}/hr</td></tr>
          ${contractNumber ? `<tr><td>Contract#:</td><td style="text-align:right;font-family:monospace;font-size:10px;">${contractNumber}</td></tr>` : ''}
        </table>
      </div>

      <table>
        <tr><td>Room Charge:</td><td style="text-align:right;">$${((room?.duration_minutes || 60) / 60 * (room?.rate_per_hour || 300)).toFixed(2)}</td></tr>
        ${dreamDollarValue > 0 ? `
        <tr><td>GlyphBucks Purchased:</td><td style="text-align:right;">$${dreamDollarValue.toFixed(2)}</td></tr>
        <tr><td>Processing Surcharge (30%):</td><td style="text-align:right;">$${(dreamDollarValue * 0.3).toFixed(2)}</td></tr>
        ` : ''}
        <tr><td>Sales Tax (AZ 8%):</td><td style="text-align:right;">$${(grandTotal * 0.08).toFixed(2)}</td></tr>
      </table>
      <div class="double"></div>
      <table><tr><td style="font-size:16px;font-weight:900;">TOTAL CHARGED:</td><td style="text-align:right;font-size:16px;font-weight:900;">$${grandTotal.toFixed(2)}</td></tr></table>
      <div class="divider"></div>

      <div class="audit">
        <div class="center bold">AUDIT TRAIL</div>
        <table style="font-size:9px;">
          <tr><td>Terminal:</td><td style="text-align:right;">NUPS-VIP-001</td></tr>
          <tr><td>Contract:</td><td style="text-align:right;">${contractNumber || 'N/A'}</td></tr>
          <tr><td>Timestamp:</td><td style="text-align:right;">${now.toISOString()}</td></tr>
        </table>
      </div>

      <div class="center" style="font-family:monospace;font-size:10px;letter-spacing:3px;margin:8px 0;">
        ||| ${contractNumber || 'VIP-' + Date.now()} |||
      </div>
      <div class="divider"></div>
      <div class="center" style="font-size:9px;color:#444;">
        <div style="font-weight:bold;">Thank you for your patronage!</div>
        <div>All sales final per signed contract.</div>
        <div>Disputes: ${BIZ_PHONE}</div>
        <div style="margin-top:4px;font-size:7px;color:#888;">${BIZ_LEGAL}<br/>${BIZ_ADDRESS}<br/>
        Printed: ${now.toLocaleString()} | N.U.P.S. POS v2.0 — Secured by GlyphLock</div>
      </div>
    </body></html>`;
    const w = window.open('','_blank','width=350,height=900');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Button onClick={printVIPReceipt} className="bg-gradient-to-r from-purple-500 to-pink-600 font-bold">
      <Star className="w-4 h-4 mr-1" />
      <Printer className="w-4 h-4 mr-1" /> Print VIP Receipt
    </Button>
  );
}