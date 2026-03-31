import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

/**
 * Professional itemized receipt engine for POS transactions.
 * Matches printed layout exactly — dynamic height expansion for variable item counts.
 */
export default function POSReceiptEngine({ transaction, batch, onPrint }) {
  const receiptRef = React.useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Dream Palace Receipt - ${transaction?.order_number || 'N/A'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 20px;
              background: white;
              color: black;
            }
            .receipt {
              max-width: 380px;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 20px;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
            .header h1 { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .header p { font-size: 11px; margin: 2px 0; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .row.bold { font-weight: bold; }
            .items { margin: 10px 0; }
            .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .barcode { text-align: center; margin: 20px 0; padding: 15px; border: 2px solid #000; }
            .barcode-label { font-size: 10px; margin-bottom: 5px; }
            .barcode-value { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; text-align: center; font-size: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
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

  return (
    <div className="space-y-4">
      {/* Receipt Preview */}
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-md mx-auto" ref={receiptRef}>
        <div className="receipt">
          {/* Header */}
          <div className="header">
            <h1>DREAM PALACE</h1>
            <p>123 Entertainment Blvd</p>
            <p>Las Vegas, NV 89101</p>
            <p>Tel: (702) 555-0100</p>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>TRANSACTION RECEIPT</p>
          </div>

          {/* Transaction Info */}
          <div className="section">
            <div className="section-title">TRANSACTION DETAILS</div>
            <div className="row">
              <span>Receipt #:</span>
              <span>{transaction.transaction_id}</span>
            </div>
            <div className="row">
              <span>Date:</span>
              <span>{new Date(transaction.created_date).toLocaleString()}</span>
            </div>
            <div className="row">
              <span>Terminal:</span>
              <span>BAR-01</span>
            </div>
            <div className="row">
              <span>Cashier:</span>
              <span>{transaction.cashier?.split('@')[0] || 'Staff'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="section">
            <div className="section-title">ITEMS</div>
            <div className="items">
              {transaction.items?.map((item, idx) => (
                <div key={idx} className="item">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span>${(item.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="totals">
            <div className="row">
              <span>Subtotal:</span>
              <span>${(transaction.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="row">
              <span>Tax (8%):</span>
              <span>${(transaction.tax || 0).toFixed(2)}</span>
            </div>
            <div className="row bold" style={{ fontSize: '14px', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #000' }}>
              <span>TOTAL:</span>
              <span>${(transaction.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="section">
            <div className="section-title">PAYMENT METHOD</div>
            <div className="row">
              <span>Method:</span>
              <span>{transaction.payment_method}</span>
            </div>
            <div className="row">
              <span>Status:</span>
              <span>APPROVED</span>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Thank you for your business!</p>
            <p style={{ marginTop: '10px' }}>Please retain this receipt for your records.</p>
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