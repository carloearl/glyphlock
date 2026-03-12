import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';

export default function QRScanner({ onValidScan }) {
  const [qrData, setQrData] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const validateQR = async () => {
    if (!qrData) {
      toast.error('Enter QR code data');
      return;
    }

    setIsValidating(true);
    try {
      const result = await base44.functions.invoke('validateSecureQR', {
        qr_data: qrData
      });

      if (result.data.valid) {
        setLastResult({ valid: true, ...result.data });
        toast.success('QR code validated successfully');
        if (onValidScan) onValidScan(result.data);
      } else {
        setLastResult({ valid: false, error: result.data.error });
        toast.error(result.data.error || 'Invalid QR code');
      }

      setQrData('');
    } catch (error) {
      setLastResult({ valid: false, error: error.message });
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Secure QR Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Scan or paste QR data"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && validateQR()}
          />
          <Button onClick={validateQR} disabled={isValidating}>
            Validate
          </Button>
        </div>

        {lastResult && (
          <div className={`p-4 rounded-lg ${lastResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {lastResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${lastResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                {lastResult.valid ? 'Valid QR Code' : 'Invalid QR Code'}
              </span>
            </div>
            {lastResult.valid ? (
              <div className="mt-2 text-sm text-green-800">
                <p>Order ID: {lastResult.order_id}</p>
                <p>Venue: {lastResult.venue_id}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-red-800">{lastResult.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}