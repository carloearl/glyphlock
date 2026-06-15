import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const BIZ_SYSTEM = "N.U.P.S. POS v2.0 — Secured by GlyphLock";

// E7 — always prefer cashier_name over raw email
const getCashierDisplay = (tx) => tx?.cashier_name || tx?.cashier || 'N/A';

export default function ReceiptPrinter({
  transaction,
  isVIP = false,
  vipDetails = null
}) {
  const activeVenue = useActiveVenue();

  const BIZ_NAME = activeVenue?.name || transaction?.venue_name || 'N.U.P.S. POS';
  const BIZ_LEGAL = activeVenue?.legal_name || activeVenue?.name || BIZ_NAME;
  const BIZ_ADDRESS = [activeVenue?.address, activeVenue?.city, activeVenue?.state].filter(Boolean).join(', ') || 'Address on file';
  const BIZ_PHONE = activeVenue?.phone || '';
  const BIZ_TAX_ID = '';

  const printReceipt = () => {
    if (!transaction) return;

    const items = transaction.items || [];
    const txDate = new Date(transaction.created_date);
    const formattedDate = txDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cashierDisplay = getCashierDisplay(transaction);

    const itemsHtml = items.map((item, idx) =>
      `<tr>
        <td style="text-align:left;padding:3px 0;border-bottom:1px dotted #ddd;">${idx + 1}. ${item.product_name}</td>
        <td style="text-align:center;padding:3px 0;border-bottom:1px dotted #ddd;">${item.quantity}</td>
        <td style="text-align:right;padding:3px 0;border-bottom:1px dotted #ddd;">$${item.price?.toFixed(2)}</td>
        <td style="text-align:right;padding:3px 0;border-bottom:1px dotted #ddd;font-weight:bold;">$${item.total?.toFixed(2)}</td>
      </tr>`
    ).join('');

    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const tipAmount = transaction.tip || 0;
    const grandTotal = transaction.total || 0;

    // Door cover charges are sales-tax-exempt; the `tax` field on a door
    // transaction is actually the credit-card processing fee. Split it on
    // the receipt so the customer reads honest line items.
    const isDoor = (transaction.station || '').toLowerCase() === 'door';
    const taxLabel = isDoor ? 'Sales Tax (0%)' : 'Sales Tax (AZ 8%)';
    const taxValue = isDoor ? 0 : (transaction.tax || 0);
    const ccFee    = isDoor ? (transaction.tax || 0) : 0;

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
          <div class="header-logo">${BIZ_NAME}</div>
          <div style="font-size:9px;">N.U.P.S. — NEXUS UNIVERSAL POINT-OF-SALE</div>
          <div style="font-size:9px;margin-top:4px;">${BIZ_LEGAL}</div>
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
        <table>
          <tr class="item-header">
            <td style="text-align:left;">ITEM</td>
            <td style="text-align:center;">QTY</td>
            <td style="text-align:right;">PRICE</td>
            <td style="text-align:right;">TOTAL</td>
          </tr>
        </table>
        <table>${itemsHtml}</table>
        <div style="font-size:9px;text-align:right;color:#666;padding-top:2px;">
          ${totalItems} item${totalItems !== 1 ? 's' : ''} sold
        </div>
        <div class="double-divider"></div>
        <table>
          <tr><td>Subtotal:</td><td class="right">$${(transaction.subtotal || 0).toFixed(2)}</td></tr>
          <tr><td>${taxLabel}:</td><td class="right">$${taxValue.toFixed(2)}</td></tr>
          ${ccFee > 0 ? `<tr><td>Card Processing Fee:</td><td class="right">$${ccFee.toFixed(2)}</td></tr>` : ''}
          ${transaction.discount > 0 ? `<tr><td>Discount:</td><td class="right" style="color:red;">-$${transaction.discount.toFixed(2)}</td></tr>` : ''}
          ${tipAmount > 0 ? `<tr><td>Gratuity:</td><td class="right">$${tipAmount.toFixed(2)}</td></tr>` : ''}
        </table>
        <div class="divider"></div>
        <table><tr class="total-row"><td>TOTAL DUE:</td><td class="right">$${grandTotal.toFixed(2)}</td></tr></table>
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
            <tr><td>Terminal:</td><td class="right">NUPS-001</td></tr>
            <tr><td>Sequence:</td><td class="right">${transaction.transaction_id}</td></tr>
            <tr><td>Timestamp:</td><td class="right">${txDate.toISOString()}</td></tr>
            <tr><td>Operator:</td><td class="right">${cashierDisplay}</td></tr>
          </table>
        </div>
        <div class="center barcode">||| ${transaction.transaction_id} |||</div>
        <div class="divider"></div>
        <div class="center footer">
          <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">Thank you for your patronage!</div>
          <div>All sales are final. Refunds require manager</div>
          <div>approval within 24 hours with valid receipt.</div>
          <div style="margin-top:4px;">For disputes contact: ${BIZ_PHONE}</div>
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

    const printWindow = window.open('', '_blank', 'width=380,height=700,scrollbars=yes');
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 400); };
    setTimeout(() => { printWindow.print(); }, 800);
  };

  if (!transaction) {
    return (
      <Button variant="outline" size="sm" disabled className="border-gray-700 text-gray-600">
        <Printer className="w-4 h-4 mr-1" /> No Receipt
      </Button>
    );
  }

  const items = transaction.items || [];
  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const tipAmount = transaction.tip || 0;
  const grandTotal = transaction.total || 0;
  const txDate = new Date(transaction.created_date);
  const cashierDisplay = getCashierDisplay(transaction);

  // Match the printable receipt: door = 0% sales tax, surface CC fee separately.
  const isDoor = (transaction.station || '').toLowerCase() === 'door';
  const taxLabelScreen = isDoor ? 'Tax (0%)' : 'Tax (AZ 8%)';
  const taxValueScreen = isDoor ? 0 : (transaction.tax || 0);
  const ccFeeScreen    = isDoor ? (transaction.tax || 0) : 0;

  return (
    <div className="space-y-3" style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto' }}>
      {/* On-screen receipt preview */}
      <div className="bg-black/90 border border-cyan-500/40 rounded-xl p-4 font-mono text-xs max-w-sm mx-auto shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="text-center mb-3">
          <div className="text-base font-black text-white tracking-widest">{BIZ_NAME}</div>
          <div className="text-[9px] text-gray-500">N.U.P.S. — NEXUS UNIVERSAL POINT-OF-SALE</div>
          <div className="text-[9px] text-gray-400 mt-1">{BIZ_ADDRESS}</div>
          <div className="text-[9px] text-gray-400">Tel: {BIZ_PHONE}</div>
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
          <div className="flex justify-between text-gray-500 text-[10px] mb-1 font-bold">
            <span className="flex-1">ITEM</span>
            <span className="w-8 text-center">QTY</span>
            <span className="w-14 text-right">PRICE</span>
            <span className="w-16 text-right">TOTAL</span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-300 py-0.5">
              <span className="flex-1 truncate">{item.product_name}</span>
              <span className="w-8 text-center text-gray-500">{item.quantity}</span>
              <span className="w-14 text-right text-gray-500">${item.price?.toFixed(2)}</span>
              <span className="w-16 text-right text-white font-bold">${item.total?.toFixed(2)}</span>
            </div>
          ))}
          <div className="text-right text-[10px] text-gray-600 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
        </div>

        <div className="border-t border-double border-gray-600 pt-2 space-y-1">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${(transaction.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-400"><span>{taxLabelScreen}</span><span>${taxValueScreen.toFixed(2)}</span></div>
          {ccFeeScreen > 0 && <div className="flex justify-between text-gray-400"><span>Card Processing Fee</span><span>${ccFeeScreen.toFixed(2)}</span></div>}
          {transaction.discount > 0 && <div className="flex justify-between text-red-400"><span>Discount</span><span>-${transaction.discount.toFixed(2)}</span></div>}
          {tipAmount > 0 && <div className="flex justify-between text-gray-400"><span>Gratuity</span><span>${tipAmount.toFixed(2)}</span></div>}
          <div className="border-t border-gray-700 pt-1 flex justify-between text-lg font-black text-green-400">
            <span>TOTAL</span><span>${grandTotal.toFixed(2)}</span>
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

        <div className="border-t border-dashed border-gray-700 pt-2 mt-2 text-center text-[10px] text-gray-600">
          <div className="text-gray-400 text-xs mb-1">Thank you for your patronage!</div>
          <div>All sales final • Disputes: {BIZ_PHONE}</div>
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