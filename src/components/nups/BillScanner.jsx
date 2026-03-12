import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

/**
 * BARCODE SCANNER COMPONENT
 * Hardware barcode scanner + manual entry support
 */

export default function BillScanner({ onScan }) {
  const [manualEntry, setManualEntry] = useState('');
  const [scanMode, setScanMode] = useState('hardware'); // 'hardware' | 'manual'
  const inputRef = useRef(null);

  // Hardware scanner detection (listens for rapid keypresses ending with Enter)
  React.useEffect(() => {
    if (scanMode !== 'hardware') return;

    let buffer = '';
    let timeout;

    const handleKeyPress = (e) => {
      clearTimeout(timeout);

      if (e.key === 'Enter') {
        if (buffer.length > 8) { // Valid barcode length
          onScan(buffer);
          toast.success('Barcode scanned');
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
        timeout = setTimeout(() => { buffer = ''; }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [scanMode, onScan]);

  const handleManualScan = () => {
    if (manualEntry.length < 8) {
      toast.error('Invalid serial number');
      return;
    }
    onScan(manualEntry);
    setManualEntry('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Bill Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={scanMode === 'hardware' ? 'default' : 'outline'}
            onClick={() => setScanMode('hardware')}
            className="flex-1"
          >
            <Scan className="h-4 w-4 mr-2" />
            Hardware Scanner
          </Button>
          <Button
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setScanMode('manual')}
            className="flex-1"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {scanMode === 'hardware' ? (
          <div className="p-6 border-2 border-dashed rounded-lg text-center">
            <Scan className="h-12 w-12 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">
              Ready to scan. Position barcode under scanner.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              placeholder="Enter serial number"
              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
            />
            <Button onClick={handleManualScan}>Scan</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}