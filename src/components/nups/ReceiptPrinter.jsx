import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function ReceiptPrinter({ transaction, businessName = "N.U.P.S.", businessAddress = "123 Entertainment Blvd", businessPhone = "(555) 555-0100", taxId = "88-1234567" }) {
  const printReceipt = () => {
    if (!transaction) return;
    
    const items = transaction.items || [];
    const txDate = new Date(transaction.created_date);
    const formattedDate = txDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const itemsHtml = items.map((item, idx) => 
      `<tr>
        <td style="text-align:left;padding:3px 0;">${idx + 1}. ${item.product_name}</td>
        <td style="text-align:center;padding:3px 0;">${item.quantity}</td>
        <td style="text-align:right;padding:3px 0;">$${item.price?.toFixed(2)}</td>
        <td style="text-align:right;padding:3px 0;font-weight:bold;">$${item.total?.toFixed(2)}</td>
      </tr>`
    ).join('');

    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const tipAmount = transaction.tip || 0;
    const grandTotal = (transaction.total || 0) + tipAmount;

    const receiptHtml = `
      <html>
      <head><title>Receipt - ${transaction.transaction_id}</title>
      <style>
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { width: 80mm; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 302px; padding: 16px 12px; font-size: 12px; color: #000; line-height: 1.4; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .double-divider { border-top: 2px solid #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .header-logo { font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 2px; }
        .item-header { font-size: 10px; font-weight: bold; border-bottom: 1px solid #000; }
        .item-header td { padding-bottom: 4px; }
        .total-row td { font-size: 18px; font-weight: 900; padding: 6px 0; }
        .info-row { font-size: 10px; }
        .barcode { font-family: monospace; font-size: 10px; letter-spacing: 3px; margin: 6px 0; }
        .footer { font-size: 9px; color: #444; margin-top: 8px; }
      </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="center">
          <div class="header-logo">${businessName}</div>
          <div style="font-size:10px;">NEXUS UNIVERSAL POINT-OF-SALE</div>
          <div style="font-size:10px;margin-top:4px;">${businessAddress}</div>
          <div style="font-size:10px;">Tel: ${businessPhone}</div>
          <div style="font-size:9px;margin-top:2px;">Tax ID: ${taxId}</div>
        </div>
        
        <div class="double-divider"></div>
        
        <!-- TRANSACTION INFO -->
        <table>
          <tr class="info-row">
            <td>Receipt #:</td>
            <td class="right bold">${transaction.transaction_id}</td>
          </tr>
          <tr class="info-row">
            <td>Date:</td>
            <td class="right">${formattedDate}</td>
          </tr>
          <tr class="info-row">
            <td>Time:</td>
            <td class="right">${formattedTime}</td>
          </tr>
          <tr class="info-row">
            <td>Cashier:</td>
            <td class="right">${transaction.cashier || 'N/A'}</td>
          </tr>
          ${transaction.customer_id ? `<tr class="info-row"><td>Customer:</td><td class="right">${transaction.customer_id}</td></tr>` : ''}
        </table>
        
        <div class="divider"></div>
        
        <!-- COLUMN HEADERS -->
        <table>
          <tr class="item-header">
            <td style="text-align:left;">ITEM</td>
            <td style="text-align:center;">QTY</td>
            <td style="text-align:right;">PRICE</td>
            <td style="text-align:right;">TOTAL</td>
          </tr>
        </table>
        
        <!-- LINE ITEMS -->
        <table>
          ${itemsHtml}
        </table>
        
        <div style="font-size:10px;text-align:right;color:#666;padding-top:2px;">
          ${totalItems} item${totalItems !== 1 ? 's' : ''} sold
        </div>
        
        <div class="double-divider"></div>
        
        <!-- TOTALS -->
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="right">$${(transaction.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Sales Tax (8.0%):</td>
            <td class="right">$${(transaction.tax || 0).toFixed(2)}</td>
          </tr>
          ${transaction.discount > 0 ? `
          <tr>
            <td>Discount:</td>
            <td class="right" style="color:red;">-$${transaction.discount.toFixed(2)}</td>
          </tr>` : ''}
          ${tipAmount > 0 ? `
          <tr>
            <td>Tip:</td>
            <td class="right">$${tipAmount.toFixed(2)}</td>
          </tr>` : ''}
        </table>
        
        <div class="divider"></div>
        
        <table>
          <tr class="total-row">
            <td>TOTAL:</td>
            <td class="right">$${grandTotal.toFixed(2)}</td>
          </tr>
        </table>
        
        <div class="divider"></div>
        
        <!-- PAYMENT INFO -->
        <table>
          <tr>
            <td class="bold">Payment Method:</td>
            <td class="right bold">${transaction.payment_method}</td>
          </tr>
          ${transaction.payment_method === 'Cash' && transaction.cash_tendered ? `
          <tr>
            <td>Cash Tendered:</td>
            <td class="right">$${parseFloat(transaction.cash_tendered).toFixed(2)}</td>
          </tr>
          <tr class="bold">
            <td>Change Due:</td>
            <td class="right">$${(transaction.change_due > 0 ? parseFloat(transaction.change_due).toFixed(2) : '0.00')}</td>
          </tr>` : ''}
          ${transaction.payment_method === 'Credit Card' || transaction.payment_method === 'Debit Card' ? `
          <tr class="info-row">
            <td>Card:</td>
            <td class="right">**** **** **** ${transaction.card_last_four || 'XXXX'}</td>
          </tr>
          <tr class="info-row">
            <td>Auth Code:</td>
            <td class="right">${transaction.auth_code || Math.random().toString(36).substr(2, 6).toUpperCase()}</td>
          </tr>` : ''}
        </table>
        
        <div class="double-divider"></div>
        
        <!-- RECEIPT BARCODE -->
        <div class="center barcode">
          ||| ${transaction.transaction_id} |||
        </div>
        
        <div class="divider"></div>
        
        <!-- FOOTER -->
        <div class="center footer">
          <div style="font-size:11px;font-weight:bold;margin-bottom:4px;">Thank you for your patronage!</div>
          <div>All sales are final. No refunds without</div>
          <div>manager approval within 24 hours.</div>
          <div style="margin-top:6px;">Keep this receipt for your records.</div>
          <div style="margin-top:6px;font-size:8px;color:#888;">
            Printed: ${new Date().toLocaleString()}<br/>
            N.U.P.S. POS v2.0 — Secured by GlyphLock
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=800');
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  // Also render an on-screen receipt preview
  if (!transaction) {
    return (
      <Button variant="outline" size="sm" disabled className="border-gray-700 text-gray-600">
        <Printer className="w-4 h-4 mr-1" />
        No Receipt
      </Button>
    );
  }

  const items = transaction.items || [];
  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const tipAmount = transaction.tip || 0;
  const grandTotal = (transaction.total || 0) + tipAmount;
  const txDate = new Date(transaction.created_date);

  return (
    <div className="space-y-3">
      {/* On-screen itemized receipt */}
      <div className="bg-black/60 border border-cyan-500/20 rounded-xl p-4 font-mono text-xs max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-base font-black text-white tracking-widest">{businessName}</div>
          <div className="text-[10px] text-gray-500">NEXUS UNIVERSAL POINT-OF-SALE</div>
        </div>
        
        {/* Transaction info */}
        <div className="border-t border-dashed border-gray-700 pt-2 mb-2 text-gray-400 space-y-0.5">
          <div className="flex justify-between"><span>Receipt:</span><span className="text-white">{transaction.transaction_id}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{txDate.toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span>Time:</span><span>{txDate.toLocaleTimeString()}</span></div>
          <div className="flex justify-between"><span>Cashier:</span><span>{transaction.cashier || 'N/A'}</span></div>
        </div>
        
        {/* Items */}
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
        
        {/* Totals */}
        <div className="border-t border-double border-gray-600 pt-2 space-y-1">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${(transaction.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-400"><span>Tax (8%)</span><span>${(transaction.tax || 0).toFixed(2)}</span></div>
          {transaction.discount > 0 && (
            <div className="flex justify-between text-red-400"><span>Discount</span><span>-${transaction.discount.toFixed(2)}</span></div>
          )}
          {tipAmount > 0 && (
            <div className="flex justify-between text-gray-400"><span>Tip</span><span>${tipAmount.toFixed(2)}</span></div>
          )}
          <div className="border-t border-gray-700 pt-1 flex justify-between text-lg font-black text-green-400">
            <span>TOTAL</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Payment */}
        <div className="border-t border-dashed border-gray-700 pt-2 mt-2 space-y-0.5 text-gray-400">
          <div className="flex justify-between font-bold"><span>Payment</span><span className="text-cyan-400">{transaction.payment_method}</span></div>
          {transaction.payment_method === 'Cash' && transaction.cash_tendered && (
            <>
              <div className="flex justify-between"><span>Tendered</span><span>${parseFloat(transaction.cash_tendered).toFixed(2)}</span></div>
              {transaction.change_due > 0 && (
                <div className="flex justify-between font-bold text-amber-400"><span>Change</span><span>${parseFloat(transaction.change_due).toFixed(2)}</span></div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-dashed border-gray-700 pt-2 mt-2 text-center text-[10px] text-gray-600">
          <div className="text-gray-400 text-xs mb-1">Thank you for your patronage!</div>
          <div>All sales final • No refunds w/o mgr approval</div>
          <div className="mt-1 tracking-[4px] text-gray-700">||| {transaction.transaction_id} |||</div>
        </div>
      </div>
      
      {/* Print button */}
      <div className="flex justify-center">
        <Button
          onClick={printReceipt}
          variant="outline"
          size="sm"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Printer className="w-4 h-4 mr-1" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}