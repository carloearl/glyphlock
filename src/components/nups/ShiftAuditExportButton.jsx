import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, ExternalLink } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

/**
 * One-tap end-of-shift export: driver payouts + entertainer check-ins
 * for tonight's shift → a Google Sheet in the connected Drive.
 */
export default function ShiftAuditExportButton() {
  const activeVenue = useActiveVenue();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    // Local (venue) shift date, not UTC.
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    try {
      const res = await base44.functions.invoke("exportShiftAuditToSheets", {
        venue_id: activeVenue?.id,
        date: localDate,
      });
      setResult(res.data);
      if (res.data?.sheet_url) window.open(res.data.sheet_url, "_blank");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        onClick={handleExport}
        disabled={busy}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold min-h-[44px]"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        {busy ? "Exporting…" : "Export Shift to Google Sheets"}
      </Button>
      {result && (
        <a
          href={result.sheet_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-semibold hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {result.driver_payout_count} payouts · {result.checkin_count} check-ins → {result.sheet_name}
        </a>
      )}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}