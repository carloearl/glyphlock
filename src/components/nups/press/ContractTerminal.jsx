/**
 * ContractTerminal — DRAFT → SIGN → ISSUED → ARCHIVED flow
 * Reference-exact stages, financial rules, print layout
 */
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign, CreditCard, FileText, Printer, Check, Archive,
  Fingerprint, PenTool, ArrowRight, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { printCurrentNupsView } from '@/lib/nups/receiptService';
import {
  ContractStatus, CURRENCY_AMOUNTS, createContractRecord, calculateFinancials,
} from "@/components/nups/press/types";
import {
  appendContractRecord, emitPressTelemetry,
} from "@/components/nups/press/services/pressStorage";

// ─── Status Badge ───
function StatusBadge({ status }) {
  const colors = {
    DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    SIGN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    ISSUED: 'bg-green-500/20 text-green-400 border-green-500/40',
    ARCHIVED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  };
  return (
    <Badge className={`${colors[status] || colors.DRAFT} text-xs`}>
      {status}
    </Badge>
  );
}

// ─── Printable Contract Document ───
function PrintableContract({ contract }) {
  if (!contract) return null;

  return (
    <div className="print-only bg-white text-black p-8 font-mono text-sm" style={{ width: '8.5in', minHeight: '11in' }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">CLUB CURRENCY TRANSACTION CONTRACT</h1>
        <p className="text-xs text-gray-600 mt-1">Legally Binding Financial Instrument</p>
      </div>

      <div className="border-2 border-black p-4 mb-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><strong>TX ID:</strong> {contract.txId}</div>
          <div><strong>POS Terminal:</strong> {contract.posTerminalId}</div>
          <div><strong>Date:</strong> {new Date(contract.timestamp).toLocaleString()}</div>
          <div><strong>Status:</strong> {contract.status}</div>
          <div><strong>Customer:</strong> {contract.customerName}</div>
          <div><strong>Card (last 4):</strong> •••• {contract.cardLast4}</div>
        </div>
      </div>

      <div className="border-2 border-black p-4 mb-4">
        <h2 className="font-bold mb-2">FINANCIAL SUMMARY</h2>
        <table className="w-full text-xs">
          <tbody>
            <tr><td>Currency Amount:</td><td className="text-right">${contract.currencyAmount.toFixed(2)}</td></tr>
            <tr><td>Convenience Fee (30%):</td><td className="text-right">${contract.convenienceFee.toFixed(2)}</td></tr>
            <tr className="border-t border-black font-bold"><td>Total Charged:</td><td className="text-right">${contract.totalAmount.toFixed(2)}</td></tr>
            <tr><td>Dancer Payout (50%):</td><td className="text-right">${contract.dancerPayout.toFixed(2)}</td></tr>
            <tr><td>House Portion:</td><td className="text-right">${contract.housePortion.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="border-2 border-black p-4 mb-4">
        <h2 className="font-bold mb-2">REDEMPTION SCHEDULE</h2>
        <div className="text-xs space-y-1">
          <p>• Club Currency is redeemable only at the issuing venue.</p>
          <p>• Currency expires 24 hours from issuance unless otherwise noted.</p>
          <p>• No cash refunds on club currency purchases.</p>
          <p>• Lost or stolen currency will not be replaced.</p>
          <p>• Management reserves the right to refuse redemption for policy violations.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
        <div>
          <p className="border-b border-black pb-8 mb-1">___________________________</p>
          <p>Customer Signature</p>
        </div>
        <div>
          <p className="border-b border-black pb-8 mb-1">___________________________</p>
          <p>Authorized Representative</p>
        </div>
      </div>

      <div className="text-center mt-6 text-[8px] text-gray-500">
        Contract ID: {contract.id} | Generated: {new Date(contract.timestamp).toISOString()}
      </div>
    </div>
  );
}

// ─── Main Terminal ───
export default function ContractTerminal({ onArchive }) {
  const [contract, setContract] = useState(createContractRecord());
  const [acknowledged, setAcknowledged] = useState(false);
  const [thumbScanned, setThumbScanned] = useState(false);
  const [signed, setSigned] = useState(false);

  const updateField = (key, value) => {
    setContract((c) => ({ ...c, [key]: value }));
  };

  const selectCurrency = (amount) => {
    const fin = calculateFinancials(amount);
    setContract((c) => ({
      ...c,
      currencyAmount: amount,
      ...fin,
    }));
  };

  const advanceStage = (to) => {
    const from = contract.status;
    emitPressTelemetry('CONTRACT_STAGE_CHANGE', { from, to, txId: contract.txId });
    setContract((c) => ({ ...c, status: to }));
  };

  const handleFinalize = () => {
    advanceStage(ContractStatus.ISSUED);
    emitPressTelemetry('CONTRACT_FINALIZED', { txId: contract.txId, totalAmount: contract.totalAmount });
    toast.success('Contract finalized and issued');
  };

  const handleArchiveContract = () => {
    const archived = { ...contract, status: ContractStatus.ARCHIVED };
    appendContractRecord(archived);
    emitPressTelemetry('CONTRACT_ARCHIVED', { txId: contract.txId, customerName: contract.customerName });
    onArchive?.(archived);
    toast.success('Contract archived');
    // Reset
    setContract(createContractRecord());
    setAcknowledged(false);
    setThumbScanned(false);
    setSigned(false);
  };

  const handlePrint = () => {
    printCurrentNupsView();
  };

  const handleReset = () => {
    setContract(createContractRecord());
    setAcknowledged(false);
    setThumbScanned(false);
    setSigned(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Contract Terminal</h3>
          <StatusBadge status={contract.status} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
          <span>TX: {contract.txId}</span>
          <span>POS: {contract.posTerminalId}</span>
        </div>
      </div>

      {/* DRAFT Stage */}
      {contract.status === ContractStatus.DRAFT && (
        <Card className="bg-gray-900/60 border-gray-700">
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Customer Name</Label>
                <Input
                  value={contract.customerName}
                  onChange={(e) => updateField('customerName', e.target.value.toUpperCase())}
                  placeholder="FULL NAME"
                  className="mt-1 bg-gray-800 border-gray-700 uppercase"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Card Last 4</Label>
                <Input
                  value={contract.cardLast4}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateField('cardLast4', v);
                  }}
                  placeholder="1234"
                  maxLength={4}
                  className="mt-1 bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            {/* Currency buttons */}
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Currency Amount</Label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCY_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={contract.currencyAmount === amt ? "default" : "outline"}
                    className={`h-12 text-lg font-bold ${contract.currencyAmount === amt ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700'}`}
                    onClick={() => selectCurrency(amt)}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            {contract.currencyAmount > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between"><span className="text-gray-400">Currency:</span><span className="text-green-400">${contract.currencyAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Fee (30%):</span><span className="text-yellow-400">${contract.convenienceFee.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-gray-700 pt-1 font-bold"><span className="text-white">Total:</span><span className="text-cyan-400">${contract.totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Dancer payout:</span><span>${contract.dancerPayout.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500"><span>House portion:</span><span>${contract.housePortion.toFixed(2)}</span></div>
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 gap-2"
              disabled={!contract.customerName || !contract.cardLast4 || contract.currencyAmount === 0}
              onClick={() => advanceStage(ContractStatus.SIGN)}
            >
              Proceed to Sign <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SIGN Stage */}
      {contract.status === ContractStatus.SIGN && (
        <Card className="bg-gray-900/60 border-yellow-500/30">
          <CardContent className="pt-4 space-y-4">
            <div className="text-center py-4">
              <p className="text-sm text-white font-semibold mb-1">{contract.customerName}</p>
              <p className="text-2xl font-bold text-green-400">${contract.totalAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Card ending {contract.cardLast4}</p>
            </div>

            {/* Acknowledgement */}
            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={setAcknowledged}
                id="ack"
              />
              <label htmlFor="ack" className="text-xs text-gray-300 cursor-pointer">
                I acknowledge and agree to the terms of this Club Currency transaction. I understand the convenience fee and redemption policies.
              </label>
            </div>

            {/* Thumb scan simulation */}
            <Button
              variant="outline"
              className={`w-full h-16 gap-2 border-gray-700 ${thumbScanned ? 'border-green-500/50 bg-green-500/10' : ''}`}
              onClick={() => {
                setThumbScanned(true);
                setContract((c) => ({ ...c, thumbprintData: `THUMB_${Date.now()}` }));
              }}
              disabled={!acknowledged}
            >
              <Fingerprint className={`w-6 h-6 ${thumbScanned ? 'text-green-400' : 'text-gray-500'}`} />
              <span className="text-sm">{thumbScanned ? 'Thumbprint Captured' : 'Tap to Scan Thumbprint'}</span>
            </Button>

            {/* Signature simulation */}
            <Button
              variant="outline"
              className={`w-full h-16 gap-2 border-gray-700 ${signed ? 'border-green-500/50 bg-green-500/10' : ''}`}
              onClick={() => {
                setSigned(true);
                setContract((c) => ({ ...c, signatureData: `SIG_${contract.customerName}_${Date.now()}` }));
              }}
              disabled={!thumbScanned}
            >
              <PenTool className={`w-6 h-6 ${signed ? 'text-green-400' : 'text-gray-500'}`} />
              <span className="text-sm">{signed ? 'Signature Captured' : 'Tap to Sign'}</span>
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-gray-700" onClick={() => advanceStage(ContractStatus.DRAFT)}>
                <RotateCcw className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 gap-2"
                disabled={!acknowledged || !thumbScanned || !signed}
                onClick={handleFinalize}
              >
                <Check className="w-4 h-4" /> Finalize
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ISSUED Stage */}
      {contract.status === ContractStatus.ISSUED && (
        <Card className="bg-gray-900/60 border-green-500/30">
          <CardContent className="pt-4 space-y-4">
            <div className="text-center py-4">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-green-400">CONTRACT ISSUED</p>
              <p className="text-xs text-gray-500 font-mono mt-1">{contract.txId}</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-xs font-mono">
              <div className="flex justify-between"><span className="text-gray-400">Customer:</span><span>{contract.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Amount:</span><span className="text-green-400">${contract.currencyAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Charged:</span><span className="text-cyan-400">${contract.totalAmount.toFixed(2)}</span></div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handlePrint} className="flex-1 gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600">
                <Printer className="w-4 h-4" /> Print Contract
              </Button>
              <Button size="sm" onClick={handleArchiveContract} className="flex-1 gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600">
                <Archive className="w-4 h-4" /> Archive
              </Button>
            </div>

            <Button variant="outline" size="sm" className="w-full border-gray-700" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> New Contract
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Printable document (hidden on screen) */}
      <PrintableContract contract={contract} />

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>
    </div>
  );
}