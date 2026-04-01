import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function POSReceiptEngine({ transaction, batch, onPrint }) {
  const receiptRef = React.useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>GlyphLock POS Receipt - ${transaction?.transaction_id || 'N/A'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; background: white; color: black; }
            .receipt { max-width: 380px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
            .brand { font-size: 26px; font-weight: bold; letter-spacing: 4px; margin-bottom: 4px; }
            .powered { font-size: 9px; letter-spacing: 2px; color: #555; margin-bottom: 8px; }
            .header p { font-size: 11px; margin: 2px 0; }
            .receipt-type { margin-top: 10px; font-weight: bold; font-size: 13px; letter-spacing: 1px; border: 1px solid #000; display: inline-block; padding: 3px 10px; }
            .section { margin: 12px 0; }
            .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 8px; font-size: 11px; letter-spacing: 1px; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 11px; }
            .row.bold { font-weight: bold; }
            .items { margin: 8px 0; }
            .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; font-size: 11px; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .barcode { text-align: center; margin: 15px 0; padding: 12px; border: 2px solid #000; background: #f9f9f9; }
            .barcode-label { font-size: 9px; letter-spacing: 1px; margin-bottom: 5px; color: #555; }
            .barcode-value { font-size: 13px; font-weight: bold; letter-spacing: 3px; }
            .footer { margin-top: 15px; padding-top: 12px; border-top: 2px dashed #000; text-align: center; font-size: 10px; }
            .footer .support { margin-top: 8px; font-weight: bold; font-size: 11px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${receiptRef.current?.innerHTML || ''}
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">Print Receipt</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    onPrint?.();
  };

  if (!transaction || !batch) {
    return <div className="text-center py-8 text-gray-400">No transaction data available</div>;
  }

  const s = (val) => (val || 0).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Receipt Preview */}
      <div className="bg-white text-black rounded-lg shadow-lg max-w-md mx-auto overflow-hidden" ref={receiptRef}>
        <div style={{ maxWidth: 380, margin: '0 auto', border: '2px solid #000', padding: 20, fontFamily: 'Courier New, monospace', fontSize: 12, color: '#000' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px dashed #000', paddingBottom: 15 }}>
            <div style={{ fontSize: 26, fontWeight: 'bold', letterSpacing: 4 }}>GLYPHLOCK</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#555', marginBottom: 8 }}>SECURE POS SYSTEM</div>
            <p style={{ fontSize: 11, margin: '2px 0' }}>Dream Palace Entertainment</p>
            <p style={{ fontSize: 11, margin: '2px 0' }}>Tel: (424) 246-6499</p>
            <p style={{ fontSize: 11, margin: '2px 0' }}>support@glyphlock.com</p>
            <div style={{ marginTop: 10, fontWeight: 'bold', fontSize: 13, letterSpacing: 1, border: '1px solid #000', display: 'inline-block', padding: '3px 10px' }}>
              TRANSACTION RECEIPT
            </div>
          </div>

          {/* Transaction Info */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8, fontSize: 11, letterSpacing: 1 }}>TRANSACTION DETAILS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Receipt #:</span><span>{transaction.transaction_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Date:</span><span>{new Date(transaction.created_date).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Terminal:</span><span>BAR-01</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Cashier:</span><span>{transaction.cashier?.split('@')[0] || 'Staff'}</span>
            </div>
          </div>

          {/* Items */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8, fontSize: 11, letterSpacing: 1 }}>ITEMS PURCHASED</div>
            {transaction.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dotted #ccc', fontSize: 11 }}>
                <span>{item.product_name} x{item.quantity}</span>
                <span>${s(item.total)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '2px solid #000', paddingTop: 10, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Subtotal:</span><span>${s(transaction.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Tax:</span><span>${s(transaction.tax)}</span>
            </div>
            {transaction.tip > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
                <span>Tip:</span><span>${s(transaction.tip)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0 0', paddingTop: 8, borderTop: '2px solid #000', fontWeight: 'bold', fontSize: 14 }}>
              <span>TOTAL:</span><span>${s(transaction.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 3, marginBottom: 8, fontSize: 11, letterSpacing: 1 }}>PAYMENT METHOD</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Method:</span><span>{transaction.payment_method}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 11 }}>
              <span>Status:</span><span style={{ fontWeight: 'bold' }}>✓ APPROVED</span>
            </div>
          </div>

          {/* Barcode / Transaction ID */}
          <div style={{ textAlign: 'center', margin: '15px 0', padding: 12, border: '2px solid #000', background: '#f9f9f9' }}>
            <div style={{ fontSize: 9, letterSpacing: 1, marginBottom: 5, color: '#555' }}>TRANSACTION ID</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 }}>
              {transaction.transaction_id}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 15, paddingTop: 12, borderTop: '2px dashed #000', textAlign: 'center', fontSize: 10 }}>
            <p>Thank you for your business!</p>
            <p style={{ marginTop: 6 }}>Please retain this receipt for your records.</p>
            <p style={{ marginTop: 8, fontWeight: 'bold', fontSize: 11 }}>GlyphLock POS | (424) 246-6499</p>
            <p style={{ marginTop: 2, fontSize: 9, color: '#555' }}>Powered by GlyphLock Secure Commerce™</p>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button onClick={handlePrint} className="btn-glow-blue">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}