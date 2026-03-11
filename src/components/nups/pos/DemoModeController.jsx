import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

/**
 * Demo Mode Controller - generates watermarked test data for Dream Dollar workflows.
 * Isolated from live financial records.
 */
export default function DemoModeController({ onModeChange }) {
  const [demoMode, setDemoMode] = useState(false);

  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    onModeChange?.(newMode);

    if (newMode) {
      sessionStorage.setItem('nups_demo_mode', 'true');
    } else {
      sessionStorage.removeItem('nups_demo_mode');
    }
  };

  return (
    <Card className={demoMode ? 'border-yellow-500 border-2' : 'glyph-glass-card'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={demoMode ? 'w-5 h-5 text-yellow-400 animate-pulse' : 'w-5 h-5 text-gray-400'} />
          Demo Mode Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {demoMode && (
          <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-yellow-400 mb-1">DEMO MODE ACTIVE</div>
                <div className="text-gray-300">
                  All transactions, receipts, and contracts generated will display a "DEMO DATA ONLY" watermark.
                  No live payment processing will occur.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium">Current Mode:</div>
          <div className={`text-lg font-bold ${demoMode ? 'text-yellow-400' : 'text-green-400'}`}>
            {demoMode ? 'DEMONSTRATION' : 'PRODUCTION'}
          </div>
        </div>

        <Button
          onClick={toggleDemoMode}
          variant={demoMode ? 'destructive' : 'default'}
          className="w-full"
        >
          {demoMode ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Disable Demo Mode
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Enable Demo Mode
            </>
          )}
        </Button>

        {demoMode && (
          <div className="mt-4 p-3 rounded-lg bg-gray-900/40 border border-gray-700 text-xs space-y-2">
            <div className="font-semibold text-cyan-400">Demo Mode Features:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Mock customer names generated</li>
              <li>Test approval codes (DEMO-XXXXX)</li>
              <li>Fake serial numbers</li>
              <li>Watermarked receipts and contracts</li>
              <li>No real card processing</li>
              <li>Isolated from production database</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Demo data generators
export const DemoDataGenerator = {
  customerName: () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  },

  approvalCode: () => {
    return `DEMO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  },

  serialNumber: () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DEMO-${dateStr}${random}`;
  },

  cardNumber: () => {
    return `****-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
  },

  idNumber: () => {
    return `DEMO${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }
};

export function isDemoMode() {
  return sessionStorage.getItem('nups_demo_mode') === 'true';
}