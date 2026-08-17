import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck, Loader2 } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { computeReceiptHash } from "@/lib/nups/receiptHash";
import { buildReceiptBreakdown, getCashierDisplay } from "@/lib/nups/receiptBreakdown";
import { DEMO_RECEIPT_VENUE, isDemoTransaction } from "@/lib/nups/demoReceiptVenue";
import { printHtml } from "@/lib/nups/printHtml";
import { logActivity } from "@/lib/nups/activityLog";
import { markTrainingStep } from "@/lib/nups/operatingMode";
import { toast } from "sonner";

const BIZ_SYSTEM = "N.U.P.S. POS v2.0 — Secured by GlyphLock";

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const money = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export default function ReceiptPrinter({
  transaction,
  isVIP = false,
  vipDetails = null
}) {
  const activeVenue = useActiveVenue();
  const [rates, setRates] = useState(null);
  const [hashInfo, setHashInfo] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [lastPrintAt, setLastPrintAt] = useState(null);

  // Load per-venue receipt config (processing fee, service fee, footer, tax id).
  useEffect(() => {
    let alive = true;
    const venueId = transaction?.venue_id || activeVenue?.venue_id || activeVenue?.id;
    if (!venueId) { setRates({}); return; }
    (async () => {
      try {
        const r = await loadVenueRates(venueId);
        if (alive) setRates(r || {});
      } catch { if (alive) setRates({}); }
    })();
    return () => { alive = false; };
  }, [transaction?.venue_id, activeVenue?.venue_id, activeVenue?.id]);

  // Blockchain fingerprint — prefer the persisted `receipt_hash` written at
  // sale time (canonical, ledger-verifiable). Fall back to recomputing for
  // legacy transactions written before the hash field existed.
  useEffect(() => {
    let alive = true;
    if (!transaction) { setHashInfo(null); return; }
    if (transaction.receipt_hash) {
      setHashInfo({
        hash: transaction.receipt_hash,
        short: String(transaction.receipt_hash).slice(0, 12),
        algorithm: "SHA-256",
        version: transaction.receipt_hash_version || 1,
      });
      return;
    }
    computeReceiptHash(transaction).then(h => { if (alive) setHashInfo(h); }).catch(() => {});
    return () => { alive = false; };
  }, [transaction?.transaction_id, transaction?.receipt_hash, transaction?.total, transaction?.created_date]);

  // Demo receipts render with the mock demo venue instead of a live venue —
  // clearly labeled demonstration data, never a real venue's identity.
  const isDemo = isDemoTransaction(transaction);
  const dv = isDemo ? DEMO_RECEIPT_VENUE : null;

  const VENUE_BRAND = dv?.name || activeVenue?.name || transaction?.venue_name || '';
  const BIZ_LEGAL = dv?.legal_name || rates?.receipt_legal_name || VENUE_BRAND || 'N.U.P.S. POS';
  const BIZ_NAME = VENUE_BRAND || BIZ_LEGAL;
  const BIZ_ADDRESS = dv
    ? [dv.address, dv.city, dv.state].filter(Boolean).join(', ')
    : ([activeVenue?.address, activeVenue?.city, activeVenue?.state].filter(Boolean).join(', ') || 'Address on file');
  const BIZ_PHONE = dv?.phone || activeVenue?.phone || '';
  const BIZ_TAX_ID = dv?.tax_id || rates?.receipt_tax_id || '';
  const FOOTER_TEXT = dv?.footer_text || rates?.receipt_footer_text || '';

  // Fee toggles + rates
  const showProcFee = rates?.show_processing_fee !== false; // default true
  const showSvcFee  = !!rates?.show_service_fee;
  const svcPct      = Number(rates?.service_fee_pct || 0);
  const svcLabel    = rates?.service_fee_label || 'Service Fee';
  const procRate    = Number(rates?.cc_processing_fee_rate || 0);

  const printReceipt = () => {
    if (!transaction) return;

    const items = transaction.items || [];
    const txDate = new Date(transaction.created_date);
    const formattedDate = txDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cashierDisplay = getCashierDisplay(transaction);

    const itemsHtml = items.map((item, idx) =>
      `<div style="padding:4px 0;border-bottom:1px dotted #ddd;">
         <div style="font-weight:bold;">${idx + 1}. ${item.product_name}</div>
         <div style="font-size:10px;color:#555;padding-left:8px;">Qty: ${item.quantity} × $${item.price?.toFixed(2)}</div>
         <div style="text-align:right;font-weight:bold;padding-top:2px;">$${item.total?.toFixed(2)}</div>
       </div>`
    ).join('');

    // Standardized breakdown — single source of truth from receiptBreakdown.js
    const bd = buildReceiptBreakdown(transaction, rates);
    const { grandTotal, totalItems } = bd;

    const vipSection = isVIP && vipDetails ? `
      <div style="border:2px solid #000;padding:8px;margin:8px 0;background:#f9f9f9;">
        <div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:4px;">★ VIP SHOW SERVICE ★</div>
        <table style="width:100%;font-size:11px;">
          <tr><td>Room:</td><td style="text-align:right;font-weight:bold;">${vipDetails.room_name || vipDetails.room_number || 'N/A'}</td></tr>
          <tr><td>Entertainer:</td><td style="text-align:right;font-weight:bold;">${vipDetails.entertainer_name || 'N/A'}</td></tr>
          <tr><td>Guest:</td><td style="text-align:right;font-weight:bold;">${vipDetails.guest_name || 'N/A'}</td></tr>
          <tr><td>Duration:</td><td style="text-align:right;">${vipDetails.duration_minutes || 60} min</td></tr>
          <tr><td>Rate:</td><td style="text-align:right;">$${(vipDetails.rate_per_hour || 300).toFixed(2)}/hr</td></tr>
          ${vipDetails.contract_number ? `<tr><td>Contract#:</td><td style="text-align:right;font-family:monospace;">${vipDetails.contract_number}</td></tr>` : ''}
        </table>
      </div>
    ` : '';

    const receiptHtml = `
      <html>
      <head><title>Receipt - ${transaction.transaction_id}</title>
      <style>
        @media print {
          @page { margin: 4mm; size: 80mm auto; }
          body { width: 72mm; margin: 0 auto; }
          html, body { height: auto !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 302px; padding: 16px 12px; font-size: 11px; color: #000; line-height: 1.4; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .double-divider { border-top: 2px solid #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .header-logo { font-size: 20px; font-weight: 900; letter-spacing: 2px; margin-bottom: 2px; }
        .item-header { font-size: 9px; font-weight: bold; border-bottom: 1px solid #000; }
        .item-header td { padding-bottom: 4px; }
        .total-row td { font-size: 16px; font-weight: 900; padding: 6px 0; }
        .info-row { font-size: 10px; }
        .barcode { font-family: monospace; font-size: 10px; letter-spacing: 3px; margin: 6px 0; }
        .footer { font-size: 8px; color: #444; margin-top: 8px; }
        .audit-box { border: 1px solid #000; padding: 6px; margin: 6px 0; font-size: 9px; }
      </style>
      </head>
      <body>
        <div class="center">
          <div class="header-logo">${BIZ_LEGAL}</div>
          ${VENUE_BRAND && VENUE_BRAND !== BIZ_LEGAL ? `<div style="font-size:10px;font-weight:bold;">${VENUE_BRAND}</div>` : ''}
          <div style="font-size:10px;margin-top:2px;font-weight:bold;">${BIZ_ADDRESS}</div>
          <div style="font-size:10px;">Tel: ${BIZ_PHONE}</div>
          <div style="font-size:9px;margin-top:2px;">${BIZ_TAX_ID}</div>
        </div>
        <div class="double-divider"></div>
        <table>
          <tr class="info-row"><td>Receipt #:</td><td class="right bold">${transaction.transaction_id}</td></tr>
          <tr class="info-row"><td>Date:</td><td class="right">${formattedDate}</td></tr>
          <tr class="info-row"><td>Time:</td><td class="right">${formattedTime}</td></tr>
          <tr class="info-row"><td>Cashier:</td><td class="right">${cashierDisplay}</td></tr>
          ${transaction.customer_id ? `<tr class="info-row"><td>Customer:</td><td class="right">${transaction.customer_id}</td></tr>` : ''}
          <tr class="info-row"><td>Batch:</td><td class="right">${transaction.batch_id || 'N/A'}</td></tr>
          <tr class="info-row"><td>Terminal:</td><td class="right">${transaction.station?.toUpperCase() || transaction.terminal_name || 'POS'}</td></tr>
        </table>
        ${vipSection}
        <div class="divider"></div>
        <div style="font-size:9px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:4px;">ITEMS</div>
        <div>${itemsHtml}</div>
        <div style="font-size:9px;text-align:right;color:#666;padding-top:2px;">
          ${totalItems} item${totalItems !== 1 ? 's' : ''} sold
        </div>
        <div class="double-divider"></div>
        <div style="font-size:11px;">
          ${bd.lines.map(l => `<div style="display:flex;justify-content:space-between;padding:2px 0;${l.emphasis ? 'font-weight:bold;' : ''}${l.negative ? 'color:red;' : ''}"><span>${l.label}</span><span>${l.negative ? '-' : ''}$${Math.abs(l.amount).toFixed(2)}</span></div>`).join('')}
        </div>
        <div class="divider"></div>
        <div class="total-row" style="display:flex;justify-content:space-between;"><span>TOTAL DUE:</span><span>$${grandTotal.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div style="font-size:9px;color:#666;border:1px dashed #999;padding:4px;margin:4px 0;">
          <div style="font-weight:bold;margin-bottom:2px;font-size:8px;letter-spacing:1px;">ACCOUNTING</div>
          <div style="display:flex;justify-content:space-between;padding:1px 0;"><span>${bd.svcFeeLabel}</span><span>$${bd.svcFee.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:1px 0;"><span>${bd.ccFeeLabel}</span><span>$${bd.ccFee.toFixed(2)}</span></div>
        </div>
        <div class="divider"></div>
        <table>
          <tr><td class="bold">Payment:</td><td class="right bold">${transaction.payment_method}</td></tr>
          ${transaction.payment_method === 'Cash' && transaction.cash_tendered ? `
          <tr><td>Tendered:</td><td class="right">$${parseFloat(transaction.cash_tendered).toFixed(2)}</td></tr>
          <tr class="bold"><td>Change:</td><td class="right">$${(transaction.change_due > 0 ? parseFloat(transaction.change_due).toFixed(2) : '0.00')}</td></tr>` : ''}
          ${(transaction.payment_method === 'Credit Card' || transaction.payment_method === 'Debit Card') ? `
          <tr class="info-row"><td>Card:</td><td class="right">**** **** **** ${transaction.card_last_four || 'XXXX'}</td></tr>
          <tr class="info-row"><td>Auth Code:</td><td class="right">${transaction.auth_code || Math.random().toString(36).substr(2, 6).toUpperCase()}</td></tr>
          <tr class="info-row"><td>Entry:</td><td class="right">CHIP/TAP</td></tr>` : ''}
        </table>
        <div class="double-divider"></div>
        <div class="audit-box">
          <div style="text-align:center;font-weight:bold;margin-bottom:3px;">AUDIT TRAIL</div>
          <table style="font-size:9px;">
            <tr><td>Terminal:</td><td class="right">${transaction.terminal_id || 'NUPS-001'}</td></tr>
            <tr><td>Sequence:</td><td class="right">${transaction.transaction_id}</td></tr>
            <tr><td>Timestamp:</td><td class="right">${txDate.toISOString()}</td></tr>
            <tr><td>Operator:</td><td class="right">${cashierDisplay}</td></tr>
          </table>
        </div>
        ${hashInfo ? `
        <div class="audit-box" style="border-color:#0a7;">
          <div style="text-align:center;font-weight:bold;margin-bottom:3px;">◆ BLOCKCHAIN FINGERPRINT ◆</div>
          <div style="font-size:8px;color:#555;text-align:center;margin-bottom:3px;">
            ${hashInfo.algorithm} · v${hashInfo.version}
          </div>
          <div style="font-family:monospace;font-size:10px;text-align:center;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">
            ${hashInfo.short}
          </div>
          <div style="font-family:monospace;font-size:7px;color:#666;word-break:break-all;text-align:center;line-height:1.3;">
            ${hashInfo.hash}
          </div>
          <div style="font-size:8px;color:#666;text-align:center;margin-top:3px;">
            Tamper-evident. Verify at ${BIZ_PHONE || 'venue office'}.
          </div>
        </div>` : ''}
        <div class="center barcode">||| ${transaction.transaction_id} |||</div>
        <div class="divider"></div>
        <div class="center footer">
          ${FOOTER_TEXT
            ? `<div style="font-size:10px;">${FOOTER_TEXT.replace(/\n/g, '<br/>')}</div>`
            : `<div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Thank you for your patronage!</div>
               <div>All sales are final. Refunds require manager</div>
               <div>approval within 24 hours with valid receipt.</div>`}
          ${BIZ_PHONE ? `<div style="margin-top:4px;">For disputes contact: ${BIZ_PHONE}</div>` : ''}
          <div style="margin-top:6px;font-size:7px;color:#888;">
            ${BIZ_LEGAL}<br/>
            ${BIZ_ADDRESS}<br/>
            Printed: ${new Date().toLocaleString()}<br/>
            ${BIZ_SYSTEM}
          </div>
        </div>
      </body>
      </html>
    `;

    printHtml(receiptHtml, { title: `Receipt - ${transaction.transaction_id}` });
  };

  if (!transaction) {
    return (
      <Button variant="outline" size="sm" disabled className="border-gray-700 text-gray-600">
        <Printer className="w-4 h-4 mr-1" /> No Receipt
      </Button>
    );
  }

  const items = transaction.items || [];
  const txDate = new Date(transaction.created_date);
  const cashierDisplay = getCashierDisplay(transaction);

  // Standardized breakdown — shared with the printable receipt.
  const bd = buildReceiptBreakdown(transaction, rates);
  const { grandTotal, totalItems } = bd;

  return (
    <div className="space-y-3" style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto' }}>
      {/* On-screen receipt preview */}
      <div className="bg-black/90 border border-cyan-500/40 rounded-xl p-4 font-mono text-xs max-w-sm mx-auto shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="text-center mb-3">
          <div className="text-base font-black text-white tracking-widest">{BIZ_LEGAL}</div>
          {VENUE_BRAND && VENUE_BRAND !== BIZ_LEGAL && <div className="text-[10px] font-bold text-gray-300">{VENUE_BRAND}</div>}
          <div className="text-[9px] text-gray-400 mt-1">{BIZ_ADDRESS}</div>
          {BIZ_PHONE && <div className="text-[9px] text-gray-400">Tel: {BIZ_PHONE}</div>}
          {BIZ_TAX_ID && <div className="text-[9px] text-gray-500 mt-0.5">{BIZ_TAX_ID}</div>}
        </div>

        {isVIP && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 mb-2 text-center">
            <span className="text-purple-400 font-bold text-[10px]">★ VIP SHOW SERVICE ★</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-700 pt-2 mb-2 text-gray-400 space-y-0.5">
          <div className="flex justify-between"><span>Receipt:</span><span className="text-white">{transaction.transaction_id}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{txDate.toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span>Time:</span><span>{txDate.toLocaleTimeString()}</span></div>
          <div className="flex justify-between"><span>Cashier:</span><span className="text-white">{cashierDisplay}</span></div>
          <div className="flex justify-between"><span>Terminal:</span><span>{transaction.station?.toUpperCase() || transaction.terminal_name || 'POS'}</span></div>
        </div>

        <div className="border-t border-dashed border-gray-700 pt-2 mb-2">
          <div className="text-gray-500 text-[10px] mb-1 font-bold">ITEMS</div>
          {items.map((item, idx) => (
            <div key={idx} className="py-1 border-b border-dotted border-gray-800">
              <div className="text-gray-200 font-bold">{idx + 1}. {item.product_name}</div>
              <div className="text-[10px] text-gray-500 pl-2">Qty: {item.quantity} × ${item.price?.toFixed(2)}</div>
              <div className="text-right text-white font-bold mt-0.5">${item.total?.toFixed(2)}</div>
            </div>
          ))}
          <div className="text-right text-[10px] text-gray-600 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
        </div>

        <div className="border-t border-double border-gray-600 pt-2 space-y-1">
          {bd.lines.map(l => (
            <div
              key={l.key}
              className={`flex justify-between ${l.emphasis ? 'text-amber-400 font-bold' : l.negative ? 'text-red-400' : 'text-gray-400'}`}
            >
              <span>{l.label}</span>
              <span>{l.negative ? '-' : ''}${Math.abs(l.amount).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-1 flex justify-between text-lg font-black text-green-400">
            <span>TOTAL</span><span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Accounting footer — always shows service fee + processing fee
            even when $0.00 (cash) for ledger reconciliation. */}
        <div className="border border-dashed border-gray-700 rounded px-2 py-1 mt-1 space-y-0.5">
          <div className="text-[8px] uppercase tracking-widest text-gray-600 font-bold mb-0.5">Accounting</div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{bd.svcFeeLabel}</span>
            <span className="font-mono">${bd.svcFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{bd.ccFeeLabel}</span>
            <span className="font-mono">${bd.ccFee.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-700 pt-2 mt-2 space-y-0.5 text-gray-400">
          <div className="flex justify-between font-bold"><span>Payment</span><span className="text-cyan-400">{transaction.payment_method}</span></div>
          {transaction.payment_method === 'Cash' && transaction.cash_tendered && (
            <>
              <div className="flex justify-between"><span>Tendered</span><span>${parseFloat(transaction.cash_tendered).toFixed(2)}</span></div>
              {transaction.change_due > 0 && <div className="flex justify-between font-bold text-amber-400"><span>Change</span><span>${parseFloat(transaction.change_due).toFixed(2)}</span></div>}
            </>
          )}
        </div>

        <div className="border-t border-gray-700 mt-2 pt-2">
          <div className="text-[9px] text-gray-600 text-center font-bold mb-1">AUDIT TRAIL</div>
          <div className="text-[9px] text-gray-600 space-y-0.5">
            <div className="flex justify-between"><span>Seq:</span><span>{transaction.transaction_id}</span></div>
            <div className="flex justify-between"><span>ISO:</span><span>{txDate.toISOString().split('.')[0]}</span></div>
          </div>
        </div>

        {/* Blockchain hash — printed on every receipt, cannot be disabled */}
        {hashInfo && (
          <div className="border border-emerald-500/40 rounded-lg mt-2 p-2 bg-emerald-500/5">
            <div className="flex items-center justify-center gap-1 text-[9px] text-emerald-300 font-bold mb-1">
              <ShieldCheck className="w-3 h-3" /> BLOCKCHAIN FINGERPRINT
            </div>
            <div className="text-center font-mono text-[11px] tracking-widest text-emerald-200 font-bold">
              {hashInfo.short}
            </div>
            <div className="text-center font-mono text-[7px] text-emerald-400/50 mt-1 break-all leading-tight">
              {hashInfo.hash}
            </div>
            <div className="text-center text-[8px] text-gray-500 mt-1">
              {hashInfo.algorithm} · v{hashInfo.version} · tamper-evident
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-gray-700 pt-2 mt-2 text-center text-[10px] text-gray-600">
          {FOOTER_TEXT ? (
            <div className="text-gray-300 text-[10px] whitespace-pre-line leading-snug">{FOOTER_TEXT}</div>
          ) : (
            <>
              <div className="text-gray-400 text-xs mb-1">Thank you for your patronage!</div>
              <div>All sales final{BIZ_PHONE ? ` • Disputes: ${BIZ_PHONE}` : ''}</div>
            </>
          )}
          {BIZ_TAX_ID && <div className="mt-1 text-[8px] text-gray-500">{BIZ_TAX_ID}</div>}
          <div className="mt-1 text-[8px] text-gray-700">{BIZ_ADDRESS}</div>
          <div className="mt-1 tracking-[4px] text-gray-700">||| {transaction.transaction_id} |||</div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={printReceipt} variant="outline" size="sm"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          style={{ position: 'relative', zIndex: 31, pointerEvents: 'auto', cursor: 'pointer' }}>
          <Printer className="w-4 h-4 mr-1" /> Print Receipt
        </Button>
      </div>
    </div>
  );
}