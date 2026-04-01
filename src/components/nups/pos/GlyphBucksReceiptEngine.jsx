import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import QRCode from 'qrcode';
import { GLYPHLOCK_DISCLAIMER_SHORT } from '@/constants/legalDisclaimer';

/**
 * Professional itemized receipt engine for GlyphBucks transactions.
 * Matches printed layout exactly — dynamic height expansion for variable item counts.
 */
export default function GlyphBucksReceiptEngine({ transaction, batch, bills, currentUser, onPrint }) {
  const receiptRef = React.useRef();
  const activeVenue = useActiveVenue();
  const venueName = activeVenue?.name || 'N.U.P.S. POS';
  const venueAddress = activeVenue?.address || '';
  const venueCity = [activeVenue?.city, activeVenue?.state].filter(Boolean).join(', ') || '';
  const venuePhone = activeVenue?.phone || '';
  const barcodeRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && transaction?.order_number) {
      try {
        if (typeof window !== 'undefined' && window.JsBarcode) {
          window.JsBarcode(barcodeRef.current, transaction.order_number, {
            format: 'CODE128',
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 10,
            margin: 4
          });
        }
      } catch (err) {
        console.error('Barcode generation failed:', err);
      }
    }

    if (qrRef.current && transaction?.order_number) {
      const qrData = JSON.stringify({
        type: 'GLYPHLOCK_RECEIPT',
        uuid: transaction.order_number,
        batch_id: batch.batch_id,
        timestamp: transaction.created_date,
        lookup: `glyphlock.base44.app/ContractLookup?id=${transaction.order_number}`
      });
      
      QRCode.toCanvas(qrRef.current, qrData, {
        width: 80,
        margin: 1,
        errorCorrectionLevel: 'M'
      }).catch(err => console.error('QR generation failed:', err));
    }
  }, [transaction?.order_number, batch?.batch_id]);

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  if (!transaction || !batch) {
    return <div className="text-center py-8 text-gray-400">No transaction data available</div>;
  }

  const cashierName = currentUser?.full_name || transaction.created_by?.split('@')[0] || `Staff ID: ${transaction.created_by || 'UNKNOWN'}`;

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            font-family: Arial, sans-serif !important;
          }
          .no-print { display: none !important; }
          .no-screen { display: block !important; }
        }
        @media screen {
          .no-screen { display: none; }
        }
      `}</style>

      {/* Receipt Preview */}
      <div className="receipt-container bg-white text-black p-6 rounded-lg shadow-lg max-w-md mx-auto" ref={receiptRef}>
        <div className="receipt">
          {/* Header */}
          <div className="header text-center mb-5 pb-4 border-b-2 border-dashed border-black">
            <h1 className="text-xl font-bold mb-1">{venueName.toUpperCase()}</h1>
            {venueAddress && <p className="text-xs">{venueAddress}</p>}
            {venueCity && <p className="text-xs">{venueCity}</p>}
            {venuePhone && <p className="text-xs">Tel: {venuePhone}</p>}
            <p className="mt-3 font-bold text-sm">GLYPHBUCKS PURCHASE RECEIPT</p>
          </div>

          {/* Transaction Info */}
          <div className="section mb-4">
            <div className="section-title font-bold border-b border-black pb-1 mb-2">TRANSACTION DETAILS</div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Receipt #:</span>
              <span className="font-mono">{transaction.order_number}</span>
            </div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Date:</span>
              <span>{new Date(transaction.created_date).toLocaleString()}</span>
            </div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Cashier:</span>
              <span className="font-semibold">{cashierName}</span>
            </div>
            {batch.approval_code && (
              <div className="row flex justify-between my-1 text-xs">
                <span>Approval Code:</span>
                <span className="font-mono">{batch.approval_code}</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="section mb-4">
            <div className="section-title font-bold border-b border-black pb-1 mb-2">CUSTOMER</div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Name:</span>
              <span className="font-semibold">{transaction.customer_name}</span>
            </div>
          </div>

          {/* Itemized GlyphBucks */}
          <div className="section mb-4">
            <div className="section-title font-bold border-b border-black pb-1 mb-2">GLYPHBUCKS PURCHASED</div>
            <div className="items">
              {batch.denominations?.map((item, idx) => (
                <div key={idx} className="item flex justify-between py-1 border-b border-dotted border-gray-300 text-xs">
                  <span style={{ wordWrap: 'break-word', maxWidth: '70%' }}>{item.quantity}x ${item.denomination} GlyphBucks</span>
                  <span className="font-semibold">${item.total_value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GlyphBucks Issued Section */}
          {bills && bills.length > 0 && (
            <div className="section mb-4">
              <div className="section-title font-bold border-b border-black pb-1 mb-2">GLYPHBUCKS ISSUED</div>
              <div className="space-y-1">
                {bills.map((bill, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="font-mono">{bill.serial_number}</span>
                    <span className="font-semibold">${bill.denomination.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs pt-2 mt-2 border-t border-black font-bold">
                  <span>Total GlyphBucks:</span>
                  <span>${bills.reduce((sum, b) => sum + b.denomination, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="totals border-t-2 border-black pt-3 mt-3">
            <div className="row flex justify-between my-1 text-xs">
              <span>GlyphBucks Face Value:</span>
              <span>${batch.total_face_value?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Processing Surcharge (30%):</span>
              <span>${batch.surcharge_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="row bold flex justify-between mt-2 pt-2 border-t-2 border-black font-bold text-sm">
              <span>TOTAL CHARGED:</span>
              <span>${batch.total_charged?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="section mt-4">
            <div className="section-title font-bold border-b border-black pb-1 mb-2">PAYMENT METHOD</div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Card:</span>
              <span>****{transaction.card_last_six?.slice(-4) || 'XXXX'}</span>
            </div>
            <div className="row flex justify-between my-1 text-xs">
              <span>Status:</span>
              <span className="font-bold text-green-700">APPROVED</span>
            </div>
          </div>

          {/* QR Code + Barcode Section */}
          <div className="no-screen mt-6 pt-4 border-t-2 border-black">
            <div className="flex items-start justify-between">
              <div className="text-xs">
                <p className="font-bold">Transaction UUID:</p>
                <p className="font-mono text-[10px] mt-1">{transaction.order_number}</p>
                <p className="font-bold mt-3">Scan to verify:</p>
              </div>
              <div className="text-center">
                <canvas ref={qrRef} />
                <p className="text-[9px] mt-1">GlyphLock Verify</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <canvas ref={barcodeRef} className="mx-auto" />
            </div>
          </div>

          {/* Footer */}
          <div className="footer mt-5 pt-4 border-t-2 border-dashed border-black text-center text-xs">
            <p className="font-semibold">Thank you for your business!</p>
            <p className="mt-2">GlyphBucks are redeemable exclusively at this venue.</p>
            <p className="mt-1">Terms and conditions apply. Non-refundable.</p>
            <p className="mt-3 text-[9px]">
              This receipt is your proof of purchase. Please retain for your records.
            </p>
            <p className="mt-4 pt-3 border-t border-gray-300 text-[9px] text-gray-600">
              {GLYPHLOCK_DISCLAIMER_SHORT}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center no-print">
        <Button onClick={handlePrint} className="btn-glow-blue min-h-[48px]">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}