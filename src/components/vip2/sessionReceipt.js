/**
 * printVIPSessionReceipt — 80mm-style VIP session receipt.
 * Shows room, ENTERTAINER, guest, start/end TIME and duration.
 */
import { printHtml } from "@/lib/nups/printHtml";

const t = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";

export function printVIPSessionReceipt(room) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:'Courier New',monospace;font-size:12px;color:#000;width:280px;margin:0 auto;padding:8px}
    h1{font-size:14px;text-align:center;margin:0 0 2px}
    .sub{text-align:center;font-size:10px;margin:0 0 8px}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;margin:2px 0}
    .big{font-size:16px;font-weight:bold}
    .foot{text-align:center;font-size:10px;margin-top:10px}
  </style></head><body>
    <h1>VIP SESSION RECEIPT</h1>
    <p class="sub">${room.room_name || `Room ${room.room_number}`} (${room.room_number})</p>
    <hr>
    <div class="row"><span>ENTERTAINER</span><span class="big">${room.entertainer_name || "—"}</span></div>
    <div class="row"><span>Guest</span><span>${room.guest_name || "—"}</span></div>
    <hr>
    <div class="row"><span>Start Time</span><span>${t(room.start_time)}</span></div>
    <div class="row"><span>End Time</span><span>${t(room.end_time)}</span></div>
    <div class="row"><span>Duration</span><span class="big">${room.duration_minutes ? `${room.duration_minutes} min` : "—"}</span></div>
    ${room.total_charge != null ? `<hr><div class="row"><span>Total</span><span class="big">$${Number(room.total_charge).toFixed(2)}</span></div>` : ""}
    <hr>
    <p class="foot">Printed ${new Date().toLocaleString()}<br>Clickwrap acceptance on file.</p>
  </body></html>`;
  printHtml(html, { title: `VIP-${room.room_number}` });
}