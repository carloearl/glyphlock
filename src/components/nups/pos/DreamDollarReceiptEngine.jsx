import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

/**
 * Professional itemized receipt engine for Dream Dollar transactions.
 * Matches printed layout exactly — dynamic height expansion for variable item counts.
 */
export default function DreamDollarReceiptEngine({ transaction, batch, onPrint }) {
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
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>DREAM DOLLAR PURCHASE RECEIPT</p>
          </div>

          {/* Transaction Info */}
          <div className="section">
            <div className="section-title">TRANSACTION DETAILS</div>
            <div className="row">
              <span>Receipt #:</span>
              <span>{transaction.order_number}</span>
            </div>
            <div className="row">
              <span>Date:</span>
              <span>{new Date(transaction.created_date).toLocaleString()}</span>
            </div>
            <div className="row">
              <span>Terminal:</span>
              <span>POS-01</span>
            </div>
            <div className="row">
              <span>Cashier:</span>
              <span>{transaction.created_by?.split('@')[0] || 'Staff'}</span>
            </div>
            {batch.approval_code && (
              <div className="row">
                <span>Approval Code:</span>
                <span>{batch.approval_code}</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="section">
            <div className="section-title">CUSTOMER</div>
            <div className="row">
              <span>Name:</span>
              <span>{transaction.customer_name}</span>
            </div>
          </div>

          {/* Itemized Dream Dollars */}
          <div className="section">
            <div className="section-title">DREAM DOLLARS PURCHASED</div>
            <div className="items">
              {batch.denominations?.map((item, idx) => (
                <div key={idx} className="item">
                  <span>{item.quantity}x ${item.denomination} Dream Dollar{item.quantity > 1 ? 's' : ''}</span>
                  <span>${item.total_value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="totals">
            <div className="row">
              <span>Dream Dollar Face Value:</span>
              <span>${batch.total_face_value?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="row">
              <span>Processing Surcharge (30%):</span>
              <span>${batch.surcharge_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="row bold" style={{ fontSize: '14px', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #000' }}>
              <span>TOTAL CHARGED:</span>
              <span>${batch.total_charged?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="section">
            <div className="section-title">PAYMENT METHOD</div>
            <div className="row">
              <span>Card Type:</span>
              <span>****{transaction.card_last_six?.slice(-4) || 'XXXX'}</span>
            </div>
            <div className="row">
              <span>Status:</span>
              <span>APPROVED</span>
            </div>
          </div>

          {/* Barcode */}
          <div className="barcode">
            <div className="barcode-label">TRANSACTION BARCODE</div>
            <div className="barcode-value">{batch.batch_barcode || batch.batch_id}</div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Thank you for your business!</p>
            <p style={{ marginTop: '10px' }}>Dream Dollars are redeemable exclusively at Dream Palace venues.</p>
            <p>Terms and conditions apply. Non-refundable.</p>
            <p style={{ marginTop: '10px', fontSize: '9px' }}>
              This receipt is your proof of purchase. Please retain for your records.
            </p>
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