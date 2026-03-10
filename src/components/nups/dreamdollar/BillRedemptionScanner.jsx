import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, Trash2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

export default function BillRedemptionScanner({ venue_id, contractor }) {
  const [scannedBills, setScannedBills] = useState([]);
  const [serialInput, setSerialInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionRate] = useState(0.85);

  const handleScanSerial = () => {
    const serial = serialInput.trim().toUpperCase();
    if (!serial) return;

    // Check if already scanned
    if (scannedBills.some(b => b.serial_number === serial)) {
      alert('Bill already scanned in this session');
      setSerialInput('');
      return;
    }

    // Add to scanned list (pending validation)
    setScannedBills(prev => [...prev, {
      serial_number: serial,
      status: 'pending',
      denomination: null
    }]);

    setSerialInput('');
  };

  const removeBill = (serial) => {
    setScannedBills(prev => prev.filter(b => b.serial_number !== serial));
  };

  const handleRedeemBills = async () => {
    if (scannedBills.length === 0) {
      alert('No bills scanned');
      return;
    }

    if (!contractor?.id) {
      alert('No contractor selected');
      return;
    }

    setRedeeming(true);
    try {
      const serial_numbers = scannedBills.map(b => b.serial_number);

      const result = await base44.functions.invoke('redeemDreamDollarBills', {
        venue_id,
        contractor_id: contractor.id,
        contractor_name: contractor.stage_name || contractor.legal_name,
        serial_numbers,
        redemption_rate: redemptionRate,
        payment_method: 'cash'
      });

      if (result.data.success) {
        const { bills_redeemed, duplicates_detected, total_payout, errors } = result.data;

        let message = `✅ Successfully redeemed ${bills_redeemed} bills\n`;
        message += `💰 Payout: $${total_payout.toFixed(2)}\n`;

        if (duplicates_detected > 0) {
          message += `⚠️ ${duplicates_detected} duplicate bills detected\n`;
        }

        if (errors.length > 0) {
          message += `\nErrors:\n${errors.join('\n')}`;
        }

        alert(message);
        setScannedBills([]);
      }
    } catch (err) {
      console.error('Redemption error:', err);
      alert('Failed to redeem bills: ' + err.message);
    } finally {
      setRedeeming(false);
    }
  };

  const totalScanned = scannedBills.length;
  const estimatedPayout = scannedBills.reduce((sum, bill) => 
    sum + (bill.denomination || 0), 0
  ) * redemptionRate;

  return (
    <div className="space-y-4">
      <Card className="glyph-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            Dream Dollar Redemption
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contractor Info */}
          {contractor && (
            <div className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/30">
              <div className="text-sm text-gray-300">Redeeming for:</div>
              <div className="font-semibold text-cyan-400">
                {contractor.stage_name || contractor.legal_name}
              </div>
            </div>
          )}

          {/* Serial Scanner */}
          <div>
            <label className="block text-sm font-medium mb-2">Scan Bill Serial Number</label>
            <div className="flex gap-2">
              <Input
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScanSerial()}
                placeholder="Enter or scan serial number"
                className="input-glow-blue flex-1"
                disabled={!contractor}
              />
              <Button
                onClick={handleScanSerial}
                disabled={!serialInput.trim() || !contractor}
              >
                <Scan className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Scanned Bills List */}
          {scannedBills.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Scanned Bills ({totalScanned})</div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {scannedBills.map(bill => (
                  <div
                    key={bill.serial_number}
                    className="flex items-center justify-between p-3 rounded-lg glyph-glass border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      {bill.status === 'pending' ? (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-mono text-sm">{bill.serial_number}</span>
                      {bill.denomination && (
                        <span className="text-cyan-400 font-semibold">
                          ${bill.denomination}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeBill(bill.serial_number)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payout Summary */}
          {scannedBills.length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30">
              <div className="flex justify-between text-sm mb-1">
                <span>Bills Scanned:</span>
                <span className="font-semibold">{totalScanned}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Redemption Rate:</span>
                <span className="font-semibold">{(redemptionRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2 mt-2">
                <span>Estimated Payout:</span>
                <span className="text-cyan-400">${estimatedPayout.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Redeem Button */}
          <Button
            onClick={handleRedeemBills}
            disabled={redeeming || scannedBills.length === 0 || !contractor}
            className="w-full btn-glow-blue"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            {redeeming ? 'Processing...' : 'Complete Redemption'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}