import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Banknote, Upload, Printer, Loader2, CheckCircle2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import RoleHomeButton from "@/components/nups/RoleHomeButton";
import DreamPalaceBill from "@/components/nups/glyphbucks/DreamPalaceBill";

import { printCurrentNupsView } from '@/lib/nups/receiptService';
/**
 * Dream Palace VIP GlyphBucks — Bill Printer.
 * Upload the single-bill artwork, set denomination + start serial + quantity,
 * register the run to the ledger (unique serials + Code-128 barcodes), then
 * print the sheet with serial/denomination/barcode overlaid on each bill.
 */
export default function VIPBillPrinter() {
  const [artworkUrl, setArtworkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [denomination, setDenomination] = useState(100);
  const [serialPrefix, setSerialPrefix] = useState("DP");
  const [startSerial, setStartSerial] = useState(1);
  const [quantity, setQuantity] = useState(5);
  const [registering, setRegistering] = useState(false);
  const [bills, setBills] = useState([]);
  const [batchId, setBatchId] = useState("");

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setArtworkUrl(file_url);
      toast.success("Bill artwork uploaded");
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleRegister = useCallback(async () => {
    if (!artworkUrl) { toast.error("Upload the bill artwork first"); return; }
    setRegistering(true);
    try {
      const res = await base44.functions.invoke("registerVIPBills", {
        denomination: Number(denomination),
        quantity: Number(quantity),
        serial_prefix: serialPrefix,
        start_serial: Number(startSerial),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setBills(res.data.bills || []);
      setBatchId(res.data.batch_id || "");
      toast.success(`Registered ${res.data.count} × $${res.data.denomination} bills — ready to print`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegistering(false);
    }
  }, [artworkUrl, denomination, quantity, serialPrefix, startSerial]);

  const handlePrint = useCallback(() => {
    if (!bills.length) { toast.error("Register the bills first"); return; }
    setTimeout(() => printCurrentNupsView(), 300);
  }, [bills]);

  return (
    <NUPSAppShell
      title="VIP GlyphBucks · Bill Printer"
      subtitle="Dream Palace — register & print physical VIP bills"
      role="MANAGER"
    >
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0.25in; }
          body * { visibility: hidden !important; }
          .bill-print-area, .bill-print-area * { visibility: visible !important; }
          .bill-print-area { position: absolute !important; left: 0; top: 0; width: 100% !important; }
          .no-print { display: none !important; }
          .dp-bill { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="no-print"><RoleHomeButton /></div>

        {/* Controls */}
        <Card className="bg-white/[0.02] border-amber-500/20 no-print">
          <CardContent className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Dream Palace VIP GlyphBucks Bills</h2>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">Physical Notes</Badge>
            </div>

            {/* Upload */}
            <div>
              <Label className="text-gray-300 text-sm">Single-Bill Artwork</Label>
              <p className="text-xs text-gray-500 mb-2">
                Upload one bill's front design (blank serial / denomination / barcode boxes).
              </p>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-semibold cursor-pointer hover:bg-amber-500/20 min-h-[44px]">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Uploading…" : "Upload Artwork"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                {artworkUrl && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <ImageIcon className="w-4 h-4" /> Loaded
                  </span>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Denomination ($)</Label>
                <Input type="number" min={1} value={denomination}
                  onChange={(e) => setDenomination(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Serial Prefix</Label>
                <Input value={serialPrefix} maxLength={4}
                  onChange={(e) => setSerialPrefix(e.target.value.toUpperCase())} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Start Serial #</Label>
                <Input type="number" min={1} value={startSerial}
                  onChange={(e) => setStartSerial(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Quantity (1–500)</Label>
                <Input type="number" min={1} max={500} value={quantity}
                  onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleRegister} disabled={registering || !artworkUrl}
                className="bg-amber-600 hover:bg-amber-500 gap-2 min-h-[44px]">
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Register {quantity} Bills to Ledger
              </Button>
              <Button onClick={handlePrint} disabled={!bills.length} variant="outline"
                className="border-amber-500/40 text-amber-200 gap-2 min-h-[44px]">
                <Printer className="w-4 h-4" /> Print Sheet
              </Button>
            </div>

            {bills.length > 0 && (
              <div className="text-xs text-gray-400 border-t border-white/5 pt-3">
                Batch <span className="font-mono text-amber-300">{batchId}</span> · {bills.length} bills ·
                serials {bills[0].serial} → {bills[bills.length - 1].serial} · total face value $
                {(Number(denomination) * bills.length).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print sheet */}
        {bills.length > 0 && (
          <div className="bill-print-area space-y-3 bg-white p-3 rounded-lg">
            {bills.map((b) => (
              <DreamPalaceBill
                key={b.serial}
                artworkUrl={artworkUrl}
                serial={b.serial}
                denomination={b.denomination}
                miscellaneous={`VIP · ${batchId.slice(-6)}`}
              />
            ))}
          </div>
        )}

        {/* Preview when not yet registered */}
        {bills.length === 0 && artworkUrl && (
          <Card className="bg-white/[0.02] border-white/10 no-print">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-2">Preview — sample overlay (register to lock in serials)</div>
              <div className="bg-white p-3 rounded-lg">
                <DreamPalaceBill
                  artworkUrl={artworkUrl}
                  serial={`${serialPrefix}-${denomination}-${String(startSerial).padStart(7, "0")}`}
                  denomination={denomination}
                  miscellaneous="VIP · SAMPLE"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </NUPSAppShell>
  );
}