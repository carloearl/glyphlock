import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle, Loader2,
  DollarSign, Trash2, Archive, WifiOff
} from "lucide-react";
import { toast } from "sonner";
import OfflineIndicator from "../OfflineIndicator";

export default function BillScanner({ contractorId, contractorName, onPayoutComplete }) {
  const [scannedBills, setScannedBills] = useState([]);
  const [scanBuffer, setScanBuffer] = useState("");
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input for continuous scanning
  useEffect(() => {
    inputRef.current?.focus();
  }, [scannedBills]);

  // Handle barcode scanner input (HID keyboard wedge)
  useEffect(() => {
    let buffer = "";
    let timeout;

    const handleKeyPress = (e) => {
      // Barcode scanners send Enter after the code
      if (e.key === "Enter" && buffer.length > 0) {
        e.preventDefault();
        handleScan(buffer.trim());
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { buffer = ""; }, 100);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      clearTimeout(timeout);
    };
  }, [scannedBills]);

  const handleScan = async (serialNumber) => {
    if (!serialNumber || scannedBills.some(b => b.serial_number === serialNumber)) {
      toast.error("Duplicate scan detected");
      return;
    }

    // Check network connectivity
    if (!navigator.onLine) {
      toast.error("No internet connection — cannot validate bill");
      setScannedBills(prev => [...prev, {
        serial_number: serialNumber,
        status: "error",
        error: "Offline — scan not validated"
      }]);
      return;
    }

    setValidating(true);
    
    try {
      // Validate bill via backend (single-bill validation)
      const response = await base44.functions.invoke('redeemDreamDollarBills', {
        contractor_id: contractorId,
        contractor_name: contractorName,
        serial_numbers: [serialNumber],
        redemption_rate: 0.50, // 50% redemption rate
        payment_method: "cash"
      });

      const data = response.data;

      if (data.success && data.bills_redeemed > 0) {
        // Valid bill — add to scanned list
        const billData = data.payout.bills_redeemed[0];
        setScannedBills(prev => [...prev, {
          serial_number: serialNumber,
          denomination: billData.denomination,
          redemption_amount: billData.redemption_amount,
          status: "valid",
          payout_id: data.payout.payout_id
        }]);
        toast.success(`✓ $${billData.denomination} bill validated — Payout: $${billData.redemption_amount}`);
      } else if (data.duplicates_detected > 0) {
        // Already redeemed
        const dup = data.duplicate_bills[0];
        setScannedBills(prev => [...prev, {
          serial_number: serialNumber,
          status: "duplicate",
          redeemed_at: dup.redeemed_at,
          redeemed_by: dup.redeemed_by
        }]);
        toast.error("Bill already redeemed");
      } else {
        // Invalid bill
        setScannedBills(prev => [...prev, {
          serial_number: serialNumber,
          status: "invalid",
          error: data.error || "Bill not found"
        }]);
        toast.error(data.error || "Invalid bill");
      }
    } catch (error) {
      setScannedBills(prev => [...prev, {
        serial_number: serialNumber,
        status: "error",
        error: error.message
      }]);
      toast.error("Validation failed: " + error.message);
    } finally {
      setValidating(false);
      setScanBuffer("");
    }
  };

  const handleManualEntry = () => {
    if (scanBuffer.trim()) {
      handleScan(scanBuffer.trim());
    }
  };

  const removeBill = (serial) => {
    setScannedBills(prev => prev.filter(b => b.serial_number !== serial));
  };

  const validBills = scannedBills.filter(b => b.status === "valid");
  const totalPayout = validBills.reduce((sum, b) => sum + (b.redemption_amount || 0), 0);
  const totalFaceValue = validBills.reduce((sum, b) => sum + (b.denomination || 0), 0);

  const handleFinalizePayout = async () => {
    if (validBills.length === 0) {
      toast.error("No valid bills to process");
      return;
    }

    setProcessing(true);
    try {
      // All bills already redeemed individually during scan
      // Just confirm and trigger callback
      toast.success(`Payout complete: $${totalPayout.toFixed(2)} to ${contractorName}`);
      if (onPayoutComplete) {
        onPayoutComplete({
          contractor_id: contractorId,
          bills_redeemed: validBills.length,
          total_payout: totalPayout,
          payout_ids: [...new Set(validBills.map(b => b.payout_id))]
        });
      }
      setScannedBills([]);
    } catch (error) {
      toast.error("Payout failed: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <OfflineIndicator />
      
      {/* Scanner Input */}
      <Card className="bg-gray-900/60 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400">Scan Dream Dollar Bills</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={scanBuffer}
              onChange={e => setScanBuffer(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualEntry()}
              placeholder="Scan barcode or type serial number..."
              className="flex-1 bg-gray-800 border-gray-700 font-mono"
              disabled={validating}
            />
            <Button
              onClick={handleManualEntry}
              disabled={!scanBuffer.trim() || validating}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </div>
          <div className="text-xs text-gray-400">
            💡 Use barcode scanner or type serial manually + press Enter
          </div>
        </CardContent>
      </Card>

      {/* Scanned Bills List */}
      {scannedBills.length > 0 && (
        <Card className="bg-gray-900/60 border-purple-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-400">Scanned Bills ({scannedBills.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {scannedBills.map((bill, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  bill.status === "valid"
                    ? "bg-green-900/20 border-green-500/40"
                    : bill.status === "duplicate"
                    ? "bg-yellow-900/20 border-yellow-500/40"
                    : "bg-red-900/20 border-red-500/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  {bill.status === "valid" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : bill.status === "duplicate" ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <div className="font-mono text-sm text-white">{bill.serial_number}</div>
                    {bill.status === "valid" && (
                      <div className="text-xs text-gray-400">
                        Face: ${bill.denomination} → Payout: ${bill.redemption_amount?.toFixed(2)}
                      </div>
                    )}
                    {bill.status === "duplicate" && (
                      <div className="text-xs text-yellow-400">
                        Already redeemed {bill.redeemed_at ? `on ${new Date(bill.redeemed_at).toLocaleDateString()}` : ""}
                      </div>
                    )}
                    {bill.status === "invalid" && (
                      <div className="text-xs text-red-400">{bill.error}</div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBill(bill.serial_number)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Payout Summary */}
      {validBills.length > 0 && (
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/40">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Valid Bills:</span>
              <span className="font-bold text-white">{validBills.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Total Face Value:</span>
              <span className="font-mono text-lg text-white">${totalFaceValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-green-500/30">
              <span className="text-sm font-bold text-green-400">Contractor Payout (50%):</span>
              <span className="font-mono text-2xl font-black text-green-400">${totalPayout.toFixed(2)}</span>
            </div>
            <Button
              onClick={handleFinalizePayout}
              disabled={processing}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <DollarSign className="w-5 h-5 mr-2" />
              )}
              Confirm Payout to {contractorName}
            </Button>
          </CardContent>
        </Card>
      )}

      {scannedBills.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ScanLine className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-sm">No bills scanned yet</p>
          <p className="text-xs text-gray-600 mt-1">Use scanner or type serial number above</p>
        </div>
      )}
    </div>
  );
}