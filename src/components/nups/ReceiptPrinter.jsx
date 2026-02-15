import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function ReceiptPrinter({ transaction, businessName = "N.U.P.S." }) {
  const printReceipt = () => {
    if (!transaction) return;
    
    const items = transaction.items || [];
    const itemsHtml = items.map(item => 
      `<tr>
        <td style="text-align:left">${item.quantity}x ${item.product_name}</td>
        <td style="text-align:right">$${item.total?.toFixed(2)}</td>
      </tr>`
    ).join('');

    const receiptHtml = `
      <html>
      <head><title>Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 300px; padding: 12px; font-size: 12px; color: #000; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; }
        td { padding: 2px 0; }
        .bold { font-weight: bold; }
        .big { font-size: 16px; }
        .right { text-align: right; }
      </style>
      </head>
      <body>
        <div class="center">
          <div class="bold big">${businessName}</div>
          <div>Point of Sale System</div>
          <div style="margin-top:4px;font-size:10px">Powered by GlyphLock Security</div>
        </div>
        <div class="divider"></div>
        <div style="font-size:10px">
          <div>Receipt: ${transaction.transaction_id}</div>
          <div>Date: ${new Date(transaction.created_date).toLocaleString()}</div>
          <div>Cashier: ${transaction.cashier || 'N/A'}</div>
        </div>
        <div class="divider"></div>
        <table>${itemsHtml}</table>
        <div class="divider"></div>
        <table>
          <tr><td>Subtotal:</td><td class="right">$${(transaction.subtotal || 0).toFixed(2)}</td></tr>
          <tr><td>Tax:</td><td class="right">$${(transaction.tax || 0).toFixed(2)}</td></tr>
          ${transaction.discount > 0 ? `<tr><td>Discount:</td><td class="right">-$${transaction.discount.toFixed(2)}</td></tr>` : ''}
          <tr class="bold"><td class="big">TOTAL:</td><td class="right big">$${(transaction.total || 0).toFixed(2)}</td></tr>
        </table>
        <div class="divider"></div>
        <div>Payment: ${transaction.payment_method}</div>
        ${transaction.cash_tendered ? `<div>Cash Tendered: $${transaction.cash_tendered.toFixed(2)}</div>` : ''}
        ${transaction.change_due > 0 ? `<div>Change: $${transaction.change_due.toFixed(2)}</div>` : ''}
        <div class="divider"></div>
        <div class="center" style="font-size:10px;margin-top:8px">
          Thank you for your patronage!<br/>
          ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <Button
      onClick={printReceipt}
      variant="outline"
      size="sm"
      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
      disabled={!transaction}
    >
      <Printer className="w-4 h-4 mr-1" />
      Print Receipt
    </Button>
  );
}