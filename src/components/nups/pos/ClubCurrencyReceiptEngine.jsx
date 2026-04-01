import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useActiveVenue } from '@/hooks/useActiveVenue';

/**
 * Professional itemized receipt engine for Club Currency (GlyphBucks) transactions.
 */
export default function ClubCurrencyReceiptEngine({ transaction, batch, onPrint }) {
  const receiptRef = React.useRef();
  const activeVenue = useActiveVenue();

  const venueName = activeVenue?.name || 'N.U.P.S. POS';
  const venueAddress = [activeVenue?.address, activeVenue?.city, activeVenue?.state].filter(Boolean).join(', ') || '';
  const venuePhone = activeVenue?.phone || '';
  const currencyName = activeVenue?.currency_name || 'Club Currency';

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=600');
    const content = receiptRef.current?.innerHTML || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction?.order_number || 'N/A'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; background: white; color: black; }
            .receipt { max-width: 380px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
            .header h1 { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .header p { font-size: 11px; margin: 2px 0; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .row.bold { font-weight: bold; }
            .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; text-align: center; font-size: 10px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
    onPrint?.();
  };

  if (!transaction || !batch) {
    return <div className="text-center py-8 text-gray-400">No transaction data available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg max-w-md mx-auto" ref={receiptRef}>
        <div className="receipt">
          <div className="header">
            <h1>{venueName.toUpperCase()}</h1>
            {venueAddress && <p>{venueAddress}</p>}
            {venuePhone && <p>Tel: {venuePhone}</p>}
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{currencyName.toUpperCase()} PURCHASE RECEIPT</p>
          </div>

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
              <span>{batch?.station ? batch.station.toUpperCase() + ' REGISTER' : 'POS'}</span>
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

          <div className="section">
            <div className="section-title">CUSTOMER</div>
            <div className="row">
              <span>Name:</span>
              <span>{transaction.customer_name}</span>
            </div>
          </div>

          <div className="section">
            <div className="section-title">{currencyName.toUpperCase()} PURCHASED</div>
            <div className="items">
              {batch.denominations?.map((item, idx) => (
                <div key={idx} className="item">
                  <span>{item.quantity}x ${item.denomination} {currencyName}{item.quantity > 1 ? 's' : ''}</span>
                  <span>${item.total_value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="totals">
            <div className="row">
              <span>{currencyName} Face Value:</span>
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

          <div className="barcode">
            <div className="barcode-label">TRANSACTION BARCODE</div>
            <div className="barcode-value">{batch.batch_barcode || batch.batch_id}</div>
          </div>

          <div className="footer">
            <p>Thank you for your business!</p>
            <p style={{ marginTop: '10px' }}>{currencyName} are redeemable exclusively at this venue.</p>
            <p>Terms and conditions apply. Non-refundable.</p>
            <p style={{ marginTop: '10px', fontSize: '9px' }}>
              This receipt is your proof of purchase. Please retain for your records.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={handlePrint} className="btn-glow-blue">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}