import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle, Loader2,
  DollarSign, Trash2, Archive, WifiOff, Shield
} from "lucide-react";
import { toast } from "sonner";
import OfflineIndicator from "../OfflineIndicator";
import ManagerPINVerifier from "../ManagerPINVerifier";

export default function BillScanner({ contractorId, contractorName, onPayoutComplete }) {
  const [scannedBills, setScannedBills] = useState([]);
  const [scanBuffer, setScanBuffer] = useState("");
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPINVerifier, setShowPINVerifier] = useState(false);
  const [authorizedManager, setAuthorizedManager] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [scannedBills]);

  useEffect(() => {
    let buffer = "";
    let timeout;

    const handleKeyPress = (e) => {
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
      const response = await base44.functions.invoke('redeemGlyphBucksBills', {
        contractor_id: contractorId,
        contractor_name: contractorName,
        serial_numbers: [serialNumber],
        redemption_rate: 0.50,
        payment_method: "cash"
      });

      const data = response.data;

      // D-5 EXPIRY GATE — check before redemption
      const gbtx = await base44.entities.GlyphBucksTransaction.filter(
        { transaction_id: serialNumber },
        '-created_date',
        1
      );

      if (gbtx.length > 0) {
        const tx = gbtx[0];
        const now = new Date();
        const expiresAt = new Date(tx.expires_at);

        if (!tx.is_redeemable || now > expiresAt) {
          await base44.entities.SystemAuditLog.create({
            event_type: "GLYPHBUCKS_REDEMPTION_BLOCKED",
            description: `GlyphBucks redemption blocked: expired or already redeemed. transaction_id=${tx.id}`,
            actor_email: contractorName,
            status: "blocked",
            severity: "HIGH",
            metadata: {
              transaction_id: tx.id,
              expires_at: tx.expires_at,
              is_redeemable: tx.is_redeemable,
              reason: now > expiresAt ? "expired" : "already_redeemed",
              section: "D-5-EXPIRY-GATE"
            }
          });
          toast.error("These GlyphBucks have expired or have already been redeemed.");
          setScannedBills(prev => [...prev, {
            serial_number: serialNumber,
            status: "expired",
            error: "Bill expired or already redeemed"
          }]);
          setValidating(false);
          return;
        }
      }

      if (data.success && data.bills_redeemed > 0) {
        const billData = data.payout.bills_redeemed[0];
        setScannedBills(prev => [...prev, {
          serial_number: serialNumber,
          denomination: billData.denomination,
          redemption_amount: billData.redemption_amount,
          status: "valid",
          payout_id: data.payout.payout_id
        }]);
        toast.success(`✓ $${billData.denomination} bill validated — Payout: $${billData.redemption_amount}`);
        
        // Mark transaction as redeemed
        if (gbtx.length > 0) {
          await base44.entities.GlyphBucksTransaction.update(gbtx[0].id, {
            is_redeemable: false
          });
        }
      } else if (data.duplicates_detected > 0) {
        const dup = data.duplicate_bills[0];
        setScannedBills(prev => [...prev, {
          serial_number: serialNumber,
          status: "duplicate",
          redeemed_at: dup.redeemed_at,
          redeemed_by: dup.redeemed_by
        }]);
        toast.error("Bill already redeemed");
      } else {
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
    
    try {
      const response = await base44.functions.invoke('redeemGlyphBucksBills', {
        contractor_id: contractorId,
        contractor_name: contractorName,
        serial_numbers: [serialNumber],
        redemption_rate: 0.50,
        payment_method: "cash"
      });

      const data = response.data;

      if (data.success && data.bills_redeemed > 0) {
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
        const dup = data.duplicate_bills[0];
        setScannedBills(prev => [...prev, {
          serial_number: serialNumber,
          status: "duplicate",
          redeemed_at: dup.redeemed_at,
          redeemed_by: dup.redeemed_by
        }]);
        toast.error("Bill already redeemed");
      } else {
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

  const handleRequestPayout = () => {
    if (validBills.length === 0) {
      toast.error("No valid bills to process");
      return;
    }
    setShowPINVerifier(true);
  };

  const handleManagerAuthorized = (managerInfo) => {
    setAuthorizedManager(managerInfo);
    setShowPINVerifier(false);
    handleFinalizePayout(managerInfo);
  };

  const handleFinalizePayout = async (managerInfo) => {
    if (validBills.length === 0) {
      toast.error("No valid bills to process");
      return;
    }

    setProcessing(true);
    try {
      toast.success(`Payout approved by ${managerInfo.managerName} — $${totalPayout.toFixed(2)} to ${contractorName}`);
      if (onPayoutComplete) {
        onPayoutComplete({
          contractor_id: contractorId,
          contractor_name: contractorName,
          bills_redeemed: validBills.length,
          total_payout: totalPayout,
          payout_ids: [...new Set(validBills.map(b => b.payout_id))],
          authorized_by_manager_id: managerInfo.managerId,
          authorized_by_manager_name: managerInfo.managerName,
          authorized_by_manager_email: managerInfo.managerEmail,
          authorized_at: new Date().toISOString()
        });
      }
      setScannedBills([]);
      setAuthorizedManager(null);
    } catch (error) {
      toast.error("Payout failed: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <OfflineIndicator />
      
      <Card className="bg-gray-900/60 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400">Scan GlyphBucks Bills</span>
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

      {showPINVerifier && (
        <ManagerPINVerifier
          purpose={`authorize $${totalPayout.toFixed(2)} payout to ${contractorName}`}
          onVerified={handleManagerAuthorized}
          onCancel={() => setShowPINVerifier(false)}
        />
      )}

      {validBills.length > 0 && !showPINVerifier && (
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

            {authorizedManager ? (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg p-2">
                <CheckCircle2 className="w-4 h-4" />
                Authorized by: <strong>{authorizedManager.managerName}</strong>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/10 border border-amber-500/30 rounded-lg p-2">
                <Shield className="w-4 h-4" />
                Manager PIN required to finalize
              </div>
            )}

            <Button
              onClick={handleRequestPayout}
              disabled={processing}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Shield className="w-5 h-5 mr-2" />
              )}
              {processing ? "Processing..." : "Authorize & Finalize Payout"}
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