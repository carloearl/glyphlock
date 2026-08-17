import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { printHtml } from "@/lib/nups/printHtml";

export default function ThermalPrinterPanel({
  documentHtml,
  documentName = "Document",
  onPrintComplete,
  activeVenue
}) {
  const venueId = activeVenue?.id || activeVenue?.venue_id;

  const { data: deviceConfig } = useQuery({
    queryKey: ['hw-printer', venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const records = await base44.entities.VenueHardware.filter({ venue_id: venueId, device_type: 'receipt_printer' });
      return records.find(r => r.is_active !== false) || null;
    },
    enabled: !!venueId,
  });
  const [printing, setPrinting] = useState(false);
  const [lastPrint, setLastPrint] = useState(null);
  const printerReady = typeof window !== 'undefined' && Boolean(document?.body);

  const handlePrint = async () => {
    if (printing || !documentHtml) return;
    setPrinting(true);
    try {
      const result = await printHtml(documentHtml, { title: documentName });
      const printRecord = {
        timestamp: result?.invokedAt || new Date().toISOString(),
        document: documentName,
        printer: deviceConfig?.device_label || deviceConfig?.model || 'Browser Print Service',
        status: 'dialog_opened',
        method: result?.method || 'iframe',
      };
      setLastPrint(printRecord);
      toast.success('Print dialog opened');
      onPrintComplete?.(printRecord);
    } catch (e) {
      toast.error(`Print failed: ${e?.message || 'unknown error'}`);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Card className="bg-gray-900/60 border-green-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-green-400 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            {deviceConfig?.device_label || 'Thermal Printer'}
          </CardTitle>
          {printerReady ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[10px]">
              Ready
            </Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">
              Offline
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-black/40 border border-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Document Queue</span>
          </div>
          <div className="text-xs text-white font-bold">
            {documentName}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {deviceConfig?.model || 'Browser Print Service'} · {deviceConfig ? 'Configured thermal printer' : 'Use system printer dialog'}
          </div>
        </div>

        {lastPrint && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2">
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle2 className="w-3 h-3" />
              Last Print: {new Date(lastPrint.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        <Button 
          onClick={handlePrint}
          disabled={printing || !printerReady || !documentHtml}
          className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold"
        >
          {printing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="w-5 h-5 mr-2" />
              Print Document
            </>
          )}
        </Button>

        <div className="text-[10px] text-gray-600 text-center">
          {deviceConfig?.model || 'Browser Print Service'}{deviceConfig ? ' · thermal configuration' : ' · choose your receipt printer'}
          {deviceConfig?.is_sandbox && <span className="text-yellow-500 ml-2">[SANDBOX]</span>}
        </div>
      </CardContent>
    </Card>
  );
}