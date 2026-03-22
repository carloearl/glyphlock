import React, { useState, useRef, useEffect } from 'react';
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
  const hiddenInputRef = useRef(null);

  // Hardware scanner detection - KEYBOARD WEDGE HID INPUT
  // Auto-focuses hidden input to capture rapid keystrokes ending in Enter
  React.useEffect(() => {
    if (scanMode !== 'hardware') return;

    // Auto-focus hidden input for HID scanner
    hiddenInputRef.current?.focus();

    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyPress = (e) => {
      const now = Date.now();
      
      // Reset buffer if gap > 100ms (user typing vs scanner)
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 8) { // Valid barcode serial (8-12 digits)
          e.preventDefault();
          onScan(buffer.trim());
          toast.success(`✅ Scanned: ${buffer.trim()}`);
          buffer = '';
          hiddenInputRef.current.value = '';
        }
      } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        buffer += e.key;
      }
    };

    const hiddenInput = hiddenInputRef.current;
    hiddenInput?.addEventListener('keypress', handleKeyPress);
    
    return () => {
      hiddenInput?.removeEventListener('keypress', handleKeyPress);
    };
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
          <div className="relative">
            {/* HIDDEN INPUT FOR USB HID BARCODE SCANNER (KEYBOARD WEDGE) */}
            <input
              ref={hiddenInputRef}
              type="text"
              autoFocus
              className="absolute opacity-0 pointer-events-none"
              style={{ width: 1, height: 1 }}
              aria-label="Barcode scanner input"
            />
            <div className="p-6 border-2 border-dashed rounded-lg text-center bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-cyan-500/40">
              <Scan className="h-12 w-12 mx-auto text-cyan-400 mb-2 animate-pulse" />
              <p className="text-sm text-white font-medium">
                ✅ Scanner Ready
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Position barcode under USB scanner
              </p>
            </div>
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